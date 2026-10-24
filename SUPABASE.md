# Panel de administración · Cómo activarlo (Supabase)

Con esto vas a poder entrar a **https://flordepilchas.vercel.app/admin** con tu email y contraseña y cargar prendas, precios, talles, colores y fotos sin tocar código.

**Ya está casi todo hecho:** el proyecto `flor-de-pilchas` de Supabase está creado, con las tablas, las 5 prendas cargadas, el permiso de administradora para **saliasnancy@hotmail.com** y la tienda conectada.
Faltan solo **3 pasos**, desde la web de Supabase (unos 5 minutos). Mientras tanto la tienda funciona normal.

---

## 1. Configurar a dónde llevan los emails (obligatorio, antes de invitar)

Sin esto, el enlace del email lleva a una página que no existe.

1. Abrí: <https://supabase.com/dashboard/project/pfptpduijyfjkkrdzoro/auth/url-configuration>
2. En **Site URL** poné `https://flordepilchas.vercel.app/admin` y tocá **Save**.
3. En **Redirect URLs** tocá **Add URL** y agregá estas dos (de a una), y guardá:
   - `https://flordepilchas.vercel.app/admin`
   - `https://flordepilchas.vercel.app/admin.html`
   - `https://flord-pilchasok.vercel.app/admin` (dirección anterior, sigue funcionando)
   - `https://flord-pilchasok.vercel.app/admin.html`

## 2. Invitar a Nancy

1. Abrí: <https://supabase.com/dashboard/project/pfptpduijyfjkkrdzoro/auth/users>
2. Tocá **Add user** → **Send invitation**, escribí `saliasnancy@hotmail.com` y tocá **Invite user**.
3. A Nancy le llega un email **"You have been invited"** (mirá también en *Correo no deseado*). Toca **Accept the invite**, se abre la página `/admin` con el cartel **"Elegí tu contraseña"**, escribe una de al menos 8 caracteres dos veces y entra directo al panel.

> El enlace vence en 24 horas y sirve una sola vez. Si venció, en la pantalla de ingreso tocá **¿Olvidaste tu contraseña?** con ese mismo email y llega uno nuevo.
> El servicio de email gratis de Supabase manda pocos emails por hora: si no llega, esperá un rato antes de reintentar.

## 3. Cerrar el registro libre (recomendado)

Así nadie más puede crearse una cuenta: solo entran las personas que invites.

1. Abrí: <https://supabase.com/dashboard/project/pfptpduijyfjkkrdzoro/auth/providers>
2. Apagá **Allow new users to sign up** y tocá **Save**.
3. **Dejá prendido "Confirm email"** (en Providers → Email): el permiso de administradora se da por email y esto asegura que solo quien recibe los emails de esa casilla pueda entrar.

---

### Sumar o quitar administradoras

En **SQL Editor** (<https://supabase.com/dashboard/project/pfptpduijyfjkkrdzoro/sql/new>) pegá
[`admins.sql`](https://raw.githubusercontent.com/juancjose/flord-pilchasok/main/supabase/admins.sql), cambiá el email y tocá **Run**. Después invitala como en el paso 2.

### Rehacer todo desde cero (solo si hiciera falta)

En SQL Editor ejecutar, en este orden:
[`schema.sql`](https://raw.githubusercontent.com/juancjose/flord-pilchasok/main/supabase/schema.sql),
[`seed.sql`](https://raw.githubusercontent.com/juancjose/flord-pilchasok/main/supabase/seed.sql) y
[`admins.sql`](https://raw.githubusercontent.com/juancjose/flord-pilchasok/main/supabase/admins.sql).
Las claves públicas van en `config.js` (`supabaseUrl` y `supabaseAnonKey`). **Nunca** pongas ahí la clave `service_role` ni la `secret`.

## Después: cómo se usa el panel

- Entrá a **https://flordepilchas.vercel.app/admin** con tu email y contraseña.
- **Productos:** tocá una prenda para editarla o **+ Nuevo producto** para crear una.
- **Colores:** cada color tiene nombre, una muestra de color y sus propias fotos. La primera foto es la principal. Las flechas cambian el orden y la × la quita.
- **Fotos:** se achican solas a 800×1000 antes de subirse. Si la foto tiene fondo transparente se ve entera; si no, se recorta un poco para llenar el cuadro.
- **Visible en la tienda:** apagalo para esconder una prenda sin borrarla.
- **Agotado:** la prenda se sigue viendo, con el cartel "Agotado", y el botón pasa a "Consultar si vuelve".
- Tocá **Guardar**. La tienda se actualiza al recargar la página.
- **¿Te olvidaste la contraseña?** En la pantalla de ingreso tocá "¿Olvidaste tu contraseña?" y te llega un enlace por email.

## Bueno saber

- **El plan gratis de Supabase se "pausa" si pasa una semana sin que nadie entre a la tienda.** Si pasa, la web igual se ve (muestra la última lista guardada en el código, `products.js`), pero los cambios del panel no aparecen hasta reactivarlo: entrá a supabase.com, abrí el proyecto y tocá **Restore project**.
- Para sumar o quitar administradoras, mirá «Sumar o quitar administradoras» más arriba.
