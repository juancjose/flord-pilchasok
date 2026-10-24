# Flor de Pilchas - Guía de la tienda

La tienda es un **catálogo**: el cliente mira las prendas, elige el color y toca **"Consultá stock con Nancy"**, que abre WhatsApp con un mensaje ya escrito. No hay carrito ni pago dentro de la web: el stock, el envío y el cobro se arreglan por WhatsApp.

Dirección: https://flordepilchas.vercel.app

---

## 1. Qué hay en el repositorio

Todos los archivos están **juntos, en la raíz**, sin carpetas. Si agregás fotos nuevas, subilas al mismo lugar.

| Archivo | Para qué sirve |
|---|---|
| `products.js` | **Lista de productos**: nombre, precio, talles, colores y fotos. Es el archivo que más vas a tocar. |
| `config.js` | **Datos de la tienda**: nombre, textos de la portada, WhatsApp, Instagram, alias y tema (oscuro o claro). |
| Fotos (`*.webp`, `*.jpg`) | Las fotos de la ropa. |
| `logo*.png`, `favicon*`, `apple-touch-icon.png`, `og-image.png` | Logo, íconos y la imagen que aparece al compartir el link. |
| `index.html`, `styles.css`, `app.js` | La página en sí. No hace falta tocarlos. |
| `shipping.js` | Quedó de una versión anterior con carrito. La tienda actual no lo usa. |

Cada vez que guardás un cambio en GitHub (*Commit changes*), Vercel publica la tienda sola en uno o dos minutos.

---

## 2. Cómo ve la tienda el cliente

1. Ve las prendas en la portada. Si hay más de una categoría (ej. Remeras, Vestidos), arriba aparecen los filtros.
2. Toca una prenda y se abre en grande, con precio, descripción, talle y colores.
3. Si la prenda tiene varios colores, puede tocar un color, tocar la foto o usar las flechitas de los costados para pasar al siguiente color.
4. Toca **"Consultá stock con Nancy"** y se abre WhatsApp con un mensaje así:

> Hola Nancy! Quería consultar stock de: REMERA DE ENCAJE - Color: Negro - Talle Único - $ 19.999
> (y el link directo a esa prenda en ese color)

El link del mensaje abre la tienda directamente en esa prenda y ese color, así sabés exactamente de qué te habla.

También hay un botón flotante de WhatsApp para consultas generales, y en el pie de página los íconos de WhatsApp e Instagram.

---

## 3. Agregar un producto

### A) Preparar las fotos
- Buena luz y fondo liso. Mejor **verticales** (como 800 × 1000 px).
- Formato `.webp` o `.jpg`, de menos de 500 KB cada una (se pueden comprimir gratis en squoosh.app).
- Nombres **simples, en minúsculas, sin espacios ni tildes**. Ej: `remera-encaje-negro.webp`.
- Si la prenda viene en varios colores, una foto (o más) **por color**.

### B) Subir las fotos
En GitHub: *Add file* → *Upload files* → arrastrá las fotos → *Commit changes*. Van a la raíz, al lado de `products.js`. No uses un nombre que ya exista, porque lo pisarías.

### C) Cargar el producto en `products.js`
1. Abrí `products.js` y tocá el lápiz (*Edit*).
2. Copiá un bloque completo de un producto parecido, desde `{` hasta `}`, y pegalo después del último (entre bloque y bloque va una **coma**).
3. Cambiá los datos.

Producto con un solo color o sin colores:

```js
  {
    id: "vestido-india-largo",
    name: "Vestido de la India Largo",
    price: 45000,
    category: "Vestidos",
    sizes: ["L/XL"],
    description: "Vestido largo con estampa ikat.",
    images: ["vestido-india-largo.webp"]
  },
```

Producto con varios colores (cada color con sus fotos):

```js
  {
    id: "remera-encaje",
    name: "Remera de Encaje",
    price: 19999,
    category: "Remeras",
    sizes: ["Único"],
    description: "Remera manga larga de encaje.",
    images: ["remera-encaje-marron.webp"],
    colors: [
      { name: "Marrón", hex: "#8a4a38", images: ["remera-encaje-marron.webp"] },
      { name: "Negro",  hex: "#111111", images: ["remera-encaje-negro.webp"] }
    ]
  },
```

