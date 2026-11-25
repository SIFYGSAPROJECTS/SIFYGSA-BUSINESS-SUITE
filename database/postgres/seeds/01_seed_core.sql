-- ============================================================================
-- database/postgres/seeds/01_seed_core.sql
-- Datos iniciales transversales: Empresas, 28 Sedes/Localidades normalizadas,
-- Módulos de la Suite, Submódulos RRHH, Roles y Matriz Inicial RBAC.
-- Idempotente (seguro de volver a ejecutar gracias a ON CONFLICT DO NOTHING).
-- ============================================================================

-- 1. Empresas / Subsidiarias
INSERT INTO core.empresas (codigo, nombre_corto, razon_social, es_principal)
VALUES
  ('SIFYGSA', 'SIFYGSA', 'Soluciones Integrales en Fire & Gas S.A. de C.V.', TRUE),
  ('VIPSA',   'VIPSA',   'VIPSA Ingeniería y Servicios Industriales S.A. de C.V.', FALSE)
ON CONFLICT (codigo) DO NOTHING;

-- 2. Sedes y Localidades Operativas Normalizadas (28 registros únicos sin variantes de acento/mayúsculas)
INSERT INTO core.sedes (id_empresa, codigo, nombre, ciudad, estado, es_matriz)
SELECT e.id_empresa, v.codigo, v.nombre, v.ciudad, v.estado, v.es_matriz
FROM core.empresas e
CROSS JOIN (
  VALUES
    -- Bases operativas principales
    ('MIN', 'Minatitlán, Ver.',              'Minatitlán',              'Veracruz',  TRUE),
    ('MAP', 'Mapachapa, Ver.',               'Mapachapa',               'Veracruz',  FALSE),
    ('COM', 'Comalcalco, Tab.',              'Comalcalco',              'Tabasco',   FALSE),
    ('COA', 'Coatzacoalcos, Ver.',           'Coatzacoalcos',           'Veracruz',  FALSE),
    ('COS', 'Cosoleacaque, Ver.',            'Cosoleacaque',            'Veracruz',  FALSE),
    ('XAL', 'Xalapa, Ver.',                  'Xalapa',                  'Veracruz',  FALSE),
    ('CDC', 'Ciudad del Carmen, Camp.',      'Ciudad del Carmen',       'Campeche',  FALSE),
    ('MER', 'Mérida, Yuc.',                  'Mérida',                  'Yucatán',   FALSE),
    -- Localidades adicionales de la plantilla activa
    ('ACA', 'Acayucan, Ver.',                'Acayucan',                'Veracruz',  FALSE),
    ('CAN', 'Canticas, Ver.',                'Canticas',                'Veracruz',  FALSE),
    ('CAR', 'Carrizal, Ver.',                'Carrizal',                'Veracruz',  FALSE),
    ('CEN', 'Centla, Tab.',                  'Centla',                  'Tabasco',   FALSE),
    ('CNO', 'Centro Norte',                  'Minatitlán',              'Veracruz',  FALSE),
    ('COR', 'Córdoba, Ver.',                 'Córdoba',                 'Veracruz',  FALSE),
    ('QRO', 'Corregidora, Querétaro',        'Corregidora',             'Querétaro', FALSE),
    ('HUI', 'Huimanguillo, Tab.',            'Huimanguillo',            'Tabasco',   FALSE),
    ('IXH', 'Ixhuatlán del Sureste, Ver.',   'Ixhuatlán del Sureste',   'Veracruz',  FALSE),
    ('JDM', 'Jalpa de Méndez, Tab.',         'Jalpa de Méndez',         'Tabasco',   FALSE),
    ('JAL', 'Jáltipan, Ver.',                'Jáltipan',                'Veracruz',  FALSE),
    ('NAC', 'Nacajuca, Tab.',                'Nacajuca',                'Tabasco',   FALSE),
    ('ORI', 'Orizaba, Ver.',                 'Orizaba',                 'Veracruz',  FALSE),
    ('OTE', 'Oteapan, Ver.',                 'Oteapan',                 'Veracruz',  FALSE),
    ('PAR', 'Paraíso, Tab.',                 'Paraíso',                 'Tabasco',   FALSE),
    ('SPM', 'San Pedro Mártir, Ver.',        'San Pedro Mártir',        'Veracruz',  FALSE),
    ('SOC', 'Soconusco, Ver.',               'Soconusco',               'Veracruz',  FALSE),
    ('TEX', 'Texistepec, Ver.',              'Texistepec',              'Veracruz',  FALSE),
    ('TBL', 'Tierra Blanca, Ver.',           'Tierra Blanca',           'Veracruz',  FALSE),
    ('VHA', 'Villahermosa, Tab.',            'Villahermosa',            'Tabasco',   FALSE)
) AS v(codigo, nombre, ciudad, estado, es_matriz)
WHERE e.codigo = 'SIFYGSA'
ON CONFLICT (codigo) DO NOTHING;

