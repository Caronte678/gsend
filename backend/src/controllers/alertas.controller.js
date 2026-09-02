const prisma = require('../config/prisma');

// GET /api/alertas/stock — materiales donde stock_actual < stock_minimo (RF-08)
async function stockBajo(req, res, next) {
  try {
    const materiales = await prisma.material.findMany({
      where: {
        activo: true,
        // Prisma no soporta comparación entre dos campos directamente,
        // usamos $queryRaw para la comparación columna-a-columna.
      },
      orderBy: { nombre: 'asc' },
    });

    // Filtrado en JS (eficiente para bajo volumen de insumos, que es el caso de esta PyME)
    const alertas = materiales.filter(
      (m) => Number(m.stock_actual) < Number(m.stock_minimo)
    );

    res.json(alertas);
  } catch (err) {
    next(err);
  }
}

module.exports = { stockBajo };
