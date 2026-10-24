-- Más decimales para consumos fraccionarios (p. ej. 1 hoja A4 rinde 3 fotos:
-- 1/3 de hoja por foto). Solo se amplía la escala: ningún valor existente se pierde.

-- AlterTable
ALTER TABLE "materiales" ALTER COLUMN "stock_actual" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "stock_minimo" SET DATA TYPE DECIMAL(14,4);

-- AlterTable
ALTER TABLE "producto_material" ALTER COLUMN "cantidad_por_unidad" SET DATA TYPE DECIMAL(14,6);

-- AlterTable
ALTER TABLE "movimientos_inventario" ALTER COLUMN "cantidad" SET DATA TYPE DECIMAL(14,4);

-- Las recetas cargadas antes como 0.3333 eran en realidad 1/3: se completan a
-- 6 decimales (0.333333) para que 3 unidades consuman exactamente 1 material.
-- Solo se tocan valores < 1 que, redondeados a 4 decimales, coinciden con 1/N.
UPDATE "producto_material"
SET "cantidad_por_unidad" = ROUND(1.0 / ROUND(1.0 / "cantidad_por_unidad"), 6)
WHERE "cantidad_por_unidad" > 0 AND "cantidad_por_unidad" < 1
  AND ROUND(1.0 / ROUND(1.0 / "cantidad_por_unidad"), 4) = ROUND("cantidad_por_unidad", 4);
