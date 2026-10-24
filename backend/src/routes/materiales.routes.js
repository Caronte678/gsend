const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth.middleware');
const {
  listar,
  obtener,
  crear,
  actualizar,
  reponer,
  ajustar,
} = require('../controllers/materiales.controller');

router.use(requireAuth);

// GET /api/materiales?activo=true
router.get('/', listar);

// GET /api/materiales/:id
router.get('/:id', obtener);

// POST /api/materiales — { nombre, unidad_medida, stock_minimo?, stock_actual?, costo_unitario_actual? }
router.post('/', crear);

// PUT /api/materiales/:id
router.put('/:id', actualizar);

// POST /api/materiales/:id/reponer — { cantidad, costo_unitario, motivo? }
// Genera MovimientoInventario tipo 'entrada' y actualiza stock en la misma transacción.
router.post('/:id/reponer', reponer);

// POST /api/materiales/:id/ajustar — { stock_real, motivo? }
// Corrige el stock a lo contado; la diferencia queda como movimiento de ajuste.
router.post('/:id/ajustar', ajustar);

module.exports = router;
