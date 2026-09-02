const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth.middleware');
const {
  listar,
  obtener,
  crear,
  actualizar,
  cambiarEstado,
  eliminar,
  listarPagos,
  registrarPago,
} = require('../controllers/pedidos.controller');

router.use(requireAuth);

// GET /api/pedidos?estado=pendiente
router.get('/', listar);

// GET /api/pedidos/:id — detalle completo con financiero calculado
router.get('/:id', obtener);

// POST /api/pedidos — { cliente_nombre, cliente_contacto?, notas?, items[] }
router.post('/', crear);

// PUT /api/pedidos/:id — editar datos del pedido
router.put('/:id', actualizar);

// PATCH /api/pedidos/:id/estado — { estado }
// Si estado pasa a 'completado': valida stock y descuenta inventario en transacción (RNF-06).
router.patch('/:id/estado', cambiarEstado);

// DELETE /api/pedidos/:id
router.delete('/:id', eliminar);

// GET /api/pedidos/:id/pagos
router.get('/:id/pagos', listarPagos);

// POST /api/pedidos/:id/pagos — { monto, metodo_pago? }
router.post('/:id/pagos', registrarPago);

module.exports = router;
