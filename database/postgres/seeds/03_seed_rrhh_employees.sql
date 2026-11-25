-- ============================================================================
-- database/postgres/seeds/03_seed_rrhh_employees.sql
-- Seed real normalizado (3FN) de 188 colaboradores activos de SIFYGSA
-- Fuente: data/sifygsa_db.json (excluye 4 registros binarios corruptos:
--         SFG-0048, SFG-0066, SFG-0072 y SFG-0155; conserva consecutivo >= 192).
-- Sin columnas derivadas (nombre_completo, iniciales, avatar_color, etc.).
-- ============================================================================

BEGIN;

-- 1. Inserción idempotente de colaboradores (orden Etapa 1 -> Etapa 2 -> Etapa 3)
INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0001', 'Agustín', 'Anastacio', 'Martínez',
  'AAMA760706EI0', 'AAMA760706HVZNRG18', '67987627006', DATE '1976-07-06',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, 'Dirección Corporativa',
  DATE '2021-03-15', 'ACTIVO', 'Certificación Vigente',
  '9221201243', '9222241996', 'agustin.anastacio@sifygsa.com.mx'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'DIR'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Director General'
LEFT JOIN core.sedes sed    ON sed.codigo = 'CNO'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0002', 'Manuel', 'Martínez', 'Ruíz',
  'MARM810118BV1', 'MARM810118HVZRZN09', '67048100183', DATE '1981-01-18',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Director Comercial'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0003', 'Emmanuel', 'Mendoza', 'Ramírez',
  'MERE821216FKA', 'MERE821216HVZNMM07', '67978252574', DATE '1982-12-16',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente de Servicios'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0004', 'Miguel Ángel', 'Guzmán', 'Reyes',
  'GURM830725GG8', 'GURM830725HVZZYG00', '22048310878', DATE '1983-07-25',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente de Ingeniería'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0005', 'Marlem', 'Campos', 'García',
  'CAGM821115U6A', 'CAGM821115MVZMRR00', '67018222140', DATE '1982-11-15',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente de Compras'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0006', 'Carlos Enrique', 'Cossio', 'Ruíz',
  'CORC880619JNA', 'CORC880619HVZSZR09', '67068814473', DATE '1988-06-19',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente QHSE'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0007', 'Pablo', 'Vázquez', 'Culebro',
  'VACP870818U17', 'VACP870818HVZZLB06', '67118701878', DATE '1987-08-18',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente de Infraestructura'
LEFT JOIN core.sedes sed    ON sed.codigo = 'ACA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0008', 'Viridiana', 'Arenas', 'Anastacio',
  'AEAV880424NN5', 'AEAV880424MVZRNR04', '67098815318', DATE '1988-04-24',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ADM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente de Administración'
