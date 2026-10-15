/* ============================================================
   PRODUCTOS
   Para agregar un producto: copiá un bloque { ... }, pegalo
   debajo del último (con una coma entre bloques) y cambiá los datos.
   Las fotos se suben al mismo lugar que este archivo (la raíz del repositorio, sin carpetas) y acá se escribe solo el
   nombre del archivo (ej: "remera-1.jpg").

   Campos:
     id          -> un nombre corto único, sin espacios (ej: "remera-lino")
     name        -> nombre que ve el cliente
     price       -> precio en pesos, solo números (ej: 24900)
     category    -> categoría (ej: "Remeras"). Se crea el filtro sola.
     sizes       -> talles disponibles. Si es talle único: ["Único"]
     description -> descripción corta
     images      -> lista de fotos (la primera es la principal)
     colors      -> (opcional) colores: [{ name: "Negro", hex: "#111111", images: ["foto-negro.webp"] }].
                    Si un color no tiene fotos, se muestra la primera foto disponible como ilustrativa.
     soldOut     -> (opcional) poné true si no hay stock
     weightGrams -> (opcional) peso en gramos de la prenda. Es solo informativo: aparece en el mensaje de
                    WhatsApp del pedido para que puedas calcular el envío más rápido. Los valores de
                    abajo son DE EJEMPLO.
   ============================================================ */
window.PRODUCTS = [
  {
    id: "remera-encaje",
    weightGrams: 200,
    name: "Remera de Encaje",
    price: 19999,
    category: "Remeras",
    sizes: ["Único"],
    description: "Remera manga larga de encaje texturado, entallada y suave. Ideal para usar sola o en capas.",
    images: ["remera-encaje-marron.webp"],
    colors: [
      { name: "Marrón", hex: "#8a4a38", images: ["remera-encaje-marron.webp"] },
      { name: "Negro", hex: "#111111", images: ["remera-encaje-negro.webp"] },
      { name: "Beige", hex: "#e0a890", images: ["remera-encaje-beige.webp"] },
      { name: "Blanco", hex: "#f2eee6", images: ["remera-encaje-blanco.webp"] }
    ]
  },
  {
    id: "remera-boxing",
    weightGrams: 220,
    name: "Remera Boxing de Algodón",
    price: 17999,
    category: "Remeras",
    sizes: ["Único"],
    description: "Remera oversized de algodón, corte boxy con hombros caídos. Cómoda, versátil y con caída relajada.",
    images: ["remera-boxing-marron-front.webp"],
    colors: [
      { name: "Marrón", hex: "#6b3f2e", images: ["remera-boxing-marron-front.webp", "remera-boxing-marron-back.webp"] },
      { name: "Blanco", hex: "#f4f1ea", images: ["remera-boxing-blanco-front.webp", "remera-boxing-blanco-back.webp"] },
      { name: "Negro", hex: "#111111", images: ["remera-boxing-negro-front.webp", "remera-boxing-negro-tq.webp"] }
    ]
  },
  {
    id: "remera-boxing-lunares",
    weightGrams: 220,
    name: "Remera Boxing con Lunares",
    price: 17999,
    category: "Remeras",
    sizes: ["Único"],
    description: "Remera oversized de algodón con lunares, corte boxy. Divertida, cómoda y con caída relajada.",
    images: ["remera-boxing-lunares-blanca-front.webp"],
    colors: [
      { name: "Blanca", hex: "#f5f2ec", images: ["remera-boxing-lunares-blanca-front.webp", "remera-boxing-lunares-blanca-back.webp"] },
      { name: "Negra", hex: "#111111", images: ["remera-boxing-lunares-negra-front.webp", "remera-boxing-lunares-negra-back.webp"] },
      { name: "Marrón", hex: "#5c3a2a", images: ["remera-boxing-lunares-marron-front.webp"] },
      { name: "Beige", hex: "#e8d5b5", images: ["remera-boxing-lunares-beige-front.webp"] }
    ]
  },
  {
    id: "remera-algodon",
    weightGrams: 200,
    name: "Remera de algodón premium",
    price: 18900,
    category: "Remeras",
    sizes: ["Único"],
    description: "Remera de algodón peinado de caída suave. Corte relajado, cuello redondo reforzado. Ideal para usar sola o en capas.",
    images: ["remera-1.svg", "remera-2.svg"]
  },
  {
    id: "camisa-lino",
    weightGrams: 280,
    name: "Camisa de lino",
    price: 32500,
    category: "Camisas",
    sizes: ["Único"],
    description: "Camisa liviana de lino con botones de nácar. Fresca, elegante y con ese arrugado natural que la hace única.",
    images: ["camisa-1.svg", "camisa-2.svg"]
  },
  {
    id: "jean-recto",
    weightGrams: 700,
    name: "Jean recto tiro alto",
    price: 41900,
    category: "Pantalones",
    sizes: ["Único"],
    description: "Jean de denim rígido, calce recto y tiro alto. Cómodo y duradero, combina con todo.",
    images: ["jean-1.svg", "jean-2.svg"]
  },
  {
    id: "vestido-midi",
    weightGrams: 400,
    name: "Vestido midi",
    price: 46800,
    category: "Vestidos",
    sizes: ["Único"],
    description: "Vestido midi de tela fluida con cintura marcada y falda con vuelo. Para el día y para la noche.",
    images: ["vestido-1.svg", "vestido-2.svg"]
  },
  {
    id: "buzo-frisa",
    weightGrams: 650,
    name: "Buzo de friza con capucha",
    price: 38500,
    category: "Abrigos",
    sizes: ["Único"],
    description: "Buzo de friza suave por dentro, capucha amplia y bolsillo canguro. Abrigado sin perder estilo.",
    images: ["buzo-1.svg", "buzo-2.svg"]
  },
  {
    id: "pollera-plisada",
    weightGrams: 350,
    name: "Pollera plisada",
    price: 29900,
    category: "Polleras",
    sizes: ["Único"],
    description: "Pollera plisada de largo midi con elástico en la cintura. Talle único, se adapta del S al L.",
    images: ["pollera-1.svg", "pollera-2.svg"]
  }
];
