/* ============================================================
   CONFIGURACIÓN DE LA TIENDA
   Editá solo lo que está entre comillas. Guardá el archivo y
   recargá la página para ver los cambios.
   ============================================================ */
window.CONFIG = {
  // --- Datos de la tienda ---
  storeName: "Flor de Pilchas",              // <- Nombre de la marca
  tagline: "Ropa seleccionada, hecha para acompañarte todos los días.",
  heroTitle: "Estilo simple, detalles que importan",
  heroText: "Colección de temporada. Consultá stock y envíos por WhatsApp.",
  about: "Somos un emprendimiento familiar de Argentina. Elegimos cada prenda con cariño y la enviamos con atención personalizada.",

  // --- Tema (claro / oscuro) ---
  // Con qué tema arranca la tienda la primera vez: "dark" (oscuro, el de siempre), "light" (claro) o "auto" (el del celular/compu del cliente).
  // El cliente puede cambiarlo con el botón sol/luna del encabezado y se acuerda de su elección.
  defaultTheme: "dark",

  // --- Contacto ---
  // WhatsApp: código de país + código de área + número, SIN +, SIN espacios, SIN 15.
  // Ejemplo para Buenos Aires: 5491123456789
  whatsappNumber: "5491168998039",
  whatsappDisplay: "11 6899-8039",             // cómo se muestra el número en el pie de página
  instagram: "@flordpilchas",                 // usuario de Instagram
  instagramUrl: "https://www.instagram.com/flordpilchas/",
  email: "contacto@ejemplo.com",
  city: "Buenos Aires, Argentina",
  hours: "Lunes a viernes de 10 a 18 hs",

  // --- Envíos ---
  shippingNote: "Envíos a todo el país por Correo Argentino / Andreani. El costo se cotiza según el peso y las medidas de tu pedido y te lo confirmamos por WhatsApp. También podés retirar sin cargo.",

  // Prefijo del número de pedido (ej: FP-261011-AB3K)
  orderPrefix: "FP",

  // Si es "true", el email es obligatorio (se usa para enviar el comprobante). Poné false para que sea opcional.
  requireEmail: true,

  shipping: {
    // MODO DE ENVÍO:
    //   "quote" (el que viene por defecto) = el envío se COTIZA A MANO. El cliente carga sus datos y su dirección,
    //            la tienda le muestra "Envío: a cotizar" y el pedido te llega por WhatsApp. Vos pesás y medís el paquete,
    //            le confirmás el costo y el total, y recién ahí paga. (Retiro = $0 y puede pagar al instante.)
    //   "zones"  = el costo se calcula SOLO con la tabla de zonas de abajo, y el cliente puede pagar en el momento.
    mode: "quote",

    // Solo para modo "quote": poné true para mostrarle al cliente un precio ORIENTATIVO (el de la zona),
    // aclarando que el valor final se confirma por WhatsApp. No se suma al total.
    showEstimate: false,

    // ⚠️ LOS PRECIOS DE LAS ZONAS SON DE EJEMPLO. Se usan en modo "zones" (o como orientativo si showEstimate es true).
    // Cambialos por lo que realmente cobra el correo.

    // Envío gratis a partir de este monto (en pesos, sin puntos). 0 = no hay envío gratis.
    // Funciona en los dos modos: si el cliente llega a ese monto, el envío queda en $0 y puede pagar al instante.
    freeShippingFrom: 0,                       // Ej: 80000 => envío gratis en compras de $80.000 o más

    // Retiro sin costo (el cliente retira y no paga envío)
    pickup: {
      enabled: true,                            // false = no mostrar la opción de retiro
      title: "Retiro por el punto de entrega",
      address: "Buenos Aires. La dirección exacta y el horario te los pasamos por WhatsApp al confirmar el pedido.",   // <- EJEMPLO: poné tu dirección
      hours: ""                                 // Ej: "Lunes a viernes de 10 a 18 hs"
    },

    // Zonas de envío. Cada zona tiene un precio, un plazo y las provincias que incluye.
    // Las provincias que no estén en ninguna zona usan "defaultZone" (resto del país).
    defaultZone: "zona3",
    zones: {
      zona1: {
        name: "Zona 1 · CABA y GBA",
        price: 4500,                            // <- PRECIO DE EJEMPLO
        eta: "2-4 días hábiles",                // <- plazo de ejemplo (dejalo vacío "" para no mostrarlo)
        provinces: ["CABA"],
        // Códigos postales de Buenos Aires que cuentan como GBA (aprox. 1600 a 1899). Editalos si hace falta.
        postalRanges: [{ province: "Buenos Aires", from: 1600, to: 1899 }]
      },
      zona2: {
        name: "Zona 2 · Buenos Aires (interior), Córdoba, Santa Fe, Entre Ríos y La Pampa",
        price: 6500,                            // <- PRECIO DE EJEMPLO
        eta: "3-5 días hábiles",
        provinces: ["Buenos Aires", "Córdoba", "Santa Fe", "Entre Ríos", "La Pampa"]
      },
      zona3: {
        name: "Zona 3 · Resto del país",
        price: 8500,                            // <- PRECIO DE EJEMPLO
        eta: "5-8 días hábiles",
        provinces: []                           // vacío: incluye todas las provincias que no están en las otras zonas
      }
    },

    // Precios especiales por código postal (opcional). Pisan el precio de la zona.
    // Para activar uno, sacale las barras "//" a las líneas. Ejemplo: La Plata a $5.500.
    postalOverrides: [
      // { postalCodes: ["1900", "1901"], name: "La Plata", price: 5500, eta: "2-3 días hábiles" },
    ]
  },

  // --- Mercado Pago ---
  mercadoPago: {
    // OPCIÓN A (la más fácil): link de pago de Mercado Pago.
    // Se crea desde la app de Mercado Pago > "Cobrar" > "Link de pago".
    // Dejalo vacío ("") si no tenés uno todavía.
    paymentLink: "",

    // Pago automático (función de servidor): NO está incluido en esta versión plana (sin carpetas).
    // Necesita la versión completa de /tienda-ropa. Dejalo vacío ("") para que esa opción no se muestre.
    endpoint: ""
  },

  // --- Transferencia bancaria ---
  bankTransfer: {
    enabled: true,
    holder: "",
    bank: "Mercado Pago",
    cbu: "",
    alias: "flor.pilchas.mp",
    cuit: ""                                  // opcional
  },

  // --- Moneda ---
  currency: "ARS",
  locale: "es-AR"
};
