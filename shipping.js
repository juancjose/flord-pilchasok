/*
 * CÁLCULO DE ENVÍO (no hace falta tocar este archivo).
 * Lo usa la página (navegador) a partir de la tabla "shipping" de config.js.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.Shipping = api;
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  // Las 24 jurisdicciones de Argentina (23 provincias + CABA)
  var CABA = "Ciudad Autónoma de Buenos Aires";
  var PROVINCES = [
    CABA, "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa",
    "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan",
    "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán"
  ];

  function plain(s) {
    s = String(s == null ? "" : s).toLowerCase().trim();
    try { s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch (e) {}
    return s.replace(/\./g, "").replace(/\s+/g, " ");
  }
  var INDEX = {};
  PROVINCES.forEach(function (p) { INDEX[plain(p)] = p; });
  [["caba", CABA], ["capital federal", CABA], ["ciudad de buenos aires", CABA], ["ciudad autonoma de buenos aires", CABA],
   ["capital", CABA], ["bs as", "Buenos Aires"], ["bsas", "Buenos Aires"], ["provincia de buenos aires", "Buenos Aires"],
   ["gba", "Buenos Aires"], ["tierra del fuego antartida e islas del atlantico sur", "Tierra del Fuego"]]
    .forEach(function (a) { INDEX[a[0]] = a[1]; });

  /** Devuelve el nombre oficial de la provincia ("" si no existe). Acepta "CABA", "cordoba", etc. */
  function normalizeProvince(s) { return INDEX[plain(s)] || ""; }

  /** Código postal: 4 números (1425) o CPA (C1425ABC). Devuelve { valid, digits, cpa }. */
  function parsePostal(s) {
    var v = String(s == null ? "" : s).replace(/[\s-]/g, "").toUpperCase();
    var m = /^(\d{4})$/.exec(v);
    if (m) return { valid: true, digits: m[1], cpa: "" };
    m = /^[A-Z](\d{4})[A-Z]{3}$/.exec(v);
    if (m) return { valid: true, digits: m[1], cpa: v };
    return { valid: false, digits: "", cpa: "" };
  }

  function num(x, def) { x = Number(x); return isFinite(x) && x >= 0 ? Math.round(x) : def; }

  /** Lee la configuración y completa lo que falte. Acepta window.CONFIG completo. */
  function getConfig(config) {
    config = config || {};
    var s = config.shipping || {};
    var out = {
      enabled: s.enabled !== false,
      // "quote" (por defecto): el costo se cotiza a mano y se confirma por WhatsApp. "zones": precio automático por zona.
      mode: s.mode === "zones" ? "zones" : "quote",
      showEstimate: s.showEstimate === true,
      freeShippingFrom: num(s.freeShippingFrom != null ? s.freeShippingFrom : config.freeShippingFrom, 0),
      defaultZone: s.defaultZone || "",
      zones: {},
      postalOverrides: [],
      pickup: {
        enabled: !(s.pickup && s.pickup.enabled === false),
        title: (s.pickup && s.pickup.title) || "Retiro por el punto de entrega",
        address: (s.pickup && s.pickup.address) || "",
        hours: (s.pickup && s.pickup.hours) || ""
      },
      home: {
        enabled: !(s.home && s.home.enabled === false),
        title: (s.home && s.home.title) || "Envío a domicilio"
      }
    };
    var zones = s.zones || {};
    Object.keys(zones).forEach(function (key) {
      var z = zones[key] || {};
      out.zones[key] = {
        key: key,
        name: z.name || key,
        price: num(z.price, 0),
        eta: z.eta || "",
        provinces: (z.provinces || []).map(normalizeProvince).filter(Boolean),
        postalRanges: (z.postalRanges || []).map(function (r) {
          return { province: normalizeProvince(r.province), from: num(r.from, 0), to: num(r.to, 0) };
        })
      };
    });
    if (!out.defaultZone || !out.zones[out.defaultZone]) {
      var keys = Object.keys(out.zones);
      out.defaultZone = keys.length ? keys[keys.length - 1] : "";
    }
    (s.postalOverrides || []).forEach(function (o) {
      if (!o) return;
      var list = [].concat(o.postalCodes || o.cp || []).map(function (c) { return String(c).replace(/\D/g, "").slice(0, 4); }).filter(function (c) { return c.length === 4; });
      if (!list.length) return;
      out.postalOverrides.push({ postalCodes: list, price: num(o.price, 0), eta: o.eta || "", name: o.name || "Tarifa especial" });
    });
    return out;
  }

  /**
   * Calcula el envío.
   * input: { method: "envio" | "retiro", province, postalCode, subtotal }
   * Devuelve { method, ok, pending, cost, baseCost, free, estimate, zone, zoneName, eta, source }
   *   ok=false      => todavía falta la provincia.
   *   pending=true  => modo "quote": el envío es a cotizar (cost = 0 hasta que la vendedora lo confirme).
   *   estimate      => (solo modo quote con showEstimate) precio orientativo de la zona, NO se suma al total.
   */
  function quote(cfg, input) {
    input = input || {};
    var subtotal = num(input.subtotal, 0);
    var isQuote = cfg.mode === "quote";
    if (input.method === "retiro") {
      return { method: "retiro", ok: !!cfg.pickup.enabled, pending: false, cost: 0, baseCost: 0, free: false, zone: "", zoneName: "Retiro", eta: "", source: "retiro" };
    }
    var province = normalizeProvince(input.province);
    if (!cfg.enabled) {
      return { method: "envio", ok: true, pending: false, cost: 0, baseCost: 0, free: false, zone: "", zoneName: "Envío a coordinar", eta: "", source: "disabled", province: province };
    }
    if (!province) return { method: "envio", ok: false, pending: isQuote, cost: 0, baseCost: 0, free: false, zone: "", zoneName: "", eta: "", source: "", province: "" };
    var cp = parsePostal(input.postalCode);
    var zone = null, source = "", price = null, eta = "", name = "";

    // 1) Precio especial por código postal
    if (cp.valid) {
      for (var i = 0; i < cfg.postalOverrides.length && !zone && price === null; i++) {
        var o = cfg.postalOverrides[i];
        if (o.postalCodes.indexOf(cp.digits) >= 0) { price = o.price; eta = o.eta; name = o.name; source = "override"; }
      }
    }
    // 2) Rango de códigos postales dentro de una provincia (ej. GBA dentro de Buenos Aires)
    if (price === null && cp.valid) {
      var n = parseInt(cp.digits, 10);
      Object.keys(cfg.zones).forEach(function (k) {
        if (zone) return;
        cfg.zones[k].postalRanges.forEach(function (r) {
          if (!zone && r.province === province && n >= r.from && n <= r.to) { zone = cfg.zones[k]; source = "range"; }
        });
      });
    }
    // 3) Zona por provincia
    if (price === null && !zone) {
      Object.keys(cfg.zones).forEach(function (k) {
        if (!zone && cfg.zones[k].provinces.indexOf(province) >= 0) { zone = cfg.zones[k]; source = "province"; }
      });
    }
    // 4) Zona por defecto (resto del país)
    if (price === null && !zone && cfg.defaultZone) { zone = cfg.zones[cfg.defaultZone]; source = "default"; }
    if (price === null) {
      if (!zone) { price = null; }
      else { price = zone.price; eta = zone.eta; name = zone.name; }
    }
    var free = cfg.freeShippingFrom > 0 && subtotal >= cfg.freeShippingFrom;
    var res = { method: "envio", ok: true, pending: false, province: province, cost: 0, baseCost: price || 0, free: free, estimate: null,
      zone: zone ? zone.key : "", zoneName: name, eta: eta, source: source };
    if (free) return res;
    if (isQuote) {
      res.pending = true; res.source = "quote";
      if (cfg.showEstimate && price !== null) res.estimate = price;
      else { res.zone = ""; res.zoneName = ""; res.eta = ""; }
      return res;
    }
    if (price === null) { res.ok = false; res.message = "Sin tarifa configurada"; return res; }
    res.cost = price;
    return res;
  }

  return { PROVINCES: PROVINCES, CABA: CABA, normalizeProvince: normalizeProvince, parsePostal: parsePostal, getConfig: getConfig, quote: quote };
});
