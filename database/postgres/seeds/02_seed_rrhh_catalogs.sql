-- ============================================================================
-- database/postgres/seeds/02_seed_rrhh_catalogs.sql
-- Catálogos oficiales de Recursos Humanos SIFYGSA (3FN)
-- Incluye 13 Bancos de México, 5 Tipos de Contrato, 3 Carpetas estándar,
-- 14 Departamentos + 2 Ramas, 102 Puestos unificados, 14 Extensiones y Festivos.
-- ============================================================================

-- 1. Inicializar control atómico de folios
INSERT INTO rrhh.control_folios (entidad, prefijo, ultimo_numero, longitud_min)
VALUES
  ('EMPLEADO', 'SFG', 0, 4),
  ('VACACION', 'VAC', 0, 4),
  ('SGI',      'SGI', 0, 4)
ON CONFLICT (entidad) DO NOTHING;

-- 2. Bancos de México (13 instituciones con código SPEI — alineado a formShield.ts)
INSERT INTO rrhh.cat_bancos (codigo_spei, nombre)
VALUES
  ('012', 'BBVA México'),
  ('072', 'Banorte'),
  ('014', 'Santander México'),
  ('002', 'Citibanamex'),
  ('021', 'HSBC México'),
  ('044', 'Scotiabank'),
  ('127', 'Banco Azteca'),
  ('137', 'BanCoppel'),
  ('036', 'Inbursa'),
  ('062', 'Afirme'),
  ('058', 'BanRegio'),
  ('638', 'Nu México'),
  ('159', 'Hey Banco')
ON CONFLICT (nombre) DO NOTHING;

-- 3. Tipos de Contrato (LFT México)
INSERT INTO rrhh.cat_tipos_contrato (codigo, nombre, requiere_vigencia)
VALUES
  ('INDET',  'Tiempo Indeterminado', FALSE),
  ('DET',    'Tiempo Determinado',   TRUE),
  ('OBRA',   'Por Obra Determinada', TRUE),
  ('PRUEBA', 'Periodo de Prueba',    TRUE),
  ('CAPAC',  'Capacitación Inicial', TRUE)
ON CONFLICT (codigo) DO NOTHING;

-- 4. Carpetas estándar del Expediente Digital
INSERT INTO rrhh.carpetas_expediente (id_empleado, nombre, es_sistema, orden)
SELECT NULL, v.nombre, TRUE, v.orden
FROM (
  VALUES
    ('Documentos',         1),
    ('Certificaciones',    2),
    ('Contratos y Anexos', 3)
) AS v(nombre, orden)
WHERE NOT EXISTS (
  SELECT 1 FROM rrhh.carpetas_expediente c
   WHERE c.id_empleado IS NULL AND LOWER(c.nombre) = LOWER(v.nombre)
);

-- 5. Los 14 Departamentos Oficiales de SIFYGSA (con siglas DIR..GSAPE)
INSERT INTO rrhh.departamentos (id_empresa, id_sede, codigo, nombre, descripcion)
SELECT
  e.id_empresa,
  s.id_sede,
  v.codigo::rrhh.codigo_departamento,
  v.nombre,
  v.descripcion
