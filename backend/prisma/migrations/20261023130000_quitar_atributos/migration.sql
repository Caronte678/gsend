-- Se eliminan los atributos variables de producto (y sus reglas de consumo y
-- los valores cargados en pedidos): la pyme no los usa y complicaban la carga.

-- Antes de borrar, lo que se haya escrito en pedidos (p. ej. una dedicatoria)
-- se copia a las notas del pedido para no perder información de clientes.
UPDATE "pedidos" AS p
SET "notas" = CONCAT_WS(E'\n\n', NULLIF(p."notas", ''), x.texto)
FROM (
  SELECT ip."id_pedido",
         'Datos extra del pedido:' || E'\n' || STRING_AGG(
           '- ' || pr."nombre" || ' · ' || av."nombre" || ': ' || iav."valor",
           E'\n' ORDER BY ip."id_item", av."id_atributo"
         ) AS texto
  FROM "item_atributo_valor" iav
  JOIN "items_pedido" ip        ON ip."id_item" = iav."id_item"
  JOIN "productos" pr           ON pr."id_producto" = ip."id_producto"
  JOIN "atributos_variables" av ON av."id_atributo" = iav."id_atributo"
  GROUP BY ip."id_pedido"
) AS x
WHERE p."id_pedido" = x."id_pedido";

-- DropForeignKey
ALTER TABLE "atributos_variables" DROP CONSTRAINT "atributos_variables_id_producto_fkey";

-- DropForeignKey
ALTER TABLE "atributo_material" DROP CONSTRAINT "atributo_material_id_atributo_fkey";

-- DropForeignKey
ALTER TABLE "atributo_material" DROP CONSTRAINT "atributo_material_id_material_fkey";

-- DropForeignKey
ALTER TABLE "item_atributo_valor" DROP CONSTRAINT "item_atributo_valor_id_item_fkey";

-- DropForeignKey
ALTER TABLE "item_atributo_valor" DROP CONSTRAINT "item_atributo_valor_id_atributo_fkey";

-- DropTable
DROP TABLE "atributos_variables";

-- DropTable
DROP TABLE "atributo_material";

-- DropTable
DROP TABLE "item_atributo_valor";