LEFT JOIN core.sedes sed    ON sed.codigo = 'ACA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0009', 'Valeria', 'Méndez', 'Albores',
  'MEAV961029FB0', 'MEAV961029MVZNLL01', '13169645606', DATE '1996-10-29',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'RH'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente de Recursos Humanos'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0010', 'Rosa Ivette', 'Trujillo', 'Palma',
  'TUPR850715GG8', 'TUPR850715MTCRLS09', '83038519969', DATE '1985-07-15',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente HSE Comalcalco'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0011', 'Víctor Manuel', 'Anastacio', 'Martínez',
  'AAMV820404A92', 'AAMV820404HVZNRC01', '67048202047', DATE '1982-04-04',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'MCP'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente de MYCP'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0012', 'Samuel Martín', 'Cruz', 'Camera',
  'CUCS6908205F9', 'CUCS690820HVZRMM01', '67896960605', DATE '1969-08-20',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'GSAPE'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente de Soporte a Proyectos'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0013', 'Yesenia', 'Rosas', 'Rogel',
  'RORY830520DWA', 'RORY830520MVZSGS00', '67068303535', DATE '1983-05-20',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente Ventas Sur'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0014', 'Guillermo', 'Sánchez', 'Escobar',
  'SAEG8603227SA', 'SAEG860322HOCNSL06', '67088601272', DATE '1986-03-22',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente Ventas Istmo'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0015', 'Erick', 'Hernández', 'Rueda',
  'HERE860806PZ9', 'HERE860806HVZRDR04', '67098617219', DATE '1986-08-06',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Sub-Gerente de Servicios'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0016', 'Adrián José', 'Rodríguez', 'Hernández',
  'ROHA860109TD3', 'ROHA860109HVZDRD05', '67038516158', DATE '1986-01-09',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, 'Cuadrilla Frente CT1',
  DATE '2021-06-01', 'ACTIVO', 'Vigente SIL-3',
  '9222141194', '9222241996', 'adrianjose1986@hotmail.com'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de Obra Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0017', 'Alan Armando', 'Montiel', 'Rodríguez',
  'MORA020920APA', 'MORA020920HVZNDLA0', '86170227424', DATE '2002-09-20',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, 'Tecnología & Redes',
  DATE '2023-08-01', 'ACTIVO', 'DC-3 Vigente',
  '9242429732', '9222241996', 'alan.montiel@sifygsa.com.mx'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar de TI Trainee'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0018', 'Aldo Carlos', 'Pérez', 'Sánchez',
  'PESA9310073N2', 'PESA931007HVZRNL09', '67119316544', DATE '1993-10-07',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, 'Cuadrilla Alfa SIL-3',
  DATE '2022-05-15', 'ACTIVO', 'Vigente SIL-3',
  '9211013573', '9222241996', 'aldo.perez@sifygsa.com.mx'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de servicios senior'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0019', 'Alejandra', 'Arias', 'Rodríguez',
  'AIRA960312B69', 'AIRA960312MTCRDL08', '66169612315', DATE '1996-03-12',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar administrativo Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0020', 'Alejandra', 'Sujias', 'Ricardez',
  'SURA841202IB0', 'SURA841202MTCJCL03', '83088420902', DATE '1984-12-02',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar Administrativo Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0021', 'Alejandra', 'Sujías', 'Ricardez',
  NULL, NULL, NULL, NULL,
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, 'Administración en Campo',
  DATE '2023-01-10', 'ACTIVO', 'DC-3 Vigente',
  '9331174872', '9222241996', 'alejandra.sujias@sifygsa.com.mx'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar Administrativo Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0022', 'Alessandra', 'González', 'Flores',
  'GOFA011022HY8', 'GOFA011022MVZNLLA6', '18160108777', DATE '2001-10-22',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Definición de Soluciones Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0023', 'Alexander', 'Cruz', 'Pesado',
  'CUPA020220IX4', 'CUPA020220HVZRSLA8', '07160280769', DATE '2002-02-20',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Líder de Proyecto Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0024', 'Alfonso', 'Gutiérrez', 'Vázquez',
  'GUVA761026PF6', 'GUVA761026HTCTZL06', '83937608210', DATE '1976-10-26',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0025', 'Álvaro', 'Fuentes', 'Zamudio',
  'FUZA770219SY5', 'FUZA770219HTCNML01', '83977706593', DATE '1977-02-19',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0026', 'Amado', 'Reyes', 'Peña',
  'REPA770913AR5', 'REPA770913HOCYXM15', '67957757684', DATE '1977-09-13',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Eléctrico Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0027', 'Ana Belén', 'Alcudia', 'Córdova',
  'AUCA9411024V2', 'AUCA941102MTCLRN08', '08149430186', DATE '1994-11-02',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0028', 'Ángel Emmanuel', 'Medina', 'Lazaro',
  'MELA0312311VA', 'MELA031231HVZDZNA4', '18190366916', DATE '2003-12-31',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicios Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0029', 'Antonio', 'Gómez', 'Cruz',
  'GOCA981009UQ3', 'GOCA981009HTCMRN03', '18139854907', DATE '1998-10-09',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar de HSE Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'VHA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0030', 'Arantza', 'Lázaro', 'Loya',
  'LALA981125ES0', 'LALA981125MVZZYR08', '05179821516', DATE '1998-11-25',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar de HSE Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0031', 'Arcadio', 'Torres', 'Domínguez',
  'TODA710112Q90', 'TODA710112HVZRMR09', '67997101919', DATE '1971-01-12',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante general'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0032', 'Arely', 'Santiago', 'Mayo',
  'SAMA9104123Y1', 'SAMA910412MVZNYR00', '67129124524', DATE '1991-04-12',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Intendencia'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0033', 'Arem Estefanía', 'López', 'Sánchez',
  'LOSA990928C26', 'LOSA990928MQRPNR00', '81169970977', DATE '1999-09-28',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Definición de Soluciones Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'JAL'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0034', 'Armando', 'Alfonso', 'Cruz',
  'AOCA031111HRA', 'AOCA031111HVZLRRA5', '64180317527', DATE '2003-11-11',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante general'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0035', 'Aurelio', 'Palacios', 'Xolo',
  'PAXA711015K48', 'PAXA711015HVZLLR01', '67897158175', DATE '1971-10-15',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, 'Almacén & Procura',
  DATE '2022-08-10', 'ACTIVO', 'Certificación Vigente',
  NULL, NULL, 'aurelio.palacios@sifygsa.com.mx'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente de Compras'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0036', 'Basilio', 'Mendoza', 'Ramírez',
  'MERB900105CT3', 'MERB900105HVZNMS05', '67109044270', DATE '1990-01-05',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Líder de proyecto Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0037', 'Bryan Antonio', 'Vielma', 'Lazcarez',
  'VILB0608306V0', 'VILB060830HVZLZRA2', '18230652218', DATE '2006-08-30',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar de almacén'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0038', 'Bryan Paul', 'Rodríguez', 'Santiago',
  'ROSB050412GE8', 'ROSB050412HVZDNRA8', '18210528289', DATE '2005-04-12',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante Eléctrico'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0039', 'Carlos Alberto', 'Hernández', 'Córdova',
  'HECC830605LA4', 'HECC830605HVZRRR00', '83028416333', DATE '1983-06-05',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0040', 'Carlos Alberto', 'Reyes', 'Ramírez',
  'RERC840908CX0', 'RERC840908HVZYMR02', '67078402475', DATE '1984-09-08',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Andamiero'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0041', 'Carlos Alberto', 'Tun', 'Culebro',
  'TUCC9010144H8', 'TUCC901014HVZNLR08', '19159016625', DATE '1990-10-14',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, 'Staff Central',
  DATE '2023-02-01', 'ACTIVO', 'DC-3 Acreditado',
  NULL, NULL, 'tunccarlos14@gmail.com'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'RH'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Generalista de Recursos Humanos'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0042', 'Carlos', 'Lázaro', 'Fidencio',
  'LAFC810831NW8', 'LAFC810831HVZZDR08', '67968152537', DATE '1981-08-31',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de definición de soluciones'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0043', 'César', 'González', 'Fuentes',
  'GOFC9608091W3', 'GOFC960809HTCNNS02', '66159650366', DATE '1996-08-09',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico especialista jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0044', 'Cesar Iván', 'Izquierdo', 'Hernández',
  'IUHC9211165X9', 'IUHC921116HVZZRS03', '67119230182', DATE '1992-11-16',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Vigilante'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0045', 'Christian del Carmen Pérez', 'de los', 'Santos',
  'PESC9407109H0', 'PESC940710HTCRNH04', '63169414354', DATE '1994-07-10',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Cadista Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'PAR'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0046', 'Citlali Astrid', 'Sánchez', 'Martínez',
  'SAMC0004158H2', 'SAMC000415MVZNRTA4', '38180079675', DATE '2000-04-15',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de TI Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0047', 'Cristian Noel', 'Murillo', 'Rosado',
  'MURC9902282WA', 'MURC990228HVZRSR06', '82169936281', DATE '1999-02-28',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante general'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0049', 'Daisy', 'Ortíz', 'López',
  'OILD8212031Q0', 'OILD821203MVZRPS07', '78038219362', DATE '1982-12-03',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'CAL'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ing. de Calidad Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0050', 'Daniel', 'De León', 'López',
  'LELD810422TQA', 'LELD810422HVZNPN02', '78968172409', DATE '1981-04-22',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de productos'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0051', 'Daniel', 'Trujillo', 'Palma',
  'TUPD891014550', 'TUPD891014HTCRLN04', '03178955633', DATE '1989-10-14',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0052', 'Daniela', 'Calderón', 'Domínguez',
  'CADD850624C94', 'CADD850624MVZLMN04', '67098510943', DATE '1985-06-24',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ADM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Nominista'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0053', 'Darany Sinaí', 'González', 'Pascual',
  'GOPD970721ML7', 'GOPD970721MVZNSR02', '28169724797', DATE '1997-07-21',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicios Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0054', 'Dariana', 'Rogel', 'Borja',
  'ROBD001019SS3', 'ROBD001019MVZGRRA5', '38190020503', DATE '2000-10-19',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Definición de Soluciones Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0055', 'Dendra Kein Betsaida Jiménez', 'De la', 'Cruz',
  'JICD900612IQ5', 'JICD900612MTCMRN06', '05159076628', DATE '1990-06-12',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Ventas Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'PAR'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0056', 'Diana Itzel', 'Méndez', 'Martínez',
  'MEMD9510272T9', 'MEMD951027MVZNRN01', '09169573285', DATE '1995-10-27',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Servicios Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'JAL'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0057', 'Dionicio', 'Guzmán', 'Quevedo',
  'GUQD860805MB4', 'GUQD860805HTCZVN00', '83058643442', DATE '1986-08-05',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Signatario de HSE Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0058', 'Edgar', 'Martínez', 'Hilario',
  'MAHE8010268E4', 'MAHE801026HVZRLD05', '67048003742', DATE '1980-10-26',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Coordonador de volumetrías'
