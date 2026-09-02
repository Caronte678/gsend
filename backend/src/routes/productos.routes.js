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
  listarAtributos,
  crearAtributo,
  eliminarAtributo,
  upsertAtributoMaterial,
} = require('../controllers/productos.controller');

router.use(requireAuth);

// ─── Productos CRUD ───────────────────────────────────────────────────────────
// GET /api/productos?activo=true
router.get('/', listar);

// GET /api/productos/:id — incluye receta y atributos variables
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

// ─── Atributos variables ──────────────────────────────────────────────────────
// GET /api/productos/:id/atributos
router.get('/:id/atributos', listarAtributos);

// POST /api/productos/:id/atributos — { nombre, tipo_dato }
router.post('/:id/atributos', crearAtributo);

// DELETE /api/productos/:id/atributos/:id_atributo
router.delete('/:id/atributos/:id_atributo', eliminarAtributo);

// ─── Materiales de un atributo (atributo_material) ───────────────────────────
// POST /api/atributos/:id_atributo/materiales — { id_material, cantidad_por_unidad_atributo }
// Nota: esta ruta está montada en /api/productos pero hace referencia al atributo, no al producto
router.post('/atributos/:id_atributo/materiales', upsertAtributoMaterial);

module.exports = router;
