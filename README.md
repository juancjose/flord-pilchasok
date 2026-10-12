# Flor de Pilchas — Tienda online

Tienda web simple y elegante, con **modo oscuro y modo claro**: catálogo, filtro por categoría, detalle de producto con talles, carrito que se guarda en el navegador y pedido por **Mercado Pago**, **transferencia** o **WhatsApp**. No necesita programar ni instalar nada.

---

## 1. Qué hay en la carpeta

| Archivo / carpeta | Para qué sirve |
|---|---|
| `config.js` | **Datos de la tienda**: nombre, WhatsApp, Instagram, Mercado Pago, CBU/alias, envíos. |
| `products.js` | **Lista de productos** (nombre, precio, talles, fotos…). |
| `images/` | **Las fotos**. Acá se copian las fotos de la ropa. También están el logo y los íconos (ver "Logo y marca"). |
| `index.html`, `styles.css`, `app.js`, `shipping.js` | La página en sí y el cálculo de envío. No hace falta tocarlos. |
| `netlify/`, `api/`, `server/` | Opcional: pago automático con Mercado Pago (ver sección 8). |
| `tests/` | Pruebas automáticas del cálculo de envío (opcional, se corren con `node tests/shipping.test.js`). |

> Los productos y fotos que vienen son **de ejemplo**. Hay que reemplazarlos por los reales.

---

### Logo y marca

- `images/logo.png`: logo completo y circular (1024 px: perchero con flores, "Flor de Pilchas" y aro dorado), con el exterior del círculo transparente para que se funda con el fondo negro. Se usa en alta calidad en la portada.
- `images/logo-512.png` y `images/logo-192.png`: el mismo logo en versiones livianas (la 512 para la portada, la 192 para el encabezado y el pie de página), así la web carga rápido.
- `images/favicon.ico`, `favicon-32.png`, `favicon-192.png`, `favicon-512.png`, `apple-touch-icon.png`: el círculo del logo como ícono de la pestaña del navegador y del celular.
- `images/og-image.png`: imagen que aparece cuando se comparte el link por WhatsApp o redes. **Cuando publiques la web**, en `index.html` cambiá `images/og-image.png` (aparece 2 veces) por la dirección completa, por ejemplo `https://tudominio.com/images/og-image.png`; si no, algunas apps no la muestran.
- Los colores (negro, dorado y un toque de rosa de la rosa del logo) están al principio de `styles.css`, en dos bloques: el oscuro (`:root`) y el claro (`[data-theme="light"]`). Para cambiar el dorado, modificá `--gold` (y `--gold-fill` para los botones) en cada bloque.
- Si cambiás el logo: reemplazá `logo.png` (cuadrado, circular, con el exterior transparente o negro), y generá de nuevo `logo-512.png`, `logo-192.png` y los íconos con la misma imagen redimensionada.

---

## 2. Cómo ver la tienda en tu computadora

- Lo más simple: hacé doble clic en `index.html` y se abre en el navegador.
- Si algo no se ve bien así, abrí una terminal en esta carpeta y ejecutá `python -m http.server 8000`, y entrá a `http://localhost:8000`.

Cada vez que cambies un archivo, guardalo y **recargá la página** (tecla F5).

### Modo oscuro / modo claro

- En el encabezado, al lado del carrito, hay un botón con un **sol / luna** para cambiar entre modo oscuro (negro y dorado) y modo claro (marfil y dorado). La elección queda guardada en el navegador de cada cliente.
- Con qué modo arranca la tienda la primera vez se cambia en `config.js`, en `defaultTheme`: `"dark"` (oscuro, el que viene), `"light"` (claro) o `"auto"` (el que tenga el celular o la compu del cliente).
- Las fotos de ejemplo tienen versión clara (`*-light.svg`). Tus fotos reales (JPG/PNG) se ven igual en los dos modos. El logo tiene fondo negro propio, por eso se ve bien en ambos.