LEFT JOIN core.sedes sed    ON sed.codigo = 'TEX'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0059', 'Eduardo Javier', 'Pérez', 'Torres',
  'PETE9210144C7', 'PETE921014HVZRRD07', '05169251005', DATE '1992-10-14',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0060', 'Eduardo', 'Organista', 'Chigo',
  'OACE870428SS0', 'OACE870428HVZRHD06', '65108720353', DATE '1987-04-28',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Vigilante'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0061', 'Eduardo', 'Vidaña', 'García',
  'VIGE920509NJ3', 'VIGE920509HVZDRD02', '67129239124', DATE '1992-05-09',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicios'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0062', 'Elodia Nayeli', 'Flores', 'Juárez',
  'FOJE941014EL9', 'FOJE941014MTCLRL07', '22169400557', DATE '1994-10-14',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'HUI'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0063', 'Erick Daniel', 'García', 'Olán',
  'GAOE9311127M7', 'GAOE931112HTCRLR00', '81139317077', DATE '1993-11-12',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Eléctrico Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0064', 'Esbehidy del Carmen', 'Medina', 'Lázaro',
  'MELE000716TR3', 'MELE000716MVZDZSA7', '34160081138', DATE '2000-07-16',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Comprador Trainee'
LEFT JOIN core.sedes sed    ON sed.codigo = 'SPM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0065', 'Estefany Michelle De los', 'Santos', 'Pérez',
  'SAPE990608KT1', 'SAPE990608MVZNRS01', '51169924571', DATE '1999-06-08',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de servicios Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0067', 'Evelin', 'Vargas', 'Ambrosio',
  'VAAE971010NR7', 'VAAE971010MPLRMV07', '30169772800', DATE '1997-10-10',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0068', 'Fabián', 'Aguilar', 'Arias',
  'AUAF890423LLA', 'AUAF890423HTCGRB05', '83148900042', DATE '1989-04-23',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar Técnico Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0069', 'Fortino', 'Osorio', 'Ricárdez',
  'OORF9611178W5', 'OORF961117HVZSCR09', '43169604865', DATE '1996-11-17',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de servicios Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0070', 'Francisco Javier', 'Mayo', 'Reyes',
  'MARF000608N35', 'MARF000608HVZYYRA8', '61160087302', DATE '2000-06-08',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Cadista Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0071', 'Freddy', 'Cruz', 'Antonio',
  'CUAF970509VA4', 'CUAF970509HVZRNR07', '24169756780', DATE '1997-05-09',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de servicios Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0073', 'Gabriel', 'Pérez', 'Aguilar',
  'PEAG911103PW0', 'PEAG911103HVZRGB02', '67109131978', DATE '1991-11-03',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Almacenista Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0074', 'Giezell Daraly', 'Jimenez', 'Torres',
  'JITG990205G88', 'JITG990205MPLMRZ08', '05139922941', DATE '1999-02-05',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'DIR'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Medición Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0075', 'Giovanni Aldahir', 'Martínez', 'Sánchez',
  'MASG991217UK9', 'MASG991217HVZRNV06', '02229983859', DATE '1999-12-17',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Líder de Proyecto Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0076', 'Guillermo', 'Lara', 'Menéndez',
  'LAMG8201263X1', 'LAMG820126HVZRNL06', '67068208601', DATE '1982-01-26',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Encargado de Mantenimiento SS'
