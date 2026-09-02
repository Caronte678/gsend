/**
 * GSend — Seed de datos de prueba
 * Papelería personalizada bykary.design
 *
 * Incluye:
 *  - Materiales con stock real (algunos bajo mínimo para ver alertas)
 *  - Productos con receta de materiales y atributos variables
 *  - Pedidos en distintos estados con pagos parciales/completos
 *
 * Uso:
 *   node prisma/seed-demo.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Cargando datos de prueba para bykary.design...\n');

  // ── 1. MATERIALES ─────────────────────────────────────────────────────────
  console.log('📦 Creando materiales...');

  const materiales = await Promise.all([
    prisma.material.upsert({
      where: { nombre: 'Papel fotográfico A4' },
      update: {},
      create: {
        nombre: 'Papel fotográfico A4',
        unidad_medida: 'hojas',
        stock_actual: 320,
        stock_minimo: 100,
        costo_unitario_actual: 12.5,
      },
    }),
    prisma.material.upsert({
      where: { nombre: 'Lámina PVC transparente' },
      update: {},
      create: {
        nombre: 'Lámina PVC transparente',
        unidad_medida: 'hojas',
        stock_actual: 18,   // ⚠ bajo mínimo
        stock_minimo: 50,
        costo_unitario_actual: 85,
      },
    }),
    prisma.material.upsert({
      where: { nombre: 'Cartón microcanal blanco' },
      update: {},
      create: {
        nombre: 'Cartón microcanal blanco',
        unidad_medida: 'hojas',
        stock_actual: 75,
        stock_minimo: 30,
        costo_unitario_actual: 40,
      },
    }),
    prisma.material.upsert({
      where: { nombre: 'Vinilo adhesivo blanco' },
      update: {},
      create: {
        nombre: 'Vinilo adhesivo blanco',
        unidad_medida: 'metros',
        stock_actual: 4.5,  // ⚠ bajo mínimo
        stock_minimo: 10,
        costo_unitario_actual: 320,
      },
    }),
    prisma.material.upsert({
      where: { nombre: 'Tinta para sublimación (set)' },
      update: {},
      create: {
        nombre: 'Tinta para sublimación (set)',
        unidad_medida: 'ml',
        stock_actual: 850,
        stock_minimo: 200,
        costo_unitario_actual: 1.8,
      },
    }),
    prisma.material.upsert({
      where: { nombre: 'Espiral metálica 20mm' },
      update: {},
      create: {
        nombre: 'Espiral metálica 20mm',
        unidad_medida: 'unidades',
        stock_actual: 60,
        stock_minimo: 20,
        costo_unitario_actual: 35,
      },
    }),
    prisma.material.upsert({
      where: { nombre: 'Hoja couché 150g A4' },
      update: {},
      create: {
        nombre: 'Hoja couché 150g A4',
        unidad_medida: 'hojas',
        stock_actual: 200,
        stock_minimo: 80,
        costo_unitario_actual: 8,
      },
    }),
    prisma.material.upsert({
      where: { nombre: 'Cinta washi decorativa' },
      update: {},
      create: {
        nombre: 'Cinta washi decorativa',
        unidad_medida: 'metros',
        stock_actual: 6,    // ⚠ bajo mínimo
        stock_minimo: 15,
        costo_unitario_actual: 45,
      },
    }),
    prisma.material.upsert({
      where: { nombre: 'Marco de madera 20x25cm' },
      update: {},
      create: {
        nombre: 'Marco de madera 20x25cm',
        unidad_medida: 'unidades',
        stock_actual: 12,
        stock_minimo: 5,
        costo_unitario_actual: 480,
      },
    }),
    prisma.material.upsert({
      where: { nombre: 'Bolsa celofán con lazo' },
      update: {},
      create: {
        nombre: 'Bolsa celofán con lazo',
        unidad_medida: 'unidades',
        stock_actual: 140,
        stock_minimo: 50,
        costo_unitario_actual: 15,
      },
    }),
  ]);

  const [
    papelFoto, pvc, carton, vinilo, tinta,
    espiral, couche, washi, marco, bolsa,
  ] = materiales;

  // ── 2. PRODUCTOS ──────────────────────────────────────────────────────────
  console.log('🏷️  Creando productos...');

  // Cuadro con foto
  const cuadro = await prisma.producto.upsert({
    where: { id_producto: 1 },
    update: {},
    create: {
      nombre: 'Cuadro con foto personalizada',
      tipo: 'cuadro',
      descripcion: 'Cuadro de madera con foto impresa en papel fotográfico. Incluye packaging.',
      precio_base: 2800,
    },
  });

  await prisma.productoMaterial.upsert({
    where: { id_producto_id_material: { id_producto: cuadro.id_producto, id_material: papelFoto.id_material } },
    update: {},
    create: { id_producto: cuadro.id_producto, id_material: papelFoto.id_material, cantidad_por_unidad: 1 },
  });
  await prisma.productoMaterial.upsert({
    where: { id_producto_id_material: { id_producto: cuadro.id_producto, id_material: marco.id_material } },
    update: {},
    create: { id_producto: cuadro.id_producto, id_material: marco.id_material, cantidad_por_unidad: 1 },
  });
  await prisma.productoMaterial.upsert({
    where: { id_producto_id_material: { id_producto: cuadro.id_producto, id_material: bolsa.id_material } },
    update: {},
    create: { id_producto: cuadro.id_producto, id_material: bolsa.id_material, cantidad_por_unidad: 1 },
  });

  // Atributo: dedicatoria
  await prisma.atributoVariable.upsert({
    where: { id_producto_nombre: { id_producto: cuadro.id_producto, nombre: 'dedicatoria' } },
    update: {},
    create: { id_producto: cuadro.id_producto, nombre: 'dedicatoria', tipo_dato: 'texto' },
  });

  // Sticker personalizado
  const sticker = await prisma.producto.upsert({
    where: { id_producto: 2 },
    update: {},
    create: {
      nombre: 'Sticker personalizado',
      tipo: 'sticker',
      descripcion: 'Sticker en vinilo adhesivo cortado con diseño a medida.',
      precio_base: 350,
    },
  });

  await prisma.productoMaterial.upsert({
    where: { id_producto_id_material: { id_producto: sticker.id_producto, id_material: vinilo.id_material } },
    update: {},
    create: { id_producto: sticker.id_producto, id_material: vinilo.id_material, cantidad_por_unidad: 0.05 },
  });

  await prisma.atributoVariable.upsert({
    where: { id_producto_nombre: { id_producto: sticker.id_producto, nombre: 'ancho_cm' } },
    update: {},
    create: { id_producto: sticker.id_producto, nombre: 'ancho_cm', tipo_dato: 'numero' },
  });
  await prisma.atributoVariable.upsert({
    where: { id_producto_nombre: { id_producto: sticker.id_producto, nombre: 'alto_cm' } },
    update: {},
    create: { id_producto: sticker.id_producto, nombre: 'alto_cm', tipo_dato: 'numero' },
  });

  // Libreta personalizada
  const libreta = await prisma.producto.upsert({
    where: { id_producto: 3 },
    update: {},
    create: {
      nombre: 'Libreta personalizada',
      tipo: 'libreta',
      descripcion: 'Libreta A5 con tapa de cartón decorada y espiral metálica.',
      precio_base: 1800,
    },
  });

  await prisma.productoMaterial.upsert({
    where: { id_producto_id_material: { id_producto: libreta.id_producto, id_material: carton.id_material } },
    update: {},
    create: { id_producto: libreta.id_producto, id_material: carton.id_material, cantidad_por_unidad: 1 },
  });
  await prisma.productoMaterial.upsert({
    where: { id_producto_id_material: { id_producto: libreta.id_producto, id_material: couche.id_material } },
    update: {},
    create: { id_producto: libreta.id_producto, id_material: couche.id_material, cantidad_por_unidad: 30 },
  });
  await prisma.productoMaterial.upsert({
    where: { id_producto_id_material: { id_producto: libreta.id_producto, id_material: espiral.id_material } },
    update: {},
    create: { id_producto: libreta.id_producto, id_material: espiral.id_material, cantidad_por_unidad: 1 },
  });

  await prisma.atributoVariable.upsert({
    where: { id_producto_nombre: { id_producto: libreta.id_producto, nombre: 'cantidad_hojas' } },
    update: {},
    create: { id_producto: libreta.id_producto, nombre: 'cantidad_hojas', tipo_dato: 'numero' },
  });

  // Llavero foto
  const llavero = await prisma.producto.upsert({
    where: { id_producto: 4 },
    update: {},
    create: {
      nombre: 'Llavero con foto sublimada',
      tipo: 'llavero',
      descripcion: 'Llavero de PVC con imagen sublimada a doble cara.',
      precio_base: 650,
    },
  });

  await prisma.productoMaterial.upsert({
    where: { id_producto_id_material: { id_producto: llavero.id_producto, id_material: pvc.id_material } },
    update: {},
    create: { id_producto: llavero.id_producto, id_material: pvc.id_material, cantidad_por_unidad: 0.02 },
  });
  await prisma.productoMaterial.upsert({
    where: { id_producto_id_material: { id_producto: llavero.id_producto, id_material: tinta.id_material } },
    update: {},
    create: { id_producto: llavero.id_producto, id_material: tinta.id_material, cantidad_por_unidad: 2 },
  });

  // Conjunto regalo
  const combo = await prisma.producto.upsert({
    where: { id_producto: 5 },
    update: {},
    create: {
      nombre: 'Combo regalo personalizado',
      tipo: 'combo',
      descripcion: 'Set con libreta + sticker + llavero en bolsa de regalo.',
      precio_base: 3200,
    },
  });

  await prisma.productoMaterial.upsert({
    where: { id_producto_id_material: { id_producto: combo.id_producto, id_material: bolsa.id_material } },
    update: {},
    create: { id_producto: combo.id_producto, id_material: bolsa.id_material, cantidad_por_unidad: 1 },
  });
  await prisma.productoMaterial.upsert({
    where: { id_producto_id_material: { id_producto: combo.id_producto, id_material: washi.id_material } },
    update: {},
    create: { id_producto: combo.id_producto, id_material: washi.id_material, cantidad_por_unidad: 0.3 },
  });

  await prisma.atributoVariable.upsert({
    where: { id_producto_nombre: { id_producto: combo.id_producto, nombre: 'mensaje_tarjeta' } },
    update: {},
    create: { id_producto: combo.id_producto, nombre: 'mensaje_tarjeta', tipo_dato: 'texto' },
  });

  // ── 3. PEDIDOS ────────────────────────────────────────────────────────────
  console.log('📦 Creando pedidos de prueba...');

  const getAtrib = async (id_producto, nombre) => {
    const a = await prisma.atributoVariable.findUnique({
      where: { id_producto_nombre: { id_producto, nombre } },
    });
    return a?.id_atributo;
  };

  // Pedido 1 — Completado, pagado
  const p1 = await prisma.pedido.create({
    data: {
      cliente_nombre: 'Valentina Rodríguez',
      cliente_contacto: '@vale.rod',
      estado: 'completado',
      notas: 'Le gusta el estilo romántico, colores rosados.',
      fecha_creacion: new Date('2026-07-10'),
      items: {
        create: [
          {
            id_producto: cuadro.id_producto,
            cantidad: 1,
            precio_venta_unitario: 3200,
            valores: {
              create: [{
                id_atributo: await getAtrib(cuadro.id_producto, 'dedicatoria'),
                valor: 'Para mi amor eterno ♥',
              }],
            },
          },
          {
            id_producto: llavero.id_producto,
            cantidad: 2,
            precio_venta_unitario: 700,
          },
        ],
      },
      pagos: {
        create: [{ monto: 4600, metodo_pago: 'Transferencia', fecha: new Date('2026-07-10') }],
      },
    },
  });

  // Pedido 2 — Confirmado, pago parcial
  const p2 = await prisma.pedido.create({
    data: {
      cliente_nombre: 'Camila Fuentes',
      cliente_contacto: '+56 9 8821 4433',
      estado: 'confirmado',
      notas: 'Cumpleaños de su mamá el 25 de agosto. Entrega urgente.',
      fecha_creacion: new Date('2026-08-01'),
      items: {
        create: [
          {
            id_producto: combo.id_producto,
            cantidad: 1,
            precio_venta_unitario: 3800,
            valores: {
              create: [{
                id_atributo: await getAtrib(combo.id_producto, 'mensaje_tarjeta'),
                valor: 'Feliz cumple mami, te amo infinito 🌸',
              }],
            },
          },
          {
            id_producto: sticker.id_producto,
            cantidad: 5,
            precio_venta_unitario: 380,
            valores: {
              create: [
                { id_atributo: await getAtrib(sticker.id_producto, 'ancho_cm'), valor: '8' },
                { id_atributo: await getAtrib(sticker.id_producto, 'alto_cm'), valor: '8' },
              ],
            },
          },
        ],
      },
      pagos: {
        create: [{ monto: 2000, metodo_pago: 'Efectivo', fecha: new Date('2026-08-02') }],
      },
    },
  });

  // Pedido 3 — Pendiente, sin pago
  await prisma.pedido.create({
    data: {
      cliente_nombre: 'Isidora Mena',
      cliente_contacto: '@isi.mena',
      estado: 'pendiente',
      notas: 'Quiere libreta para ella + cuadro para regalar.',
      fecha_creacion: new Date('2026-08-15'),
      items: {
        create: [
          {
            id_producto: libreta.id_producto,
            cantidad: 1,
            precio_venta_unitario: 2000,
            valores: {
              create: [{ id_atributo: await getAtrib(libreta.id_producto, 'cantidad_hojas'), valor: '80' }],
            },
          },
          {
            id_producto: cuadro.id_producto,
            cantidad: 1,
            precio_venta_unitario: 3000,
            valores: {
              create: [{ id_atributo: await getAtrib(cuadro.id_producto, 'dedicatoria'), valor: 'Para Santi con amor' }],
            },
          },
        ],
      },
    },
  });

  // Pedido 4 — Pendiente, sin pago
  await prisma.pedido.create({
    data: {
      cliente_nombre: 'Francisca Vera',
      cliente_contacto: '+56 9 7734 9900',
      estado: 'pendiente',
      notas: 'Set corporativo para empresa. Necesita factura.',
      fecha_creacion: new Date('2026-08-17'),
      items: {
        create: [
          {
            id_producto: sticker.id_producto,
            cantidad: 20,
            precio_venta_unitario: 300,
            valores: {
              create: [
                { id_atributo: await getAtrib(sticker.id_producto, 'ancho_cm'), valor: '5' },
                { id_atributo: await getAtrib(sticker.id_producto, 'alto_cm'), valor: '5' },
              ],
            },
          },
        ],
      },
    },
  });

  // Pedido 5 — Completado, pagado (más antiguo)
  await prisma.pedido.create({
    data: {
      cliente_nombre: 'Antonia Lagos',
      cliente_contacto: '@antonia.l',
      estado: 'completado',
      fecha_creacion: new Date('2026-06-20'),
      items: {
        create: [
          { id_producto: llavero.id_producto, cantidad: 3, precio_venta_unitario: 650 },
          { id_producto: sticker.id_producto, cantidad: 10, precio_venta_unitario: 350 },
        ],
      },
      pagos: {
        create: [{ monto: 5450, metodo_pago: 'MercadoPago', fecha: new Date('2026-06-20') }],
      },
    },
  });

  // Pedido 6 — Cancelado
  await prisma.pedido.create({
    data: {
      cliente_nombre: 'Daniela Ríos',
      cliente_contacto: '@dani.rios',
      estado: 'cancelado',
      notas: 'Canceló por cambio de fecha del evento.',
      fecha_creacion: new Date('2026-08-05'),
      items: {
        create: [
          { id_producto: combo.id_producto, cantidad: 2, precio_venta_unitario: 3500 },
        ],
      },
    },
  });

  console.log('\n✅ Datos de prueba cargados exitosamente:\n');
  console.log('   📦 10 materiales (3 con stock bajo mínimo para ver alertas)');
  console.log('   🏷️  5 productos con recetas y atributos variables');
  console.log('   📋 6 pedidos en distintos estados:');
  console.log('       - 2 completados y pagados');
  console.log('       - 1 confirmado con pago parcial');
  console.log('       - 2 pendientes sin pago');
  console.log('       - 1 cancelado\n');
}

main()
  .catch(err => {
    console.error('❌ Error durante el seed de demo:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
