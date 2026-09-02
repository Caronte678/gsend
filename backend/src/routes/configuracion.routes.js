const { Router } = require('express');
const { obtener, actualizar } = require('../controllers/configuracion.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = Router();

// GET público — el frontend lo carga al iniciar (sin auth)
router.get('/', obtener);

// PUT protegido — solo admin puede cambiar la config
router.put('/', requireAuth, actualizar);

module.exports = router;