LEFT JOIN core.sedes sed    ON sed.codigo = 'TBL'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0077', 'Guiucepe Alberto', 'Villavicencio', 'López',
  'VILG950613HX4', 'VILG950613HVZLPC07', '67129511191', DATE '1995-06-13',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de Obra Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0078', 'Hector de Jesús', 'Santiago', 'Sosa',
  'SASH000816SK9', 'SASH000816HVZNSCA4', '03200050163', DATE '2000-08-16',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar Administrativo'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0079', 'Hiram Lugardo', 'Daza', 'Martínez',
  'DAMH770121QZ8', 'DAMH770121HVZZRR08', '67937750999', DATE '1977-01-21',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Eléctrico Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0080', 'Humberto', 'Avalos', 'González',
  'AAGH851004KY8', 'AAGH851004HTCVNM08', '83058514817', DATE '1985-10-04',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Almacenista Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0081', 'Humberto', 'Ripoll', 'Hernández',
  'RIHH820823986', 'RIHH820823HVZPRM06', '67068222685', DATE '1982-08-23',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Ventas Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'QRO'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0082', 'Indra Fabiola', 'Anastacio', 'Lozada',
  'AALI0103036J4', 'AALI010303MVZNZNA7', '02260116146', DATE '2001-03-03',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ADM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar contable Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0083', 'Carlos', 'Hernández', NULL,
  NULL, NULL, NULL, NULL,
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, 'Operaciones F&G',
  DATE '2023-09-04', 'ACTIVO', 'DC-3 Acreditado',
  NULL, NULL, 'carlos.hernandez@sifygsa.com.mx'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico en Detección de Gas'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MAP'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0084', 'Fernando', 'Alarcón', 'Paz',
  NULL, NULL, NULL, NULL,
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, 'Regional Centro',
  DATE '2023-01-15', 'ACTIVO', 'Certificación Vigente',
  NULL, NULL, 'fernando.alarcon@sifygsa.com.mx'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de Mantenimiento & Redes'
LEFT JOIN core.sedes sed    ON sed.codigo = 'XAL'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0085', 'Roberto', 'Méndez', 'Cruz',
  NULL, NULL, NULL, NULL,
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, 'Cuadrilla Bravo (Base Operativa)',
  DATE '2024-09-18', 'ACTIVO', 'Por Renovar',
  NULL, NULL, 'roberto.mendez@sifygsa.com.mx'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'MCP'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Especialista en Automatización & Control'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0086', 'Ingrid Brigitte', 'Vidal', 'Vitales',
  'VIVI950910521', 'VIVI950910MTCDTN04', '05199558312', DATE '1995-09-10',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Estimacionista'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0087', 'Irving José', 'Pineda', 'Hernández',
  'PIHI90112893A', 'PIHI901128HVZNRR06', '25149059690', DATE '1990-11-28',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Líder de Contrato Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0088', 'Isaac', 'Ángeles', 'Caraveo',
  'AECI020310KM6', 'AECI020310HHGNRSA6', '54170267774', DATE '2002-03-10',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicios Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0089', 'Isaac', 'Martínez', 'Cruz',
  'MACI020414QR8', 'MACI020414HVZRRSA1', '56170273611', DATE '2002-04-14',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante Eléctrico'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0090', 'Israel', 'Garrido', 'Reyes',
  'GARI961121228', 'GARI961121HVZRYS05', '67139606742', DATE '1996-11-21',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Soldador Ss.'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0091', 'Israel Joshua', 'Landero', 'Carrera',
  'LACI911019RU2', 'LACI911019HVZNRS08', '14169147833', DATE '1991-10-19',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicios'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0092', 'Iván Javier', 'Gutiérrez', 'Balcázar',
  'GUBI000208E60', 'GUBI000208HVZTLVA9', '19180088866', DATE '2000-02-08',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'RH'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar de RRHH Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
) -- CURP origen "AAOJ070928HTCLSRAO" omitida por formato inválido (corregir en captura)
SELECT
  'SFG-0093', 'Jared Joel', 'Álvarez', 'Osorio',
  'AAOJ0709284K5', NULL, '08260790418', NULL,
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante Eléctrico'
LEFT JOIN core.sedes sed    ON sed.codigo = 'CAN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0094', 'Jason', 'Ramírez', 'Luna',
  'RALJ010628VD9', 'RALJ010628HVZMNSA9', '10150141975', DATE '2001-06-28',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicios Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0095', 'Jazmín Lizette', 'González', 'Martínez',
  'GOMJ980725Q80', 'GOMJ980725MVZNRZ07', '54169846463', DATE '1998-07-25',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Definición de Soluciones Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0096', 'Jeannete Ivonne', 'Macías', 'Ovando',
  'MAOJ8106037J9', 'MAOJ810603MVZCVN08', '67068106615', DATE '1981-06-03',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Comprador Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0097', 'Jesús Alberto', 'Ruíz', 'Martínez',
  'RUMJ981226DT9', 'RUMJ981226HVZZRS09', '42169891365', DATE '1998-12-26',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Cadista Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0098', 'Jesús Elías', 'Rivera', 'Jiménez',
  'RIJJ790213DN4', 'RIJJ790213HVZVMS06', '83037907603', DATE '1979-02-13',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ing. De Servicios'
