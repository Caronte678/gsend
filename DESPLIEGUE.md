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

## 2b. Verificar la cadena antes de desplegar

Para no descubrir un error recien cuando Render falle el build:

1. Creá el archivo `backend/.env.produccion` con una sola línea:

   ```
   DATABASE_URL="postgresql://...tu cadena de Neon..."
   ```

2. Corré:

   ```bash
   cd backend
   npm run verificar
   ```

Te avisa si quedó la conexión *pooled*, si falta `sslmode`, y prueba la
conexión de verdad. Cuando diga **CONECTADO**, está lista para Render.

> **Si dice que no puede conectar al puerto 5432:** puede ser tu red, no la cadena.
> Muchas redes universitarias, de trabajo y algunos ISP bloquean ese puerto.
> No es un impedimento para desplegar: quien se conecta a la base en producción
> es el servidor de Render, no tu computadora. Seguí al paso 3 igual.

> Ese archivo está en `.gitignore` y es aparte de `backend/.env` a propósito:
> si pusieras la cadena de Neon en `.env`, tu app local pasaría a escribir sobre
> la base real de la clienta sin que lo notes.

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

La base arranca vacía, así que hay que crear la cuenta con la que va a entrar.

> **La consola (Shell) de Render es solo para planes pagos**, así que no se puede
> correr `npm run seed` desde allá. En su lugar se genera la sentencia SQL en tu
> computadora y se ejecuta desde el editor de Neon, que funciona por el navegador
> y no depende del puerto 5432.

**1. Generá la sentencia** (en PowerShell, dentro de `backend`):

```powershell
$env:ADMIN_EMAIL="elemail@dela.clienta"
$env:ADMIN_PASSWORD="una-contrasena-larga"
npm run sql:admin
```

Imprime un `INSERT` listo para copiar. Contiene el *hash* de la contraseña, no la
contraseña: es seguro pegarlo donde sea.

**2. Ejecutalo en Neon:** panel del proyecto → **SQL Editor** → pegar → **Run**.

**3. Probá el ingreso** en la URL de la app con ese email y esa contraseña.

Para cambiar la contraseña más adelante, generás la sentencia otra vez y en lugar
de insertarla usás:

```sql
UPDATE usuarios SET password_hash = 'el-hash-nuevo' WHERE email = 'el-email';
```

> **No corras `seed:demo`.** Carga productos y pedidos inventados que después
> habría que borrar uno por uno. La base vacía es justo lo que querés para que
> ella cargue lo suyo.

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
