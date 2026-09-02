-- CreateTable
CREATE TABLE "usuarios" (
    "id_usuario" SERIAL NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "materiales" (
    "id_material" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "unidad_medida" VARCHAR(30) NOT NULL,
    "stock_actual" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "stock_minimo" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "costo_unitario_actual" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "materiales_pkey" PRIMARY KEY ("id_material")
);

-- CreateTable
CREATE TABLE "productos" (
    "id_producto" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "precio_base" DECIMAL(12,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id_producto")
);

-- CreateTable
CREATE TABLE "producto_material" (
    "id_producto" INTEGER NOT NULL,
    "id_material" INTEGER NOT NULL,
    "cantidad_por_unidad" DECIMAL(12,4) NOT NULL,

    CONSTRAINT "producto_material_pkey" PRIMARY KEY ("id_producto","id_material")
);

-- CreateTable
CREATE TABLE "atributos_variables" (
    "id_atributo" SERIAL NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "tipo_dato" VARCHAR(20) NOT NULL,

    CONSTRAINT "atributos_variables_pkey" PRIMARY KEY ("id_atributo")
);

-- CreateTable
CREATE TABLE "atributo_material" (
    "id_atributo" INTEGER NOT NULL,
    "id_material" INTEGER NOT NULL,
    "cantidad_por_unidad_atributo" DECIMAL(12,4) NOT NULL,

    CONSTRAINT "atributo_material_pkey" PRIMARY KEY ("id_atributo","id_material")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id_pedido" SERIAL NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "cliente_nombre" VARCHAR(150) NOT NULL,
    "cliente_contacto" VARCHAR(150),
    "notas" TEXT,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id_pedido")
);

-- CreateTable
CREATE TABLE "items_pedido" (
    "id_item" SERIAL NOT NULL,
    "id_pedido" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_venta_unitario" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "items_pedido_pkey" PRIMARY KEY ("id_item")
);

-- CreateTable
CREATE TABLE "item_atributo_valor" (
    "id_valor" SERIAL NOT NULL,
    "id_item" INTEGER NOT NULL,
    "id_atributo" INTEGER NOT NULL,
    "valor" VARCHAR(150) NOT NULL,

    CONSTRAINT "item_atributo_valor_pkey" PRIMARY KEY ("id_valor")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id_movimiento" SERIAL NOT NULL,
    "id_material" INTEGER NOT NULL,
    "tipo" VARCHAR(10) NOT NULL,
    "cantidad" DECIMAL(12,2) NOT NULL,
    "costo_unitario" DECIMAL(12,2),
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_pedido" INTEGER,
    "motivo" VARCHAR(200),

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id_movimiento")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id_pago" SERIAL NOT NULL,
    "id_pedido" INTEGER NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodo_pago" VARCHAR(50),

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id_pago")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "materiales_nombre_key" ON "materiales"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "atributos_variables_id_producto_nombre_key" ON "atributos_variables"("id_producto", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "item_atributo_valor_id_item_id_atributo_key" ON "item_atributo_valor"("id_item", "id_atributo");

-- AddForeignKey
ALTER TABLE "producto_material" ADD CONSTRAINT "producto_material_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_material" ADD CONSTRAINT "producto_material_id_material_fkey" FOREIGN KEY ("id_material") REFERENCES "materiales"("id_material") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atributos_variables" ADD CONSTRAINT "atributos_variables_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atributo_material" ADD CONSTRAINT "atributo_material_id_atributo_fkey" FOREIGN KEY ("id_atributo") REFERENCES "atributos_variables"("id_atributo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atributo_material" ADD CONSTRAINT "atributo_material_id_material_fkey" FOREIGN KEY ("id_material") REFERENCES "materiales"("id_material") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_pedido" ADD CONSTRAINT "items_pedido_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedidos"("id_pedido") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_pedido" ADD CONSTRAINT "items_pedido_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_atributo_valor" ADD CONSTRAINT "item_atributo_valor_id_item_fkey" FOREIGN KEY ("id_item") REFERENCES "items_pedido"("id_item") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_atributo_valor" ADD CONSTRAINT "item_atributo_valor_id_atributo_fkey" FOREIGN KEY ("id_atributo") REFERENCES "atributos_variables"("id_atributo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_material_fkey" FOREIGN KEY ("id_material") REFERENCES "materiales"("id_material") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedidos"("id_pedido") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedidos"("id_pedido") ON DELETE CASCADE ON UPDATE CASCADE;
