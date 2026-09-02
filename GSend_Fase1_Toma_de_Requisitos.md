# GSend — Fase 1: Toma de Requisitos

**Proyecto:** GSend
**Metodología:** Ágil (Scrum/Kanban), entregas incrementales
**Equipo:** 3 desarrolladores (POO, SQL/BD, Python, HTML, CSS, JS, React, Node)
**Fecha del documento:** 16 de agosto de 2026

---

## 1. Contexto del proyecto

**Descripción breve:**
GSend es un sistema de gestión para una PyME que vende productos personalizados a través de Instagram (cuadros con fotos, libretas con anillas, pulseras, stickers, entre otros). El sistema permite a la administradora registrar manualmente los pedidos recibidos, gestionar el catálogo de productos y sus "recetas" de materiales, y controlar el inventario de insumos, descontando automáticamente los materiales consumidos cuando un pedido se completa.

**Usuarios/roles:**
- **Admin** (rol único, cuenta de acceso única/login único). La propia clienta ingresa y gestiona los pedidos manualmente.

**Alcance del MVP:**
Gestión conjunta de pedidos e inventario, en una versión básica, desde el inicio. Incluye: registro manual de pedidos, catálogo de productos con receta de materiales (fija y variable), descuento automático de inventario al completar un pedido, y alertas de stock insuficiente.

**Restricciones:**
- **Plazos:** no definidos; se estructurará el trabajo por sprints (ver Fase 5).
- **Stack tecnológico:** sin restricción obligatoria definida por el cliente; se propondrá en la Fase 4 como sugerencia a validar por el equipo (considerando que el equipo domina React, Node y SQL).
- **Plataforma:** debe ser accesible desde computador y celular → aplicación **web responsive** (sin apps nativas).
- **Integraciones externas:** la integración con Instagram/WhatsApp para automatizar la recepción de mensajes **queda fuera de alcance** en esta etapa. No se diseñará ni siquiera como extensión futura dentro de este ciclo de trabajo; si se retoma más adelante, requerirá una nueva toma de requisitos.

---

## 2. Requisitos Funcionales

| # | Requisito | Prioridad (MoSCoW) |
|---|---|---|
| RF-01 | El sistema debe permitir al Admin crear, editar y eliminar pedidos manualmente. | Must |
| RF-02 | El sistema debe permitir asignar y cambiar el estado de un pedido: Pendiente, Confirmado/En proceso, Completado/Entregado, Cancelado. | Must |
| RF-03 | El sistema debe permitir gestionar un catálogo de productos (tipo, nombre, materiales fijos asociados). | Must |
| RF-04 | El sistema debe permitir definir productos con atributos variables que afectan el consumo de materiales (ej. cantidad de fotos en un cuadro, cantidad de anillas en una libreta). | Must |
| RF-05 | El sistema debe permitir gestionar el inventario de materiales/insumos: nombre, unidad de medida, stock actual. | Must |
| RF-06 | El sistema debe calcular automáticamente los materiales requeridos para un pedido, combinando la receta fija del producto con las variables ingresadas en ese pedido específico. | Must |
| RF-07 | El sistema debe descontar automáticamente del inventario los materiales calculados cuando un pedido pasa a estado "Completado/Entregado". | Must |
| RF-08 | El sistema debe generar una alerta cuando el stock de un material sea insuficiente para completar un pedido pendiente. | Should |
| RF-09 | El sistema debe mostrar un listado/panel de pedidos pendientes. | Should |
| RF-10 | El sistema debe mostrar un listado/panel de pedidos completados. | Should |
| RF-11 | El sistema debe mantener un histórico de pedidos y del consumo de materiales asociado. | Could |
| RF-12 | El admin debe poder reponer manualmente el stock de inventario (ingreso de nuevas unidades). | Should |
| RF-13 | El sistema debe requerir autenticación (login) para acceder. | Must |
| RF-14 🔶 | *(Sugerencia, a validar)* Reportes básicos (productos más pedidos, consumo de materiales por periodo). | Could |

---

## 3. Requisitos No Funcionales

| # | Requisito |
|---|---|
| RNF-01 🔶 | *(Sugerencia)* Interfaz simple y de baja curva de aprendizaje, dado que el uso es de un único administrador sin perfil técnico necesariamente. |
| RNF-02 | El sistema debe proteger el acceso mediante autenticación (usuario/contraseña como mínimo). |
| RNF-03 | El sistema debe ser accesible como aplicación web responsive, utilizable tanto desde computador como desde celular. **(Confirmado por el cliente.)** |
| RNF-04 | El código debe seguir una arquitectura modular que facilite el trabajo simultáneo de 3 desarrolladores (separación por capas/módulos). |
| RNF-05 🔶 | *(Sugerencia)* No se esperan requisitos de alta disponibilidad ni alto volumen de tráfico (uso interno, bajo volumen de PyME), pero el diseño de base de datos debe permitir crecimiento razonable. |
| RNF-06 | El sistema debe mantener consistencia de datos al descontar inventario (evitar condiciones de carrera si dos pedidos se completan simultáneamente). |

