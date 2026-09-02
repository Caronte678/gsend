# Poner GSend en internet — gratis

Guía para dejar GSend accesible desde una URL, para que la clienta lo use desde
su computadora o su celular sin instalar nada. Todo con capas gratuitas y sin
tarjeta de crédito.

## Cómo queda armado

GSend se despliega como **un solo servicio**: Express sirve la API en `/api` y
además entrega el frontend ya compilado. Un solo hosting, una sola URL, sin CORS.

```
Navegador ──► Render (Node + Express) ──► Neon (PostgreSQL)
               ├── /api/*  → la API
               └── /*      → la app de React
```

| Servicio | Para qué | Gratis |
|---|---|---|
| [Neon](https://neon.com) | Base PostgreSQL | Permanente, 0.5 GB, sin tarjeta |
| [Render](https://render.com) | Servidor Node | 750 hs/mes, sin tarjeta |

**Lo que hay que aceptar a cambio:** el servicio gratuito de Render se apaga tras
15 minutos sin visitas, así que la primera carga del día tarda cerca de un
minuto. Las siguientes son instantáneas. Avisale a tu clienta antes para que no
piense que se rompió.

> **No lo mantengas despierto con un servicio de "ping".** Es un truco común, pero
> acá sale caro: si el servidor nunca duerme, Prisma mantiene la conexión abierta
> y Neon nunca baja a cero, consumiendo sus 100 horas de cómputo mensuales en unos
> pocos días. Al agotarlas se cae la base. Que duerman los dos juntos es lo que
> hace que el conjunto sea sostenible en gratis.

---

## 1. Crear la base de datos (Neon)

1. Entrá a [neon.com](https://neon.com) y creá una cuenta.
2. Creá un proyecto nuevo. Llamalo `gsend`.
3. Copiá la **cadena de conexión** (*connection string*). Se ve así:

   ```
   postgresql://usuario:contraseña@ep-algo.region.aws.neon.tech/neondb?sslmode=require
   ```

4. Guardala en un lugar seguro: es el valor de `DATABASE_URL`.

> El `?sslmode=require` del final es obligatorio. Si el despliegue falla con un
> error de SSL, ese es el motivo.

---

## 2. Subir el código a GitHub

El repositorio local ya está creado y con los commits hechos. Solo falta subirlo.

1. Entrá a [github.com](https://github.com) → **New repository**.
2. Ponele nombre (`gsend`) y dejalo **vacío**: sin README, sin .gitignore, sin licencia.
3. Podés hacerlo **privado**: Render se conecta igual.
4. Copiá los comandos que GitHub te muestra en *"…or push an existing repository"*:

```bash
cd gsend
git remote add origin https://github.com/TU-USUARIO/gsend.git
git push -u origin main
```

> `.gitignore` ya excluye `backend/.env`, así que tus credenciales locales no se
> suben. Ya está verificado en los commits existentes.

---

## 3. Crear el servicio (Render)

El repositorio incluye `render.yaml`, así que no hay que llenar formularios:

1. Entrá a [render.com](https://render.com) y creá una cuenta (podés entrar con GitHub).
2. **New** → **Blueprint**.
3. Elegí el repositorio de GSend.
4. Render lee `render.yaml` y arma el servicio solo. Te va a pedir **un** valor:

   | Variable | Qué poner |
   |---|---|
   | `DATABASE_URL` | La cadena de conexión de Neon del paso 1 |

   El `JWT_SECRET` lo genera Render automáticamente, seguro y aleatorio.

5. **Apply**. El primer despliegue tarda unos minutos: instala dependencias,
   compila el frontend y aplica las migraciones a la base.

Cuando termine te da una URL del estilo `https://gsend.onrender.com`.

---

## 4. Crear el usuario administrador

La base arranca vacía. En Render, abrí la pestaña **Shell** de tu servicio y
ejecutá (poniendo el email y la contraseña que quieras usar):

```bash
ADMIN_EMAIL=tuemail@ejemplo.com ADMIN_PASSWORD=una-contraseña-larga npm run seed
```

La contraseña no se guarda en ningún archivo: solo queda su hash en la base.

Si querés cambiarla después:

```bash
ADMIN_EMAIL=tuemail@ejemplo.com ADMIN_PASSWORD=la-nueva npm run admin:password
```

> **No uses la contraseña de desarrollo.** Elegí una larga (mínimo 10 caracteres,
> mejor 16) y guardala en un gestor de contraseñas.

---

## 5. Probar

Abrí la URL y verificá:

- [ ] Carga la pantalla de ingreso.
- [ ] Podés iniciar sesión con el usuario que creaste.
- [ ] Se puede crear un material, un producto y un pedido.
- [ ] Recargar la página estando en `/pedidos` no da error 404.
- [ ] Entra bien desde el celular.
- [ ] Completar un pedido descuenta el stock.

---

## 6. Entregarle el sistema a la clienta

Mandale:

- La URL.
- Su usuario y contraseña (por un canal privado, no por el chat del pedido).
- El aviso de que la primera carga del día tarda un minuto.

Después entrá a **Configuración** y cargá el nombre y el logo de la pyme: aparece
en la barra lateral y hace que se sienta suyo.

---

## Mantenimiento

**Publicar cambios.** Subí los cambios a GitHub y Render redespliega solo. No hay
que reenviarle nada a la clienta: la próxima vez que entre ya está actualizado.

```bash
git add -A
git commit -m "descripción del cambio"
git push
```

**Respaldos.** Es lo único irreemplazable: el código se recompila, el historial de
ventas no. Neon guarda un historial reciente que permite recuperar la base a un
momento anterior, pero para dormir tranquilo hacé una copia propia de vez en
cuando desde tu computadora:

```bash
pg_dump "TU_DATABASE_URL" > respaldo-$(date +%F).sql
```

**Ver los datos a mano.** Con la variable cargada, `npx prisma studio` abre un
panel para inspeccionar y editar la base.

---

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| El build falla en `prisma migrate deploy` | Falta `?sslmode=require` en `DATABASE_URL`, o está mal copiada |
| Arranca y se apaga enseguida | Falta `DATABASE_URL` o `JWT_SECRET` — el servidor avisa cuál en los logs |
| "JWT_SECRET es demasiado corto" | Estás usando el de desarrollo; en producción pide 32+ caracteres |
| La página carga pero la API da 404 | El frontend no se compiló: revisá que el build incluya `npm run build` |
| Primera visita del día muy lenta | Normal: el servicio gratuito estaba dormido |
| "Demasiados intentos de inicio de sesión" | 10 intentos fallidos en 15 minutos. Esperá y reintentá |

Los **Logs** del servicio en Render muestran el error exacto; casi siempre está ahí.

---

## Cosas a tener en cuenta

- **Las capas gratuitas cambian.** Los datos de esta guía se verificaron en
  septiembre de 2026. Revisá las condiciones vigentes antes de comprometerte.
- **La sesión dura 8 horas.** Pasado ese tiempo hay que volver a iniciar sesión.
- **Hay un solo usuario.** Si más adelante entra alguien a ayudar con los pedidos,
  van a compartir la cuenta hasta que se agregue gestión de usuarios.
- **0.5 GB de base** es muchísimo para este uso: son cientos de miles de pedidos.
  El logo en base64 es lo único que pesa, y tiene tope de 2 MB.
