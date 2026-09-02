# GSend — Documentación Completa del Proyecto

**Metodología:** Ágil (Scrum/Kanban), entregas incrementales
**Equipo:** 3 desarrolladores (POO, SQL/BD, Python, HTML, CSS, JS, React, Node)
**Fecha del documento:** 16 de agosto de 2026
**Estado:** Fases 1-6 aprobadas por el cliente. Fase 7 (tabla resumen) incluida a continuación.

---

## Contexto del proyecto

**Descripción:** GSend es un sistema de gestión para una PyME que vende productos personalizados a través de Instagram (cuadros con fotos, libretas con anillas, pulseras, stickers, entre otros). La administradora registra manualmente los pedidos recibidos, gestiona el catálogo de productos y sus "recetas" de materiales, controla el inventario de insumos con descuento automático al completar un pedido, y lleva el control financiero (precio de venta, costo, margen y pagos) de cada pedido.

**Usuarios/roles:** Admin (rol único, login único — la propia clienta gestiona el sistema).

**Alcance del MVP:** Gestión conjunta de pedidos, inventario y finanzas básicas, en una versión funcional desde el inicio.

**Restricciones:**
- Plazos: no definidos; trabajo estructurado por sprints.
- Stack: sin restricción obligatoria del cliente; propuesto por el equipo en Fase 4.
- Plataforma: web responsive (computador y celular), sin apps nativas.
- Fuera de alcance: integración con Instagram/WhatsApp para automatizar la recepción de mensajes. Descartada explícitamente para este ciclo.

---

## Fase 1 — Toma de Requisitos

### Requisitos Funcionales

| # | Requisito | Prioridad |
|---|---|---|
| RF-01 | Crear, editar y eliminar pedidos manualmente. | Must |
| RF-02 | Cambiar estado del pedido: Pendiente, Confirmado/En proceso, Completado/Entregado, Cancelado. | Must |
| RF-03 | Gestionar catálogo de productos (tipo, nombre, materiales fijos asociados). | Must |
| RF-04 | Definir productos con atributos variables que afectan el consumo de materiales. | Must |
| RF-05 | Gestionar inventario de materiales/insumos: nombre, unidad de medida, stock actual. | Must |
| RF-06 | Calcular automáticamente los materiales requeridos combinando receta fija + variables. | Must |
| RF-07 | Descontar automáticamente del inventario al completar un pedido. | Must |
| RF-08 | Generar alerta cuando el stock sea insuficiente para un pedido pendiente. | Should |
| RF-09 | Panel de pedidos pendientes. | Should |
| RF-10 | Panel de pedidos completados. | Should |
| RF-11 | Histórico de pedidos y consumo de materiales. | Could |
| RF-12 | Reponer manualmente el stock de inventario. | Should |
| RF-13 | Autenticación (login) para acceder. | Must |
| RF-14 🔶 | Reportes básicos (productos más pedidos, consumo por periodo). | Could |

### Requisitos No Funcionales

| # | Requisito |
|---|---|
| RNF-01 🔶 | Interfaz simple, baja curva de aprendizaje. |
| RNF-02 | Autenticación mínima usuario/contraseña. |
| RNF-03 | Web responsive, usable desde computador y celular. **(Confirmado.)** |
| RNF-04 | Arquitectura modular que facilite trabajo simultáneo de 3 devs. |
| RNF-05 🔶 | Sin requisitos de alta disponibilidad/tráfico (uso interno, bajo volumen). |
| RNF-06 | Consistencia de datos al descontar inventario (evitar condiciones de carrera). |

### Historias de Usuario

1. **HU-01** — Como Admin, quiero crear, editar y eliminar pedidos manualmente, para registrar los pedidos que recibo por Instagram.
2. **HU-02** — Como Admin, quiero cambiar el estado de un pedido, para reflejar en qué etapa del proceso se encuentra.
3. **HU-03** — Como Admin, quiero definir la receta de materiales fijos de un producto, para que el sistema sepa qué descontar por cada unidad vendida.
4. **HU-04** — Como Admin, quiero definir atributos variables en un pedido, para que el sistema calcule el consumo real de materiales de ese pedido específico.
5. **HU-05** — Como Admin, quiero recibir una alerta cuando no haya stock suficiente, para poder reabastecerme a tiempo.
6. **HU-06** — Como Admin, quiero reponer stock de materiales manualmente, para mantener el inventario actualizado tras una compra.
7. **HU-07** — Como Admin, quiero ver un panel con los pedidos pendientes y completados, para tener visibilidad del negocio.
8. **HU-08** — Como Admin, quiero iniciar sesión de forma segura, para que solo yo pueda acceder a la información del negocio.
9. **HU-09** *(adenda)* — Como Admin, quiero gestionar el catálogo de productos, para mantener actualizada mi oferta.
10. **HU-10** *(adenda)* — Como Admin, quiero gestionar el inventario de materiales, para tener mis insumos correctamente registrados.
11. **HU-11** *(adenda)* — Como Admin, quiero ver el precio de venta, costo y margen de cada pedido, para saber cuánto gano en cada venta.
12. **HU-12** *(adenda)* — Como Admin, quiero registrar pagos/abonos de un pedido, para saber si está pagado, parcial o pendiente de cobro.

