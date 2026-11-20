-- ============================================================================
-- database/postgres/seeds/02_seed_rrhh_catalogs.sql
-- Catálogos oficiales de Recursos Humanos SIFYGSA
-- ============================================================================

-- 1. Inicializar control atómico de folios
INSERT INTO rrhh.control_folios (entidad, prefijo, ultimo_numero, longitud_min)
VALUES
  ('EMPLEADO', 'SFG', 0, 4),
  ('VACACION', 'VAC', 0, 4),
  ('SGI',      'SGI', 0, 4)
ON CONFLICT (entidad) DO NOTHING;

-- 2. Bancos de México
INSERT INTO rrhh.cat_bancos (codigo_spei, nombre)
VALUES
  ('012', 'BBVA México'),
  ('002', 'Banamex'),
  ('014', 'Santander'),
  ('072', 'Banorte'),
  ('021', 'HSBC'),
  ('044', 'Scotiabank'),
  ('137', 'BanCoppel'),
  ('127', 'Banco Azteca'),
  ('036', 'Inbursa')
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
   WHERE c.id_empleado IS NULL AND c.nombre = v.nombre
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

-- 6. Directorio base de Extensiones Telefónicas
INSERT INTO rrhh.extensiones_telefonicas (extension, etiqueta_area, id_departamento, id_sede, asignado_texto, es_principal_depto)
SELECT
  v.ext::rrhh.extension_tel,
  v.etiqueta,
  d.id_departamento,
  s.id_sede,
  v.asignado,
  v.es_principal
FROM (
  VALUES
    ('101', 'Dirección General',        'DIR',     'MIN', 'Ing. Agustín Anastacio Martínez', TRUE),
    ('102', 'Dirección Comercial',      'VTA',     'MIN', 'Ing. Manuel Martínez Ruíz',       FALSE),
    ('103', 'Ventas Istmo',             'VTA',     'MIN', 'Ing. Guillermo Sánchez Escobar',  TRUE),
    ('104', 'Ventas Sur',               'VTA',     'MIN', 'Ing. Yesenia Rosas Rogel',        FALSE),
    ('105', 'Administración',           'ADM',     'MIN', 'Lic. Viridiana Arenas Anastacio', TRUE),
    ('107', 'Gerencia de Compras',      'COM',     'MIN', 'Lic. Marlem Campos García',       TRUE),
    ('111', 'Infraestructura',          'INF',     'MIN', 'Ing. Pablo Vázquez Culebro',      TRUE),
    ('112', 'Recursos Humanos',         'RH',      'MIN', 'Lic. Valeria Méndez Albores',     TRUE),
    ('114', 'Almacén Mapachapa',        'ALM',     'MAP', 'Manuel Cordero',                  TRUE),
    ('115', 'Ingeniería',               'ING',     'MIN', 'Ing. Miguel Ángel Guzmán Reyes',  TRUE),
    ('116', 'Servicios',                'SRV',     'MIN', 'Ing. Emmanuel Mendoza Ramírez',   TRUE),
    ('117', 'HSE Minatitlán',           'HSE-MIN', 'MIN', 'Ing. Carlos Enrique Cossio Ruíz', TRUE),
    ('118', 'Subgerencia de Servicios', 'SRV',     'MIN', 'Ing. Erick Hernández Rueda',      FALSE),
    ('119', 'HSE Comalcalco',           'HSE-COM', 'COM', 'Ing. Rosa Ivette Trujillo Palma', TRUE)
) AS v(ext, etiqueta, depto_cod, sede_cod, asignado, es_principal)
JOIN rrhh.departamentos d ON d.codigo = v.depto_cod
LEFT JOIN core.sedes s    ON s.codigo = v.sede_cod
ON CONFLICT (extension) DO NOTHING;

-- 7. Días Festivos Oficiales México (LFT 2026)
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
