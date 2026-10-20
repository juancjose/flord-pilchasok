# Flor de Pilchas — Tienda online

Catálogo web de ropa para el emprendimiento **Flor de Pilchas**: cada prenda tiene su botón **"Consultá stock con Nancy"**, que abre WhatsApp con la prenda, el color y el talle ya escritos. Es un sitio estático, sin base de datos ni backend.

🔗 **Demo:** https://flord-pilchasok.vercel.app · Instagram: [@flordpilchas](https://www.instagram.com/flordpilchas/)

## Funcionalidades
- Modo oscuro (negro y dorado) y claro (marfil y dorado), con botón sol/luna y elección guardada.
- Catálogo con filtro por categoría y ficha de producto con talle, descripción y precio.
- Una foto por color: el cliente elige el color, toca la foto o usa las flechas para pasar al siguiente.
- Botón de consulta por WhatsApp con mensaje armado (prenda, color, talle, precio y link directo a esa prenda y color).
- Links compartibles a un producto y color (`#p=<id>&c=<color>`).
- Datos de la tienda en `config.js` y productos en `products.js`, editables desde la web de GitHub.

## Tecnologías
HTML5 · CSS3 · JavaScript vanilla · Deploy en Vercel

## Estructura
```
index.html, styles.css, app.js   La tienda
config.js                        Configuración de la tienda
products.js                      Productos
*.webp / *.png / *.svg           Fotos, logo, íconos e imagen para compartir
```

## Cómo correrlo localmente
```bash
git clone https://github.com/juancjose/flord-pilchasok.git
cd flord-pilchasok
python -m http.server 8000
```
Abrí http://localhost:8000.

Guía de uso paso a paso (cargar productos, fotos y precios): [`GUIA.md`](GUIA.md).

## Autor
**Juan José Cáceres** — [@juancjose](https://github.com/juancjose)

## Licencia
Código bajo licencia MIT. Ver [`LICENSE`](LICENSE).

## Créditos

- Foto de portada (`hero-percha-1600.webp`, `hero-percha-800.webp`): Ron Lach en Pexels — https://www.pexels.com/photo/cloths-hanging-in-wardrobe-10330179/ (licencia Pexels: uso libre, atribución no obligatoria).
