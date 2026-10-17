/* Lógica de la tienda. No hace falta tocar este archivo. */
(function () {
  "use strict";
  var CFG = window.CONFIG || {};
  var MP = CFG.mercadoPago || {};
  var BANK = CFG.bankTransfer || {};
  var PRODUCTS = (window.PRODUCTS || []).filter(function (p) { return p && p.id; });

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

  /* ---------- Colores ---------- */
  function colorsOf(p) { return (p && p.colors || []).filter(function (c) { return c && c.name; }); }
  function colorByName(p, n) { return colorsOf(p).filter(function (c) { return c.name === n; })[0]; }
  function firstPhotoColor(p) { return colorsOf(p).filter(function (c) { return c.images && c.images.length; })[0]; }
  // Fotos a mostrar para un producto y color. Si el color no tiene fotos, usa las primeras disponibles.
  function imagesFor(p, colorName) {
    var c = colorByName(p, colorName);
    if (c && c.images && c.images.length) return { imgs: c.images, fallback: null };
    var imgs = p.images && p.images.length ? p.images : ((firstPhotoColor(p) || {}).images || []);
    var fc = firstPhotoColor(p);
    return { imgs: imgs, fallback: c && fc ? fc.name : null };
  }
  // Color que se está viendo y el siguiente (ciclo) para productos con varios colores
  function shownColor(p, colorName) {
    var cols = colorsOf(p); if (!cols.length) return null;
    if (colorByName(p, colorName)) return colorName;
    var first = imagesFor(p, null).imgs[0];
    var m = cols.filter(function (c) { return c.images && c.images.indexOf(first) >= 0; })[0];
    return (m || cols[0]).name;
  }
  function nextColor(p, colorName) {
    var cols = colorsOf(p), cur = shownColor(p, colorName), i = 0;
    cols.forEach(function (c, k) { if (c.name === cur) i = k; });
    return cols[(i + 1) % cols.length].name;
  }
  var cardColor = {};
  function lineKey(l) { return l.id + "|" + l.size + "|" + (l.color || ""); }
  function itemDesc(l) { return "talle " + l.size + (l.color ? ", color " + l.color : ""); }
  function byId(id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0]; }
  function digits(s) { return String(s || "").replace(/\D/g, ""); }

  /* ---------- Utilidades de UI ---------- */
  var openLayer = null;
  function lock(on) { document.body.classList.toggle("locked", on); }
  function openEl(el) {
    closeAll(true);
    $("overlay").hidden = false; el.hidden = false; openLayer = el; lock(true);
    var f = el.querySelector("button:not([data-close]), input"); if (f && window.innerWidth > 760) { try { f.focus({ preventScroll: true }); } catch (e) {} }
  }
  function closeAll(silent) {
    ["productModal"].forEach(function (id) { $(id).hidden = true; });
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
    $("perkShip").textContent = "Envíos a todo el país. Te cotizamos el costo por WhatsApp.";
    $("footShip").textContent = CFG.shippingNote || "";
    if (BANK.alias) $("footAlias").innerHTML = "Alias Mercado Pago: <strong>" + esc(BANK.alias) + "</strong>";
    $("pmShipNote").textContent = "Te respondemos por WhatsApp con stock, envío y formas de pago.";
    $("footCity").textContent = CFG.city || "";
    $("footHours").textContent = CFG.hours || "";
    $("footCopy").textContent = "© " + new Date().getFullYear() + " " + name + ". Todos los derechos reservados.";
    $("footWhats").href = whatsUrl(); $("footWhats").setAttribute("aria-label", "WhatsApp " + (CFG.whatsappDisplay || ""));
    $("whatsFab").href = whatsUrl("Hola! Quería consultar por una prenda.");
    var ig = String(CFG.instagram || "").replace(/^@/, "");
    $("footInsta").href = CFG.instagramUrl || ("https://www.instagram.com/" + ig + "/"); $("footInsta").setAttribute("aria-label", "Instagram @" + ig);
    $("topbar").textContent = "Envíos a todo el país · consultá stock por WhatsApp";
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
      var cc = cardColor[p.id] || null, imgs = imagesFor(p, cc).imgs, cols = colorsOf(p), multi = cols.length > 1;
      var sc = multi ? shownColor(p, cc) : null;
      return '<button class="card' + "" + '" data-id="' + esc(p.id) + '" aria-label="Ver ' + esc(p.name) + '">' +
        '<div class="card__media"' + "" + '>' +
        '<img src="' + esc(imgSrc(imgs[0])) + '" alt="' + esc(p.name) + '" loading="lazy">' +
        (imgs[1] ? '<img src="' + esc(imgSrc(imgs[1])) + '" alt="" loading="lazy">' : "") +
        (p.soldOut ? '<span class="badge">Agotado</span>' : "") +
        "</div>" +
        '<p class="card__cat">' + esc(p.category || "") + "</p>" +
        '<h3 class="card__name">' + esc(p.name) + "</h3>" +
        (cols.length ? '<p class="card__swatches" aria-label="Colores: ' + esc(cols.map(function (c) { return c.name; }).join(", ")) + '">' + cols.map(function (c) {
          return '<span class="swatch-dot' + (c.name === sc ? " is-active" : "") + '" style="background:' + esc(c.hex || "#888") + '" title="' + esc(c.name) + '"></span>';
        }).join("") + "</p>" : "") +
        '<p class="card__price">' + fmt(p.price) + "</p></button>";
    }).join("");
  }
  $("filters").addEventListener("click", function (e) {
    var b = e.target.closest("[data-cat]"); if (!b) return;
    activeCat = b.getAttribute("data-cat"); renderFilters(); renderGrid();
  });
  $("grid").addEventListener("click", function (e) {
    var c = e.target.closest("[data-id]"); if (!c) return;
    var id = c.getAttribute("data-id"), p = byId(id);
    openProduct(id);
  });

  /* ---------- Detalle de producto ---------- */
  var current = null, currentSize = null, currentColor = null;
  function renderGallery() {
    var r = imagesFor(current, currentColor), imgs = r.imgs.length ? r.imgs : [""];
    setMainImage(imgs[0], current.name + (currentColor ? " — color " + currentColor : ""));
    $("pmThumbs").innerHTML = imgs.length > 1 ? imgs.map(function (im, i) {
      return '<button class="' + (i === 0 ? "is-active" : "") + '" data-img="' + esc(im) + '" aria-label="Foto ' + (i + 1) + '"><img src="' + esc(imgSrc(im)) + '" alt=""></button>';
    }).join("") : "";
    var n = $("pmColorNote"); n.hidden = !r.fallback; n.textContent = r.fallback ? "Foto ilustrativa en color " + r.fallback.toLowerCase() : "";
  }
  function renderColors() {
    var cols = colorsOf(current);
    $("pmColorsWrap").hidden = !cols.length;
    $("pmColorName").textContent = currentColor || "";
    $("pmColors").innerHTML = cols.map(function (c) {
      var on = c.name === currentColor;
      return '<button type="button" class="color' + (on ? " is-active" : "") + '" role="radio" aria-checked="' + on + '" aria-label="' + esc(c.name) + '" title="' + esc(c.name) + '" data-color="' + esc(c.name) + '"><span class="color__dot" style="background:' + esc(c.hex || "#888") + '"></span><span class="color__name">' + esc(c.name) + "</span></button>";
    }).join("");
  }
  function openProduct(id) {
    var p = byId(id); if (!p) return;
    current = p;
    currentSize = sizeLabel(p);
    $("pmTalle").textContent = "Talle " + (currentSize === "Único" ? "único" : currentSize);
    var cols = colorsOf(p);
    currentColor = cols.length === 1 ? cols[0].name : (cardColor[id] || shownColor(p, null));
    $("productModal").classList.toggle("pm--multi", cols.length > 1);
    $("pmCycleHint").hidden = cols.length < 2;
    $("pmPrev").hidden = $("pmNext").hidden = cols.length < 2;
    $("colorError").hidden = true;
    renderColors();
    $("pmCategory").textContent = p.category || "";
    $("pmName").textContent = p.name;
    $("pmPrice").textContent = fmt(p.price);
    $("pmDesc").textContent = p.description || "";
    renderGallery();
    updateConsult();
    openEl($("productModal"));
    $("productModal").scrollTop = 0;
  }
  function setMainImage(im, alt) { var el = $("pmImage"); el.src = imgSrc(im); el.alt = alt || ""; }
  $("pmThumbs").addEventListener("click", function (e) {
    var b = e.target.closest("[data-img]"); if (!b) return;
    setMainImage(b.getAttribute("data-img"), current.name);
    Array.prototype.forEach.call($("pmThumbs").children, function (x) { x.classList.toggle("is-active", x === b); });
  });
  function setColor(name) {
    currentColor = name; $("colorError").hidden = true; cardColor[current.id] = name;
    renderColors(); renderGallery(); updateConsult();
  }
  function stepColor(dir) {
    var cols = colorsOf(current); if (!current || cols.length < 2) return;
    var cur = shownColor(current, currentColor), i = 0;
    cols.forEach(function (c, k) { if (c.name === cur) i = k; });
    setColor(cols[(i + dir + cols.length) % cols.length].name);
  }
  $("pmImage").addEventListener("click", function () { stepColor(1); });
  $("pmPrev").addEventListener("click", function (e) { e.stopPropagation(); stepColor(-1); });
  $("pmNext").addEventListener("click", function (e) { e.stopPropagation(); stepColor(1); });
  $("pmColors").addEventListener("click", function (e) {
    var b = e.target.closest("[data-color]"); if (!b) return;
    setColor(b.getAttribute("data-color"));
  });
  function sizeLabel(p) { var s = (p.sizes || []).filter(Boolean); return s.length ? s.join(" / ") : "Único"; }
  function consultText(p, color) {
    var link = location.origin + location.pathname + "#p=" + encodeURIComponent(p.id) + (color ? "&c=" + encodeURIComponent(color) : "");
    return "Hola Nancy! Quería consultar stock de: " + p.name.toUpperCase() + (color ? " - Color: " + color : "") + " - Talle " + sizeLabel(p) + " - " + fmt(p.price) + "\n" + link;
  }
  function updateConsult() { if (current) $("pmConsult").href = whatsUrl(consultText(current, currentColor)); }
  // Abrir un producto desde un enlace compartido (#p=id&c=color)
  function openFromHash() {
    var m = /[#&]p=([^&]+)/.exec(location.hash); if (!m) return;
    var id = decodeURIComponent(m[1]), c = /[&]c=([^&]+)/.exec(location.hash), p = byId(id); if (!p) return;
    if (c && colorByName(p, decodeURIComponent(c[1]))) cardColor[id] = decodeURIComponent(c[1]);
    openProduct(id);
  }

  /* ---------- Inicio ---------- */
  initStatic(); renderFilters(); renderGrid(); openFromHash();
})();
