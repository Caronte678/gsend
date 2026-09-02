const prisma = require('../config/prisma');

// ─── PRODUCTOS ────────────────────────────────────────────────────────────────

// GET /api/productos?activo=true
async function listar(req, res, next) {
  try {
    const { activo } = req.query;

    const where = {};
    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const productos = await prisma.producto.findMany({
      where,
      include: {
        receta: { include: { material: true } },
        atributos: { include: { reglas: { include: { material: true } } } },
      },
      orderBy: { nombre: 'asc' },
    });

    res.json(productos);
  } catch (err) {
    next(err);
  }
}

// GET /api/productos/:id — incluye receta completa y atributos variables
async function obtener(req, res, next) {
  try {
    const id = parseInt(req.params.id);

    const producto = await prisma.producto.findUnique({
      where: { id_producto: id },
      include: {
        receta: { include: { material: true } },
        atributos: { include: { reglas: { include: { material: true } } } },
      },
    });

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(producto);
  } catch (err) {
    next(err);
  }
}

// POST /api/productos — { nombre, tipo, descripcion?, precio_base? }
async function crear(req, res, next) {
  try {
    const { nombre, tipo, descripcion, precio_base } = req.body;

    if (!nombre || !tipo) {
      return res.status(400).json({ error: 'nombre y tipo son requeridos' });
    }

    const precioNum = Number(precio_base);
    if (precio_base === undefined || precio_base === null || precio_base === '' ||
        !Number.isFinite(precioNum) || precioNum < 0) {
      return res.status(400).json({ error: 'precio_base es requerido y debe ser >= 0' });
    }

    const producto = await prisma.producto.create({
      data: { nombre, tipo, descripcion, precio_base: precioNum },
    });

    res.status(201).json(producto);
  } catch (err) {
    next(err);
  }
}

// PUT /api/productos/:id
async function actualizar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { nombre, tipo, descripcion, precio_base, activo } = req.body;

    if (precio_base !== undefined && precio_base !== null && precio_base !== '') {
      const n = Number(precio_base);
      if (!Number.isFinite(n) || n < 0) {
        return res.status(400).json({ error: 'precio_base debe ser >= 0' });
      }
    }

    const producto = await prisma.producto.update({
      where: { id_producto: id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(tipo !== undefined && { tipo }),
        ...(descripcion !== undefined && { descripcion }),
        ...(precio_base !== undefined && precio_base !== null && precio_base !== '' && { precio_base: Number(precio_base) }),
        ...(activo !== undefined && { activo }),
      },
    });

    res.json(producto);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    next(err);
  }
}

// DELETE /api/productos/:id — soft delete (activo = false)
async function eliminar(req, res, next) {
  try {
    const id = parseInt(req.params.id);

    await prisma.producto.update({
      where: { id_producto: id },
      data: { activo: false },
    });

    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    next(err);
  }
}

// ─── RECETA (producto_material) ───────────────────────────────────────────────

// GET /api/productos/:id/materiales — receta fija del producto
async function listarReceta(req, res, next) {
  try {
    const id = parseInt(req.params.id);

    const receta = await prisma.productoMaterial.findMany({
      where: { id_producto: id },
      include: { material: true },
    });

    res.json(receta);
  } catch (err) {
    next(err);
  }
}

// POST /api/productos/:id/materiales — { id_material, cantidad_por_unidad }
// Usa upsert: si la combinación ya existe, actualiza la cantidad.
async function upsertReceta(req, res, next) {
  try {
    const id_producto = parseInt(req.params.id);
    const { id_material, cantidad_por_unidad } = req.body;

    if (!id_material || cantidad_por_unidad === undefined || cantidad_por_unidad <= 0) {
      return res.status(400).json({ error: 'id_material y cantidad_por_unidad (> 0) son requeridos' });
    }

    const entrada = await prisma.productoMaterial.upsert({
      where: { id_producto_id_material: { id_producto, id_material } },
      create: { id_producto, id_material, cantidad_por_unidad },
      update: { cantidad_por_unidad },
      include: { material: true },
    });

    res.status(201).json(entrada);
  } catch (err) {
    if (err.code === 'P2003') {
      return res.status(404).json({ error: 'Producto o material no encontrado' });
    }
    next(err);
  }
}

// DELETE /api/productos/:id/materiales/:id_material — quitar material de la receta
async function eliminarReceta(req, res, next) {
  try {
    const id_producto = parseInt(req.params.id);
    const id_material = parseInt(req.params.id_material);

    await prisma.productoMaterial.delete({
      where: { id_producto_id_material: { id_producto, id_material } },
    });

    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Entrada de receta no encontrada' });
    }
    next(err);
  }
}

// ─── ATRIBUTOS VARIABLES ──────────────────────────────────────────────────────

// GET /api/productos/:id/atributos
async function listarAtributos(req, res, next) {
  try {
    const id = parseInt(req.params.id);

    const atributos = await prisma.atributoVariable.findMany({
      where: { id_producto: id },
      include: { reglas: { include: { material: true } } },
    });

    res.json(atributos);
  } catch (err) {
    next(err);
  }
}

// POST /api/productos/:id/atributos — { nombre, tipo_dato }
// tipo_dato: 'numero' | 'texto' | 'seleccion'
async function crearAtributo(req, res, next) {
  try {
    const id_producto = parseInt(req.params.id);
    const { nombre, tipo_dato } = req.body;

    const TIPOS_VALIDOS = ['numero', 'texto', 'seleccion'];
    if (!nombre || !tipo_dato) {
      return res.status(400).json({ error: 'nombre y tipo_dato son requeridos' });
    }
    if (!TIPOS_VALIDOS.includes(tipo_dato)) {
      return res.status(400).json({ error: `tipo_dato debe ser uno de: ${TIPOS_VALIDOS.join(', ')}` });
    }

    const atributo = await prisma.atributoVariable.create({
      data: { id_producto, nombre, tipo_dato },
    });

    res.status(201).json(atributo);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un atributo con ese nombre para este producto' });
    }
    next(err);
  }
}

// DELETE /api/productos/:id/atributos/:id_atributo
async function eliminarAtributo(req, res, next) {
  try {
    const id_atributo = parseInt(req.params.id_atributo);

    await prisma.atributoVariable.delete({
      where: { id_atributo },
    });

    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Atributo no encontrado' });
    }
    next(err);
  }
}

// POST /api/atributos/:id_atributo/materiales — { id_material, cantidad_por_unidad_atributo }
// Vincula un material a un atributo variable (tabla atributo_material).
async function upsertAtributoMaterial(req, res, next) {
  try {
    const id_atributo = parseInt(req.params.id_atributo);
    const { id_material, cantidad_por_unidad_atributo } = req.body;

    if (!id_material || cantidad_por_unidad_atributo === undefined || cantidad_por_unidad_atributo <= 0) {
      return res.status(400).json({ error: 'id_material y cantidad_por_unidad_atributo (> 0) son requeridos' });
    }

    const regla = await prisma.atributoMaterial.upsert({
      where: { id_atributo_id_material: { id_atributo, id_material } },
      create: { id_atributo, id_material, cantidad_por_unidad_atributo },
      update: { cantidad_por_unidad_atributo },
      include: { material: true },
    });

    res.status(201).json(regla);
  } catch (err) {
    if (err.code === 'P2003') {
      return res.status(404).json({ error: 'Atributo o material no encontrado' });
    }
    next(err);
  }
}

module.exports = {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar,
  listarReceta,
  upsertReceta,
  eliminarReceta,
  listarAtributos,
  crearAtributo,
  eliminarAtributo,
  upsertAtributoMaterial,
};
