-- ============================================================================
-- database/postgres/seeds/01_seed_core.sql
-- Datos iniciales transversales: Empresas, Sedes, Módulos, Submódulos y Roles
-- Idempotente (seguro de volver a ejecutar gracias a ON CONFLICT DO NOTHING)
-- ============================================================================

-- 1. Empresas / Subsidiarias
INSERT INTO core.empresas (codigo, nombre_corto, razon_social, es_principal)
VALUES
  ('SIFYGSA', 'SIFYGSA', 'Soluciones Integrales en Fire & Gas S.A. de C.V.', TRUE),
  ('VIPSA',   'VIPSA',   'VIPSA Ingeniería y Servicios Industriales S.A. de C.V.', FALSE)
ON CONFLICT (codigo) DO NOTHING;

-- 2. Sedes / Bases Operativas
INSERT INTO core.sedes (id_empresa, codigo, nombre, ciudad, estado, es_matriz)
SELECT e.id_empresa, v.codigo, v.nombre, v.ciudad, v.estado, v.es_matriz
FROM core.empresas e
CROSS JOIN (
  VALUES
    ('MIN', 'Minatitlán, Ver.',        'Minatitlán',        'Veracruz', TRUE),
    ('MAP', 'Mapachapa, Ver.',         'Mapachapa',         'Veracruz', FALSE),
    ('COM', 'Comalcalco, Tab.',        'Comalcalco',        'Tabasco',  FALSE),
    ('XAL', 'Xalapa, Ver.',            'Xalapa',            'Veracruz', FALSE),
    ('CDC', 'Ciudad del Carmen, Camp.','Ciudad del Carmen', 'Campeche', FALSE),
    ('MER', 'Mérida, Yuc.',            'Mérida',            'Yucatán',  FALSE)
) AS v(codigo, nombre, ciudad, estado, es_matriz)
WHERE e.codigo = 'SIFYGSA'
ON CONFLICT (codigo) DO NOTHING;

-- 3. Módulos de la Suite ERP / CRM
INSERT INTO core.modulos (codigo, nombre, descripcion, orden)
VALUES
  ('DASH', 'Inicio',           'Panel ejecutivo consolidado', 1),
  ('RRHH', 'Recursos Humanos', 'Plantilla, organigrama, expedientes, vacaciones y SGI', 2),
  ('FIN',  'Finanzas',         'Tabulador, nómina, fondos y partidas', 3),
  ('ADM',  'Administración',   'Roles, permisos y configuración global', 4)
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

-- 6. Permisos completos para super_admin y gerente_rrhh sobre submódulos RRHH
INSERT INTO core.rol_permisos (id_rol, id_submodulo, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar)
SELECT r.id_rol, s.id_submodulo, TRUE, TRUE, TRUE, (r.codigo = 'super_admin'), TRUE
FROM core.roles r
CROSS JOIN core.submodulos s
WHERE r.codigo IN ('super_admin', 'gerente_rrhh')
ON CONFLICT (id_rol, id_submodulo) DO NOTHING;
