/* New design — calculator renderer and homepage filter.
   Calculator definitions (CALCS, fmt) come from calcs.js. */
(function () {
  "use strict";

  /* ---------- homepage filter ---------- */
  const filter = document.getElementById("filter");
  if (filter) {
    const groups = document.querySelectorAll("[data-group]");
    const empty = document.getElementById("no-match");
    filter.addEventListener("input", () => {
      const q = filter.value.trim().toLowerCase();
      let shown = 0;
      groups.forEach(g => {
        let inGroup = 0;
        g.querySelectorAll("li[data-search]").forEach(li => {
          const hit = !q || li.dataset.search.includes(q);
          li.hidden = !hit;
          if (hit) inGroup++;
        });
        g.hidden = inGroup === 0;
        shown += inGroup;
      });
      empty.hidden = shown > 0;
    });
  }

  /* ---------- calculator ---------- */
  const id = document.body.dataset.calc;
  if (!id || typeof CALCS === "undefined" || !CALCS[id]) return;
  const calc = CALCS[id];
  const form = document.getElementById("inputs");

  // Fields shown only in one mode (the weight calculator's reverse mode)
  const MODE_FIELDS = {
    weight: v => v.calcMode === "reverse"
      ? ["calcMode", "bar", "totalWeight", "stockLen"]
      : ["calcMode", "bar", "len", "qty"]
  };

  function buildFields() {
    form.innerHTML = "";
    calc.fields.forEach(f => {
      const wrap = document.createElement("div");
      wrap.className = "field";
      wrap.dataset.field = f.k;
      // Skip the unit when the label already carries one, e.g. "Quantity (pieces)"
      const label = f.label + (f.unit && !/\)$/.test(f.label) ? ` (${f.unit})` : "");
      if (f.type === "select") {
        // Bar defaults like "0.888|12" can differ from the rounded option value ("0.887|12"),
        // so fall back to matching the diameter after the "|".
        const dia = v => String(v).split("|")[1];
        const pick = f.options.find(o => o.v === f.default)
          || f.options.find(o => dia(o.v) !== undefined && dia(o.v) === dia(f.default));
        const opts = f.options.map(o =>
          `<option value="${o.v}"${o === pick ? " selected" : ""}>${o.t}</option>`).join("");
        wrap.innerHTML = `<label for="f-${f.k}">${label}</label><select id="f-${f.k}" data-key="${f.k}">${opts}</select>`;
      } else {
        wrap.innerHTML = `<label for="f-${f.k}">${label}</label>
          <input id="f-${f.k}" data-key="${f.k}" type="number" inputmode="decimal" step="${f.step || "any"}" min="0" value="${f.default}">`;
      }
      form.appendChild(wrap);
    });
  }

  function readValues() {
    const v = {};
    form.querySelectorAll("[data-key]").forEach(el => {
      v[el.dataset.key] = el.tagName === "SELECT" ? el.value : (parseFloat(el.value) || 0);
    });
    return v;
  }

  function update() {
    const v = readValues();
    const visible = MODE_FIELDS[id] && MODE_FIELDS[id](v);
    if (visible) form.querySelectorAll("[data-field]").forEach(w => { w.hidden = !visible.includes(w.dataset.field); });

    const res = calc.compute(v);
    const main = res.rows.find(r => r.primary) || res.rows[0];
    document.getElementById("r-label").textContent = main.label;
    document.getElementById("r-total").textContent = fmt(main.value);
    document.getElementById("r-unit").textContent = main.unit || "";
    document.getElementById("r-grid").innerHTML = res.rows.filter(r => r !== main).map(r =>
      `<div><dt>${r.label}</dt><dd>${fmt(r.value)}${r.unit ? ` <small>${r.unit}</small>` : ""}</dd></div>`).join("");
    document.getElementById("r-note").textContent = res.note || "";
  }

  buildFields();
  form.addEventListener("input", update);
  form.addEventListener("submit", e => e.preventDefault());
  document.getElementById("reset").addEventListener("click", () => { buildFields(); update(); });
  update();
})();
