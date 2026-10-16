# Flor de Pilchas — Tienda online

Tienda web de ropa para el emprendimiento **Flor de Pilchas**: catálogo, carrito y pedidos por WhatsApp, transferencia o link de Mercado Pago. Es un sitio estático, sin base de datos ni backend.

🔗 **Demo:** https://flord-pilchasok.vercel.app · Instagram: [@flordpilchas](https://www.instagram.com/flordpilchas/)

## Funcionalidades
- Modo oscuro (negro y dorado) y claro (marfil y dorado), con botón sol/luna y elección guardada.
- Catálogo con filtro por categoría y detalle de producto con talles.
- Carrito que se guarda en el navegador.
- Checkout en 3 pasos (datos, entrega y resumen) con número de pedido (ej. `FP-261011-AB3K`).
- Envío **a cotizar** o **por zona/código postal**, envío gratis desde un monto, y opción de retiro.
- Pago por transferencia al alias, link de Mercado Pago (opcional) o WhatsApp. El pedido llega armado por WhatsApp.
- Toda la configuración (datos de la tienda, contacto, envíos, pagos, tema) en `config.js`, y los productos en `products.js`.

## Tecnologías
HTML5 · CSS3 · JavaScript vanilla · Deploy en Vercel

## Estructura
```
index.html, styles.css, app.js   La tienda
shipping.js                      Cálculo de envíos
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

## Autor
**Juan José Cáceres** — [@juancjose](https://github.com/juancjose)

## Licencia
Código bajo licencia MIT. Ver [`LICENSE`](LICENSE).