LEFT JOIN core.sedes sed    ON sed.codigo = 'VHA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0099', 'Jesús Enrique', 'Santos', 'Valera',
  'SAVJ010309EU5', 'SAVJ010309HVZNLSA2', '49190122488', DATE '2001-03-09',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicios Jr.'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0100', 'Jesús Miguel', 'Esteva', 'Domínguez',
  'EEDJ9305032N9', 'EEDJ930503HVZSMS04', '67129330089', DATE '1993-05-03',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Almacenista Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0101', 'Jesús', 'Navarro', 'Pérez',
  'NAPJ951006K47', 'NAPJ951006HVZVRS03', '09169589364', DATE '1995-10-06',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico especialista Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0102', 'Jesús Rogelio', 'Hernández', 'Magaña',
  'HEMJ901030MG1', 'HEMJ901030HTCRGS02', '02179075359', DATE '1990-10-30',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Almacenista'
LEFT JOIN core.sedes sed    ON sed.codigo = 'JDM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0103', 'Jesús Uriel', 'García', 'Nazario',
  'GANJ030114A9A', 'GANJ030114HVZRZSA6', '11160370992', DATE '2003-01-14',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar de HSE Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'JAL'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0104', 'Jonatan', 'Rodríguez', 'Martínez',
  'ROMJ880628AM2', 'ROMJ880628HVZDRN08', '67078810941', DATE '1988-06-28',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Andamiero'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0105', 'Jonathan', 'Cruz', 'Rogel',
  'CURJ910414DS8', 'CURJ910414HVZRGN06', '18149164107', DATE '1991-04-14',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Líder de Proyecto Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0106', 'Jorge', 'Cruz', 'Salazar',
  'CUSJ9512237K5', 'CUSJ951223HVZRLR02', '05159549723', DATE '1995-12-23',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Cadista Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'JAL'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0107', 'Jorge Noé', 'Pérez', 'Zepahua',
  'PEZJ881117B53', 'PEZJ881117HVZRPR07', '02168808067', DATE '1988-11-17',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico especialista Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0108', 'Jorge Rafael', 'Contreras', 'Canto',
  'COCJ8408059H1', 'COCJ840805HVZNNR08', '83128401292', DATE '1984-08-05',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Estimacionista Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0109', 'José Adrián', 'Velasco', 'Bartolo',
  'VEBA990518N57', 'VEBA990518HVZLRD08', '84169907023', DATE '1999-05-18',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Líder de Proyecto Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0110', 'José Alberto', 'López', 'Roldán',
  'LORA8601124K5', 'LORA860112HVZPLL07', '67068616985', DATE '1986-01-12',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Eléctrico Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0111', 'José Ángel', 'Castillejos', 'Cruz',
  'CACX011101326', 'CACX011101HVZSRNA7', '52190147414', DATE '2001-11-01',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Chofer'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0112', 'José Antonio', 'González', 'Fuentes',
  'GOFA920521B93', 'GOFA920521HTCNNN07', '19149229890', DATE '1992-05-21',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Líder de ingeniería Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0113', 'José', 'Arias', 'Córdova',
  'AICJ970927NU6', 'AICJ970927HTCRRS01', '68169702450', DATE '1997-09-27',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Eléctrico Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'CEN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0114', 'José Carlos', 'Rosas', 'Rogel',
  'RORC870410MW5', 'RORC870410HVZSGR07', '67068731230', DATE '1987-04-10',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Jefe de Taller'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0115', 'José Eduardo', 'Pérez', 'Jiménez',
  'PEJE970909HW0', 'PEJE970909HVZRMD00', '26179799114', DATE '1997-09-09',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante general'
