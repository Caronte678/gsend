const prisma = require('../config/prisma');

// GET /api/configuracion — publica (sin auth para que el frontend la cargue al inicio)
async function obtener(req, res, next) {
  try {
    const rows = await prisma.configuracion.findMany();
    const config = {};
    rows.forEach(r => { config[r.clave] = r.valor; });

    // Valores por defecto si aún no hay configuración
    const defaults = {
      nombre_pyme:  'Mi Pyme',
      logo_base64:  null,
      descripcion:  '',
    };

    res.json({ ...defaults, ...config });
  } catch (err) { next(err); }
}

// PUT /api/configuracion — protegida
async function actualizar(req, res, next) {
  try {
    const allowed = ['nombre_pyme', 'logo_base64', 'descripcion'];
    const entries = Object.entries(req.body).filter(([k]) => allowed.includes(k));

    if (entries.length === 0) {
      return res.status(400).json({ error: 'No se enviaron campos válidos' });
    }

    await prisma.$transaction(
      entries.map(([clave, valor]) =>
        prisma.configuracion.upsert({
          where: { clave },
          update: { valor: valor ?? null },
          create: { clave, valor: valor ?? null },
        })
      )
    );

    // Devolver configuración completa actualizada
    const rows = await prisma.configuracion.findMany();
    const config = {};
    rows.forEach(r => { config[r.clave] = r.valor; });

    const defaults = { nombre_pyme: 'Mi Pyme', logo_base64: null, descripcion: '' };
    res.json({ ...defaults, ...config });
  } catch (err) { next(err); }
}

module.exports = { obtener, actualizar };
