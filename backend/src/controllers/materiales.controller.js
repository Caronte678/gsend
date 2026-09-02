const prisma = require('../config/prisma');

// GET /api/materiales — lista todos los materiales (activos por defecto)
async function listar(req, res, next) {
  try {
    const { activo } = req.query;

    const where = {};
    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const materiales = await prisma.material.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });

    res.json(materiales);
  } catch (err) {
    next(err);
  }
}

// GET /api/materiales/:id
async function obtener(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const material = await prisma.material.findUnique({
      where: { id_material: id },
    });

    if (!material) {
      return res.status(404).json({ error: 'Material no encontrado' });
    }

    res.json(material);
  } catch (err) {
    next(err);
  }
}

// POST /api/materiales — { nombre, unidad_medida, stock_minimo, stock_actual, costo_unitario_actual }
async function crear(req, res, next) {
  try {
    const { nombre, unidad_medida, stock_minimo = 0, stock_actual = 0, costo_unitario_actual = 0 } = req.body;

    if (!nombre || !unidad_medida) {
      return res.status(400).json({ error: 'nombre y unidad_medida son requeridos' });
    }

    const material = await prisma.material.create({
      data: {
        nombre,
        unidad_medida,
        stock_minimo,
        stock_actual,
        costo_unitario_actual,
      },
    });

    res.status(201).json(material);
  } catch (err) {
    // Unicidad de nombre
    if (err.code === 'P2002') {
      return res.status(409).json({ error: `Ya existe un material con el nombre "${req.body.nombre}"` });
    }
    next(err);
  }
}

// PUT /api/materiales/:id — actualiza nombre, unidad_medida, stock_minimo, activo
// No permite modificar stock_actual directamente; usar /reponer para eso.
async function actualizar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { nombre, unidad_medida, stock_minimo, activo } = req.body;

    const material = await prisma.material.update({
      where: { id_material: id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(unidad_medida !== undefined && { unidad_medida }),
        ...(stock_minimo !== undefined && { stock_minimo }),
        ...(activo !== undefined && { activo }),
      },
    });

    res.json(material);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Material no encontrado' });
    }
    if (err.code === 'P2002') {
      return res.status(409).json({ error: `Ya existe un material con ese nombre` });
    }
    next(err);
  }
}

// POST /api/materiales/:id/reponer — { cantidad, costo_unitario, motivo? }
// Genera MovimientoInventario tipo 'entrada', actualiza stock_actual y costo_unitario_actual.
// Todo en una sola transacción para cumplir RNF-06.
async function reponer(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { cantidad, costo_unitario, motivo } = req.body;

    if (!cantidad || cantidad <= 0) {
      return res.status(400).json({ error: 'cantidad debe ser un número positivo' });
    }
    if (costo_unitario === undefined || costo_unitario < 0) {
      return res.status(400).json({ error: 'costo_unitario es requerido y debe ser >= 0' });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      // Verificar que el material existe
      const material = await tx.material.findUnique({ where: { id_material: id } });
      if (!material) {
        throw Object.assign(new Error('Material no encontrado'), { statusCode: 404 });
      }

      // Registrar el movimiento de entrada
      const movimiento = await tx.movimientoInventario.create({
        data: {
          id_material: id,
          tipo: 'entrada',
          cantidad,
          costo_unitario,
          motivo: motivo || 'Reposición manual',
        },
      });

      // Actualizar stock_actual y costo_unitario_actual (último precio de compra — decisión de Fase 2)
      const materialActualizado = await tx.material.update({
        where: { id_material: id },
        data: {
          stock_actual: { increment: cantidad },
          costo_unitario_actual: costo_unitario,
        },
      });

      return { material: materialActualizado, movimiento };
    });

    res.status(201).json(resultado);
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
}

module.exports = { listar, obtener, crear, actualizar, reponer };
