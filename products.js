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
  }
];