FROM core.empresas e
CROSS JOIN (
  VALUES
    ('DIR',     'MIN', 'Dirección',                       'Dirección general y gestión estratégica corporativa'),
    ('ADM',     'MIN', 'Administración',                  'Gestión administrativa, tesorería y contabilidad'),
    ('CAL',     'MIN', 'Calidad',                         'Aseguramiento y control de calidad ISO / SIL-3'),
    ('COM',     'MIN', 'Compras',                         'Adquisición de suministros, equipos e importaciones F&G'),
    ('HSE-MIN', 'MIN', 'HSE',                             'Seguridad industrial, salud ocupacional y medio ambiente (Sede Minatitlán)'),
    ('ALM',     'MAP', 'Almacén',                         'Control de inventarios, resguardos y entrega de EPP'),
    ('INF',     'MIN', 'Infraestructura',                 'Mantenimiento de bases operativas y redes de telecomunicación'),
    ('ING',     'MIN', 'Ingeniería',                      'Diseño e integración de sistemas de detección de gas y fuego SIL-3'),
    ('MCP',     'MIN', 'Medición y Control de Proyectos', 'Seguimiento de proyectos, licitaciones, estimaciones y control operativo'),
    ('HSE-COM', 'COM', 'HSE',                             'Seguridad industrial, salud ocupacional y medio ambiente (Sede Comalcalco)'),
    ('RH',      'MIN', 'Recursos Humanos',                'Gestión de talento, nómina, acreditaciones y rama de Capacitación (DC-3 / STPS)'),
    ('SRV',     'COM', 'Servicios',                       'Mantenimiento en campo, calibración y puestas en marcha'),
    ('VTA',     'MIN', 'Ventas',                          'Comercialización de soluciones F&G y rama de Definición de Soluciones'),
    ('GSAPE',   'MIN', 'GSAPE',                           'Grupo de Soporte y Análisis de Proyectos Especiales F&G')
) AS v(codigo, sede_cod, nombre, descripcion)
LEFT JOIN core.sedes s ON s.codigo = v.sede_cod
WHERE e.codigo = 'SIFYGSA'
ON CONFLICT (codigo) DO UPDATE
  SET nombre      = EXCLUDED.nombre,
      descripcion = EXCLUDED.descripcion,
      id_sede     = EXCLUDED.id_sede;

-- Ramas especializadas (sub-departamentos con id_depto_padre)
INSERT INTO rrhh.departamentos (id_empresa, id_sede, id_depto_padre, codigo, nombre, descripcion)
SELECT
  e.id_empresa,
  p.id_sede,
  p.id_departamento,
  v.codigo::rrhh.codigo_departamento,
  v.nombre,
  v.descripcion
FROM core.empresas e
CROSS JOIN (
  VALUES
    ('RH-CAP',  'RH',  'Capacitación',            'Rama de Recursos Humanos enfocada en cursos, DC-3 y STPS'),
    ('VTA-SOL', 'VTA', 'Definición de Soluciones','Rama de Ventas enfocada en ingeniería comercial y propuestas F&G')
) AS v(codigo, padre_cod, nombre, descripcion)
JOIN rrhh.departamentos p ON p.codigo = v.padre_cod
WHERE e.codigo = 'SIFYGSA'
ON CONFLICT (codigo) DO NOTHING;

-- 6. Catálogo Oficial de Puestos Unificados (102 puestos sin variantes de acento/mayúsculas)
INSERT INTO rrhh.cat_puestos (nombre, id_departamento, nivel_jerarquico)
SELECT
  v.nombre,
  d.id_departamento,
  v.nivel::core.nivel_jerarquico
