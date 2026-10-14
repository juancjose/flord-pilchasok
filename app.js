/* Lógica de la tienda. No hace falta tocar este archivo. */
(function () {
  "use strict";
  var CFG = window.CONFIG || {};
  var MP = CFG.mercadoPago || {};
  var BANK = CFG.bankTransfer || {};
  var SHIP = Shipping.getConfig(CFG);          // tabla de envíos (config.js), compartida con la función del servidor
  var QUOTE_MODE = SHIP.mode === "quote";
  var PRODUCTS = (window.PRODUCTS || []).filter(function (p) { return p && p.id; });
  var CART_KEY = "tienda_carrito_v1";
  var CUSTOMER_KEY = "tienda_cliente_v1";

  var $ = function (id) { return document.getElementById(id); };
  var money = new Intl.NumberFormat(CFG.locale || "es-AR", { style: "currency", currency: CFG.currency || "ARS", maximumFractionDigits: 0 });
  var fmt = function (n) { return money.format(n); };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  /* ---------- Tema claro / oscuro ---------- */
  var THEME_KEY = "fdp-theme";
  var rootEl = document.documentElement;
  function currentTheme() { return rootEl.getAttribute("data-theme") === "light" ? "light" : "dark"; }
  // Las fotos de ejemplo (.svg) tienen versión clara "-light.svg". Las fotos reales no se tocan.
  var SAMPLE_IMG = /^(?:images\/)?((?:buzo|camisa|jean|pollera|remera|vestido)-\d)(-light)?\.svg$/;
  function themedSrc(src) {
    var m = SAMPLE_IMG.exec(src || "");
    return m ? m[1] + (currentTheme() === "light" ? "-light" : "") + ".svg" : src;
  }
  function imgSrc(name) {
    if (!name) return "placeholder.svg";
    return themedSrc(imgSrcRaw(name));
  }
  function imgSrcRaw(name) {
    // Versión plana: todas las fotos están en la misma carpeta que index.html, así que alcanza con el nombre del archivo.
    // (Si alguien escribe "images/foto.jpg" por costumbre, se ignora la carpeta.)
    return /^(https?:)?\/\//.test(name) || name.indexOf("/") === 0 ? name : name.replace(/^(\.\/)?images\//, "");
  }
  function applyTheme(t, save) {
    if (rootEl.getAttribute("data-theme") !== t) rootEl.setAttribute("data-theme", t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "light" ? "#faf7f2" : "#0a0a0a");
    var btn = document.getElementById("themeToggle");
    if (btn) { var l = t === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"; btn.setAttribute("aria-label", l); btn.setAttribute("title", l); }
    document.querySelectorAll("img").forEach(function (i) {
      var s = i.getAttribute("src"), n = themedSrc(s);
      if (n !== s) i.setAttribute("src", n);
    });
    if (save) { try { localStorage.setItem(THEME_KEY, t); } catch (e) {} }
  }
  function savedTheme() { try { var t = localStorage.getItem(THEME_KEY); return t === "light" || t === "dark" ? t : null; } catch (e) { return null; } }
  applyTheme(currentTheme(), false);
  document.getElementById("themeToggle").addEventListener("click", function () {
    rootEl.classList.add("theme-anim");
    applyTheme(currentTheme() === "light" ? "dark" : "light", true);
    setTimeout(function () { rootEl.classList.remove("theme-anim"); }, 400);
  });
  // Con defaultTheme "auto" y sin elección guardada, acompaña los cambios del sistema
  if ((CFG.defaultTheme || "dark") === "auto" && window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: light)");
    var onSys = function (e) { if (!savedTheme()) applyTheme(e.matches ? "light" : "dark", false); };
    if (mq.addEventListener) mq.addEventListener("change", onSys); else if (mq.addListener) mq.addListener(onSys);
  }

  function byId(id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0]; }
  function digits(s) { return String(s || "").replace(/\D/g, ""); }

  /* ---------- Carrito ---------- */
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch (e) { cart = []; }
  // Descarta productos que ya no existen y limpia datos inválidos
  cart = cart.filter(function (l) { return l && byId(l.id) && l.qty > 0; });

  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
    renderCartCount();
  }
  function cartCount() { return cart.reduce(function (n, l) { return n + l.qty; }, 0); }
  function cartTotal() { return cart.reduce(function (n, l) { return n + byId(l.id).price * l.qty; }, 0); }
  function addToCart(id, size) {
    var line = cart.filter(function (l) { return l.id === id && l.size === size; })[0];
    if (line) line.qty += 1; else cart.push({ id: id, size: size, qty: 1 });
    saveCart();
  }
  function renderCartCount() {
    var n = cartCount(), el = $("cartCount");
    el.textContent = n; el.hidden = n === 0;
  }

  /* ---------- Utilidades de UI ---------- */
  var openLayer = null;
  function lock(on) { document.body.classList.toggle("locked", on); }
  function openEl(el) {
    closeAll(true);
    $("overlay").hidden = false; el.hidden = false; openLayer = el; lock(true);
    var f = el.querySelector("button:not([data-close]), input"); if (f && window.innerWidth > 760) { try { f.focus({ preventScroll: true }); } catch (e) {} }
  }
  function closeAll(silent) {
    ["productModal", "cartDrawer", "checkoutModal"].forEach(function (id) { $(id).hidden = true; });
    $("overlay").hidden = true; openLayer = null; lock(false);
  }
  var toastTimer;
  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2800);
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && openLayer) closeAll(); });
  $("overlay").addEventListener("click", function () { closeAll(); });
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) closeAll();
  });

  /* ---------- Datos fijos de la tienda ---------- */
  function whatsUrl(text) {
    var base = "https://wa.me/" + digits(CFG.whatsappNumber);
    return text ? base + "?text=" + encodeURIComponent(text) : base;
  }
  function initStatic() {
    var name = CFG.storeName || "Tienda";
    document.title = name + " | Ropa";
    $("brandName").textContent = name;
    $("footBrandName").textContent = name;
    document.querySelectorAll(".js-logo").forEach(function (i) { i.alt = "Logo de " + name; });
    $("heroTitle").textContent = CFG.heroTitle || name;
    $("heroText").textContent = CFG.heroText || CFG.tagline || "";
    $("aboutText").textContent = CFG.about || "";
    $("perkShip").textContent = QUOTE_MODE ? "Envíos a todo el país. Te cotizamos el costo por WhatsApp." : "Envíos a todo el país. El costo se calcula según tu provincia.";
    $("footShip").textContent = CFG.shippingNote || "";
    $("pmShipNote").textContent = CFG.shippingNote || "";
    $("footCity").textContent = CFG.city || "";
    $("footHours").textContent = CFG.hours || "";
    $("footCopy").textContent = "© " + new Date().getFullYear() + " " + name + ". Todos los derechos reservados.";
    $("footWhats").href = whatsUrl(); $("footWhats").querySelector("span").textContent = (CFG.whatsappDisplay || ("+" + digits(CFG.whatsappNumber)));
    $("whatsFab").href = whatsUrl("Hola! Quería consultar por una prenda.");
    var ig = String(CFG.instagram || "").replace(/^@/, "");
    $("footInsta").href = CFG.instagramUrl || ("https://www.instagram.com/" + ig + "/"); $("footInsta").querySelector("span").textContent = "@" + ig;
    $("topbar").textContent = SHIP.freeShippingFrom > 0 ? "Envío gratis en compras desde " + fmt(SHIP.freeShippingFrom) : (QUOTE_MODE ? "Envíos a todo el país · te cotizamos el costo por WhatsApp" : "Envíos a todo el país · el costo se calcula según tu provincia");
  }

  /* ---------- Catálogo ---------- */
  var activeCat = "Todas";
  function renderFilters() {
    var cats = ["Todas"];
    PRODUCTS.forEach(function (p) { if (p.category && cats.indexOf(p.category) < 0) cats.push(p.category); });
    $("filters").innerHTML = cats.length < 3 ? "" : cats.map(function (c) {
      return '<button class="filter' + (c === activeCat ? " is-active" : "") + '" data-cat="' + esc(c) + '" role="tab" aria-selected="' + (c === activeCat) + '">' + esc(c) + "</button>";
    }).join("");
  }
  function renderGrid() {
    var list = PRODUCTS.filter(function (p) { return activeCat === "Todas" || p.category === activeCat; });
    $("empty").hidden = list.length > 0;
    $("grid").innerHTML = list.map(function (p) {
      var imgs = p.images || [];
      return '<button class="card" data-id="' + esc(p.id) + '" aria-label="Ver ' + esc(p.name) + '">' +
        '<div class="card__media">' +
        '<img src="' + esc(imgSrc(imgs[0])) + '" alt="' + esc(p.name) + '" loading="lazy">' +
        (imgs[1] ? '<img src="' + esc(imgSrc(imgs[1])) + '" alt="" loading="lazy">' : "") +
        (p.soldOut ? '<span class="badge">Agotado</span>' : "") +
        "</div>" +
        '<p class="card__cat">' + esc(p.category || "") + "</p>" +
        '<h3 class="card__name">' + esc(p.name) + "</h3>" +
        '<p class="card__price">' + fmt(p.price) + "</p></button>";
    }).join("");
  }
  $("filters").addEventListener("click", function (e) {
    var b = e.target.closest("[data-cat]"); if (!b) return;
    activeCat = b.getAttribute("data-cat"); renderFilters(); renderGrid();
  });
  $("grid").addEventListener("click", function (e) {
    var c = e.target.closest("[data-id]"); if (c) openProduct(c.getAttribute("data-id"));
  });

  /* ---------- Detalle de producto ---------- */
  var current = null, currentSize = null;
  function openProduct(id) {
    var p = byId(id); if (!p) return;
    current = p;
    var sizes = p.sizes && p.sizes.length ? p.sizes : ["Único"];
    currentSize = sizes.length === 1 ? sizes[0] : null;
    var imgs = p.images && p.images.length ? p.images : [""];
    $("pmCategory").textContent = p.category || "";
    $("pmName").textContent = p.name;
    $("pmPrice").textContent = fmt(p.price);
    $("pmDesc").textContent = p.description || "";
    $("sizeError").hidden = true;
    setMainImage(imgs[0], p.name);
    $("pmThumbs").innerHTML = imgs.length > 1 ? imgs.map(function (im, i) {
      return '<button class="' + (i === 0 ? "is-active" : "") + '" data-img="' + esc(im) + '" aria-label="Foto ' + (i + 1) + '"><img src="' + esc(imgSrc(im)) + '" alt=""></button>';
    }).join("") : "";
    $("pmSizes").innerHTML = sizes.map(function (s) {
      return '<button class="size' + (s === currentSize ? " is-active" : "") + '" role="radio" aria-checked="' + (s === currentSize) + '" data-size="' + esc(s) + '">' + esc(s) + "</button>";
    }).join("");
    var add = $("pmAdd"); add.disabled = !!p.soldOut; add.textContent = p.soldOut ? "Agotado" : "Agregar al carrito";
    openEl($("productModal"));
    $("productModal").scrollTop = 0;
  }
  function setMainImage(im, alt) { var el = $("pmImage"); el.src = imgSrc(im); el.alt = alt || ""; }
  $("pmThumbs").addEventListener("click", function (e) {
    var b = e.target.closest("[data-img]"); if (!b) return;
    setMainImage(b.getAttribute("data-img"), current.name);
    Array.prototype.forEach.call($("pmThumbs").children, function (x) { x.classList.toggle("is-active", x === b); });
  });
  $("pmSizes").addEventListener("click", function (e) {
    var b = e.target.closest("[data-size]"); if (!b) return;
    currentSize = b.getAttribute("data-size"); $("sizeError").hidden = true;
    Array.prototype.forEach.call($("pmSizes").children, function (x) {
      var on = x === b; x.classList.toggle("is-active", on); x.setAttribute("aria-checked", on);
    });
  });
  $("pmAdd").addEventListener("click", function () {
    if (!currentSize) { $("sizeError").hidden = false; return; }
    addToCart(current.id, currentSize);
    renderCart(); openEl($("cartDrawer"));
  });

  /* ---------- Carrito (panel lateral) ---------- */
  function renderCart() {
    var body = $("cartBody"), foot = $("cartFoot");
    if (!cart.length) {
      body.innerHTML = '<div class="cart-empty"><p>Tu carrito está vacío.</p><button class="btn btn--ghost" data-close>Seguir mirando</button></div>';
      foot.innerHTML = ""; return;
    }
    body.innerHTML = cart.map(function (l, i) {
      var p = byId(l.id);
      return '<div class="item" data-i="' + i + '">' +
        '<img src="' + esc(imgSrc((p.images || [])[0])) + '" alt="' + esc(p.name) + '">' +
        "<div><p class=\"item__name\">" + esc(p.name) + '</p><p class="item__meta">Talle ' + esc(l.size) + " · " + fmt(p.price) + "</p>" +
        '<div class="qty"><button data-act="minus" aria-label="Menos">&minus;</button><span>' + l.qty + '</span><button data-act="plus" aria-label="Más">+</button></div></div>' +
        '<div class="item__side"><span class="item__price">' + fmt(p.price * l.qty) + '</span><button class="link" data-act="remove">Quitar</button></div></div>';
    }).join("");
    var total = cartTotal(), free = "", F = SHIP.freeShippingFrom;
    if (F > 0) free = total >= F ? '<p class="free-ship">¡Tenés envío gratis!</p>' : '<p class="free-ship">Te faltan ' + fmt(F - total) + " para el envío gratis.</p>";
    var shipLine = total >= F && F > 0 ? "Envío gratis" : QUOTE_MODE ? "Envío: a cotizar (te lo confirmamos por WhatsApp según peso y medidas)" : "Envío: se calcula al finalizar según tu provincia";
    foot.innerHTML = '<div class="total-row"><span>Subtotal</span><strong>' + fmt(total) + "</strong></div>" +
      '<p class="muted small" style="margin:0">' + esc(shipLine) + "</p>" + free +
      '<button class="btn btn--gold btn--block" id="goCheckout">Iniciar compra</button>';
  }
  $("cartBody").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-act]"); if (!btn) return;
    var row = btn.closest("[data-i]"); var i = +row.getAttribute("data-i"); var act = btn.getAttribute("data-act");
    if (act === "plus") cart[i].qty += 1;
    if (act === "minus") cart[i].qty -= 1;
    if (act === "remove" || cart[i].qty <= 0) cart.splice(i, 1);
    saveCart(); renderCart();
  });
  $("cartFoot").addEventListener("click", function (e) {
    if (e.target.closest("#goCheckout")) { renderCheckout(); openEl($("checkoutModal")); $("checkoutModal").scrollTop = 0; }
  });
  $("openCart").addEventListener("click", function () { renderCart(); openEl($("cartDrawer")); });

  /* ---------- Checkout (3 pasos: Datos · Entrega · Resumen y pago) ---------- */
  var LAST_KEY = "tienda_ultimo_pedido_v1";
  var SAVED_FIELDS = ["name", "surname", "phone", "email", "dni", "delivery", "province", "city", "street", "floor", "zip"];
  var customer = loadCustomer();
  function loadCustomer() {
    var c = {};
    try { c = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || "{}") || {}; } catch (e) { c = {}; }
    if (!c.surname && c.name && /\s/.test(c.name)) { var parts = c.name.trim().split(/\s+/); c.name = parts.shift(); c.surname = parts.join(" "); } // datos de versiones anteriores
    return c;
  }
  function hasSavedData() { return SAVED_FIELDS.some(function (k) { return k !== "delivery" && customer[k]; }); }
  function saveCustomer() {
    var o = {}; SAVED_FIELDS.forEach(function (k) { if (customer[k] != null) o[k] = customer[k]; });
    try { localStorage.setItem(CUSTOMER_KEY, JSON.stringify(o)); } catch (e) {}
  }

  var REQUIRE_EMAIL = CFG.requireEmail !== false;
  var PICKUP = SHIP.pickup;
  var co = { step: 1, pay: "", busy: false };
  function coDelivery() { return customer.delivery === "retiro" && PICKUP.enabled ? "retiro" : "envio"; }

  function orderId() {
    var d = new Date(), pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789", r = "";
    for (var i = 0; i < 4; i++) r += abc.charAt(Math.floor(Math.random() * abc.length));
    return (CFG.orderPrefix || "FP") + "-" + pad(d.getFullYear() % 100) + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + r;
  }

  /* --- Cálculo de totales (siempre a partir de la tabla de config.js) --- */
  function totals() {
    var sub = cartTotal();
    var q = Shipping.quote(SHIP, { method: coDelivery(), province: customer.province, postalCode: customer.zip, subtotal: sub });
    var pending = q.method === "envio" && q.pending && !q.free;
    var cost = pending || !q.ok ? 0 : q.cost;
    return { q: q, subtotal: sub, shipping: cost, total: sub + cost, pending: pending, unknown: q.method === "envio" && !q.ok && !q.pending };
  }
  function shipValueText(t) {
    if (t.q.method === "retiro") return "Sin costo";
    if (t.q.free) return "Envío gratis";
    if (t.pending) return "A cotizar";
    if (t.unknown) return "Elegí tu provincia";
    return fmt(t.shipping);
  }
  function hasPostalDependence(province) {
    var p = Shipping.normalizeProvince(province), r = false;
    Object.keys(SHIP.zones).forEach(function (k) { SHIP.zones[k].postalRanges.forEach(function (x) { if (x.province === p) r = true; }); });
    return r;
  }
  function shipDetailHtml(t) {
    var q = t.q, h = "";
    if (q.method === "retiro") {
      return '<p class="shipbox__note">Retiro sin cargo. ' + esc(PICKUP.address || "Te pasamos la dirección y el horario por WhatsApp.") + (PICKUP.hours ? " " + esc(PICKUP.hours) : "") + "</p>";
    }
    if (q.free) return '<p class="shipbox__note shipbox__note--ok">¡Superaste ' + fmt(SHIP.freeShippingFrom) + "! El envío va por nuestra cuenta.</p>";
    if (t.pending) {
      h = '<p class="shipbox__note">Te confirmamos el costo por WhatsApp según el peso y las medidas del paquete. <strong>Todavía no tenés que pagar el envío.</strong></p>';
      if (q.estimate != null) h += '<p class="shipbox__note">Orientativo para ' + esc(q.province) + ": alrededor de " + fmt(q.estimate) + " (el valor final se confirma por WhatsApp).</p>";
    } else if (t.unknown) {
      h = '<p class="shipbox__note">Elegí tu provincia y código postal para ver el costo del envío.</p>';
    } else {
      h = '<p class="shipbox__note">' + esc(q.zoneName) + (q.eta ? " · llega en " + esc(q.eta) : "") + "</p>";
      if (q.province && hasPostalDependence(q.province)) h += '<p class="shipbox__note">En ' + esc(q.province) + " el precio depende del código postal.</p>";
    }
    if (SHIP.freeShippingFrom > 0 && t.subtotal < SHIP.freeShippingFrom) h += '<p class="shipbox__note">Te faltan ' + fmt(SHIP.freeShippingFrom - t.subtotal) + " para el envío gratis.</p>";
    return h;
  }
  function totalsRowsHtml(t) {
    var total = t.pending
      ? '<div class="sum-total"><span>Total parcial</span><span>' + fmt(t.subtotal) + '<small> + envío a cotizar</small></span></div>'
      : '<div class="sum-total"><span>Total</span><span>' + fmt(t.total) + "</span></div>";
    return '<div><span>Subtotal</span><span>' + fmt(t.subtotal) + "</span></div>" +
      '<div><span>Envío</span><span class="' + (t.q.free ? "is-free" : "") + '">' + shipValueText(t) + "</span></div>" + total;
  }

  /* --- Armado del formulario --- */
  function field(id, label, type, extra, hint) {
    return '<div class="field"><label for="f_' + id + '">' + label + '</label><input id="f_' + id + '" name="' + id + '" type="' + type + '" value="' + esc(customer[id] || "") + '" ' + (extra || "") + ' aria-describedby="e_' + id + '"' + (hint ? "" : "") + '>' +
      (hint ? '<div class="hint">' + hint + "</div>" : "") + '<div class="err" id="e_' + id + '"></div></div>';
  }
  var STEP_NAMES = ["Datos", "Entrega", "Resumen"];
  function stepsNavHtml() {
    return '<ol class="stepper" id="stepper" aria-label="Pasos de la compra">' + STEP_NAMES.map(function (n, i) {
      return '<li data-step="' + (i + 1) + '"><span class="stepper__n">' + (i + 1) + '</span><span class="stepper__t">' + n + "</span></li>";
    }).join("") + "</ol>";
  }
  function renderCheckout() {
    if (!cart.length) { closeAll(); return; }
    co = { step: 1, pay: "", busy: false };
    if (!customer.delivery) customer.delivery = "envio";
    if (!PICKUP.enabled) customer.delivery = "envio";
    var d = coDelivery();
    var provinceOpts = '<option value="">Elegí tu provincia…</option>' + Shipping.PROVINCES.map(function (p) {
      return '<option value="' + esc(p) + '"' + (Shipping.normalizeProvince(customer.province) === p ? " selected" : "") + ">" + esc(p) + "</option>";
    }).join("");
    function opt(val, title, sub, checked) {
      return '<label class="opt"><input type="radio" name="delivery" value="' + val + '"' + (checked ? " checked" : "") + '><span class="opt__box"><strong>' + title + "</strong><small>" + sub + "</small></span></label>";
    }
    var shipSub = QUOTE_MODE ? "Costo a cotizar por WhatsApp" : "Costo según tu provincia";
    $("checkoutBody").innerHTML =
      '<button class="link back" id="backToCart" type="button">&larr; Volver al carrito</button>' +
      '<h2 id="coTitle">Finalizar compra</h2>' + stepsNavHtml() +
      '<form class="form" id="coForm" novalidate>' +
      /* Paso 1 */
      '<section class="step" data-step="1" aria-labelledby="st1">' +
      '<h3 class="step__title" id="st1" tabindex="-1">Tus datos</h3>' +
      '<div class="row2">' + field("name", "Nombre", "text", 'autocomplete="given-name" required') + field("surname", "Apellido", "text", 'autocomplete="family-name" required') + "</div>" +
      '<div class="row2">' + field("phone", "Teléfono / WhatsApp", "tel", 'autocomplete="tel" inputmode="tel" placeholder="11 5555 1234" required', "Con código de área, sin 0 ni 15.") +
      field("email", "Email" + (REQUIRE_EMAIL ? "" : " (opcional)"), "email", 'autocomplete="email" inputmode="email"' + (REQUIRE_EMAIL ? " required" : ""), "Lo usamos para enviarte el comprobante de tu compra.") + "</div>" +
      field("dni", "DNI (opcional)", "text", 'inputmode="numeric" autocomplete="off" placeholder="Solo números"', "Solo si necesitás factura o el correo lo pide.") +
      '<p class="saved" id="savedBox"' + (hasSavedData() ? "" : " hidden") + '>Tus datos quedan guardados en este dispositivo para la próxima compra. <button type="button" class="link" id="clearData">Borrar mis datos</button></p>' +
      "</section>" +
      /* Paso 2 */
      '<section class="step" data-step="2" aria-labelledby="st2" hidden>' +
      '<h3 class="step__title" id="st2" tabindex="-1">Entrega</h3>' +
      '<fieldset class="opts"><legend class="sr-only">Forma de entrega</legend>' +
      opt("envio", "Envío a domicilio", shipSub, d === "envio") +
      (PICKUP.enabled ? opt("retiro", esc(PICKUP.title), "Sin costo", d === "retiro") : "") +
      "</fieldset>" +
      '<div id="homeFields" class="fields"' + (d === "envio" ? "" : " hidden") + ">" +
      '<div class="field"><label for="f_province">Provincia</label><select id="f_province" name="province" autocomplete="address-level1" aria-describedby="e_province" required>' + provinceOpts + '</select><div class="err" id="e_province"></div></div>' +
      '<div class="row2">' + field("city", "Localidad", "text", 'autocomplete="address-level2" required') +
      field("zip", "Código postal", "text", 'autocomplete="postal-code" inputmode="text" maxlength="8" placeholder="1425" required', "4 números (o CPA, ej. C1425ABC).") + "</div>" +
      field("street", "Calle y número", "text", 'autocomplete="address-line1" placeholder="Av. Siempre Viva 742" required') +
      field("floor", "Piso / Depto (opcional)", "text", 'autocomplete="address-line2" placeholder="3° B"') +
      "</div>" +
      '<div id="pickupInfo" class="notice"' + (d === "retiro" ? "" : " hidden") + "><strong>" + esc(PICKUP.title) + "</strong><br>" + esc(PICKUP.address || "Te pasamos la dirección y el horario por WhatsApp.") + (PICKUP.hours ? "<br>" + esc(PICKUP.hours) : "") + "</div>" +
      '<div class="field"><label for="f_notes">Notas (opcional)</label><textarea id="f_notes" name="notes" placeholder="Ej: dejar con el portero, horario de entrega…"></textarea></div>' +
      '<div class="shipbox" id="shipBox" aria-live="polite"></div>' +
      "</section>" +
      /* Paso 3 */
      '<section class="step" data-step="3" aria-labelledby="st3" hidden><h3 class="step__title" id="st3" tabindex="-1">Resumen y pago</h3><div id="step3"></div></section>' +
      '<div class="step-actions"><button type="button" class="btn btn--ghost" id="stepBack" hidden>Atrás</button><button type="submit" class="btn btn--gold" id="stepNext">Continuar</button></div>' +
      "</form>";
    paintStep();
    updateShipBox();
  }
  function readStep() {
    var f = $("coForm"); if (!f) return;
    ["name", "surname", "phone", "email", "dni", "province", "city", "zip", "street", "floor"].forEach(function (k) {
      if (f.elements[k]) customer[k] = (f.elements[k].value || "").trim();
    });
    var r = f.querySelector('input[name="delivery"]:checked'); if (r) customer.delivery = r.value;
    customer.notes = f.elements.notes ? f.elements.notes.value.trim() : (customer.notes || "");
  }
  function updateShipBox() {
    var box = $("shipBox"); if (!box) return;
    readStep();
    var t = totals();
    box.innerHTML = '<div class="summary summary--live">' + totalsRowsHtml(t) + "</div>" + shipDetailHtml(t);
  }
  function paintStep() {
    var s = co.step;
    Array.prototype.forEach.call(document.querySelectorAll("#coForm .step"), function (el) { el.hidden = +el.getAttribute("data-step") !== s; });
    Array.prototype.forEach.call(document.querySelectorAll("#stepper li"), function (el) {
      var n = +el.getAttribute("data-step");
      el.classList.toggle("is-active", n === s); el.classList.toggle("is-done", n < s);
      if (n === s) el.setAttribute("aria-current", "step"); else el.removeAttribute("aria-current");
    });
    $("stepBack").hidden = s === 1;
    var next = $("stepNext");
    if (s < 3) next.textContent = "Continuar";
    else next.textContent = confirmLabel();
    next.disabled = false;
  }
  function goStep(n) {
    co.step = n;
    if (n === 3) renderStep3();
    paintStep();
    var m = $("checkoutModal"); m.scrollTop = 0;
    var h = $("st" + n); if (h) { try { h.focus({ preventScroll: true }); } catch (e) {} }
  }

  /* --- Validación (mensajes en español) --- */
  function setErr(k, msg) {
    var inp = $("f_" + k); if (!inp) return;
    var el = inp.closest(".field");
    if (msg) { el.classList.add("has-error"); el.querySelector(".err").textContent = msg; inp.setAttribute("aria-invalid", "true"); }
    else { el.classList.remove("has-error"); el.querySelector(".err").textContent = ""; inp.removeAttribute("aria-invalid"); }
  }
  function validateStep(n) {
    readStep();
    var d = customer, first = null;
    function chk(k, bad, msg) { if (bad) { setErr(k, msg); if (!first) first = k; } else setErr(k, ""); }
    if (n === 1) {
      chk("name", d.name.length < 2, "Escribí tu nombre.");
      chk("surname", d.surname.length < 2, "Escribí tu apellido.");
      var ph = digits(d.phone);
      chk("phone", ph.length < 10 || ph.length > 13, "Ingresá tu teléfono con código de área, sin 0 ni 15. Ej: 11 5555 1234.");
      var em = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(d.email);
      chk("email", (REQUIRE_EMAIL || d.email) && !em, d.email ? "El email no parece válido. Revisá que tenga @ y un dominio (ej: nombre@correo.com)." : "Ingresá tu email: ahí te mandamos el comprobante.");
      var dn = digits(d.dni);
      chk("dni", !!d.dni && (dn.length < 7 || dn.length > 8), "El DNI debe tener 7 u 8 números (o dejalo vacío).");
    }
    if (n === 2 && coDelivery() === "envio") {
      chk("province", !Shipping.normalizeProvince(d.province), "Elegí tu provincia.");
      chk("city", d.city.length < 2, "Escribí tu localidad.");
      chk("zip", !Shipping.parsePostal(d.zip).valid, "Ingresá tu código postal: 4 números (ej: 1425) o el CPA (ej: C1425ABC).");
      chk("street", d.street.length < 3 || !(/\d/.test(d.street) || /s\/?n/i.test(d.street)), "Escribí la calle y el número (ej: Av. Siempre Viva 742). Si no tiene número, poné s/n.");
    }
    if (first) { var el = $("f_" + first); if (el) { el.focus(); } return false; }
    return true;
  }

  /* --- Paso 3: resumen + pago --- */
  function payMethods() {
    var m = [];
    if (MP.endpoint || MP.paymentLink) m.push({ id: "mp", title: "Mercado Pago", sub: MP.endpoint ? "Tarjeta, dinero en cuenta y más. Pagás el total exacto." : "Pagás con el link de Mercado Pago." });
    if (BANK.enabled) m.push({ id: "bank", title: "Transferencia", sub: BANK.alias ? "Alias " + BANK.alias : "Transferencia bancaria" });
    m.push({ id: "wa", title: "Coordinar por WhatsApp", sub: "Acordamos el pago por chat." });
    return m;
  }
  function confirmLabel() {
    var t = totals();
    if (t.pending) return "Enviar pedido por WhatsApp";
    if (co.pay === "mp") return "Pagar con Mercado Pago · " + fmt(t.total);
    return "Confirmar pedido";
  }
  function addressLine(d, t) {
    if (coDelivery() === "retiro") return PICKUP.title + (PICKUP.address ? " — " + PICKUP.address : "");
    return [d.street, d.floor, d.city, t.q.province || d.province, "CP " + String(d.zip).toUpperCase()].filter(Boolean).join(", ");
  }
  function bankHtml(total) {
    var rows = [["Titular", BANK.holder], ["Banco", BANK.bank], ["CBU", BANK.cbu, 1], ["Alias", BANK.alias, 1], ["CUIT/CUIL", BANK.cuit]].filter(function (r) { return r[1]; });
    return '<div class="bank" id="bankBox">' + rows.map(function (r) {
      return '<div class="bank__row"><span>' + r[0] + "</span><code>" + esc(r[1]) + "</code>" + (r[2] ? '<button type="button" class="copy" data-copy="' + esc(r[1]) + '">Copiar</button>' : "") + "</div>";
    }).join("") +
      '<div class="bank__row"><span>Monto exacto</span><code>' + fmt(total) + '</code><button type="button" class="copy" data-copy="' + total + '">Copiar</button></div></div>';
  }
  function payDetailHtml(t) {
    if (co.pay === "bank") return bankHtml(t.total) + '<p class="notice">Hacé la transferencia por el monto exacto y después enviá el comprobante por WhatsApp (te mostramos el botón al confirmar).</p>';
    if (co.pay === "mp") {
      if (MP.endpoint) return '<p class="notice">Te llevamos a Mercado Pago a pagar <strong>' + fmt(t.total) + "</strong> (envío incluido). Cuando termines, volvés a la tienda.</p>";
      return '<p class="notice">Se abre el link de pago de Mercado Pago. Ese link no sabe cuánto es tu pedido: pagá <strong>exactamente ' + fmt(t.total) + "</strong>" + (BANK.enabled && BANK.alias ? ", o transferí ese monto al alias <strong>" + esc(BANK.alias) + "</strong>" : "") + ".</p>";
    }
    return '<p class="notice">Te escribimos por WhatsApp para coordinar el pago y la entrega.</p>';
  }
  function renderStep3() {
    readStep();
    var t = totals(), d = customer;
    var items = cart.map(function (l) {
      var p = byId(l.id);
      return "<div><span>" + l.qty + " × " + esc(p.name) + " (talle " + esc(l.size) + ")</span><span>" + fmt(p.price * l.qty) + "</span></div>";
    }).join("");
    var h = '<div class="summary">' + items + '<div class="sum-sep"></div>' + totalsRowsHtml(t) + "</div>" + shipDetailHtml(t) +
      '<dl class="recap"><div><dt>Datos <button type="button" class="link" data-goto="1">Editar</button></dt><dd>' + esc(d.name + " " + d.surname) + "<br>" + esc(d.phone) + (d.email ? "<br>" + esc(d.email) : "") + (d.dni ? "<br>DNI " + esc(d.dni) : "") + "</dd></div>" +
      '<div><dt>' + (coDelivery() === "retiro" ? "Retiro" : "Envío a") + ' <button type="button" class="link" data-goto="2">Editar</button></dt><dd>' + esc(addressLine(d, t)) + (d.notes ? "<br><em>" + esc(d.notes) + "</em>" : "") + "</dd></div></dl>";
    if (t.pending) {
      h += '<div class="nextsteps"><p class="pay__title">Cómo sigue</p><ol>' +
        "<li>Nos mandás este pedido por WhatsApp (ya va escrito, solo tocás enviar).</li>" +
        "<li>Pesamos y medimos tu pedido y te confirmamos el costo de envío y el total final.</li>" +
        "<li>Pagás ese total con un link de Mercado Pago o por transferencia" + (BANK.alias ? " al alias " + esc(BANK.alias) : "") + ".</li></ol>" +
        '<p class="notice">No tenés que pagar nada ahora.</p></div>';
    } else {
      var ms = payMethods();
      if (!co.pay || !ms.some(function (m) { return m.id === co.pay; })) co.pay = ms[0].id;
      h += '<fieldset class="opts opts--pay"><legend class="pay__title">Elegí cómo pagar</legend>' + ms.map(function (m) {
        return '<label class="opt"><input type="radio" name="pay" value="' + m.id + '"' + (m.id === co.pay ? " checked" : "") + '><span class="opt__box"><strong>' + m.title + "</strong><small>" + esc(m.sub) + "</small></span></label>";
      }).join("") + '</fieldset><div id="payDetail">' + payDetailHtml(t) + '</div>';
    }
    h += '<p class="pay-error" id="payError" role="alert" hidden></p>';
    $("step3").innerHTML = h;
  }

  /* --- Mensaje de WhatsApp --- */
  function weightLine() {
    var tot = 0, miss = 0;
    cart.forEach(function (l) { var w = Number(byId(l.id).weightGrams); if (w > 0) tot += w * l.qty; else miss += 1; });
    if (!tot) return "";
    return "Peso aprox. de las prendas (sin embalaje): " + new Intl.NumberFormat(CFG.locale || "es-AR").format(tot) + " g" + (miss ? " (faltan datos de peso en algunas prendas)" : "");
  }
  var PAYLABEL = { quote: "A coordinar cuando confirmemos el costo de envío (link de Mercado Pago o transferencia)", wa: "A coordinar por WhatsApp", bank: "Transferencia (envío el comprobante)", "mp-link": "Mercado Pago (link de pago)", "mp-auto": "Mercado Pago (pago online)" };
  function buildOrder(method) {
    readStep();
    var t = totals(), d = customer;
    var lines = ["*Pedido " + "{ID}" + "* — " + (CFG.storeName || "Tienda"), ""];
    cart.forEach(function (l) {
      var p = byId(l.id);
      lines.push("• " + l.qty + " × " + p.name + " (talle " + l.size + ") — " + fmt(p.price * l.qty) + (p.weightGrams > 0 ? " · " + p.weightGrams + " g c/u" : ""));
    });
    var wl = weightLine(); if (wl) lines.push(wl);
    lines.push("", "Subtotal: " + fmt(t.subtotal));
    if (t.q.method === "retiro") lines.push("Envío: $0 (retiro)");
    else if (t.q.free) lines.push("Envío: GRATIS");
    else if (t.pending) lines.push("Envío: *A COTIZAR* (según peso y medidas, confirmar por WhatsApp)" + (t.q.estimate != null ? " — orientativo ~" + fmt(t.q.estimate) : ""));
    else lines.push("Envío: " + fmt(t.shipping) + " (" + t.q.zoneName + (t.q.eta ? ", " + t.q.eta : "") + ")");
    lines.push(t.pending ? "*Total parcial (sin envío): " + fmt(t.subtotal) + "*" : "*Total: " + fmt(t.total) + "*");
    lines.push("Forma de pago: " + PAYLABEL[method], "", "*Datos del cliente*", "Nombre: " + d.name + " " + d.surname, "Teléfono: " + d.phone);
    if (d.email) lines.push("Email: " + d.email);
    if (d.dni) lines.push("DNI: " + d.dni);
    lines.push("", coDelivery() === "retiro" ? "*Entrega:* Retiro — " + (PICKUP.address || PICKUP.title) : "*Dirección de envío*", coDelivery() === "retiro" ? "" : addressLine(d, t));
    lines = lines.filter(function (x, i, a) { return !(x === "" && a[i - 1] === ""); });
    if (d.notes) lines.push("Notas: " + d.notes);
    return { method: method, subtotal: t.subtotal, shipping: t.shipping, total: t.total, pending: t.pending, free: t.q.free, retiro: t.q.method === "retiro", name: d.name, textTpl: lines.join("\n").replace(/\n+$/, "") };
  }
  function orderWaText(o) { return o.textTpl.replace("{ID}", o.id); }
  function openWhats(text) { window.open(whatsUrl(text), "_blank", "noopener"); }

  /* --- Confirmar --- */
  function setPayError(msg) { var e = $("payError"); if (!e) return; e.textContent = msg || ""; e.hidden = !msg; }
  function confirmOrder() {
    if (co.busy) return;
    readStep();
    var t = totals();
    var method = t.pending ? "quote" : co.pay === "mp" ? (MP.endpoint ? "mp-auto" : "mp-link") : co.pay;
    var o = buildOrder(method); o.id = orderId();
    saveCustomer();
    setPayError("");
    if (method === "mp-auto") return payMercadoPago(o);
    if (method === "mp-link") window.open(MP.paymentLink, "_blank", "noopener");
    finishOrder(o);
    if (method === "quote" || method === "wa") openWhats(orderWaText(o));
  }
  function finishOrder(o, status) {
    o.status = status || "";
    try { localStorage.setItem(LAST_KEY, JSON.stringify(o)); } catch (e) {}
    cart = []; saveCart();
    showConfirmation(o);
  }
  function mpPayload(o) {
    var d = customer, items = cart.map(function (l) { return { id: byId(l.id).id, size: l.size, quantity: l.qty }; });
    return {
      orderId: o.id, items: items, delivery: coDelivery(), notes: d.notes,
      payer: { name: d.name, surname: d.surname, email: d.email, phone: d.phone, dni: d.dni },
      address: coDelivery() === "envio" ? { province: d.province, city: d.city, street: d.street, floor: d.floor, zip: d.zip } : {}
    };
  }
  function payMercadoPago(o) {
    co.busy = true; var btn = $("stepNext"); btn.disabled = true; btn.textContent = "Conectando con Mercado Pago…";
    var failed = function (msg) {
      co.busy = false; btn.disabled = false; btn.textContent = confirmLabel();
      if (MP.paymentLink) { o.method = "mp-link"; window.open(MP.paymentLink, "_blank", "noopener"); finishOrder(o); toast("No pudimos abrir el pago automático. Usá el link de pago."); }
      else setPayError(msg || "No pudimos conectar con Mercado Pago. Probá de nuevo o elegí transferencia / WhatsApp.");
    };
    fetch(MP.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mpPayload(o)) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "Error"); return j; }); })
      .then(function (j) {
        if (!j.init_point) throw new Error("Respuesta inválida");
        if (typeof j.total === "number" && j.total !== o.total) throw new Error("El total cambió (" + fmt(j.total) + "). Volvé al carrito y revisalo.");
        o.status = "mp-redirect";
        try { localStorage.setItem(LAST_KEY, JSON.stringify(o)); } catch (e) {}
        window.location.href = j.init_point;
      })
      .catch(function (e) { failed(/total cambió/.test(e.message) ? e.message : ""); });
  }

  /* --- Pantalla "Pedido confirmado" --- */
  function confirmationBody(o) {
    var money = '<p class="order-total">' + fmt(o.pending ? o.subtotal : o.total) + (o.pending ? "<small>+ envío a cotizar</small>" : "") + "</p>";
    var h = "";
    var alias = BANK.alias ? esc(BANK.alias) : "";
    if (o.method === "quote") {
      h = '<ol class="next-list"><li><strong>Enviá tu pedido por WhatsApp</strong> con el botón de abajo (ya está escrito).</li>' +
        "<li>Pesamos y medimos tu pedido y te confirmamos el <strong>costo de envío y el total final</strong>.</li>" +
        "<li>Pagás ese total con un <strong>link de Mercado Pago</strong>" + (alias ? " o por <strong>transferencia al alias " + alias + "</strong>" : "") + ".</li></ol>" +
        '<p class="notice">Todavía no tenés que pagar nada.</p>';
    } else if (o.method === "bank") {
      h = '<p class="muted">Transferí <strong>' + fmt(o.total) + "</strong> y enviá el comprobante por WhatsApp indicando el pedido <strong>" + esc(o.id) + "</strong>.</p>" + bankHtml(o.total);
    } else if (o.method === "mp-link") {
      h = '<p class="muted">Pagá <strong>exactamente ' + fmt(o.total) + "</strong> en el link de Mercado Pago (incluye el envío). Si el link no te deja poner ese monto, transferí " + fmt(o.total) + (alias ? " al alias <strong>" + alias + "</strong>" : "") + ".</p>" +
        '<a class="btn btn--ghost btn--block" target="_blank" rel="noopener" href="' + esc(MP.paymentLink) + '">Abrir link de pago de Mercado Pago</a>' +
        '<p class="notice">Después enviá el comprobante por WhatsApp para que preparemos tu pedido.</p>';
    } else if (o.method === "mp-auto") {
      h = '<p class="muted">' + (o.status === "ok" ? "Recibimos tu pago, ¡gracias!" : "Tu pago está siendo procesado.") + " Si querés, enviá el pedido por WhatsApp para agilizar el envío.</p>";
    } else {
      h = '<p class="muted">Te escribimos por WhatsApp para coordinar el pago' + (o.retiro ? " y el retiro" : " y el envío") + ". Si no se abrió WhatsApp, usá el botón de abajo.</p>";
    }
    if (o.retiro && o.method !== "quote") h += '<p class="notice">Retiro: ' + esc(PICKUP.address || "te pasamos la dirección por WhatsApp.") + "</p>";
    var title = o.method === "quote" ? "Último paso: enviá tu pedido" : o.status === "pending" ? "Pago pendiente" : "¡Gracias, " + esc(o.name) + "!";
    return '<div class="done"><p class="eyebrow">Pedido confirmado · siguiente paso</p><h2 id="coTitle" tabindex="-1">' + title + "</h2>" +
      '<p class="order-id">Número de pedido <strong>' + esc(o.id) + "</strong></p>" + money +
      '<div class="done__body">' + h + "</div>" +
      '<a class="btn btn--gold btn--block" id="waSend" target="_blank" rel="noopener" href="' + esc(whatsUrl(orderWaText(o))) + '">Enviar comprobante / pedido por WhatsApp</a>' +
      '<button class="btn btn--ghost btn--block" style="margin-top:.8rem" data-close>Volver a la tienda</button></div>';
  }
  function showConfirmation(o) {
    $("checkoutBody").innerHTML = confirmationBody(o);
    var m = $("checkoutModal"); m.scrollTop = 0;
    var h = $("coTitle"); if (h) { try { h.focus({ preventScroll: true }); } catch (e) {} }
  }

  /* --- Eventos --- */
  var checkoutBody = $("checkoutBody");
  checkoutBody.addEventListener("click", function (e) {
    var t = e.target.closest("button"); if (!t) return;
    if (t.id === "backToCart") { renderCart(); openEl($("cartDrawer")); return; }
    if (t.id === "stepBack") { readStep(); goStep(co.step - 1); return; }
    if (t.hasAttribute("data-goto")) { readStep(); goStep(+t.getAttribute("data-goto")); return; }
    if (t.id === "clearData") {
      try { localStorage.removeItem(CUSTOMER_KEY); } catch (er) {}
      customer = {}; renderCheckout(); toast("Borramos tus datos guardados."); return;
    }
    if (t.classList.contains("copy")) {
      var v = t.getAttribute("data-copy");
      (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(function () { toast("Copiado: " + v); }, function () { toast(v); });
    }
  });
  checkoutBody.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!$("coForm")) return;
    if (co.step < 3) {
      if (!validateStep(co.step)) return;
      saveCustomer();
      goStep(co.step + 1);
    } else confirmOrder();
  });
  checkoutBody.addEventListener("input", function (e) {
    var el = e.target;
    if (el.closest && el.closest(".field.has-error") && el.name !== "province") setErr(el.name, "");
    if (["province", "zip"].indexOf(el.name) >= 0) updateShipBox();
  });
  checkoutBody.addEventListener("change", function (e) {
    var el = e.target;
    if (el.name === "province") { setErr("province", ""); updateShipBox(); }
    if (el.name === "delivery") {
      customer.delivery = el.value;
      $("homeFields").hidden = el.value !== "envio"; $("pickupInfo").hidden = el.value !== "retiro";
      updateShipBox();
    }
    if (el.name === "pay") {
      co.pay = el.value; $("payDetail").innerHTML = payDetailHtml(totals()); $("stepNext").textContent = confirmLabel();
    }
  });

  /* ---------- Vuelta desde Mercado Pago ---------- */
  function handleReturn() {
    var q = new URLSearchParams(location.search), r = q.get("pago");
    if (!r) return;
    history.replaceState(null, "", location.pathname + location.hash);
    var o = null; try { o = JSON.parse(localStorage.getItem(LAST_KEY) || "null"); } catch (e) {}
    if (r === "ok" || r === "pendiente") {
      cart = []; saveCart();
      o = o || { id: "—", method: "mp-auto", total: 0, subtotal: 0, name: "", textTpl: "Hola! Acabo de pagar un pedido en la tienda." };
      o.method = "mp-auto"; o.status = r === "ok" ? "ok" : "pending";
      openEl($("checkoutModal")); showConfirmation(o);
    } else { toast("El pago no se completó. Tu carrito sigue guardado."); }
  }

  /* ---------- Inicio ---------- */
  initStatic(); renderFilters(); renderGrid(); renderCartCount(); handleReturn();
})();
