const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth.middleware');
const { stockBajo } = require('../controllers/alertas.controller');

router.use(requireAuth);

// GET /api/alertas/stock — materiales donde stock_actual < stock_minimo (RF-08)
router.get('/stock', stockBajo);

module.exports = router;