FROM (
  VALUES
    ('Almacenista', 'SRV', 7),
    ('Almacenista Jr', 'SRV', 7),
    ('Analista de Capacitación & Anexos', 'RH', 6),
    ('Andamiero', 'ING', 7),
    ('Auxiliar Administrativo', 'ING', 7),
    ('Auxiliar administrativo Jr', 'INF', 7),
    ('Auxiliar Administrativo Jr.', 'SRV', 7),
    ('Auxiliar administrativo Sr', 'HSE-COM', 7),
    ('Auxiliar Administrativo Ss', 'SRV', 7),
    ('Auxiliar contable', 'ADM', 7),
    ('Auxiliar contable Jr', 'ADM', 7),
    ('Auxiliar contable Ss', 'ADM', 7),
    ('Auxiliar de almacén', 'COM', 7),
    ('Auxiliar de HSE Jr', 'HSE-COM', 7),
    ('Auxiliar de HSE Ss', 'HSE-MIN', 7),
    ('Auxiliar de RRHH Ss', 'RH', 7),
    ('Auxiliar de RRHH Trainee', 'RH', 7),
    ('Auxiliar de TI Trainee', 'INF', 7),
    ('Auxiliar Estimacionista', 'SRV', 7),
    ('Auxiliar Técnico Ss', 'SRV', 7),
    ('Ayudante Eléctrico', 'SRV', 7),
    ('Ayudante general', 'ING', 7),
    ('Cadista', 'SRV', 7),
    ('Cadista Jr', 'SRV', 7),
    ('Cadista Ss', 'SRV', 7),
    ('Chofer', 'SRV', 7),
    ('Comprador Jr', 'COM', 6),
    ('Comprador Trainee', 'COM', 6),
    ('Coordinadora de Seguridad & Normatividad', 'HSE-MIN', 4),
    ('Coordonador de volumetrías', 'VTA', 7),
    ('Director Comercial', 'VTA', 2),
    ('Director General', 'DIR', 1),
    ('Eléctrico Jr', 'SRV', 7),
    ('Eléctrico Sr', 'SRV', 7),
    ('Encargado de Mantenimiento Jr', 'INF', 5),
    ('Encargado de Mantenimiento SS', 'INF', 5),
    ('Especialista en Automatización & Control', 'MCP', 6),
    ('Estimacionista', 'SRV', 7),
    ('Estimacionista Ss', 'SRV', 7),
    ('Generalista de Recursos Humanos', 'RH', 7),
    ('Gerente de Administración', 'ADM', 3),
    ('Gerente de Compras', 'COM', 3),
    ('Gerente de Infraestructura', 'INF', 3),
    ('Gerente de Ingeniería', 'ING', 3),
    ('Gerente de MYCP', 'MCP', 3),
    ('Gerente de Recursos Humanos', 'RH', 3),
    ('Gerente de Servicios', 'SRV', 3),
    ('Gerente de Soporte a Proyectos', 'GSAPE', 3),
    ('Gerente HSE Comalcalco', 'HSE-COM', 3),
    ('Gerente QHSE', 'HSE-MIN', 3),
    ('Gerente Ventas Istmo', 'VTA', 3),
    ('Gerente Ventas Sur', 'VTA', 3),
    ('Ing. de Calidad Ss', 'CAL', 7),
    ('Ing. De Servicios', 'SRV', 7),
    ('Ingeniero de definición de soluciones', 'VTA', 6),
    ('Ingeniero de Definición de Soluciones Jr', 'VTA', 6),
    ('Ingeniero de Definición de Soluciones Ss', 'VTA', 6),
    ('Ingeniero de Diseño Jr.', 'VTA', 6),
    ('Ingeniero de Medición Jr', 'DIR', 6),
    ('Ingeniero de productos', 'VTA', 6),
    ('Ingeniero de Servicios Jr', 'ING', 6),
    ('Ingeniero de servicios senior', 'ING', 6),
    ('Ingeniero de servicios Ss', 'ING', 6),
    ('Ingeniero de TI Ss', 'INF', 6),
    ('Ingeniero de Ventas Jr', 'VTA', 6),
    ('Ingeniero de Ventas Sr', 'VTA', 6),
    ('Ingeniero de Ventas Ss', 'VTA', 6),
    ('Ingeniero de volumetrías Ss', 'VTA', 6),
    ('Ingeniero de volumetrías Trainee', 'VTA', 6),
    ('Intendencia', 'INF', 7),
    ('Intendencia MSA', 'INF', 7),
    ('Jefe de Taller', 'SRV', 4),
    ('Laminador', 'SRV', 7),
    ('Líder de Contrato Jr', 'ING', 5),
    ('Líder de Contrato Sr', 'SRV', 5),
    ('Líder de ingeniería Ss', 'ING', 5),
    ('Líder de Proyecto Jr', 'SRV', 5),
    ('Líder de Proyecto Sr', 'SRV', 5),
    ('Líder de proyecto Ss', 'SRV', 5),
    ('Logística', 'COM', 7),
    ('Nominista', 'ADM', 7),
    ('Por definir', NULL, 7),
    ('Signatario de HSE Jr', 'HSE-COM', 7),
    ('Soldador Ss.', 'SRV', 7),
    ('Sub-Gerente de Servicios', 'SRV', 4),
    ('Supervisor de HSE', 'HSE-COM', 5),
    ('Supervisor de HSE Jr', 'HSE-COM', 5),
    ('Supervisor de HSE Ss', 'HSE-COM', 5),
    ('Supervisor de Mantenimiento & Redes', 'INF', 5),
    ('Supervisor de obra jr', 'SRV', 5),
    ('Supervisor de Obra Sr', 'SRV', 5),
    ('Supervisor HSE Jr', 'HSE-COM', 5),
    ('Técnico de Servicio Jr', 'ING', 7),
    ('Técnico de Servicios', 'ING', 7),
    ('Técnico de Servicios Jr', 'ING', 7),
    ('Técnico de Servicios Jr.', 'SRV', 7),
    ('Técnico de servicios Sr', 'ING', 7),
    ('Técnico en Detección de Gas', 'HSE-MIN', 7),
    ('Técnico especialista jr', 'SRV', 6),
    ('Técnico especialista Ss', 'SRV', 6),
    ('Tubero Eléctrico Sr', 'SRV', 7),
    ('Vigilante', 'INF', 7)
) AS v(nombre, depto_cod, nivel)
LEFT JOIN rrhh.departamentos d ON d.codigo = v.depto_cod
ON CONFLICT (nombre) DO NOTHING;

