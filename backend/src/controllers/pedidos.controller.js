const prisma = require('../config/prisma');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// Estima el costo de materiales de un pedido a partir de la receta actual del
// producto (materiales fijos + reglas de atributos variables) y el costo unitario
// actual de cada material. Se usa cuando el pedido todavía NO fue completado y por
// lo tanto no tiene movimientos de salida registrados.
// Requiere que `pedido.items[].producto` incluya `receta` y `atributos.reglas`,
// y que cada material traiga `costo_unitario_actual`.
function estimarCostoReceta(pedido) {
  let costo = 0;
  for (const item of pedido.items) {
    const producto = item.producto;
    if (!producto) continue;
    const cantidad = item.cantidad;

    for (const r of producto.receta ?? []) {
      const costoMat = Number(r.material?.costo_unitario_actual ?? 0);
      costo += Number(r.cantidad_por_unidad) * cantidad * costoMat;
    }

    for (const valor of item.valores ?? []) {
      const atributo = (producto.atributos ?? []).find((a) => a.id_atributo === valor.id_atributo);
      if (!atributo) continue;
      const factor = atributo.tipo_dato === 'numero' ? (parseFloat(valor.valor) || 1) : 1;
      for (const regla of atributo.reglas ?? []) {
        const costoMat = Number(regla.material?.costo_unitario_actual ?? 0);
        costo += Number(regla.cantidad_por_unidad_atributo) * factor * cantidad * costoMat;
      }
    }
  }
  return costo;
}

// Calcula el total de venta, costo y pagos de un pedido
// (implementación en JS — alternativa a la vista SQL de Fase 3)
function calcularFinancieros(pedido) {
  const total_venta = pedido.items.reduce(
    (acc, item) => acc + Number(item.precio_venta_unitario) * item.cantidad,
    0
  );

  const total_pagado = pedido.pagos.reduce(
    (acc, pago) => acc + Number(pago.monto),
    0
  );

  // Costo real: movimientos de salida generados al completar el pedido.
  const salidas = (pedido.movimientos ?? []).filter((m) => m.tipo === 'salida');
  let costo_total = salidas.reduce(
    (acc, m) => acc + Number(m.cantidad) * Number(m.costo_unitario ?? 0),
    0
  );

  // Si aún no hay movimientos (pedido no completado), estimamos el costo con la
  // receta actual para que el margen no aparezca inflado (== total de venta).
  let costo_estimado = false;
  if (salidas.length === 0 && pedido.estado !== 'cancelado') {
    const estimado = estimarCostoReceta(pedido);
    if (estimado > 0) {
      costo_total = estimado;
      costo_estimado = true;
    }
  }

  const margen = total_venta - costo_total;

  let estado_pago = 'sin_pago';
  if (total_pagado >= total_venta && total_venta > 0) estado_pago = 'pagado';
  else if (total_pagado > 0) estado_pago = 'parcial';

  return { total_venta, costo_total, margen, total_pagado, estado_pago, costo_estimado };
}

// Receta del producto necesaria para estimar el costo de pedidos no completados.
const INCLUDE_PRODUCTO_RECETA = {
  include: {
    receta: { include: { material: true } },
    atributos: { include: { reglas: { include: { material: true } } } },
  },
};

