const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth.middleware');
const {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar,
  listarReceta,
  upsertReceta,
  eliminarReceta,
} = require('../controllers/productos.controller');

router.use(requireAuth);

// ─── Productos CRUD ───────────────────────────────────────────────────────────
// GET /api/productos?activo=true
router.get('/', listar);

// GET /api/productos/:id — incluye la receta
router.get('/:id', obtener);

// POST /api/productos — { nombre, tipo, descripcion?, precio_base? }
router.post('/', crear);

// PUT /api/productos/:id
router.put('/:id', actualizar);

// DELETE /api/productos/:id — soft delete (activo = false)
router.delete('/:id', eliminar);

// ─── Receta fija (producto_material) ─────────────────────────────────────────
// GET /api/productos/:id/materiales
router.get('/:id/materiales', listarReceta);

// POST /api/productos/:id/materiales — { id_material, cantidad_por_unidad }
router.post('/:id/materiales', upsertReceta);

// DELETE /api/productos/:id/materiales/:id_material
router.delete('/:id/materiales/:id_material', eliminarReceta);

module.exports = router;