-- 7. Directorio base de Extensiones Telefónicas (id_empleado_asignado se vincula en 03_seed_rrhh_employees.sql)
INSERT INTO rrhh.extensiones_telefonicas (extension, etiqueta_area, id_departamento, id_sede, es_principal_depto)
SELECT
  v.ext::rrhh.extension_tel,
  v.etiqueta,
  d.id_departamento,
  s.id_sede,
  v.es_principal
FROM (
  VALUES
    ('101', 'Dirección General',        'DIR',     'MIN', TRUE),
    ('102', 'Dirección Comercial',      'VTA',     'MIN', FALSE),
    ('103', 'Ventas Istmo',             'VTA',     'MIN', TRUE),
    ('104', 'Ventas Sur',               'VTA',     'MIN', FALSE),
    ('105', 'Administración',           'ADM',     'MIN', TRUE),
    ('107', 'Gerencia de Compras',      'COM',     'MIN', TRUE),
    ('111', 'Infraestructura',          'INF',     'MIN', TRUE),
    ('112', 'Recursos Humanos',         'RH',      'MIN', TRUE),
    ('114', 'Almacén Mapachapa',        'ALM',     'MAP', TRUE),
    ('115', 'Ingeniería',               'ING',     'MIN', TRUE),
    ('116', 'Servicios',                'SRV',     'MIN', TRUE),
    ('117', 'HSE Minatitlán',           'HSE-MIN', 'MIN', TRUE),
    ('118', 'Subgerencia de Servicios', 'SRV',     'MIN', FALSE),
    ('119', 'HSE Comalcalco',           'HSE-COM', 'COM', TRUE)
) AS v(ext, etiqueta, depto_cod, sede_cod, es_principal)
JOIN rrhh.departamentos d ON d.codigo = v.depto_cod
LEFT JOIN core.sedes s    ON s.codigo = v.sede_cod
ON CONFLICT (extension) DO NOTHING;

-- 8. Días Festivos Oficiales México (LFT 2026)
INSERT INTO rrhh.dias_festivos (fecha, nombre, tipo, es_descanso_obligatorio)
VALUES
  ('2026-01-01', 'Año Nuevo',                            'OFICIAL_LFT', TRUE),
  ('2026-02-02', 'Día de la Constitución Mexicana',      'OFICIAL_LFT', TRUE),
  ('2026-03-16', 'Natalicio de Benito Juárez',           'OFICIAL_LFT', TRUE),
  ('2026-05-01', 'Día del Trabajo',                      'OFICIAL_LFT', TRUE),
  ('2026-09-16', 'Día de la Independencia de México',    'OFICIAL_LFT', TRUE),
  ('2026-11-16', 'Revolución Mexicana',                  'OFICIAL_LFT', TRUE),
  ('2026-12-25', 'Navidad',                              'OFICIAL_LFT', TRUE)
ON CONFLICT (fecha) DO NOTHING;