LEFT JOIN core.sedes sed    ON sed.codigo = 'CAR'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0116', 'José Eduardo', 'Tenorio', 'Villalobos',
  'TEVE9608133Z6', 'TEVE960813HVZNLD07', '03159644941', DATE '1996-08-13',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0117', 'José Leonardo', 'Márquez', 'Girón',
  'MAGL7505137Q6', 'MAGL750513HOCRRN04', '75957519160', DATE '1975-05-13',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0118', 'José Roberto', 'Collado', 'Jiménez',
  'COJR940911LS1', 'COJR940911HTCLMB05', '62169474178', DATE '1994-09-11',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Definición de Soluciones Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'NAC'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0119', 'Josué', 'Torres', 'Cadena',
  'TOCJ831013RY1', 'TOCJ831013HVZRDS03', '67058317057', DATE '1983-10-13',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Eléctrico Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0120', 'Juan Carlos', 'Méndez', 'Pablo',
  'MEPJ890913AA4', 'MEPJ890913HTCNBN04', '83058900792', DATE '1989-09-13',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Eléctrico Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'HUI'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0121', 'Juan Carlos', 'Solano', 'Dector',
  'SODJ861018F29', 'SODJ861018HVZLCN08', '67098600801', DATE '1986-10-18',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Ventas Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'ORI'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0122', 'Juan Pablo', 'Casas', 'Mendoza',
  'CAMJ960706PH8', 'CAMJ960706HVZSNN00', '11169696140', DATE '1996-07-06',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0123', 'Juan', 'Pérez', 'Castro',
  'PECJ860521PI5', 'PECJ860521HVZRSN02', '67058607549', DATE '1986-05-21',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicios Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0124', 'Karla Lizeth', 'Lozano', 'Alajara',
  'LOAK991110487', 'LOAK991110MVZZLR07', '14139958483', DATE '1999-11-10',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Cadista Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0125', 'Kevin Alfredo', 'Álvarez', 'Santiago',
  'AASK980131P65', 'AASK980131HVZLNV07', '60169815655', DATE '1998-01-31',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0126', 'Kevin Elián', 'Alejandro', 'Martínez',
  'AEMK000410UL9', 'AEMK000410HTCLRVA5', '63150061255', DATE '2000-04-10',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de obra jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0127', 'Leonardo', 'Reyes', 'Luría',
  'RELL711214LY4', 'RELL711214HVZYRN04', '67887170701', DATE '1971-12-14',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Eléctrico Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'OTE'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0128', 'Leticia Andrea', 'Silva', 'Luna',
  'SILL831130B83', 'SILL831130MVZLNT04', '67068308948', DATE '1983-11-30',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ADM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar contable Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0129', 'Mariana', 'Valdez', 'Soto',
  NULL, NULL, NULL, NULL,
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, 'Rama Capacitación',
  DATE '2024-09-01', 'ACTIVO', 'Certificación Vigente',
  NULL, NULL, 'mariana.valdez@sifygsa.com.mx'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'RH'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Analista de Capacitación & Anexos'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0130', 'Lilian Vanessa', 'Alcántara', 'Saviñón',
  'AASL0205248X3', 'AASL020524MCHLVLA6', '49170245754', DATE '2002-05-24',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar administrativo Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0131', 'Lorena', 'Hernández', 'Vázquez',
  'HEVL82082548A', 'HEVL820825MVZRZR04', '67048208234', DATE '1982-08-25',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ADM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar contable'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0132', 'Lorenzo Antonio', 'Rosas', 'Galindo',
  'ROGL700604GAA', 'ROGL700604HVZSLR01', '67057003542', DATE '1970-06-04',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Vigilante'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0133', 'Luis Adrian', 'Vazquez', 'Villagran',
  'VAVL880612EZ0', 'VAVL880612HVZZLS00', '03238838159', DATE '1988-06-12',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Vigilante'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0134', 'Luis Alberto', 'Córdova', 'Martínez',
  'COML881101FS2', 'COML881101HTCRRS07', '83138813072', DATE '1988-11-01',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Líder de Proyecto Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0135', 'Luis Alberto', 'Pérez', 'Martínez',
  'PEML840416DH0', 'PEML840416HTCRRS08', '83018402111', DATE '1984-04-16',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Eléctrico Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0136', 'Luis Alberto Tosca', 'De La', 'O',
  'TOOL8505077A0', 'TOOL850507HTCSXS09', '83128500556', DATE '1985-05-07',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Cadista'