---

## 3. Paso a paso: cambiar los datos de la tienda

1. Abrí `config.js` con el **Bloc de notas** (o con un editor como VS Code).
2. Cambiá solo lo que está **entre comillas**:
   - `storeName`: nombre de la tienda.
   - `whatsappNumber`: número con código de país, **sin +, sin espacios, sin 15**. Ej: `5491123456789`.
   - `instagram` e `instagramUrl`: ya están cargados (`@flordpilchas` y https://www.instagram.com/flordpilchas/).
   - `email`, `city`, `hours`, `shippingNote`.
   - `shipping`: cómo se cobra el envío (ver sección 5).
   - `defaultTheme`: `"dark"`, `"light"` o `"auto"` (ver "Modo oscuro / modo claro").
   - `requireEmail`: `true` = el email es obligatorio (para mandar el comprobante); `false` = opcional.
   - `bankTransfer`: titular, banco, **CBU** y **alias**.
3. Guardá y recargá la página.

---

## 4. Paso a paso: cargar tus fotos y productos

### A) Preparar las fotos
- Sacá las fotos con buena luz y fondo liso. Mejor si son **verticales** (proporción 4:5, como 800 × 1000 px).
- Formato `.jpg` o `.webp`. Que cada foto pese menos de 500 KB (si pesan mucho, comprimilas gratis en squoosh.app o tinypng.com).
- Ponele nombres **simples, sin espacios ni tildes**, en minúsculas. Ej: `remera-blanca-1.jpg`, `remera-blanca-2.jpg`.

### B) Copiar las fotos
- Copiá las fotos dentro de la carpeta **`images`**.

### C) Agregar el producto
1. Abrí `products.js`.
2. Copiá un bloque completo, desde `{` hasta `}`, así:

```js
  {
    id: "remera-blanca",
    name: "Remera blanca básica",
    price: 15900,
    category: "Remeras",
    sizes: ["S", "M", "L"],
    description: "Remera de algodón, corte clásico.",
    images: ["remera-blanca-1.jpg", "remera-blanca-2.jpg"]
  },
```

3. Pegalo **después del último producto** (acordate de que entre un bloque y otro va una **coma**).
4. Cambiá los datos:
   - `id`: nombre corto **único**, sin espacios (no se puede repetir).
   - `name`: nombre que ve el cliente.
   - `price`: precio en pesos, **solo números** (sin `$` ni puntos). Ej: `15900`.
   - `category`: categoría. El filtro de arriba se arma solo con las categorías que uses.
   - `sizes`: talles disponibles. Para talle único: `["Único"]`.
   - `description`: descripción corta.
   - `images`: nombres de las fotos que copiaste. **La primera es la principal.**
   - Si no hay stock, agregá una línea `soldOut: true,`.
   - `weightGrams` (opcional): peso en gramos, solo informativo para el mensaje de WhatsApp (ver sección 5).
5. Guardá y recargá.

### D) Sacar un producto
Borrá el bloque `{ ... }` completo (con su coma) o dejalo y agregá `soldOut: true`.

### Si algo deja de funcionar
Casi siempre es una **coma** o una **comilla** que falta o sobra en `products.js` o `config.js`. Revisá que cada línea termine con coma (menos la última de cada bloque) y que los textos estén entre comillas `" "`.

---

## 5. Envíos: cómo se calcula el costo

En `config.js`, dentro de `shipping`, hay **dos modos**. Se elige con `mode`:

### Modo `"quote"` — envío a cotizar (es el que viene configurado)
Pensado para cuando **vos pesás y medís cada paquete** y le pasás el costo real a cada cliente.

- El cliente carga sus datos y su dirección (provincia, localidad, código postal), elige **envío a domicilio** o **retiro**, y la tienda le muestra **"Envío: a cotizar"** junto con el subtotal.
- Al confirmar, el pedido te llega **por WhatsApp**, ya escrito con todo: prendas, talles, cantidades, peso aproximado (si cargaste `weightGrams`, ver abajo), datos del cliente, dirección y la leyenda **"Envío: A COTIZAR"**.
- **En este modo no se cobra nada antes de la cotización.** Vos le confirmás el costo y el total y recién ahí el cliente paga (te dejamos mensajes listos más abajo).
- **Retiro** = envío $0, y el cliente puede pagar enseguida (Mercado Pago, transferencia o WhatsApp).
- Si usás `freeShippingFrom` (envío gratis) y el cliente llega al monto, el envío queda en $0 y también puede pagar enseguida.
- Opcional: `showEstimate: true` le muestra al cliente un precio **orientativo** (el de la zona, de la tabla de abajo) aclarando que el valor final se confirma por WhatsApp. No se suma al total.

### Modo `"zones"` — precio automático por zona
Poné `mode: "zones"` y la tienda calcula sola el envío según la provincia que elija el cliente, lo suma al total, lo incluye en el mensaje de WhatsApp, en el monto de la transferencia y en Mercado Pago, y el cliente puede pagar en el momento.

### Precios de las zonas (para el modo `"zones"`, o como orientativo)
> ⚠️ **Los precios que vienen cargados son DE EJEMPLO.** Cambialos por lo que realmente cobra el correo antes de usar el modo `"zones"` o `showEstimate`.

| Zona | Incluye | Precio de ejemplo | Plazo de ejemplo |
|---|---|---|---|
| `zona1` | CABA y GBA (en Buenos Aires: códigos postales 1600 a 1899) | $4.500 | 2-4 días hábiles |
| `zona2` | Resto de Buenos Aires, Córdoba, Santa Fe, Entre Ríos, La Pampa | $6.500 | 3-5 días hábiles |
| `zona3` | Todo el resto del país | $8.500 | 5-8 días hábiles |

Cómo editarlo en `config.js`:
- **Cambiar un precio:** buscá la zona (`zona1`, `zona2`, `zona3`) y cambiá el número de `price` (sin puntos ni `$`). El plazo es el texto de `eta` (dejalo `""` si no querés mostrarlo).
- **Mover una provincia de zona:** en la lista `provinces` de cada zona, agregá o sacá el nombre (entre comillas, separados por coma). `zona3` es "el resto": no hace falta listar sus provincias.
- **Envío gratis:** `freeShippingFrom: 80000` = gratis desde $80.000. Con `0` no hay envío gratis. Se avisa en la barra de arriba, en el carrito y en el resumen.
- **Precio especial por código postal:** en `postalOverrides`, sacale las `//` al ejemplo y editalo: `{ postalCodes: ["1900","1901"], name: "La Plata", price: 5500, eta: "2-3 días hábiles" }`. Pisa el precio de la zona.
- **Retiro:** en `pickup` poné la dirección (`address`) y el horario (`hours`) de tu punto de entrega. Con `enabled: false` se oculta la opción de retiro.

### Peso de las prendas (opcional)
En `products.js` podés agregar `weightGrams: 350` a cada producto (peso en gramos). Es **solo informativo**: aparece en el mensaje de WhatsApp (por prenda y el total aproximado) para que pesar y cotizar te lleve menos tiempo. Los valores que vienen son de ejemplo.

---

## 6. Cómo funciona la compra

1. El cliente elige una prenda y un talle y la agrega al carrito (queda guardado aunque cierre la página).
2. Toca **Iniciar compra** y completa 3 pasos:
   - **Datos:** nombre y apellido, teléfono/WhatsApp, email (para el comprobante) y DNI (opcional). Si vuelve a comprar, sus datos ya están cargados (se guardan solo en su dispositivo y puede borrarlos con "Borrar mis datos").
   - **Entrega:** envío a domicilio (provincia, localidad, código postal, calle y número, piso/depto, notas) o retiro. El costo se ve al instante.
   - **Resumen y pago:** subtotal, envío y total, y cómo pagar (si el envío ya está definido).
3. Al confirmar ve la pantalla **"Pedido confirmado · siguiente paso"** con su **número de pedido** (ej. `FP-261011-AB3K`), el total y las instrucciones. Siempre tiene el botón **"Enviar comprobante / pedido por WhatsApp"** con todo el pedido escrito.

> **Importante:** esta tienda no tiene base de datos ni panel de administración. Los pedidos te llegan **por WhatsApp**. El stock no se descuenta solo: vos lo controlás y, cuando algo se agota, ponés `soldOut: true`.

---

## 7. Cómo cobrar (explicado con honestidad)

- **Transferencia al alias** (`flor.pilchas.mp`): funciona siempre y por **cualquier monto**. Es la forma más simple de cobrar el total con envío incluido. El cliente manda el comprobante por WhatsApp y vos lo verificás en tu cuenta.
- **Link de pago de Mercado Pago** (`paymentLink`): un link común tiene un monto **fijo** o lo escribe el cliente. **La tienda no puede cambiarle el monto al link**, así que con esta opción no se cobra el total exacto de forma automática: la tienda le muestra el total (con envío) y le pide que pague **ese monto exacto** (o que transfiera al alias).
- **Pago automático con tarjeta por el monto exacto** (incluido el envío): solo con la **Opción B** de la sección 8 (Checkout Pro), que necesita tu Access Token de Mercado Pago y publicar la tienda en Netlify o Vercel. En modo `"quote"`, para envíos a domicilio no se usa (primero cotizás); sí sirve para retiro o envío gratis.
- Nada de esto confirma el pago solo: lo verificás vos en tu cuenta de Mercado Pago o con el comprobante que te llega por WhatsApp.
- Si Mercado Pago no está configurado, la tienda simplemente **no muestra** esa opción (quedan transferencia y WhatsApp).

### Receta para vos: cómo mandarle al cliente el monto final (modo "quote")
1. Te llega el pedido por WhatsApp con las prendas y los pesos aproximados.
2. Pesá y medí el paquete, y fijate el costo en el correo (Correo Argentino / Andreani) hacia su código postal.
3. Sumá: **total = subtotal de las prendas + costo del envío**.
4. Copiá y pegá este mensaje, cambiando lo que está entre `[ ]`:

> ¡Hola [Nombre]! Gracias por tu pedido *[FP-XXXXXX-XXXX]* 🌸
> Ya lo tengo. Te paso el detalle:
> • Prendas: [$ subtotal]
> • Envío a [localidad, provincia] (según peso y medidas): [$ envío]
> *Total a pagar: [$ total]*
>
> Podés pagar de dos formas:
> 1) Transferencia al alias *flor.pilchas.mp* (Mercado Pago) por [$ total].
> 2) Con tarjeta o dinero en cuenta en este link de Mercado Pago: [pegar el link]
>
> Cuando pagues, mandame el comprobante por acá y te preparo el envío. ¡Gracias!

