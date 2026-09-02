-- ============================================================
-- GSend — Fase 3 (v2): Script DDL con gestión financiera
-- Reemplaza a GSend_Fase3_DDL.sql — incorpora costos, precios
-- de venta variables por pedido, y registro de pagos.
-- PostgreSQL (sugerencia, a confirmar en Fase 4)
-- ============================================================

-- ---------- USUARIOS ----------
CREATE TABLE usuarios (
    id_usuario      SERIAL PRIMARY KEY,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    fecha_creacion  TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------- MATERIALES ----------
CREATE TABLE materiales (
    id_material             SERIAL PRIMARY KEY,
    nombre                  VARCHAR(150) NOT NULL UNIQUE,
    unidad_medida           VARCHAR(30) NOT NULL,
    stock_actual            DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo            DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    costo_unitario_actual   DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (costo_unitario_actual >= 0), -- último precio de compra
    activo                  BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------- PRODUCTOS ----------
CREATE TABLE productos (
    id_producto     SERIAL PRIMARY KEY,
    nombre          VARCHAR(150) NOT NULL,
    tipo            VARCHAR(50) NOT NULL,
    descripcion     TEXT,
    precio_base     DECIMAL(12,2) CHECK (precio_base IS NULL OR precio_base >= 0), -- sugerencia: precio referencial, no obligatorio
    activo          BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------- PRODUCTO_MATERIAL (receta fija) ----------
CREATE TABLE producto_material (
    id_producto             INTEGER NOT NULL REFERENCES productos(id_producto) ON DELETE CASCADE,
    id_material             INTEGER NOT NULL REFERENCES materiales(id_material) ON DELETE RESTRICT,
    cantidad_por_unidad     DECIMAL(12,4) NOT NULL CHECK (cantidad_por_unidad > 0),
    PRIMARY KEY (id_producto, id_material)
);

-- ---------- ATRIBUTOS_VARIABLES ----------
CREATE TABLE atributos_variables (
    id_atributo     SERIAL PRIMARY KEY,
    id_producto     INTEGER NOT NULL REFERENCES productos(id_producto) ON DELETE CASCADE,
    nombre          VARCHAR(100) NOT NULL,
    tipo_dato       VARCHAR(20) NOT NULL CHECK (tipo_dato IN ('numero', 'texto', 'seleccion')),
    UNIQUE (id_producto, nombre)
);

-- ---------- ATRIBUTO_MATERIAL (regla de consumo variable) ----------
CREATE TABLE atributo_material (
    id_atributo                     INTEGER NOT NULL REFERENCES atributos_variables(id_atributo) ON DELETE CASCADE,
    id_material                     INTEGER NOT NULL REFERENCES materiales(id_material) ON DELETE RESTRICT,
    cantidad_por_unidad_atributo    DECIMAL(12,4) NOT NULL CHECK (cantidad_por_unidad_atributo > 0),
    PRIMARY KEY (id_atributo, id_material)
);

-- ---------- PEDIDOS ----------
CREATE TABLE pedidos (
    id_pedido           SERIAL PRIMARY KEY,
    fecha_creacion       TIMESTAMP NOT NULL DEFAULT now(),
    estado               VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                          CHECK (estado IN ('pendiente', 'confirmado', 'completado', 'cancelado')),
    cliente_nombre       VARCHAR(150) NOT NULL,
    cliente_contacto     VARCHAR(150),
    notas                TEXT
    -- total_venta, costo_total y estado_pago NO se almacenan aquí:
    -- se calculan a partir de items_pedido, movimientos_inventario y pagos.
    -- (ver nota de desnormalización si se decide cachear en el futuro)
);

CREATE INDEX idx_pedidos_estado ON pedidos(estado);

-- ---------- ITEMS_PEDIDO ----------
CREATE TABLE items_pedido (
    id_item                 SERIAL PRIMARY KEY,
    id_pedido               INTEGER NOT NULL REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    id_producto             INTEGER NOT NULL REFERENCES productos(id_producto) ON DELETE RESTRICT,
    cantidad                INTEGER NOT NULL CHECK (cantidad > 0),
    precio_venta_unitario   DECIMAL(12,2) NOT NULL CHECK (precio_venta_unitario >= 0) -- precio acordado para ESTE pedido
);

CREATE INDEX idx_items_pedido_pedido ON items_pedido(id_pedido);

-- ---------- ITEM_ATRIBUTO_VALOR ----------
CREATE TABLE item_atributo_valor (
    id_valor        SERIAL PRIMARY KEY,
    id_item         INTEGER NOT NULL REFERENCES items_pedido(id_item) ON DELETE CASCADE,
    id_atributo     INTEGER NOT NULL REFERENCES atributos_variables(id_atributo) ON DELETE RESTRICT,
    valor           VARCHAR(150) NOT NULL,
    UNIQUE (id_item, id_atributo)
);

-- ---------- MOVIMIENTOS_INVENTARIO ----------
CREATE TABLE movimientos_inventario (
    id_movimiento   SERIAL PRIMARY KEY,
    id_material     INTEGER NOT NULL REFERENCES materiales(id_material) ON DELETE RESTRICT,
    tipo            VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'salida')),
    cantidad        DECIMAL(12,2) NOT NULL CHECK (cantidad > 0),
    costo_unitario  DECIMAL(12,2) CHECK (costo_unitario IS NULL OR costo_unitario >= 0),
    -- entrada: costo de compra ingresado por el admin (construye el historial de precios)
    -- salida: snapshot del costo_unitario_actual del material al momento del descuento
    fecha           TIMESTAMP NOT NULL DEFAULT now(),
    id_pedido       INTEGER REFERENCES pedidos(id_pedido) ON DELETE SET NULL,
    motivo          VARCHAR(200)
);

CREATE INDEX idx_movimientos_material ON movimientos_inventario(id_material);
CREATE INDEX idx_movimientos_pedido ON movimientos_inventario(id_pedido);

-- ---------- PAGOS (nueva tabla) ----------
CREATE TABLE pagos (
    id_pago         SERIAL PRIMARY KEY,
    id_pedido       INTEGER NOT NULL REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    monto           DECIMAL(12,2) NOT NULL CHECK (monto > 0),
    fecha           TIMESTAMP NOT NULL DEFAULT now(),
    metodo_pago     VARCHAR(50)
);

CREATE INDEX idx_pagos_pedido ON pagos(id_pedido);

-- ============================================================
-- Vistas de apoyo para cálculos financieros (no almacenan datos,
-- se recalculan en cada consulta — ver nota de diseño en el chat)
-- ============================================================

CREATE VIEW vista_pedido_financiero AS
SELECT
    p.id_pedido,
    p.estado,
    COALESCE(SUM(ip.cantidad * ip.precio_venta_unitario), 0) AS total_venta,
    COALESCE((
        SELECT SUM(mi.cantidad * mi.costo_unitario)
        FROM movimientos_inventario mi
        WHERE mi.id_pedido = p.id_pedido AND mi.tipo = 'salida'
    ), 0) AS costo_total,
    COALESCE((
        SELECT SUM(pg.monto) FROM pagos pg WHERE pg.id_pedido = p.id_pedido
    ), 0) AS total_pagado
FROM pedidos p
LEFT JOIN items_pedido ip ON ip.id_pedido = p.id_pedido
GROUP BY p.id_pedido, p.estado;