-- 3. Módulos de la Suite SIFYGSA ERP / CRM
INSERT INTO core.modulos (codigo, nombre, descripcion, orden)
VALUES
  ('DASH', 'Inicio',           'Panel ejecutivo consolidado', 1),
  ('RRHH', 'Recursos Humanos', 'Plantilla, organigrama, expedientes, vacaciones y SGI', 2),
  ('ALM',  'Almacén',          'Inventarios, entradas, salidas y resguardos EPP', 3),
  ('COM',  'Compras',          'Órdenes de compra, cotizaciones y proveedores', 4),
  ('REQ',  'Requisiciones',    'Solicitudes internas y flujos de aprobación', 5),
  ('CRM',  'CRM Comercial',    'Clientes, oportunidades y seguimiento de proyectos', 6),
  ('FIN',  'Finanzas',         'Tabulador, nómina, fondos y partidas', 7),
  ('ADM',  'Administración',   'Roles, permisos, usuarios y configuración global', 8)
ON CONFLICT (codigo) DO NOTHING;

-- 4. Submódulos de Recursos Humanos
INSERT INTO core.submodulos (id_modulo, codigo, nombre, ruta_url, orden)
SELECT m.id_modulo, v.codigo, v.nombre, v.ruta_url, v.orden
FROM core.modulos m
CROSS JOIN (
  VALUES
    ('rrhh-panel',         'Menú Principal',          '/rrhh/dashboard',        1),
    ('rrhh-alta',          'Registro del Personal',   '/rrhh/empleados/nuevo',  2),
    ('rrhh-catalogos',     'Directorio de Personal',  '/rrhh/empleados',        3),
    ('rrhh-vacaciones',    'Vacaciones',              '/rrhh/vacaciones',       4),
    ('rrhh-formatos',      'Formatos SGI',            '/rrhh/formatos',         5),
    ('rrhh-departamentos', 'Departamentos',           '/rrhh/departamentos',    6),
    ('rrhh-extensiones',   'Extensiones Telefónicas', '/rrhh/extensiones',      7),
    ('rrhh-cumpleanos',    'Cumpleaños',              '/rrhh/cumpleanos',       8),
    ('rrhh-festivos',      'Días Festivos',           '/rrhh/festivos',         9)
) AS v(codigo, nombre, ruta_url, orden)
WHERE m.codigo = 'RRHH'
ON CONFLICT (codigo) DO NOTHING;

-- 5. Roles corporativos base
INSERT INTO core.roles (codigo, nombre, descripcion, nivel_acceso)
VALUES
  ('super_admin',  'Administrador del Sistema', 'Control total multi-módulo', 10),
  ('direccion',    'Dirección General',         'Consulta ejecutiva y aprobaciones', 9),
  ('gerente_rrhh', 'Gerencia de RRHH',          'Control completo del módulo de Recursos Humanos', 8),
  ('analista_rrhh','Analista de RRHH',          'Altas, ediciones, importaciones y formatos SGI', 6),
  ('consulta',     'Solo Consulta',             'Lectura del directorio y organigrama', 2)
ON CONFLICT (codigo) DO NOTHING;

-- 6. Matriz inicial de permisos RBAC sobre submódulos RRHH
INSERT INTO core.rol_permisos (id_rol, id_submodulo, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar)
SELECT
  r.id_rol,
  s.id_submodulo,
  TRUE AS puede_ver,
  (r.codigo IN ('super_admin', 'gerente_rrhh', 'analista_rrhh')) AS puede_crear,
  (r.codigo IN ('super_admin', 'gerente_rrhh', 'analista_rrhh')) AS puede_editar,
  (r.codigo = 'super_admin') AS puede_eliminar,
  (r.codigo IN ('super_admin', 'direccion', 'gerente_rrhh', 'analista_rrhh')) AS puede_exportar
FROM core.roles r
CROSS JOIN core.submodulos s
WHERE r.codigo IN ('super_admin', 'direccion', 'gerente_rrhh', 'analista_rrhh')
ON CONFLICT (id_rol, id_submodulo) DO NOTHING;

-- Rol 'consulta': solo lectura en Directorio, Departamentos, Extensiones, Cumpleaños y Festivos
INSERT INTO core.rol_permisos (id_rol, id_submodulo, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar)
SELECT r.id_rol, s.id_submodulo, TRUE, FALSE, FALSE, FALSE, FALSE
FROM core.roles r
JOIN core.submodulos s ON s.codigo IN (
  'rrhh-panel', 'rrhh-catalogos', 'rrhh-departamentos',
  'rrhh-extensiones', 'rrhh-cumpleanos', 'rrhh-festivos'
)
WHERE r.codigo = 'consulta'
ON CONFLICT (id_rol, id_submodulo) DO NOTHING;
