-- ============================================================================
-- SIFYGSA ENTERPRISE ERP - ESQUEMA DE FACTURACIÓN DE PROVEEDORES (CFDI 4.0)
-- Módulo: Compras y Cuentas por Pagar (AP)
-- Propuesta de estructura relacional para PostgreSQL
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS compras;

-- 1. TABLA PRINCIPAL: FACTURAS DE PROVEEDOR
CREATE TABLE IF NOT EXISTS compras.facturas (
    id                      VARCHAR(64) PRIMARY KEY,
    folio                   VARCHAR(64) NOT NULL,
    uuid_fiscal             UUID NOT NULL UNIQUE,
    orden_compra_id         VARCHAR(64) NOT NULL,
    orden_compra_folio      VARCHAR(64) NOT NULL,
    proveedor_id            VARCHAR(64) NOT NULL,
    proveedor_rfc           VARCHAR(13) NOT NULL,
    proveedor_nombre        VARCHAR(255) NOT NULL,
    emisor_regimen_fiscal   VARCHAR(10) NOT NULL DEFAULT '601',
    receptor_rfc            VARCHAR(13) NOT NULL DEFAULT 'SFG180425ABC',
    receptor_nombre         VARCHAR(255) NOT NULL DEFAULT 'SIFYGSA Fire & Gas S.A. de C.V.',
    uso_cfdi                VARCHAR(10) NOT NULL DEFAULT 'G03',
    fecha_emision           DATE NOT NULL,
    fecha_vencimiento       DATE NOT NULL,
    periodo_contable        VARCHAR(20) NOT NULL,
    moneda                  VARCHAR(3) NOT NULL DEFAULT 'MXN',
    tipo_cambio             NUMERIC(12, 4) NOT NULL DEFAULT 1.0000,
    subtotal                NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    iva                     NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    retencion_isr           NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    retencion_iva           NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total                   NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    estatus                 VARCHAR(30) NOT NULL DEFAULT 'abierta', -- 'abierta', 'pagada', 'cancelada'
    estatus_sat             VARCHAR(30) NOT NULL DEFAULT 'vigente', -- 'vigente', 'cancelado'
    estado_aprobacion       VARCHAR(30) NOT NULL DEFAULT 'Aprobado', -- 'Pendiente', 'Aprobado', 'Rechazado'
    aprobador_nombre        VARCHAR(150),
    cuenta_contable         VARCHAR(64) DEFAULT '2110-0010-0000-0000',
    nota_condiciones        TEXT,
    xml_nombre_archivo      VARCHAR(255),
    pdf_nombre_archivo      VARCHAR(255),
    creado_por              VARCHAR(100) DEFAULT 'sistema',
    fecha_creacion          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_compras_facturas_oc ON compras.facturas (orden_compra_folio);
CREATE INDEX IF NOT EXISTS idx_compras_facturas_uuid ON compras.facturas (uuid_fiscal);
CREATE INDEX IF NOT EXISTS idx_compras_facturas_proveedor ON compras.facturas (proveedor_rfc);
CREATE INDEX IF NOT EXISTS idx_compras_facturas_estatus ON compras.facturas (estatus);

-- 2. TABLA HIJA: PARTIDAS FACTURADAS
CREATE TABLE IF NOT EXISTS compras.factura_partidas (
    id                      BIGSERIAL PRIMARY KEY,
    factura_id              VARCHAR(64) NOT NULL REFERENCES compras.facturas(id) ON DELETE CASCADE,
    partida_numero          INT NOT NULL,
    clave_prod_serv         VARCHAR(20),
    no_identificacion       VARCHAR(50),
    descripcion             TEXT NOT NULL,
    cantidad                NUMERIC(12, 4) NOT NULL DEFAULT 1.0000,
    clave_unidad            VARCHAR(10) DEFAULT 'E48',
    unidad                  VARCHAR(50) DEFAULT 'Servicio',
    valor_unitario          NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    importe                 NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    iva_trasladado          NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    retencion_isr           NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    retencion_iva           NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    orden_partida_id        VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_compras_factura_partidas_factura ON compras.factura_partidas (factura_id);

-- 3. TABLA HIJA: ARCHIVOS DEL EXPEDIENTE FISCAL
CREATE TABLE IF NOT EXISTS compras.factura_archivos (
    id                      BIGSERIAL PRIMARY KEY,
    factura_id              VARCHAR(64) NOT NULL REFERENCES compras.facturas(id) ON DELETE CASCADE,
    tipo_archivo            VARCHAR(10) NOT NULL, -- 'xml', 'pdf', 'comprobante'
    nombre_archivo          VARCHAR(255) NOT NULL,
    tamano_bytes            BIGINT NOT NULL,
    mime_type               VARCHAR(100) NOT NULL,
    storage_url             TEXT,
    contenido_base64        TEXT,
    sha256_hash             VARCHAR(64),
    usuario_subio           VARCHAR(100),
    fecha_subida            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_compras_factura_archivos_factura ON compras.factura_archivos (factura_id);

