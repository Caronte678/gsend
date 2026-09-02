// Etiquetas legibles compartidas por todas las páginas.
// Antes estos mapas estaban duplicados en Dashboard, Pedidos y DetallePedido,
// y el estado de pago se mostraba crudo ("sin_pago", "parcial").

export const ESTADO_PEDIDO_LABELS = {
  pendiente:  'Pendiente',
  confirmado: 'Confirmado',
  completado: 'Completado',
  cancelado:  'Cancelado',
};

export const ESTADO_PAGO_LABELS = {
  sin_pago: 'Sin pago',
  parcial:  'Parcial',
  pagado:   'Pagado',
};

export const estadoPedidoLabel = (e) => ESTADO_PEDIDO_LABELS[e] ?? e ?? '—';
export const estadoPagoLabel   = (e) => ESTADO_PAGO_LABELS[e] ?? e ?? '—';

// Montos de dinero (precios, totales, pagos, márgenes): siempre enteros.
//   1800 -> "$1800" | 3700.00 -> "$3700" | 848.32 -> "$848"
export const money = (n) => '$' + Math.round(Number(n) || 0);

// Costo unitario de materiales: puede tener una fracción real (p. ej. $1,8 el ml).
// Se aproxima a 2 decimales y se quitan los ceros de relleno.
//   12.5 -> "$12.5" | 1.8 -> "$1.8" | 40 -> "$40" | 1.756 -> "$1.76"
export const moneyUnit = (n) => '$' + (Math.round((Number(n) || 0) * 100) / 100);
