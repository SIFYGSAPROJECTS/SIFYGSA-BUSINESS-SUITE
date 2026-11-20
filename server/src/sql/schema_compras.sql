-- ============================================================================
-- SIFYGSA ENTERPRISE ERP - ESQUEMA DE BASE DE DATOS: MÓDULO DE COMPRAS
-- Esquema relacional para PostgreSQL (BD: sifygsa / esquema: compras)
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS compras;

-- 1. TABLA DE PROVEEDORES Y CONTRATISTAS
CREATE TABLE IF NOT EXISTS compras.proveedores (
    id                      VARCHAR(64) PRIMARY KEY,
    rfc                     VARCHAR(13) NOT NULL UNIQUE,
    razon_social            VARCHAR(255) NOT NULL,
    nombre_comercial        VARCHAR(255),
    tipo_persona            VARCHAR(10) NOT NULL DEFAULT 'moral', -- 'moral' o 'fisica'
    giro                    TEXT,
    categoria               VARCHAR(100) DEFAULT 'Servicios Especializados',
    contacto_principal      VARCHAR(150),
    puesto_contacto         VARCHAR(100),
    telefono                VARCHAR(50),
    email                   VARCHAR(150),
    calle                   VARCHAR(255),
    colonia                 VARCHAR(150),
    codigo_postal           VARCHAR(10),
    ciudad                  VARCHAR(100),
    estado                  VARCHAR(100),
    estatus                 VARCHAR(20) NOT NULL DEFAULT 'activo', -- 'activo', 'inactivo', 'bloqueado'
    regimen_fiscal          VARCHAR(10) NOT NULL DEFAULT '601',
    uso_cfdi                VARCHAR(10) NOT NULL DEFAULT 'G03',
    forma_pago              VARCHAR(10) NOT NULL DEFAULT '03',
    metodo_pago             VARCHAR(10) NOT NULL DEFAULT 'PPD',
    moneda                  VARCHAR(3) NOT NULL DEFAULT 'MXN',
    dias_credito            INT NOT NULL DEFAULT 30,
    limite_credito          NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    banco                   VARCHAR(100),
    clabe                   VARCHAR(18),
    cuenta_bancaria         VARCHAR(50),
    opinion_sat_32d         VARCHAR(20) NOT NULL DEFAULT 'positiva', -- 'positiva', 'negativa', 'en_revision'
    fecha_actualizacion_32d DATE,
    fecha_creacion          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_compras_proveedores_rfc ON compras.proveedores (rfc);
CREATE INDEX IF NOT EXISTS idx_compras_proveedores_estatus ON compras.proveedores (estatus);

-- 2. TABLA DE ÓRDENES DE COMPRA
CREATE TABLE IF NOT EXISTS compras.ordenes_compra (
    id                      VARCHAR(64) PRIMARY KEY,
    folio                   VARCHAR(64) NOT NULL UNIQUE,
    tipo_orden              VARCHAR(20) NOT NULL DEFAULT 'normal', -- 'normal', 'directa'
    proveedor_id            VARCHAR(64) NOT NULL REFERENCES compras.proveedores(id),
    proveedor_nombre        VARCHAR(255) NOT NULL,
    proveedor_rfc           VARCHAR(13) NOT NULL,
    fecha_emision           DATE NOT NULL,
    fecha_entrega           DATE NOT NULL,
    solicitante             VARCHAR(150) NOT NULL,
    comprador_nombre        VARCHAR(150),
    departamento            VARCHAR(150) DEFAULT 'Operaciones & Frentes de Obra',
    almacen_destino         VARCHAR(255),
    proyecto_id             VARCHAR(64),
    contrato_proyecto       VARCHAR(255),
    subsidiaria             VARCHAR(255) DEFAULT 'SIFYGSA Fire & Gas S.A. de C.V.',
    estatus                 VARCHAR(40) NOT NULL DEFAULT 'abierta', -- 'abierta', 'pendiente', 'pendiente_aprobacion', 'aprobada_supervisor', 'transito', 'cerrada', 'cancelada'
    moneda                  VARCHAR(3) NOT NULL DEFAULT 'MXN',
    tipo_cambio             NUMERIC(12, 4) NOT NULL DEFAULT 1.0000,
    condicion_pago          VARCHAR(100) DEFAULT 'Crédito 30 días',
    subtotal                NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    descuento               NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    iva                     NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    retenciones             NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total                   NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    notas                   TEXT,
    tiene_factura           BOOLEAN NOT NULL DEFAULT FALSE,
    factura_uuid            UUID,
    factura_folio           VARCHAR(64),
    creado_por              VARCHAR(100) DEFAULT 'sistema',
    fecha_creacion          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_compras_oc_folio ON compras.ordenes_compra (folio);
CREATE INDEX IF NOT EXISTS idx_compras_oc_estatus ON compras.ordenes_compra (estatus);
CREATE INDEX IF NOT EXISTS idx_compras_oc_proveedor ON compras.ordenes_compra (proveedor_rfc);
CREATE INDEX IF NOT EXISTS idx_compras_oc_fecha ON compras.ordenes_compra (fecha_emision);

-- 3. TABLA DE PARTIDAS DE ÓRDENES DE COMPRA
CREATE TABLE IF NOT EXISTS compras.orden_partidas (
    id                      BIGSERIAL PRIMARY KEY,
    orden_id                VARCHAR(64) NOT NULL REFERENCES compras.ordenes_compra(id) ON DELETE CASCADE,
    partida_numero          INT NOT NULL,
    codigo                  VARCHAR(50) NOT NULL,
    descripcion             TEXT NOT NULL,
    nota_partida            TEXT,
    departamento            VARCHAR(100),
    cliente_trabajo         VARCHAR(255),
    activity_code           VARCHAR(100),
    ref_detalles_impuestos  VARCHAR(100),
    cantidad                NUMERIC(12, 4) NOT NULL DEFAULT 1.0000,
    unidad                  VARCHAR(50) NOT NULL DEFAULT 'PZA',
    precio_unitario         NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    descuento_porcentaje    NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    tasa_fiscal             VARCHAR(20) NOT NULL DEFAULT 'IVA_16',
    subtotal                NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    iva_trasladado          NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    retencion_iva           NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    retencion_isr           NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_linea             NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    fecha_recibo_prevista   DATE,
    cerrado                 BOOLEAN NOT NULL DEFAULT FALSE,
    recibido_cantidad       NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    facturado_cantidad      NUMERIC(12, 4) NOT NULL DEFAULT 0.0000
);

CREATE INDEX IF NOT EXISTS idx_compras_partidas_orden ON compras.orden_partidas (orden_id);

-- 4. TABLA DE HISTORIAL DE COMUNICACIÓN (LÍNEA DE TIEMPO)
CREATE TABLE IF NOT EXISTS compras.comunicaciones (
    id                      BIGSERIAL PRIMARY KEY,
    orden_id                VARCHAR(64) NOT NULL REFERENCES compras.ordenes_compra(id) ON DELETE CASCADE,
    tipo                    VARCHAR(20) NOT NULL, -- 'Nota', 'Correo', 'Llamada', 'Mensaje'
    autor                   VARCHAR(150) NOT NULL,
    texto                   TEXT NOT NULL,
    fecha_hora              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_compras_comunicaciones_orden ON compras.comunicaciones (orden_id);