Qué es cada cosa:
- `id`: nombre corto **único**, sin espacios.
- `name`: el nombre que ve el cliente.
- `price`: precio en pesos, **solo números** (sin `$` ni puntos). Ej: `45000`.
- `category`: categoría. Los filtros se arman solos.
- `sizes`: talles. Talle único: `["Único"]`. Otros: `["L/XL"]` o `["S", "M", "L"]`. Se muestran en la ficha y en el mensaje de WhatsApp.
- `description`: descripción corta.
- `images`: la foto principal (la que se ve en la portada).
- `colors` (opcional): cada color con su nombre, el tono del circulito (`hex`) y sus fotos. Si un color no tiene foto, se muestra otra como ilustrativa con un aviso.
- `soldOut: true` (opcional): muestra el cartel **Agotado**.
- `weightGrams` (opcional): peso aproximado en gramos. Hoy no se muestra en la tienda; sirve solo como dato para vos.

4. Abajo, *Commit changes*.

### D) Sacar un producto o marcarlo agotado
Borrá el bloque `{ ... }` completo (con su coma), o dejalo y agregá `soldOut: true,`.

### E) Cambiar un precio
Buscá el producto en `products.js`, cambiá el número de `price` y guardá.

### Si algo deja de funcionar
Casi siempre es una **coma** o una **comilla** de más o de menos en `products.js` o `config.js`. Cada línea dentro de un bloque termina con coma (menos la última), y los textos van entre comillas `" "`. Si no lo encontrás, en GitHub podés volver a la versión anterior del archivo desde *History*.

---

## 4. Datos de la tienda (`config.js`)

Cambiá solo lo que está **entre comillas**:
- `storeName`, `heroTitle`, `heroText`, `about`: nombre y textos de la portada.
- `whatsappNumber`: número con código de país, **sin +, sin espacios, sin 15**. Ej: `5491123456789`. A este número llegan las consultas.
- `instagram` e `instagramUrl`: `@flordpilchas`.
- `shippingNote`: el texto sobre envíos del pie de página.
- `bankTransfer.alias`: el alias de Mercado Pago que se muestra en el pie (`flor.pilchas.mp`).
- `defaultTheme`: con qué modo arranca la tienda: `"dark"` (oscuro, el que viene), `"light"` (claro) o `"auto"`. El cliente lo puede cambiar con el botón sol/luna del encabezado.

El resto de `config.js` (zonas de envío, Mercado Pago, número de pedido) quedó de la versión con carrito y la tienda actual no lo usa.

---

## 5. Cómo se arregla una venta por WhatsApp

1. Te llega el mensaje con la prenda, el color, el talle, el precio y el link.
2. Confirmás si hay stock.
3. Si es con envío, pesás y medís el paquete y cotizás el costo en el correo (Correo Argentino / Andreani) hacia su código postal. **Total = prendas + envío.**
4. Le mandás el total y cómo pagar. Mensaje para copiar y pegar, cambiando lo que está entre `[ ]`:

> ¡Hola [Nombre]! Gracias por tu consulta 🌸 Sí, tengo [prenda, color y talle].
> • Prenda: [$ precio]
> • Envío a [localidad, provincia] (según peso y medidas): [$ envío]
> *Total: [$ total]*
>
> Podés pagar por transferencia al alias *flor.pilchas.mp* (Mercado Pago) o con tarjeta en este link: [pegar el link]
>
> Cuando pagues, mandame el comprobante por acá y te preparo el envío. ¡Gracias!

5. Verificás el pago en tu cuenta de Mercado Pago o con el comprobante. El stock no se descuenta solo: cuando algo se agota, ponés `soldOut: true`.

### Crear un link de Mercado Pago por el monto exacto (desde la app)
1. Abrí la app de Mercado Pago.
2. Tocá **Cobrar** → **Link de pago** (según la versión puede llamarse "Cobrar con link").
3. Escribí el **total** (prendas + envío) y una descripción corta.
4. Generá el link y pegalo en el WhatsApp del cliente.

---

## 6. Logo, colores y vista previa del link

- `logo.png` es el logo en alta calidad (aro dorado y flores). `logo-512.png` y `logo-192.png` son versiones livianas para que la web cargue rápido.
- `og-image.png` es la imagen que aparece al compartir el link por WhatsApp o redes. Ya está cargada con la dirección completa en `index.html`. Si algún día cambia la dirección de la tienda (por ejemplo, con un dominio propio), hay que actualizarla ahí.
- Los colores (negro y dorado, y la versión clara en marfil y dorado) están al principio de `styles.css`.

---

## 7. Dominio propio

Hoy la tienda está en `flordepilchas.vercel.app` (la dirección anterior, `flord-pilchasok.vercel.app`, sigue funcionando). Para que quede como `flordpilchas.com.ar` hay que registrar el dominio (en NIC Argentina, nic.ar) y conectarlo desde Vercel, en el proyecto → *Settings* → *Domains*.

---

## 8. Para tener en cuenta
- Informá precios finales y los datos del vendedor (Ley de Defensa del Consumidor). Consultá con tu contador por la facturación.
