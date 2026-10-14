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
     soldOut     -> (opcional) poné true si no hay stock
     weightGrams -> (opcional) peso en gramos de la prenda. Es solo informativo: aparece en el mensaje de
                    WhatsApp del pedido para que puedas calcular el envío más rápido. Los valores de
                    abajo son DE EJEMPLO.
   ============================================================ */
window.PRODUCTS = [
  {
    id: "remera-algodon",
    weightGrams: 200,
    name: "Remera de algodón premium",
    price: 18900,
    category: "Remeras",
    sizes: ["S", "M", "L", "XL"],
    description: "Remera de algodón peinado de caída suave. Corte relajado, cuello redondo reforzado. Ideal para usar sola o en capas.",
    images: ["remera-1.svg", "remera-2.svg"]
  },
  {
    id: "camisa-lino",
    weightGrams: 280,
    name: "Camisa de lino",
    price: 32500,
    category: "Camisas",
    sizes: ["S", "M", "L"],
    description: "Camisa liviana de lino con botones de nácar. Fresca, elegante y con ese arrugado natural que la hace única.",
    images: ["camisa-1.svg", "camisa-2.svg"]
  },
  {
    id: "jean-recto",
    weightGrams: 700,
    name: "Jean recto tiro alto",
    price: 41900,
    category: "Pantalones",
    sizes: ["36", "38", "40", "42", "44"],
    description: "Jean de denim rígido, calce recto y tiro alto. Cómodo y duradero, combina con todo.",
    images: ["jean-1.svg", "jean-2.svg"]
  },
  {
    id: "vestido-midi",
    weightGrams: 400,
    name: "Vestido midi",
    price: 46800,
    category: "Vestidos",
    sizes: ["S", "M", "L"],
    description: "Vestido midi de tela fluida con cintura marcada y falda con vuelo. Para el día y para la noche.",
    images: ["vestido-1.svg", "vestido-2.svg"]
  },
  {
    id: "buzo-frisa",
    weightGrams: 650,
    name: "Buzo de friza con capucha",
    price: 38500,
    category: "Abrigos",
    sizes: ["S", "M", "L", "XL"],
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