LEFT JOIN core.sedes sed    ON sed.codigo = 'JDM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0137', 'Luis Antonio', 'Trinidad', 'Cruz',
  'TICL0411182X7', 'TICL041118HVZRRSA5', '25230413277', DATE '2004-11-18',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Eléctrico Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'IXH'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0138', 'Luis de Jesús', 'Salomón', 'Barrientos',
  'SABL021210338', 'SABL021210HVZLRSA7', '28160284536', DATE '2002-12-10',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante Eléctrico'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0139', 'Luis Fernando', 'Vázquez', 'Torres',
  'VATL940723TD6', 'VATL940723HTCZRS00', '19169404811', DATE '1994-07-23',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Estimacionista'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0140', 'Luis Pablo', 'Santiago', 'Morales',
  'SAML980620128', 'SAML980620HVZNRS05', '43169868130', DATE '1998-06-20',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Cadista Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0141', 'Luz Deneth', 'Morales', 'Vazquez',
  'MOVL0306122K9', 'MOVL030612MVZRZZA1', '68180378348', DATE '2003-06-12',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'RH'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar de RRHH Trainee'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0142', 'Manuel Jair', 'Jiménez', 'Ricardez',
  'JIRM000702P38', 'JIRM000702HVZMCNA6', '61160049278', DATE '2000-07-02',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicios Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0143', 'Marcos Kevin', 'Guillen', 'Martínez',
  'GUMM991119DC8', 'GUMM991119HVZLRR09', '78169997877', DATE '1999-11-19',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar de HSE Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'JAL'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0144', 'María Trinidad', 'González', 'Hernández',
  'GOHT8510066Y6', 'GOHT851006MTCNRR03', '02198592822', DATE '1985-10-06',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Intendencia'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0145', 'Marlene Saraí', 'Alonso', 'Rodríguez',
  'AORM930128B35', 'AORM930128MOCLDR05', '03169340670', DATE '1993-01-28',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Definición de Soluciones Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0146', 'Martín', 'Hernández', 'Zarrategui',
  'HEZM771111GB5', 'HEZM771111HVZRRR07', '67957791972', DATE '1977-11-11',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Vigilante'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0147', 'Marylib De La Paz Guadalupe', 'Aguilar', 'Pacheco',
  'AUPM980616623', 'AUPM980616MVZGCR09', '05189839961', DATE '1998-06-16',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Servicios Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0148', 'Mayra Ixchel', 'González', 'Jara',
  'GOJM880503NN2', 'GOJM880503MVZNRY07', '05158899616', DATE '1988-05-03',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Comprador Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0149', 'Miguel', 'Hernández', 'Camero',
  'HECM85100747A', 'HECM851007HTCRMG08', '02218532576', DATE '1985-10-07',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicio Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0150', 'Miguel Jesús', 'Maldonado', 'Ruiz',
  'MARM020927IY0', 'MARM020927HVZLZGA5', '38170246888', DATE '2002-09-27',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar de HSE Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0151', 'Misael', 'Sánchez', 'González',
  'SAGM8602124KA', 'SAGM860212HVZNNS02', '67088615082', DATE '1986-02-12',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Líder de Contrato Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'TEX'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0152', 'Sofía', 'Morales', 'Ruiz',
  NULL, NULL, NULL, NULL,
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, 'Cuadrilla Alfa (Almacén Principal)',
  DATE '2022-09-12', 'ACTIVO', 'Certificación Vigente',
  NULL, NULL, 'sofia.morales@sifygsa.com.mx'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Coordinadora de Seguridad & Normatividad'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0153', 'Natanael', 'Domínguez', 'Pérez',
  'DOPN860714D38', 'DOPN860714HVZMRT09', '67068635647', DATE '1986-07-14',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Eléctrico Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'OTE'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0154', 'Octavio', 'Bartolo', 'Antonio',
  'BAAO7201273C2', 'BAAO720127HVZRNC05', '67897255179', DATE '1972-01-27',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Tubero Eléctrico Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0156', 'Omar Jaziel', 'Martínez', 'Martínez',
  'MAMX910205KZ2', 'MXMO910205HVZRRM09', '67079103684', DATE '1991-02-05',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicios Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0157', 'Oscar', 'Alor', 'Prieto',
  'AOPO0305171F3', 'AOPO030517HVZLRSA7', '35210301335', DATE '2003-05-17',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante Eléctrico'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0158', 'Oscar De Jesús', 'Tepox', 'Cocuyo',
  'TECO9206064Z7', 'TECO920606HVZPCS02', '67089203680', DATE '1992-06-06',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Encargado de Mantenimiento Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0159', 'Oscar Guillermo', 'Posada', 'Bolan',
  'POBO921122BW7', 'POBO921122HVZSLS01', '02169278476', DATE '1992-11-22',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicios Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0160', 'Osvaldo Arath', 'Rafael', 'López',
  'RALO030425T19', 'RALO030425HVZFPSA5', '49210352065', DATE '2003-04-25',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'RH'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar de RRHH Trainee'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0161', 'Pablo Alejandro', 'López', 'Hernández',
  'LOHP0007134M9', 'LOHP000713HTCPRBA8', '04130066469', DATE '2000-07-13',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante Eléctrico'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0162', 'Pedro Josué', 'Benitez', 'Parada',
  'BEPP8906258K2', 'BEPP890625HVZNRD06', '67118922144', DATE '1989-06-25',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Líder de Contrato Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0163', 'Porfirio Alberto', 'Luna', 'Magaña',
  'LUMP910124HW1', 'LUMP910124HTCNGR06', '83119105340', DATE '1991-01-24',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor HSE Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0164', 'Rigoberto Javier', 'De la', 'cruz',
  'JACR000705MV8', 'JACR000705HTCVRGA6', '83150026256', DATE '2000-07-05',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Cadista Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'PAR'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0165', 'Roberto Carlos', 'Lara', 'Torres',
  'LATR80033088A', 'LATR800330HVZRRB06', '67018018100', DATE '1980-03-30',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de Obra Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0166', 'Roberto Carlos', 'Méndez', 'Santiago',
  'MESR8404118U0', 'MESR840411HTCNNB07', '83058411451', DATE '1984-04-11',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante Eléctrico'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0167', 'Rodolfo', 'Zapata', NULL,
  'ZARO740326FP7', 'ZAXR740326HVZPXD00', '67927460906', DATE '1974-03-26',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante Eléctrico'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0168', 'Rómulo Enrique', 'Peña', 'Gilson',
  'PEGR7108243W6', 'PEGR710824HNEXLM02', '02187185372', DATE '1971-08-24',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Vigilante'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
) -- CURP origen "RARL750921HVZMPS1O" omitida por formato inválido (corregir en captura)
SELECT
  'SFG-0169', 'Rusbel', 'Ramos', 'López',
  'RARL750921DM5', NULL, '67957556151', NULL,
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante Eléctrico'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0170', 'Ruth Abigail', 'Joachin', 'Prieto',
  'JOPR840926J53', 'JOPR840926MVZCRT02', '67068419810', DATE '1984-09-26',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Intendencia'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0171', 'Rutilo Pérez', 'De la', 'Cruz',
  'PECR890905G20', 'PECR890905HTCRRT09', '83108926904', DATE '1989-09-05',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Vigilante'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0172', 'Salvador Alberto De la', 'Cruz', 'Alcudia',
  'CUAS031006PY2', 'CUAS031006HTCRLLA2', '26170351220', DATE '2003-10-06',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Encargado de Mantenimiento Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0173', 'Salvador Iván', 'Gómez', 'Guerrero',
  'GOGS780606IP9', 'GOGS780606HVZMRL03', '67067806215', DATE '1978-06-06',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Logística'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0174', 'Salvador', 'Patraca', 'Ramírez',
  'PARS961223US9', 'PARS961223HVZTML07', '13169684654', DATE '1996-12-23',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicios Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COR'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0175', 'Santiago', 'Fuentes', 'Cruz',
  'FUCS710724RB9', 'FUCS710724HVZNRN00', '67897157870', DATE '1971-07-24',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Vigilante'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0176', 'Sebastián', 'Preciado', 'Alvarado',
  'PEAS970602IN1', 'PEAS970602HVZRLB05', '29169767992', DATE '1997-06-02',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Ventas Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0177', 'Sergio', 'Arias', 'Domínguez',
  'AIDS890506983', 'AIDS890506HTCRMR03', '83088948449', DATE '1989-05-06',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante Eléctrico'
