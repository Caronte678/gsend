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

// Cantidades de material (stock, mínimos, consumos): hasta 2 decimales, sin
// ceros de relleno. Con recetas fraccionarias el stock puede quedar en 9.67 hojas,
// y redondearlo a entero escondería que ya no queda una hoja completa.
//   10 -> "10" | 9.6667 -> "9.67" | 0.5 -> "0.5"
export const qty = (n) => String(Math.round((Number(n) || 0) * 100) / 100);

// Si una cantidad por unidad es 1/N (0.333333 = 1/3), devuelve N; si no, null.
// Permite mostrar "1 hoja rinde 3" en vez de 0.333333.
export function rendimiento(cantidadPorUnidad) {
  const c = Number(cantidadPorUnidad);
  if (!(c > 0 && c < 1)) return null;
  const n = Math.round(1 / c);
  return n >= 2 && Math.abs(1 / n - c) < 1e-5 ? n : null;
}

// Texto legible de una entrada de receta, en la forma más natural.
// Se muestra como fracción porque la unidad puede venir en singular o plural.
//   (0.333333, 'hojas') -> "1/3 hojas por unidad (rinde 3)"
//   (2, 'ml')           -> "2 ml por unidad"
export function recetaLabel(cantidadPorUnidad, unidad = '') {
  const n = rendimiento(cantidadPorUnidad);
  const u = unidad ? ` ${unidad}` : '';
  if (n) return `1/${n}${u} por unidad (rinde ${n})`;
  return `${Math.round(Number(cantidadPorUnidad) * 1e4) / 1e4}${u} por unidad`;
}
