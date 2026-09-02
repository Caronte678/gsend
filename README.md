# GSend

Sistema de gestión de pedidos e inventario para PyME (ver documentación de Fases 1–6 del proyecto).

## Estructura

- `backend/` — API REST (Node.js + Express + Prisma + PostgreSQL)
- `frontend/` — SPA (React + Vite)

## Cómo arrancar

### 1. Base de datos
Crea una base de datos PostgreSQL local o en la nube, y copia su URL de conexión.

### 2. Backend
```bash
cd backend
cp .env.example .env      # completa DATABASE_URL y JWT_SECRET
npm install
npm run prisma:migrate    # crea las tablas a partir de prisma/schema.prisma
npm run seed               # crea el usuario Admin (ver nota abajo)
npm run seed:demo          # (opcional) carga materiales, productos y pedidos de ejemplo
npm run dev                # levanta en http://localhost:4000
```

> El seed toma el usuario y la contraseña de variables de entorno, para que nunca
> queden escritas en el código:
>
> ```bash
> ADMIN_EMAIL=admin@tupyme.com ADMIN_PASSWORD=una-contraseña-larga npm run seed
> ```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                # levanta en http://localhost:5173 (proxy /api -> :4000)
```

## Poner el sistema en internet

Para que la clienta lo use desde una URL (computadora o celular, sin instalar
nada), seguí [DESPLIEGUE.md](DESPLIEGUE.md). En producción el backend sirve
también el frontend compilado, así que se despliega como un solo servicio.

## Estado del proyecto

API REST implementada (auth, productos + recetas, materiales + reposición, pedidos + pagos +
cambio de estado con descuento de inventario en transacción, alertas de stock y configuración de
la pyme). El frontend cubre login, dashboard, pedidos, productos, materiales, inventario y ajustes.

Notas:

- No hay endpoint de registro por diseño (RF-13: login único, sin auto-registro). El usuario
  Admin se crea con `npm run seed` o manualmente con `npx prisma studio`.
- El costo de materiales de un pedido se toma de los movimientos de salida reales cuando el
  pedido está completado; en pedidos no completados se **estima** con la receta actual.
- `backend/.env` contiene credenciales: no debe versionarse (ya está en `.gitignore`).
