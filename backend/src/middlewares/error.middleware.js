// Manejador de errores centralizado.
// TODO (equipo): distinguir errores de validación (400) vs errores internos (500)
// de forma más granular a medida que se agreguen los servicios.
function errorHandler(err, req, res, next) {
  console.error(err);
  // Los controladores marcan errores esperables con `statusCode` (o `status`).
  const status = err.statusCode || err.status || 500;
  const payload = { error: err.message || 'Error interno del servidor' };
  if (err.detalle) payload.detalle = err.detalle;
  res.status(status).json(payload);
}

module.exports = { errorHandler };