LEFT JOIN core.sedes sed    ON sed.codigo = 'PAR'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0178', 'Sergio', 'Arias', 'Montejo',
  'AIMS760930B92', 'AIMS760930HTCRNR08', '83917617819', DATE '1976-09-30',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de Obra Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0179', 'Sergio', 'Del Campo', 'Yzquierdo',
  'CAYS9406149C5', 'CAYS940614HTCMZR03', '10189448177', DATE '1994-06-14',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar Estimacionista'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0180', 'Sheyla Irais', 'Troncoso', 'Vidal',
  'TOVS900806RA6', 'TOVS900806MVZRDH01', '67099011875', DATE '1990-08-06',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'RH'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar de RRHH Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0181', 'Uriel Eduardo', 'Gerónimo', 'Dionisio',
  'GEDU9501176B5', 'GEDU950117HTCRNR02', '08169503623', DATE '1995-01-17',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Diseño Jr.'
LEFT JOIN core.sedes sed    ON sed.codigo = 'VHA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0182', 'Uriel Isaí', 'Cruz', 'Cancino',
  'CUCU001228631', 'CUCU001228HVZRNRA2', '23160048049', DATE '2000-12-28',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Laminador'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0183', 'Víctor Iván', 'Hernández', 'Castelan',
  'HECV940710T17', 'HECV940710HVZRSC01', '67139429178', DATE '1994-07-10',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de volumetrías Trainee'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0184', 'Víctor Manuel', 'Alegría', 'Palacios',
  'AEPV780412JI5', 'AEPV780412HVZLLC01', '67067801810', DATE '1978-04-12',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de volumetrías Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0185', 'Víctor Manuel', 'Zunun', 'Gómez',
  'ZUGV870605US1', 'ZUGV870605HVZNMC00', '67078735528', DATE '1987-06-05',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Líder de Contrato Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0186', 'Victoria', 'Broca', 'Rabanales',
  'BORV840108I5A', 'BORV840108MTCRBC04', '02258429006', DATE '1984-01-08',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Intendencia MSA'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0187', 'Viridiana', 'Cárdenas', 'Hernández',
  'CAHV920207MF7', 'CAHV920207MVZRRR03', '19169202280', DATE '1992-02-07',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar administrativo Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0188', 'Waldo Isidro De La', 'Cruz', 'Ruíz',
  'CURW800521ALA', 'CURW800521HVZRZL05', '48068014793', DATE '1980-05-21',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Almacenista'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0189', 'Yesenia Yazbeth', 'Cruz', 'Salomón',
  'CUSY9303255X8', 'CUSY930325MVZRLS08', '03149377511', DATE '1993-03-25',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0190', 'Zaidel', 'Cruz', 'Martínez',
  'CUMZ8409039W4', 'CUMZ840903HVZRRD08', '32028447038', DATE '1984-09-03',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Encargado de Mantenimiento SS'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0191', 'Zimrry Tamar', 'Francisco', 'Reyes',
  'FARZ011115PM4', 'FARZ011115MOCRYMA2', '44160147656', DATE '2001-11-15',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ADM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar contable Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'SOC'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0192', 'Zurisadai', 'Castañeda', 'Hernández',
  'CAHZ020814KI8', 'CAHZ020814MVZSRRA5', '54170235870', DATE '2002-08-14',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar Administrativo Jr.'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

-- 2. Enlace de jerarquía del Organigrama Corporativo (id_supervisor)
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

-- 4. Enlazar Extensiones Telefónicas a su colaborador asignado por FK (sin texto redundante)
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '101' AND e.folio = 'SFG-0001';
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '102' AND e.folio = 'SFG-0002';
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '103' AND e.folio = 'SFG-0014';
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '104' AND e.folio = 'SFG-0013';
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '105' AND e.folio = 'SFG-0008';
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '107' AND e.folio = 'SFG-0005';
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '111' AND e.folio = 'SFG-0007';
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '112' AND e.folio = 'SFG-0009';
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '115' AND e.folio = 'SFG-0004';
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '116' AND e.folio = 'SFG-0003';
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '117' AND e.folio = 'SFG-0006';
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '118' AND e.folio = 'SFG-0015';
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '119' AND e.folio = 'SFG-0010';

-- 5. Sincronizar contador de folios atómico al máximo cargado (SFG-0192 -> siguiente SFG-0193)
SELECT rrhh.fn_sincronizar_folio_empleados();

COMMIT;