### Fuera de alcance (Won't)
Integración con Instagram/WhatsApp para automatizar recepción de pedidos — descartada para este ciclo.

---

## Fase 2 — Modelado de Dominio

### Entidades del dominio

| Entidad | Atributos clave |
|---|---|
| `Usuario` | id, email, password_hash |
| `Producto` | id, nombre, tipo, descripcion, precio_base 🔶, activo |
| `Material` | id, nombre, unidad_medida, stock_actual, stock_minimo, costo_unitario_actual |
| `AtributoVariable` | id, producto_id, nombre, tipo_dato |
| `Pedido` | id, fecha_creacion, estado, cliente_nombre, cliente_contacto, notas |
| `ItemPedido` | id, pedido_id, producto_id, cantidad, precio_venta_unitario |
| `ItemAtributoValor` | id, item_pedido_id, atributo_variable_id, valor |
| `MovimientoInventario` | id, material_id, tipo, cantidad, costo_unitario, fecha, pedido_id, motivo |
| `Pago` | id, pedido_id, monto, fecha, metodo_pago |

Tablas de soporte (receta): `ProductoMaterial` (N:M Producto-Material) y `AtributoMaterial` (N:M AtributoVariable-Material).

### Relaciones y cardinalidad

- Producto — Material (vía `ProductoMaterial`): N:M
- Producto — AtributoVariable: 1:N
- AtributoVariable — Material (vía `AtributoMaterial`): N:M
- Pedido — ItemPedido: 1:N
- ItemPedido — Producto: N:1
- ItemPedido — ItemAtributoValor: 1:N
- Material — MovimientoInventario: 1:N
- Pedido — MovimientoInventario: 1:N (opcional)
- Pedido — Pago: 1:N
- Usuario: independiente (login único)

### Dominio vs. persistencia

| Categoría | Entidades |
|---|---|
| Dominio con comportamiento | `Producto`, `Material`, `Pedido`, `ItemPedido` |
| Dominio, no persistido (calculado) | `AlertaStock`, `totalVenta()`, `costoTotal()`, `margen()`, `estadoPago()` |
| Persistencia pura (soporte) | `ProductoMaterial`, `AtributoMaterial`, `ItemAtributoValor`, `MovimientoInventario` |
| Persistencia (técnica) | `Usuario`, `Pago` |

🔶 **Decisión de diseño:** las tablas de receta (`ProductoMaterial`, `AtributoMaterial`) usan un modelo flexible en vez de columnas fijas por producto, para soportar nuevos tipos de producto sin cambiar el esquema.

🔶 **Decisión financiera:** el costo se calcula con el método "último precio de compra" (confirmado por el cliente). El precio de venta es variable por ítem de pedido (no fijo por producto). Los cálculos de venta/costo/margen/estado de pago **no se persisten**, se calculan en cada consulta.

---

## Fase 3 — Diseño de Base de Datos

Normalización verificada hasta 3FN en todas las tablas (ver razonamiento completo en el archivo DDL). Motor propuesto: **PostgreSQL** 🔶 (a confirmar).

🔶 **Desnormalización intencional:** `materiales.stock_actual` es un valor cacheado (derivable de `movimientos_inventario`), mantenido por rendimiento; debe sincronizarse en la misma transacción que cada movimiento.

**El script DDL completo (v2, con gestión financiera) está en el archivo separado `GSend_Fase3_DDL_v2.sql`**, e incluye:
- Las 10 tablas del modelo (`usuarios`, `materiales`, `productos`, `producto_material`, `atributos_variables`, `atributo_material`, `pedidos`, `items_pedido`, `item_atributo_valor`, `movimientos_inventario`, `pagos`).
- Índices en claves foráneas y en `pedidos.estado`.
- Restricciones `CHECK` para cantidades positivas y valores de enumeración válidos.
- Una vista `vista_pedido_financiero` que calcula `total_venta`, `costo_total` y `total_pagado` por pedido sin duplicar datos.

---

## Fase 4 — Arquitectura del Sistema

### Arquitectura
Monolito modular en capas: **Presentación → API REST → Lógica de negocio → Datos**. Se descartan microservicios por sobrecarga innecesaria para un equipo de 3 y un sistema de uso interno de bajo volumen.