### Receta: crear un link de Mercado Pago por un monto personalizado (desde la app)
1. Abrí la app de Mercado Pago con tu cuenta.
2. Tocá **Cobrar** → **Link de pago** (según la versión de la app puede llamarse "Cobrar con link" o "Link de pago").
3. Escribí el **monto total** (prendas + envío) y una descripción corta (ej. "Pedido FP-261011-AB3K").
4. Tocá **Crear/Generar link** y **compartilo**: copialo y pegalo en el WhatsApp del cliente (en el mensaje de arriba).
5. Cuando paga, te llega la notificación en la app. Cada link se crea por pedido: no hay que tocar nada en la tienda.

---

## 8. Mercado Pago: configuración (explicada con honestidad)

**Para cobrar de verdad hace falta tu propia cuenta de Mercado Pago.** Hay dos formas de conectarlo a la tienda:

### Opción A — Link de pago (la más fácil, sin programar)
1. Entrá a la app o web de Mercado Pago con tu cuenta.
2. Andá a **Cobrar → Link de pago** y creá un link.
3. Pegalo en `config.js`, en `mercadoPago.paymentLink`:
   ```js
   paymentLink: "https://mpago.la/xxxxxx",
   ```
**Limitación:** el link no cambia de monto según el pedido ni el envío. La tienda le muestra al cliente el total exacto (con envío) y le pide pagar ese monto, o transferir al alias. **El sistema no verifica el pago:** lo confirmás vos mirando tu cuenta o el comprobante por WhatsApp.

