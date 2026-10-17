/* Flor de Pilchas · panel de administración
   Supabase Auth (email + contraseña) + tabla "products" protegida con RLS + fotos en Storage (bucket "products"). */
(function () {
  "use strict";
  var CFG = window.CONFIG || {};
  var SB_URL = String(CFG.supabaseUrl || "").replace(/\/+$/, ""), SB_KEY = CFG.supabaseAnonKey || "";
  var BUCKET = "products", SITE = location.origin + location.pathname.replace(/admin(\.html)?\/?$/, "");
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
  var fmt = function (n) { return money.format(Number(n) || 0); };
  var slug = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80); };
  // Fotos guardadas solo con el nombre (las de products.js) se muestran desde la web publicada
  var src = function (u) { return u || "placeholder.svg"; };
  var sb = null, products = [], cur = null, removedUrls = [];

  function toast(m) { var t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove("show"); }, 2800); }
  function show(view) { $$("main > section").forEach(function (s) { s.hidden = s.id !== "v-" + view; }); window.scrollTo(0, 0); }
  function message(title, html) { $("#msg-title").textContent = title; $("#msg-text").innerHTML = html; show("msg"); }
  function fail(e, what) { if (window.console) console.error(e); toast(what + ": " + ((e && e.message) || e)); }
  function errBox(id, m) { var el = $(id); el.textContent = m || ""; el.hidden = !m; }

  /* ---------- Sesión ---------- */
  // Enlaces de invitación / recuperación: #access_token=…&type=invite|recovery · ?code=… · ?token_hash=…&type=…
  var hashP = new URLSearchParams(location.hash.slice(1)), queryP = new URLSearchParams(location.search);
  var linkType = hashP.get("type") || queryP.get("type") || "";
  var linkError = hashP.get("error_description") || queryP.get("error_description");
  var mustSetPassword = linkType === "invite" || linkType === "recovery";
  function cleanUrl() { history.replaceState(null, "", location.pathname); }

  function init() {
    if (!SB_URL || !SB_KEY) {
      return message("Panel sin configurar", "Todavía no se cargaron los datos de Supabase en <b>config.js</b> (<code>supabaseUrl</code> y <code>supabaseAnonKey</code>).<br>Seguí la guía <b>SUPABASE.md</b> del repositorio.");
    }
    if (!window.supabase || !window.supabase.createClient) return message("No se pudo cargar el panel", "Revisá la conexión a internet y recargá la página.");
    sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    sb.auth.onAuthStateChange(function (ev) {
      if (ev === "SIGNED_OUT") location.replace(location.pathname);
      if (ev === "PASSWORD_RECOVERY" && !mustSetPassword) { mustSetPassword = true; showPassword(); }
    });
    if (linkError) {
      cleanUrl(); show("login");
      return errBox("#login-err", /expired|invalid/i.test(linkError) ? "El enlace venció o ya se usó. Pedí uno nuevo con «¿Olvidaste tu contraseña?»." : linkError);
    }
    var step = Promise.resolve();
    if (queryP.get("code")) {
      step = sb.auth.exchangeCodeForSession(queryP.get("code")).then(function (r) { if (r.error) throw r.error; mustSetPassword = true; });
    } else if (queryP.get("token_hash") && linkType) {
      step = sb.auth.verifyOtp({ token_hash: queryP.get("token_hash"), type: linkType }).then(function (r) { if (r.error) throw r.error; });
    }
    step.then(function () { return sb.auth.getSession(); }).then(function (r) {
      var session = r.data && r.data.session;
      if (location.hash || location.search) cleanUrl();
      if (!session) return show("login");
      if (mustSetPassword) return showPassword(session);
      enter(session);
    }).catch(function () { cleanUrl(); show("login"); errBox("#login-err", "El enlace venció o no es válido en este navegador. Pedí uno nuevo."); });
  }
  function enter(session) {
    $("#uemail").textContent = session.user.email; $("#user").hidden = false;
    sb.rpc("is_admin").then(function (r) {
      if (r.error || !r.data) return message("Sin permisos", "El usuario <b>" + esc(session.user.email) + "</b> no es administrador. Pedile a quien configuró Supabase que ejecute <b>admins.sql</b> con este email.");
      show("products"); loadProducts();
    });
  }
  function showPassword(session) {
    var go = session ? Promise.resolve(session) : sb.auth.getSession().then(function (r) { return r.data.session; });
    go.then(function (s) {
      if (!s) return show("login");
      $("#pwd-email").textContent = s.user.email; $("#pwd").reset(); errBox("#pwd-err"); show("password");
    });
  }
  $("#pwd").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = new FormData(e.target), pw = String(f.get("password") || ""), btn = $("button", e.target);
    if (pw.length < 8) return errBox("#pwd-err", "La contraseña tiene que tener al menos 8 caracteres.");
    if (pw !== f.get("confirm")) return errBox("#pwd-err", "Las contraseñas no coinciden.");
    btn.disabled = true;
    sb.auth.updateUser({ password: pw }).then(function (r) {
      btn.disabled = false;
      if (r.error) return errBox("#pwd-err", /different from the old/i.test(r.error.message) ? "La contraseña nueva tiene que ser distinta de la anterior." : r.error.message);
      mustSetPassword = false; toast("Contraseña guardada");
      return sb.auth.getSession().then(function (s) { enter(s.data.session || { user: r.data.user }); });
    });
  });
  $("#login").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = new FormData(e.target), btn = $("button[type=submit]", e.target);
    if (!f.get("email") || !f.get("password")) return errBox("#login-err", "Completá email y contraseña.");
    btn.disabled = true; errBox("#login-err");
    sb.auth.signInWithPassword({ email: String(f.get("email")).trim(), password: f.get("password") }).then(function (r) {
      btn.disabled = false;
      if (r.error) return errBox("#login-err", r.error.message === "Invalid login credentials" ? "Email o contraseña incorrectos." : r.error.message);
      enter(r.data.session);
    });
  });
  $("#forgot").addEventListener("click", function () { $("#forgot-email").value = $("#login [name=email]").value; errBox("#forgot-err"); $("#forgot-ok").hidden = true; show("forgot"); });
  $("#forgot-back").addEventListener("click", function () { show("login"); });
  $("#forgotf").addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = $("button[type=submit]", e.target), email = $("#forgot-email").value.trim();
    if (!email) return errBox("#forgot-err", "Escribí tu email.");
    btn.disabled = true; errBox("#forgot-err"); $("#forgot-ok").hidden = true;
    sb.auth.resetPasswordForEmail(email, { redirectTo: SITE + "admin" }).then(function (r) {
      btn.disabled = false;
      if (r.error) return errBox("#forgot-err", /rate limit|security purposes/i.test(r.error.message) ? "Esperá unos minutos antes de pedir otro enlace." : r.error.message);
      $("#forgot-ok").hidden = false;
    });
  });
  $("#logout").addEventListener("click", function () { sb.auth.signOut(); });

  /* ---------- Lista de productos ---------- */
  function loadProducts() {
    return sb.from("products").select("*").order("sort", { ascending: true }).order("name", { ascending: true }).then(function (r) {
      if (r.error) return fail(r.error, "No se pudieron cargar los productos");
      products = r.data || []; fillCategories(); renderList();
    });
  }
  function categories() { var c = []; products.forEach(function (p) { if (p.category && c.indexOf(p.category) < 0) c.push(p.category); }); return c.sort(); }
  function fillCategories() {
    var sel = $("#pcat"), v = sel.value;
    sel.innerHTML = '<option value="">Todas las categorías</option>' + categories().map(function (c) { return '<option>' + esc(c) + "</option>"; }).join("");
    sel.value = v; $("#catlist").innerHTML = categories().map(function (c) { return '<option value="' + esc(c) + '">'; }).join("");
  }
  function firstImage(p) {
    var c = (p.colors || []).filter(function (x) { return x && x.images && x.images.length; })[0];
    return (p.images && p.images[0]) || (c && c.images[0]) || "";
  }
  function renderList() {
    var q = slug($("#psearch").value), cat = $("#pcat").value, st = $("#pstate").value;
    var list = products.filter(function (p) {
      return (!q || slug(p.name + " " + p.id + " " + p.category + " " + (p.colors || []).map(function (c) { return c.name; }).join(" ")).indexOf(q) >= 0)
        && (!cat || p.category === cat)
        && (!st || (st === "visible" && p.active) || (st === "hidden" && !p.active) || (st === "soldout" && p.sold_out));
    });
    $("#pcount").textContent = "(" + products.length + ")";
    $("#pempty").hidden = list.length > 0;
    $("#plist").innerHTML = list.map(function (p) {
      return '<li class="prow" tabindex="0" data-id="' + esc(p.id) + '"><img src="' + esc(src(firstImage(p))) + '" alt="" loading="lazy">' +
        '<div><div class="prow__name">' + esc(p.name) + '</div><div class="prow__meta"><span>' + esc(p.category) + "</span><span>Talle " + esc((p.sizes || []).join(" / ") || "Único") + "</span>" +
        ((p.colors || []).length ? '<span class="dots">' + p.colors.map(function (c) { return '<i title="' + esc(c.name) + '" style="background:' + esc(c.hex || "#888") + '"></i>'; }).join("") + "</span>" : "") +
        (p.sold_out ? '<span class="pill pill--out">Agotado</span>' : "") + (!p.active ? '<span class="pill pill--hidden">Oculto</span>' : "") +
        '</div></div><div class="prow__price">' + fmt(p.price) + "</div></li>";
    }).join("");
  }
  ["#psearch", "#pcat", "#pstate"].forEach(function (s) { $(s).addEventListener("input", renderList); });
  $("#plist").addEventListener("click", function (e) { var li = e.target.closest("[data-id]"); if (li) edit(li.getAttribute("data-id")); });
  $("#plist").addEventListener("keydown", function (e) { if (e.key === "Enter") { var li = e.target.closest("[data-id]"); if (li) edit(li.getAttribute("data-id")); } });
  $("#pnew").addEventListener("click", function () { edit(null); });

  /* ---------- Edición ---------- */
  var F = function (n) { return $("#eform").elements[n]; };
  function edit(id) {
    var p = id ? products.filter(function (x) { return x.id === id; })[0] : null;
    var maxSort = products.reduce(function (m, x) { return Math.max(m, x.sort || 0); }, 0);
    cur = p ? JSON.parse(JSON.stringify(p)) : { id: "", name: "", price: 0, category: "", description: "", sizes: ["Único"], colors: [], images: [], active: true, sold_out: false, sort: maxSort + 10 };
    cur._isNew = !p; cur._idTouched = !!p; removedUrls = [];
    cur.colors = (cur.colors || []).map(function (c) { return { name: c.name || "", hex: c.hex || "#888888", images: (c.images || []).slice() }; });
    cur.images = (cur.images || []).slice();
    $("#etitle").textContent = p ? p.name : "Nuevo producto";
    F("name").value = cur.name; F("price").value = cur.price; F("category").value = cur.category; F("description").value = cur.description || "";
    F("sizes").value = (cur.sizes || []).join(", "); F("id").value = cur.id; F("id").readOnly = !!p; F("id").title = p ? "El ID no se cambia para no romper enlaces ya compartidos" : "";
    F("sort").value = cur.sort; F("active").checked = !!cur.active; F("sold_out").checked = !!cur.sold_out;
    $("#edelete").hidden = !p;
    $$("#eform input, #eform textarea").forEach(function (i) { i.classList.remove("touched"); });
    renderColors(); renderPhotos($(".photos[data-target=general]"), cur.images, "general"); preview();
    show("edit");
  }
  function readForm() {
    cur.name = F("name").value.trim(); cur.price = Math.max(0, parseInt(F("price").value, 10) || 0);
    cur.category = F("category").value.trim(); cur.description = F("description").value.trim();
    cur.sizes = F("sizes").value.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    if (!cur.sizes.length) cur.sizes = ["Único"];
    if (cur._isNew && !cur._idTouched) F("id").value = slug(cur.name);
    cur.id = F("id").value.trim(); cur.sort = parseInt(F("sort").value, 10) || 0;
    cur.active = F("active").checked; cur.sold_out = F("sold_out").checked;
  }
  $("#eform").addEventListener("input", function (e) {
    if (e.target.name === "id") cur._idTouched = true;
    if (e.target.matches("[data-cname],[data-chex],[data-chex-text]")) return;
    readForm(); preview();
  });
  $("#eform").addEventListener("blur", function (e) { if (e.target.matches("input,textarea")) e.target.classList.add("touched"); }, true);
  function preview() {
    var c = cur.colors[0], size = (cur.sizes || []).join(" / ") || "Único";
    var name = (cur.name || "Nombre del producto").toUpperCase();
    var txt = (cur.sold_out ? "Hola Nancy! ¿Va a volver a entrar? Me interesa: " : "Hola Nancy! Quería consultar stock de: ") + name +
      (c && c.name ? " - Color: " + c.name : "") + " - Talle " + size + " - " + fmt(cur.price) + "\n" + SITE + "#p=" + (cur.id || "id");
    $("#wapreview").textContent = txt;
  }

  /* ---------- Colores ---------- */
  function renderColors() {
    var box = $("#colors");
    box.innerHTML = cur.colors.map(function (c, i) {
      return '<div class="color" data-ci="' + i + '"><div class="color__head">' +
        '<label title="Color de la muestra"><input type="color" data-chex="' + i + '" value="' + esc(/^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex : "#888888") + '" aria-label="Muestra"></label>' +
        '<label>Nombre del color<input data-cname="' + i + '" value="' + esc(c.name) + '" placeholder="Negro, Beige…" required></label>' +
        '<label class="hexwrap">Código<input data-chex-text="' + i + '" value="' + esc(c.hex) + '" maxlength="7"></label>' +
        '<div class="color__btns"><button type="button" class="ibtn" data-cmove="' + i + ',-1" title="Subir" aria-label="Subir color">↑</button><button type="button" class="ibtn" data-cmove="' + i + ',1" title="Bajar" aria-label="Bajar color">↓</button><button type="button" class="ibtn ibtn--rm" data-crm="' + i + '" title="Quitar color" aria-label="Quitar color">×</button></div>' +
        '</div><div class="photos" data-target="' + i + '"></div></div>';
    }).join("");
    cur.colors.forEach(function (c, i) { renderPhotos($('.photos[data-target="' + i + '"]', box), c.images, i); });
    $("#genwrap").hidden = cur.colors.length > 0 && !cur.images.length;
  }
  $("#colors").addEventListener("input", function (e) {
    var t = e.target, i;
    if (t.hasAttribute("data-cname")) { cur.colors[+t.getAttribute("data-cname")].name = t.value.trim(); preview(); }
    if (t.hasAttribute("data-chex")) { i = +t.getAttribute("data-chex"); cur.colors[i].hex = t.value; $('[data-chex-text="' + i + '"]').value = t.value; }
    if (t.hasAttribute("data-chex-text")) { i = +t.getAttribute("data-chex-text"); var v = t.value.trim(); if (v && v[0] !== "#") v = "#" + v; cur.colors[i].hex = v; if (/^#[0-9a-f]{6}$/i.test(v)) $('[data-chex="' + i + '"]').value = v; }
  });
  $("#colors").addEventListener("click", function (e) {
    var m = e.target.closest("[data-cmove]"), r = e.target.closest("[data-crm]");
    if (m) { var a = m.getAttribute("data-cmove").split(","), i = +a[0], j = i + (+a[1]); if (j < 0 || j >= cur.colors.length) return; var t = cur.colors[i]; cur.colors[i] = cur.colors[j]; cur.colors[j] = t; renderColors(); preview(); }
    if (r) { var k = +r.getAttribute("data-crm"), c = cur.colors[k]; if (!confirm("¿Quitar el color «" + (c.name || "sin nombre") + "» y sus fotos?")) return; removedUrls = removedUrls.concat(c.images); cur.colors.splice(k, 1); renderColors(); preview(); }
  });
  $("#caddcolor").addEventListener("click", function () { cur.colors.push({ name: "", hex: "#888888", images: [] }); renderColors(); var n = $$("[data-cname]").pop(); if (n) n.focus(); });

  /* ---------- Fotos ---------- */
  function listFor(target) { return target === "general" ? cur.images : cur.colors[+target].images; }
  function renderPhotos(box, imgs, target) {
    box.innerHTML = imgs.map(function (u, i) {
      return '<div class="ph"><img src="' + esc(src(u)) + '" alt="Foto ' + (i + 1) + '" loading="lazy"><div class="ph__ctl">' +
        '<button type="button" class="ibtn" data-pmove="' + i + ',-1" aria-label="Mover a la izquierda">←</button>' +
        '<button type="button" class="ibtn ibtn--rm" data-prm="' + i + '" aria-label="Quitar foto">×</button>' +
        '<button type="button" class="ibtn" data-pmove="' + i + ',1" aria-label="Mover a la derecha">→</button></div></div>';
    }).join("") + '<label class="ph--up">+ Subir fotos<input type="file" accept="image/*" multiple data-up="' + target + '"></label>';
  }
  function rerenderPhotos(target) {
    if (target === "general") renderPhotos($(".photos[data-target=general]"), cur.images, "general");
    else renderPhotos($('.photos[data-target="' + target + '"]'), cur.colors[+target].images, target);
  }
  $("#eform").addEventListener("click", function (e) {
    var box = e.target.closest(".photos"); if (!box) return;
    var target = box.getAttribute("data-target"), list = listFor(target);
    var m = e.target.closest("[data-pmove]"), r = e.target.closest("[data-prm]");
    if (m) { var a = m.getAttribute("data-pmove").split(","), i = +a[0], j = i + (+a[1]); if (j < 0 || j >= list.length) return; var t = list[i]; list[i] = list[j]; list[j] = t; rerenderPhotos(target); }
    if (r) { var k = +r.getAttribute("data-prm"); removedUrls.push(list[k]); list.splice(k, 1); rerenderPhotos(target); }
  });
  $("#eform").addEventListener("change", function (e) {
    var inp = e.target; if (!inp.hasAttribute("data-up")) return;
    var files = Array.prototype.slice.call(inp.files || []), target = inp.getAttribute("data-up"); inp.value = "";
    readForm();
    if (!cur.id) { F("name").focus(); return toast("Primero escribí el nombre del producto"); }
    var label = inp.closest(".ph--up"); label.classList.add("ph--busy");
    var colorName = target === "general" ? "foto" : (cur.colors[+target].name || "color");
    files.reduce(function (chain, file, n) {
      return chain.then(function () {
        label.firstChild.textContent = "Subiendo " + (n + 1) + "/" + files.length + "…";
        return resizeImage(file).then(function (blob) {
          var ext = blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";
          var path = cur.id + "/" + slug(colorName) + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + "." + ext;
          return sb.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: "31536000", upsert: false }).then(function (r) {
            if (r.error) throw r.error;
            listFor(target).push(sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
          });
        }).catch(function (err) { fail(err, "No se pudo subir " + file.name); });
      });
    }, Promise.resolve()).then(function () {
      rerenderPhotos(target); toast("Fotos listas. Acordate de tocar «Guardar».");
    });
  });
  // Achica la foto a 800×1000 (4:5). Si tiene fondo transparente se muestra entera; si no, se recorta para llenar.
  function resizeImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        var W = 800, H = 1000, c = document.createElement("canvas"); c.width = W; c.height = H;
        var ctx = c.getContext("2d"), iw = img.naturalWidth, ih = img.naturalHeight;
        var transparent = hasAlpha(img, iw, ih), s = transparent ? Math.min(W / iw, H / ih) : Math.max(W / iw, H / ih);
        var dw = iw * s, dh = ih * s;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, (W - dw) / 2, transparent ? (H - dh) / 2 : Math.min(0, (H - dh) * 0.35), dw, dh);
        c.toBlob(function (b) { b ? resolve(b) : reject(new Error("No se pudo procesar la imagen")); }, "image/webp", 0.86);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("El archivo no es una imagen válida")); };
      img.src = url;
    });
  }
  function hasAlpha(img, iw, ih) {
    try {
      var t = document.createElement("canvas"); t.width = 48; t.height = 60; var x = t.getContext("2d");
      x.drawImage(img, 0, 0, 48, 60); var d = x.getImageData(0, 0, 48, 60).data;
      for (var i = 3; i < d.length; i += 4) if (d[i] < 250) return true;
    } catch (e) {}
    return false;
  }

  /* ---------- Guardar / eliminar ---------- */
  function ownPath(u) { var m = String(u || "").split("/storage/v1/object/public/" + BUCKET + "/"); return m.length === 2 ? decodeURIComponent(m[1].split("?")[0]) : null; }
  $("#eform").addEventListener("submit", function (e) {
    e.preventDefault(); readForm();
    $$("#eform input, #eform textarea").forEach(function (i) { i.classList.add("touched"); });
    if (!cur.name) return toast("Falta el nombre"), F("name").focus();
    if (!cur.category) return toast("Falta la categoría"), F("category").focus();
    if (!/^[a-z0-9-]+$/.test(cur.id)) return toast("El ID solo puede tener letras minúsculas, números y guiones"), F("id").focus();
    if (cur._isNew && products.some(function (p) { return p.id === cur.id; })) return toast("Ya existe un producto con ese ID"), F("id").focus();
    var bad = cur.colors.filter(function (c) { return !c.name; })[0];
    if (bad) return toast("Hay un color sin nombre");
    var row = { id: cur.id, name: cur.name, price: cur.price, category: cur.category, description: cur.description, sizes: cur.sizes,
      colors: cur.colors.map(function (c) { return { name: c.name, hex: c.hex, images: c.images }; }), images: cur.images,
      active: cur.active, sold_out: cur.sold_out, sort: cur.sort };
    var btn = $("#esave"); btn.disabled = true;
    var q = cur._isNew ? sb.from("products").insert(row) : sb.from("products").update(row).eq("id", cur.id);
    q.then(function (r) {
      btn.disabled = false;
      if (r.error) return fail(r.error, "No se pudo guardar");
      var still = JSON.stringify(row), paths = removedUrls.filter(function (u) { return still.indexOf(u) < 0; }).map(ownPath).filter(Boolean);
      if (paths.length) sb.storage.from(BUCKET).remove(paths);
      toast("Guardado ✓ (la tienda se actualiza en unos segundos)");
      loadProducts().then(function () { show("products"); });
    });
  });
  $("#edelete").addEventListener("click", function () {
    if (!cur || cur._isNew) return;
    if (!confirm("¿Eliminar «" + cur.name + "» de la tienda? Esto no se puede deshacer.\n(Si solo querés esconderlo, desactivá «Visible en la tienda».)")) return;
    sb.from("products").delete().eq("id", cur.id).then(function (r) {
      if (r.error) return fail(r.error, "No se pudo eliminar");
      var all = cur.images.concat.apply(cur.images, cur.colors.map(function (c) { return c.images; })).concat(removedUrls);
      var paths = all.map(ownPath).filter(Boolean);
      if (paths.length) sb.storage.from(BUCKET).remove(paths);
      toast("Producto eliminado"); loadProducts().then(function () { show("products"); });
    });
  });
  $("#eback").addEventListener("click", function () { show("products"); renderList(); });

  init();
})();