### Stack por capa 🔶

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend | React + React Router | Ya lo domina el equipo; SPA responsive sin apps nativas. |
| Backend | Node.js + Express | Mismo lenguaje que el frontend, reduce cambio de contexto. |
| ORM | Prisma | Migraciones versionadas, cliente tipado, encaja con el DDL de Fase 3. |
| Base de datos | PostgreSQL | Ya definida en Fase 3. |
| Autenticación | JWT | Simple para login único. |

### Especificación de API REST (resumen — ver Fase 4 completa para detalle de body/response)

- `POST /api/auth/login`
- `GET/POST/PUT/DELETE /api/productos` (+ `/:id/materiales`, `/:id/atributos`)
- `POST /api/atributos/:id/materiales`
- `GET/POST/PUT /api/materiales` (+ `/:id/reponer`)
- `GET /api/alertas/stock`
- `GET/POST/PUT/PATCH/DELETE /api/pedidos` (+ `/:id/estado`, `/:id/pagos`)

### Estructura de carpetas

```
gsend/
├── backend/   (Express + Prisma; ver esqueleto ya generado)
├── frontend/  (React + Vite; ver esqueleto ya generado)
└── README.md
```

*(El esqueleto real del repositorio, con estos endpoints implementados como stubs, está en el archivo `gsend-scaffold.zip` entregado previamente.)*

---

## Fase 5 — Planificación Ágil

🔶 Sprints de 2 semanas (sugerencia, no definido por el cliente).

| Sprint | Objetivo | Historias | Definition of Done |
|---|---|---|---|
| 1 | Fundamentos y autenticación | HU-08 | Login end-to-end funcionando; migraciones aplicadas; CI corriendo; PR revisado. |
| 2 | Catálogo: productos, materiales, receta | HU-09, HU-10, HU-03, HU-04 | CRUD completo probado; receta y atributos variables funcionando. |
| 3 | Pedidos y descuento automático de inventario | HU-01, HU-02, HU-07 (parcial) | Pedido completado descuenta inventario correctamente; no se completa sin stock. |
| 4 | Alertas e inventario financiero | HU-05, HU-06, HU-12 | Alertas de stock funcionando; reposición registra costo; pagos calculan estado de cobro. |
| 5 | Finanzas y cierre del MVP | HU-11, HU-07 (completo) | Margen por pedido correcto; reportes generales disponibles; demo aprobada por la clienta. |

### Backlog priorizado (post-MVP)

| Ítem | Prioridad |
|---|---|
| RF-11 — Histórico | Could |
| RF-14 — Reportes avanzados | Could |
| Multi-usuario / roles adicionales | Backlog futuro |
| Integración Instagram/WhatsApp | Fuera de alcance (Won't) |

---

## Fase 6 — División de Tareas (3 desarrolladores)

### Roles base 🔶

| Dev | Rol |
|---|---|
| Dev 1 | Backend & Base de datos |
| Dev 2 | Frontend |
| Dev 3 | Integración, lógica de negocio compleja y QA |

*(Asignación de tareas detallada por sprint disponible en la conversación completa del proyecto — Fase 6.)*

### Flujo de Git 🔶

- **Gitflow simplificado**: `main` (estable) ← `develop` (integración) ← `feature/<sprint>-<descripcion>`.
- PR obligatorio con revisión de al menos 1 compañero antes de merge a `develop`.
- Merge a `main` al cierre de cada sprint (Definition of Done cumplida).
- Commits siguiendo **Conventional Commits** (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).

---

## Fase 7 — Entregables por Fase

| Fase | Entregable concreto | Archivo/formato |
|---|---|---|
| Fase 1 | Requisitos funcionales/no funcionales, historias de usuario, MoSCoW | `GSend_Fase1_Toma_de_Requisitos.md` |
| Fase 2 | Modelo de dominio, relaciones, diagrama de clases UML | Diagrama interactivo (mermaid) + este documento |
| Fase 3 | MER, modelo relacional normalizado, script DDL | `GSend_Fase3_DDL_v2.sql` |
| Fase 4 | Arquitectura, stack, especificación de API, estructura de carpetas | Este documento + `gsend-scaffold.zip` (esqueleto de repo) |
| Fase 5 | Plan de sprints, Definition of Done, backlog priorizado | Este documento |
| Fase 6 | Asignación de tareas, convención Git | Este documento |
| Fase 7 | Esta tabla resumen | Este documento |

---

**Nota general del documento:** todos los ítems marcados con 🔶 son sugerencias del equipo/arquitecto, no requisitos dados explícitamente por el cliente, y quedan sujetos a validación por el equipo de desarrollo antes de implementarse como definitivos.