**Nota:** no se definieron cifras concretas de tiempos de respuesta, disponibilidad (%) ni volumen estimado de pedidos/mes. No se asumieron valores; quedan pendientes de definición si el equipo lo considera necesario.

---

## 4. Historias de Usuario

**HU-01**
> Como Admin, quiero crear, editar y eliminar pedidos manualmente, para registrar los pedidos que recibo por Instagram.
- **Criterios de aceptación:**
  - Puedo crear un pedido ingresando datos del cliente (nombre y contacto), productos, cantidades y atributos personalizados.
  - Puedo editar cualquier campo del pedido mientras esté en estado Pendiente o Confirmado.
  - Puedo eliminar un pedido, considerando el impacto en la trazabilidad de inventario si ya generó movimientos (🔶 regla exacta a validar en Fase 2/3).

**HU-02**
> Como Admin, quiero cambiar el estado de un pedido, para reflejar en qué etapa del proceso se encuentra.
- **Criterios de aceptación:**
  - Puedo cambiar entre Pendiente, Confirmado, Completado, Cancelado.
  - Al pasar a "Completado", el sistema descuenta automáticamente el inventario correspondiente.
  - Al pasar a "Cancelado", no se descuenta inventario (y si ya se había descontado, se revierte — 🔶 sugerencia, a validar si aplica).

**HU-03**
> Como Admin, quiero definir la receta de materiales fijos de un producto, para que el sistema sepa qué descontar por cada unidad vendida.
- **Criterios de aceptación:**
  - Puedo asociar uno o más materiales fijos a un producto, con cantidad por unidad.
  - Puedo editar esta receta en cualquier momento.

**HU-04**
> Como Admin, quiero definir atributos variables en un pedido (ej. cantidad de fotos, tamaño), para que el sistema calcule el consumo real de materiales de ese pedido específico.
- **Criterios de aceptación:**
  - Al crear/editar un pedido de un producto personalizable, puedo ingresar sus variables.
  - El sistema recalcula automáticamente los materiales necesarios en base a receta fija + variables.

**HU-05**
> Como Admin, quiero recibir una alerta cuando no haya stock suficiente para completar un pedido, para poder reabastecerme a tiempo.
- **Criterios de aceptación:**
  - El sistema compara el stock disponible contra lo requerido por los pedidos pendientes.
  - Si algún material no alcanza, se muestra una alerta visible (ej. en el panel de pedidos pendientes).

**HU-06**
> Como Admin, quiero reponer stock de materiales manualmente, para mantener el inventario actualizado tras una compra.
- **Criterios de aceptación:**
  - Puedo ingresar una cantidad a sumar al stock actual de un material.
  - Queda registro de la reposición (fecha, cantidad — 🔶 sugerencia para trazabilidad).

**HU-07**
> Como Admin, quiero ver un panel con los pedidos pendientes y completados, para tener visibilidad del estado general del negocio.
- **Criterios de aceptación:**
  - Existe una vista que separa pedidos por estado.
  - Puedo acceder al detalle de cada pedido desde el panel.

**HU-08**
> Como Admin, quiero iniciar sesión de forma segura, para que solo yo pueda acceder a la información del negocio.
- **Criterios de aceptación:**
  - El sistema exige usuario y contraseña.
  - No se puede acceder a ninguna funcionalidad sin autenticarse.

---

## 5. Priorización MoSCoW — Resumen

| Prioridad | Requisitos |
|---|---|
| **Must** | RF-01, RF-02, RF-03, RF-04, RF-05, RF-06, RF-07, RF-13 |
| **Should** | RF-08, RF-09, RF-10, RF-12 |
| **Could** | RF-11, RF-14 🔶 |
| **Won't (por ahora)** | Integración con Instagram/WhatsApp para automatizar recepción de pedidos — descartada explícitamente para este ciclo. |

---

## 6. Decisiones marcadas como sugerencia (pendientes de validación del equipo)

| Ítem | Sugerencia | Estado |
|---|---|---|
| RNF-01 | Interfaz simple, baja curva de aprendizaje | Sugerido, no validado |
| RNF-03 | Web responsive en vez de apps nativas | **Confirmado por el cliente** |
| RNF-05 | Bajo volumen esperado, sin alta disponibilidad | Sugerido, no validado |
| RF-14 | Reportes básicos | Sugerido, prioridad Could |
| HU-01 | Regla de eliminación de pedidos con movimientos de inventario ya generados | Pendiente de definir en Fase 2/3 |
| HU-02 | Reversión de inventario al cancelar un pedido ya completado | Pendiente de definir |
| HU-06 | Registro de trazabilidad en cada reposición manual | Sugerido, no validado |

---

**Estado de la fase:** ✅ Aprobada por el cliente.
