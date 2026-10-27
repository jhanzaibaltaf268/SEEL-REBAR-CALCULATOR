/* ============================================================
   New design preview — English only, mobile-first.
   Run: node new-design/build.js
   Reads page content from ../build.js and calculator logic from
   ../script.js, so this copy never drifts from the live site.
   Pages are noindex and are not listed in any sitemap.
   ============================================================ */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const OUT = __dirname;
const src = fs.readFileSync(path.join(ROOT, "build.js"), "utf8");

/* ---------- read content from the main build ---------- */
function evalBlock(startMarker, endMarker) {
  const a = src.indexOf(startMarker);
  const b = src.indexOf(endMarker, a);
  if (a < 0 || b < 0) throw new Error("block not found: " + startMarker);
  const literal = src.slice(a + startMarker.length - 1, b + endMarker.length - 1);
  return vm.runInNewContext("(" + literal + ")");
}
const PAGES = evalBlock("const PAGES = [", "\n];");
const SILOS = evalBlock("const SILOS = [", "\n];");
const SILO_H1 = evalBlock("const SILO_H1_EN = {", "\n};");
const SILO_SUB = {};
for (const m of src.matchAll(/^  (\w+): \{\s*heroSub: "([^"]*)"/gm)) SILO_SUB[m[1]] = m[2];

/* calculator data + compute functions (everything before the DOM layer) */
const script = fs.readFileSync(path.join(ROOT, "script.js"), "utf8");
const cut = script.indexOf("const $ = id =>");
if (cut < 0) throw new Error("script.js layout changed: DOM marker not found");
fs.mkdirSync(path.join(OUT, "assets"), { recursive: true });
fs.writeFileSync(path.join(OUT, "assets", "calcs.js"),
  "/* Generated from ../script.js by new-design/build.js — do not edit. */\n" + script.slice(0, cut));

/* ---------- helpers ---------- */
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = slug => slug + ".html";
const siloOf = p => SILOS.find(s => s.cat === p.cat);
const pagesIn = s => PAGES.filter(p => p.cat === s.cat);

function layout({ title, desc, body, calc }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="robots" content="noindex, nofollow" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<link rel="icon" type="image/svg+xml" href="../favicon.svg" />
<link rel="stylesheet" href="assets/style.css" />
</head>
<body${calc ? ` data-calc="${calc}"` : ""}>
<header class="top">
  <div class="wrap top-in">
    <a class="brand" href="index.html">Rebar<b>Calc</b></a>
    <a class="top-link" href="index.html#all">All calculators</a>
  </div>
</header>
<main class="wrap">
${body}
</main>
<footer class="foot">
  <div class="wrap">
    <nav class="foot-groups" aria-label="Calculator groups">
      ${SILOS.map(s => `<a href="${href(s.slug)}">${esc(SILO_H1[s.cat])}</a>`).join("\n      ")}
    </nav>
    <p class="note">Results are estimates for material planning. Check them against your drawings and local building code; structural design needs a qualified engineer.</p>
  </div>
</footer>
${calc ? `<script src="assets/calcs.js"></script>\n` : ""}<script src="assets/app.js"></script>
</body>
</html>
`;
}

const crumbs = items => `<nav class="crumbs" aria-label="Breadcrumb">${items
  .map(i => i.href ? `<a href="${i.href}">${esc(i.name)}</a>` : `<span aria-current="page">${esc(i.name)}</span>`)
  .join('<span class="sep" aria-hidden="true">/</span>')}</nav>`;

const calcList = pages => `<ul class="list">
${pages.map(p => `  <li data-search="${esc((p.h1 + " " + p.kw).toLowerCase())}"><a href="${href(p.slug)}"><b>${esc(p.h1)}</b><span>${esc(p.desc)}</span></a></li>`).join("\n")}
</ul>`;

/* ---------- homepage ---------- */
function renderHome() {
  const groups = SILOS.map(s => `
<section class="group" data-group>
  <h2><a href="${href(s.slug)}">${esc(SILO_H1[s.cat])}</a></h2>
  ${calcList(pagesIn(s))}
</section>`).join("\n");
  const body = `
<section class="hero">
  <h1>Rebar Calculator</h1>
  <p>Quick steel rebar calculators for weight, slabs, spacing, laps, cutting length, members and cost. Metric and imperial, results as you type.</p>
  <label class="search">
    <span class="sr">Find a calculator</span>
    <input id="filter" type="search" placeholder="Find a calculator, e.g. slab, lap, cost" autocomplete="off" />
  </label>
</section>
<div id="all">
${groups}
<p id="no-match" class="empty" hidden>No calculator matches that. Try a shorter word.</p>
</div>`;
  return layout({
    title: "Rebar Calculator — Weight, Spacing, Cost & Detailing",
    desc: "Rebar calculators for weight, slab takeoff, spacing, lap length, cutting length, column and beam steel, tonnage and cost.",
    body
  });
}

/* ---------- silo hub ---------- */
function renderSilo(s) {
  const body = `
${crumbs([{ name: "Home", href: "index.html" }, { name: SILO_H1[s.cat] }])}
<section class="hero">
  <h1>${esc(SILO_H1[s.cat])}</h1>
  <p>${esc(SILO_SUB[s.cat] || "")}</p>
</section>
${calcList(pagesIn(s))}`;
  return layout({ title: `${SILO_H1[s.cat]} | Rebar Calculator`, desc: SILO_SUB[s.cat] || SILO_H1[s.cat], body });
}

/* ---------- calculator page ---------- */
function renderPage(p) {
  const s = siloOf(p);
  const related = pagesIn(s).filter(x => x.id !== p.id);
  const body = `
${crumbs([{ name: "Home", href: "index.html" }, { name: SILO_H1[s.cat], href: href(s.slug) }, { name: p.h1 }])}
<section class="hero">
  <h1>${esc(p.h1)}</h1>
  <p>${p.intro}</p>
</section>

<section class="calc" aria-label="Calculator">
  <form id="inputs" class="card fields" novalidate></form>
  <div class="card result" aria-live="polite">
    <p class="r-label" id="r-label">Result</p>
    <p class="r-main"><span id="r-total">–</span> <span id="r-unit"></span></p>
    <dl id="r-grid" class="r-grid"></dl>
    <p class="r-note" id="r-note"></p>
    <button type="button" id="reset" class="btn">Reset values</button>
  </div>
</section>

<section class="block">
  <h2>How to use it</h2>
  <ol class="steps">${p.howto.map(h => `<li>${h}</li>`).join("")}</ol>
</section>

<section class="block">
  <h2>Formula</h2>
  <p class="formula">${esc(p.formula)}</p>
</section>

<section class="block">
  <h2>Questions</h2>
  ${p.faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${a}</p></details>`).join("\n  ")}
</section>

${related.length ? `<section class="block">
  <h2>Related calculators</h2>
  ${calcList(related)}
</section>` : ""}`;
  return layout({ title: p.metaTitle, desc: p.desc, body, calc: p.id });
}

/* ---------- write ---------- */
fs.writeFileSync(path.join(OUT, "index.html"), renderHome());
SILOS.forEach(s => fs.writeFileSync(path.join(OUT, s.slug + ".html"), renderSilo(s)));
PAGES.forEach(p => fs.writeFileSync(path.join(OUT, p.slug + ".html"), renderPage(p)));
console.log(`New design: 1 home + ${SILOS.length} groups + ${PAGES.length} calculators written to new-design/`);