### Opción B — Pago automático (Checkout Pro) — requiere publicar con una función en el servidor
El cliente paga en Mercado Pago el **total exacto** (prendas + envío, el envío aparece como renglón aparte) y vuelve a la tienda. Una pequeña función crea la "preferencia" de pago de forma segura (el token **nunca** va en la página).

Necesitás:
1. Un **Access Token de producción**: *mercadopago.com.ar/developers* → **Tus integraciones** → creá una aplicación → **Credenciales de producción** → copiá el **Access Token**. (Es secreto: no lo compartas ni lo pegues en `config.js`.)
2. Publicar la tienda en **Netlify** o **Vercel** (ambos tienen plan gratuito). Usá "Import from Git" o el CLI (arrastrar la carpeta en Netlify Drop **no** corre funciones).
3. En el panel del hosting, cargá las variables de entorno:
   - `MP_ACCESS_TOKEN` = tu Access Token.
   - `SITE_URL` (opcional) = la dirección de tu tienda, ej. `https://mitienda.netlify.app`.
4. En `config.js` completá el `endpoint`:
   - Netlify: `endpoint: "/.netlify/functions/create-preference"`
   - Vercel: `endpoint: "/api/create-preference"`
5. Volvé a publicar y probá con una compra real de monto bajo.

Detalles técnicos: la función (`server/create-preference-core.js`) calcula en el servidor los **precios** (desde `products.js`) y el **costo de envío** (desde la misma tabla `shipping` de `config.js`, con el mismo `shipping.js` que usa la página). El navegador solo manda qué prendas, la provincia y el código postal, nunca un monto, así que el cliente no puede alterarlo. Por eso, si cambiás las tarifas, **volvé a publicar**. Si el total que calcula el servidor no coincide con el de la pantalla, la tienda no lo manda a pagar y le avisa. Al aprobarse el pago, Mercado Pago vuelve a la tienda con `?pago=ok`. Si la función falla y hay `paymentLink`, se usa el link como respaldo. Nota: esta versión no incluye *webhooks*: los pagos los ves en tu cuenta de Mercado Pago.

Para comprobar que la página y el servidor calculan lo mismo: `node tests/shipping.test.js` (requiere Node 18 o más; es opcional).

---

## 9. Publicar la tienda en internet

Es un sitio estático, se puede subir a cualquier hosting:
- **Netlify Drop** (netlify.com/drop): arrastrás la carpeta y listo (alcanza para WhatsApp, transferencia y link de pago; **no** corre la función de Mercado Pago automático).
- **Netlify / Vercel con Git** o CLI: necesario si querés el pago automático (Opción B, sección 8).
- **GitHub Pages**, **Cloudflare Pages**: también sirven para la versión sin función.
- Podés conectar tu propio dominio (ej. `mitienda.com.ar`) desde el panel del hosting.

---

## 10. Cosas para tener en cuenta
- Las fotos de ejemplo (`*.svg`) se pueden borrar de `images/` cuando cargues las tuyas.
- Si querés cambiar los colores, están al principio de `styles.css` (`--gold` es el dorado, `--bg` el fondo).
- Recordá la normativa: informar precios finales, datos del vendedor y botón de arrepentimiento (Ley de Defensa del Consumidor). Consultá con tu contador por la facturación.