const INCLUDE_COMPLETO = {
  items: {
    include: {
      producto: INCLUDE_PRODUCTO_RECETA,
      valores: { include: { atributo: true } },
    },
  },
  pagos: true,
  movimientos: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/pedidos?estado=pendiente
// ─────────────────────────────────────────────────────────────────────────────
async function listar(req, res, next) {
  try {
    const { estado } = req.query;

    const where = {};
    if (estado) where.estado = estado;

    const pedidos = await prisma.pedido.findMany({
      where,
      include: {
        items: {
          include: {
            producto: INCLUDE_PRODUCTO_RECETA,
            valores: true,
          },
        },
        pagos: true,
        movimientos: true,
      },
      orderBy: { fecha_creacion: 'desc' },
    });

    const resultado = pedidos.map((p) => ({
      ...p,
      financiero: calcularFinancieros(p),
    }));

    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/pedidos/:id — detalle completo con financiero
// ─────────────────────────────────────────────────────────────────────────────
async function obtener(req, res, next) {
  try {
    const id = parseInt(req.params.id);

    const pedido = await prisma.pedido.findUnique({
      where: { id_pedido: id },
      include: INCLUDE_COMPLETO,
    });

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json({ ...pedido, financiero: calcularFinancieros(pedido) });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pedidos
// Body: {
//   cliente_nombre, cliente_contacto?, notas?,
//   items: [{ id_producto, cantidad, precio_venta_unitario, valores?: [{ id_atributo, valor }] }]
// }
// ─────────────────────────────────────────────────────────────────────────────
async function crear(req, res, next) {
  try {
    const { cliente_nombre, cliente_contacto, notas, items = [] } = req.body;

    if (!cliente_nombre || !String(cliente_nombre).trim()) {
      return res.status(400).json({ error: 'cliente_nombre es requerido' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'El pedido debe tener al menos un item' });
    }
    for (const [i, it] of items.entries()) {
      if (!Number.isInteger(Number(it.id_producto)) || Number(it.id_producto) <= 0) {
        return res.status(400).json({ error: `Item ${i + 1}: id_producto inválido` });
      }
      // La cantidad se guarda como Int: un decimal se truncaría en silencio.
      if (!Number.isInteger(Number(it.cantidad)) || Number(it.cantidad) < 1) {
        return res.status(400).json({ error: `Item ${i + 1}: cantidad debe ser un entero >= 1` });
      }
      if (!Number.isFinite(Number(it.precio_venta_unitario)) || Number(it.precio_venta_unitario) < 0) {
        return res.status(400).json({ error: `Item ${i + 1}: precio_venta_unitario debe ser >= 0` });
      }
    }

    // Cada valor de atributo debe pertenecer al producto de su propio item; si no,
    // el pedido quedaría con datos inconsistentes (y el cálculo de consumo de
    // materiales al completar lo ignoraría en silencio).
    const idsProducto = [...new Set(items.map((it) => Number(it.id_producto)))];
    const atributosValidos = await prisma.atributoVariable.findMany({
      where: { id_producto: { in: idsProducto } },
      select: { id_atributo: true, id_producto: true },
    });
    for (const [i, it] of items.entries()) {
      for (const v of it.valores ?? []) {
        const atr = atributosValidos.find((a) => a.id_atributo === Number(v.id_atributo));
        if (!atr || atr.id_producto !== Number(it.id_producto)) {
          return res.status(400).json({
            error: `Item ${i + 1}: el atributo ${v.id_atributo} no pertenece al producto seleccionado`,
          });
        }
      }
    }

    const pedido = await prisma.pedido.create({
      data: {
        cliente_nombre,
        cliente_contacto,
        notas,
        items: {
          create: items.map((item) => ({
            id_producto: Number(item.id_producto),
            cantidad: Number(item.cantidad),
            precio_venta_unitario: Number(item.precio_venta_unitario),
            valores: item.valores?.length
              ? {
                  create: item.valores.map((v) => ({
                    id_atributo: Number(v.id_atributo),
                    valor: String(v.valor),
                  })),
                }
              : undefined,
          })),
        },
      },
      include: INCLUDE_COMPLETO,
    });

    res.status(201).json({ ...pedido, financiero: calcularFinancieros(pedido) });
  } catch (err) {
    if (err.code === 'P2003') {
      return res.status(404).json({ error: 'Producto o atributo referenciado no existe' });
    }
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/pedidos/:id — edita datos del pedido (no los items ni el estado)
// ─────────────────────────────────────────────────────────────────────────────
async function actualizar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { cliente_nombre, cliente_contacto, notas } = req.body;

    const pedido = await prisma.pedido.update({
      where: { id_pedido: id },
      data: {
        ...(cliente_nombre !== undefined && { cliente_nombre }),
        ...(cliente_contacto !== undefined && { cliente_contacto }),
        ...(notas !== undefined && { notas }),
      },
      include: INCLUDE_COMPLETO,
    });

    res.json({ ...pedido, financiero: calcularFinancieros(pedido) });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/pedidos/:id/estado — { estado }
// Si el nuevo estado es 'completado': valida stock y genera movimientos de salida
// Todo en una sola transacción (RNF-06).
// ─────────────────────────────────────────────────────────────────────────────
async function cambiarEstado(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { estado } = req.body;

    const ESTADOS_VALIDOS = ['pendiente', 'confirmado', 'completado', 'cancelado'];
    if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: `estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({
        where: { id_pedido: id },
        include: {
          items: {
            include: {
              producto: {
                include: {
                  receta: true,
                  atributos: { include: { reglas: true } },
                },
              },
              valores: true,
            },
          },
        },
      });

      if (!pedido) {
        throw Object.assign(new Error('Pedido no encontrado'), { statusCode: 404 });
      }

      if (pedido.estado === 'completado') {
        throw Object.assign(
          new Error('El pedido ya está completado y no puede cambiar de estado'),
          { statusCode: 409 }
        );
      }

      // Si pasa a 'completado' → validar stock y descontar inventario
      if (estado === 'completado') {
        // 1. Calcular consumo total de materiales para este pedido
        const consumo = {}; // { id_material: cantidad_total }

        for (const item of pedido.items) {
          const { cantidad, producto, valores } = item;

          // Receta fija del producto
          for (const recetaEntry of producto.receta) {
            const mat = recetaEntry.id_material;
            const cant = Number(recetaEntry.cantidad_por_unidad) * cantidad;
            consumo[mat] = (consumo[mat] || 0) + cant;
          }

          // Atributos variables: sumar consumo por cada valor de atributo del item
          for (const valorAtributo of valores) {
            const atributo = producto.atributos.find(
              (a) => a.id_atributo === valorAtributo.id_atributo
            );
            if (!atributo) continue;

            for (const regla of atributo.reglas) {
              const mat = regla.id_material;
              // Para atributos tipo 'numero', el valor multiplica la cantidad de material
              let factor = 1;
              if (atributo.tipo_dato === 'numero') {
                factor = parseFloat(valorAtributo.valor) || 1;
              }
              const cant = Number(regla.cantidad_por_unidad_atributo) * factor * cantidad;
              consumo[mat] = (consumo[mat] || 0) + cant;
            }
          }
        }

        // 2. Validar stock suficiente para cada material
        const erroresStock = [];
        for (const [id_material, cantidadNecesaria] of Object.entries(consumo)) {
          const material = await tx.material.findUnique({
            where: { id_material: parseInt(id_material) },
          });
          if (!material || Number(material.stock_actual) < cantidadNecesaria) {
            erroresStock.push({
              material: material?.nombre ?? `ID ${id_material}`,
              stock_actual: Number(material?.stock_actual ?? 0),
              requerido: cantidadNecesaria,
            });
          }
        }

        if (erroresStock.length > 0) {
          throw Object.assign(
            new Error('Stock insuficiente para completar el pedido'),
            { statusCode: 422, erroresStock }
          );
        }

        // 3. Generar movimientos de salida y actualizar stock
        for (const [id_material, cantidadDescontar] of Object.entries(consumo)) {
          const mat = parseInt(id_material);

          await tx.movimientoInventario.create({
            data: {
              id_material: mat,
              tipo: 'salida',
              cantidad: cantidadDescontar,
              costo_unitario: (await tx.material.findUnique({ where: { id_material: mat } }))
                ?.costo_unitario_actual,
              id_pedido: id,
              motivo: `Pedido #${id} completado`,
            },
          });

          await tx.material.update({
            where: { id_material: mat },
            data: { stock_actual: { decrement: cantidadDescontar } },
          });
        }
      }

      // 4. Actualizar estado del pedido
      const pedidoActualizado = await tx.pedido.update({
        where: { id_pedido: id },
        data: { estado },
        include: INCLUDE_COMPLETO,
      });

      return pedidoActualizado;
    });

    res.json({ ...resultado, financiero: calcularFinancieros(resultado) });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: err.message });
    if (err.statusCode === 409) return res.status(409).json({ error: err.message });
    if (err.statusCode === 422) {
      return res.status(422).json({ error: err.message, detalle: err.erroresStock });
    }
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/pedidos/:id
// ─────────────────────────────────────────────────────────────────────────────
async function eliminar(req, res, next) {
  try {
    const id = parseInt(req.params.id);

    await prisma.pedido.delete({ where: { id_pedido: id } });

    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/pedidos/:id/pagos
// ─────────────────────────────────────────────────────────────────────────────
async function listarPagos(req, res, next) {
  try {
    const id = parseInt(req.params.id);

    const pagos = await prisma.pago.findMany({
      where: { id_pedido: id },
      orderBy: { fecha: 'asc' },
    });

    res.json(pagos);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pedidos/:id/pagos — { monto, metodo_pago? }
// ─────────────────────────────────────────────────────────────────────────────
async function registrarPago(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { monto, metodo_pago } = req.body;

    const montoNum = Number(monto);
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      return res.status(400).json({ error: 'monto debe ser un número positivo' });
    }

    // Verificar que el pedido existe (con items y pagos para validar el saldo)
    const pedido = await prisma.pedido.findUnique({
      where: { id_pedido: id },
      include: { items: true, pagos: true },
    });
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    if (pedido.estado === 'cancelado') {
      return res.status(409).json({ error: 'No se pueden registrar pagos en un pedido cancelado' });
    }

    // El pago no puede superar el saldo pendiente (antes se aceptaba cualquier
    // monto y el saldo quedaba negativo).
    const totalVenta = pedido.items.reduce(
      (acc, it) => acc + Number(it.precio_venta_unitario) * it.cantidad, 0
    );
    const totalPagado = pedido.pagos.reduce((acc, p) => acc + Number(p.monto), 0);
    const saldo = totalVenta - totalPagado;

    if (saldo <= 0) {
      return res.status(409).json({ error: 'El pedido ya está totalmente pagado' });
    }
    // Tolerancia de 1 centavo por redondeo de decimales
    if (montoNum > saldo + 0.01) {
      return res.status(400).json({
        error: `El monto supera el saldo pendiente ($${saldo.toFixed(2)})`,
      });
    }

    const pago = await prisma.pago.create({
      data: { id_pedido: id, monto: montoNum, metodo_pago },
    });

    res.status(201).json(pago);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listar,
  obtener,
  crear,
  actualizar,
  cambiarEstado,
  eliminar,
  listarPagos,
  registrarPago,
};
