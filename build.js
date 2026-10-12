/* ============================================================
   Static site generator for the Rebar Calculator suite.
   Run:  node build.js
   Produces: slugs.js, index.html, one page per calculator,
             sitemap.xml, robots.txt
   Shared assets (styles.css, script.js) are NOT regenerated.
   ============================================================ */
const fs = require("fs");
const path = require("path");
const OUT = __dirname;
const SITE = "https://steelrebarcalculator.com";

/* ---- per-page SEO content. id MUST match a calculator in script.js ---- */
const PAGES = [
  { id:"weight", slug:"rebar-weight-calculator", cat:"Weight",
    metaTitle:"Rebar Weight Calculator — kg, lb & Tons by Bar Size",
    h1:"Rebar Weight Calculator",
    desc:"Calculate steel rebar weight by bar size, length and quantity in kg, lb and tons. Includes metric (mm) and US (#) bars and the d²/162 formula.",
    kw:"rebar weight calculator, steel rebar weight per meter, weight of rebar, reinforcement bar weight per meter, deformed bar weight calculator",
    intro:"Find the weight of any reinforcement bar in seconds. Pick the bar size, enter the length and quantity, and get the total in kilograms, pounds and metric tons — using the industry-standard <strong>weight per metre = d² ÷ 162.28</strong> formula.",
    howto:["Choose the bar size (metric mm or US # size).","Enter the length of one bar and how many pieces.","Read the total weight in kg, lb and tons."],
    formula:"Weight per metre (kg) = d² ÷ 162.28, where d is the bar diameter in mm. Total = weight/m × length × quantity.",
    faqs:[["What is the weight of a 12mm rebar?","A 12 mm bar weighs 12² ÷ 162.28 ≈ 0.888 kg per metre."],
          ["How do you calculate the weight of steel rebar?","Square the diameter in mm, divide by 162.28 to get kg/m, then multiply by length and quantity."]] },

  { id:"slab", slug:"concrete-slab-rebar-calculator", cat:"Estimating",
    metaTitle:"Concrete Slab Rebar Calculator — Bars, Length & Weight",
    h1:"Concrete Slab Rebar Calculator",
    desc:"Calculate how much rebar a concrete slab needs: number of bars both directions, total length, tie intersections and total weight.",
    kw:"concrete slab rebar calculator, calculate rebar for slab, rebar needed for concrete slab, slab reinforcement calculation, rebar grid calculator",
    intro:"Work out exactly how much reinforcement your slab needs. Enter the slab dimensions, bar spacing and edge cover, and the calculator returns the bar count in each direction, total bar length, tie-wire intersections and the total steel weight.",
    howto:["Enter slab length and width.","Set the bar spacing (centre-to-centre) and edge cover.","Pick the bar size to get the bar count and total weight."],
    formula:"Bars one way = floor((dimension − 2 × cover) ÷ spacing) + 1, repeated for both directions. Total weight = total bar length × kg/m.",
    faqs:[["How much rebar do I need for a concrete slab?","Divide each slab dimension (less cover) by the spacing, add one, and do this both ways. Multiply each row by the bar length and the bar's kg/m."],
          ["What spacing should slab rebar be?","Residential slabs commonly use 150–300 mm centres; always follow your structural design."]] },

  { id:"footing", slug:"footing-rebar-calculator", cat:"Estimating",
    metaTitle:"Footing Rebar Calculator — Reinforcement for Footings",
    h1:"Footing Rebar Calculator",
    desc:"Calculate the reinforcement mesh for an isolated or strip footing: bars both ways, total length and weight.",
    kw:"footing rebar calculator, rebar footing calculator, footing reinforcement, isolated footing rebar",
    intro:"Size the bottom mesh of a footing in seconds. Enter the footing plan dimensions, bar spacing and cover to get the number of bars each way and the total steel weight.",
    howto:["Enter footing length and width.","Set spacing and clear cover.","Choose the bar size for counts and weight."],
    formula:"Same grid method as a slab: bars one way = floor((dimension − 2 × cover) ÷ spacing) + 1, both directions, × kg/m.",
    faqs:[["What size rebar is used in footings?","10–16 mm (#4–#5) bars are typical for residential footings; design governs."],
          ["How do I calculate footing reinforcement?","Treat the footing as a small slab — bar count each way times bar length times the unit weight."]] },

  { id:"mat", slug:"rebar-mat-grid-calculator", cat:"Estimating",
    metaTitle:"Rebar Mat & Grid Calculator — Mesh Bars & Weight",
    h1:"Rebar Mat & Grid Calculator",
    desc:"Calculate a rectangular reinforcement mat: number of bars each way, intersections, total length and weight.",
    kw:"rebar mat calculator, rebar grid calculator, reinforcement mat, mesh rebar calculator",
    intro:"Lay out a rectangular reinforcement mat and get the full bar take-off: bars in each direction, intersections for tying, total bar length and weight.",
    howto:["Enter mat length and width.","Set the grid spacing and edge offset.","Pick a bar size for the totals."],
    formula:"Bars each way = floor((dimension − 2 × offset) ÷ spacing) + 1. Intersections = nx × ny.",
    faqs:[["What is a rebar mat?","A grid of bars tied together in two directions, used in slabs, rafts and footings."],
          ["How many tie points are in a mat?","One at each bar intersection — the calculator reports this as the intersection count."]] },

  { id:"spacing", slug:"rebar-spacing-calculator", cat:"Detailing",
    metaTitle:"Rebar Spacing Calculator — Bar Count & c/c Spacing",
    h1:"Rebar Spacing Calculator",
    desc:"Find the number of bars and the actual centre-to-centre spacing across any width, plus the clear gap between bars.",
    kw:"rebar spacing calculator, rebar spacing formula, bar spacing calculator, reinforcement spacing",
    intro:"Convert between bar count and spacing across a member. Enter the width, edge cover and your target spacing, and get the exact number of bars, the actual c/c spacing achieved and the clear gap.",
    howto:["Enter the total width and edge cover.","Enter the desired spacing.","Read the bar count and actual spacing."],
    formula:"Number of bars = floor((width − 2 × cover) ÷ spacing) + 1. Actual spacing = reinforced width ÷ (bars − 1).",
    faqs:[["How do you calculate rebar spacing?","Subtract cover from the width, divide by spacing, add one for the number of bars."],
          ["What is the minimum spacing between rebars?","Usually the greater of the bar diameter or aggregate size + 5 mm — check your code."]] },

  { id:"develop", slug:"rebar-development-length-calculator", cat:"Detailing",
    metaTitle:"Rebar Development Length Calculator (Ld) — IS 456",
    h1:"Rebar Development Length Calculator",
    desc:"Calculate the development (anchorage) length Ld for deformed bars using the IS 456 formula, with selectable concrete and steel grade.",
    kw:"rebar development length calculator, development length of rebar, anchorage length, Ld calculator",
    intro:"Compute the embedment a bar needs to develop its full strength. Select the bar size, steel grade and concrete grade, and the tool returns Ld in mm and as a multiple of bar diameter, for tension or compression.",
    howto:["Pick the bar size.","Select steel grade (Fe250–Fe550) and concrete grade (M20–M40).","Choose tension or compression to read Ld."],
    formula:"Ld = (φ × 0.87 × fy) ÷ (4 × τbd). τbd is the design bond stress (increased 60% for deformed bars, +25% for compression).",
    faqs:[["What is development length of rebar?","The length of bar that must be embedded in concrete to transfer its design force safely."],
          ["What is the development length for Fe500 in M25?","About 47–49 times the bar diameter in tension for deformed bars."]] },

  { id:"lap", slug:"rebar-lap-length-calculator", cat:"Detailing",
    metaTitle:"Rebar Lap & Splice Length Calculator — Tension & Compression",
    h1:"Rebar Lap / Splice Length Calculator",
    desc:"Calculate lap (splice) length for reinforcement: tension lap = max(Ld, 30d), compression lap = max(Ld, 24d).",
    kw:"rebar lap length calculator, rebar splice length calculator, rebar lapping formula, lap length of rebar",
    intro:"Find the overlap needed to splice two bars. Pick the bar size, steel and concrete grade and the lap type — the tool returns the lap length in mm and as a multiple of diameter.",
    howto:["Select the bar size.","Choose steel and concrete grade.","Pick tension or compression lap."],
    formula:"Tension lap = max(Ld, 30d); compression lap = max(Ld, 24d), where Ld is the development length.",
    faqs:[["What is lap length of rebar?","The overlap between two spliced bars so the force transfers through the concrete."],
          ["Is lap length 40d or 50d?","It depends on grade and concrete — commonly 40–50d. This tool computes it from Ld."]] },

  { id:"hook", slug:"rebar-hook-bend-cutting-length-calculator", cat:"Detailing",
    metaTitle:"Rebar Hook, Bend & Cutting Length Calculator",
    h1:"Rebar Hook, Bend & Cutting Length Calculator",
    desc:"Calculate the cutting length of a bar from its straight length, hooks and bends, with standard 9d hooks and bend deductions.",
    kw:"rebar hook length formula, rebar bend formula, rebar cut length calculation, cutting length of rebar",
    intro:"Get the exact cutting length to order or cut a bar. Enter the straight length, number of hooks and bends — the tool adds 9d per hook and deducts 1d/2d/3d for 45°/90°/135° bends.",
    howto:["Enter the straight (out-to-out) length.","Enter the number of hooks and each type of bend.","Read the cutting length in mm and m."],
    formula:"Cutting length = straight length + (hooks × 9d) − (45°×1d + 90°×2d + 135°×3d).",
    faqs:[["What is the hook length of rebar?","A standard 180° hook adds about 9 × bar diameter to the cutting length."],
          ["Why do we deduct for bends?","Bending a bar shortens its outside length, so a deduction (1d–3d) is applied per bend."]] },

  { id:"stirrup", slug:"stirrup-tie-cutting-length-calculator", cat:"Detailing",
    metaTitle:"Stirrup & Column Tie Cutting Length Calculator",
    h1:"Stirrup & Tie Cutting Length Calculator",
    desc:"Calculate the cutting length of a rectangular stirrup or column tie including hooks and bend deductions.",
    kw:"stirrup cutting length, column tie cutting length, rebar stirrup calculator, cutting length of stirrup",
    intro:"Compute the cutting length of a rectangular stirrup or tie from the member size and cover. Includes two 135° hooks (10d each) and the standard bend deductions.",
    howto:["Enter member width and depth.","Set the clear cover.","Pick the stirrup bar size."],
    formula:"Cutting length = 2(a + b) + 2 × 10d − 3 × 2d − 2 × 3d, where a and b are the inner dimensions.",
    faqs:[["How do you calculate stirrup cutting length?","Add the inner perimeter to the hook allowance and subtract the bend deductions."],
          ["What is the hook length in a stirrup?","Each 135° hook is taken as 10 × bar diameter."]] },

  { id:"column", slug:"column-rebar-calculator", cat:"Members",
    metaTitle:"Column Rebar Calculator — Vertical Steel + Ties",
    h1:"Column Rebar Calculator",
    desc:"Calculate total rebar for a rectangular column: vertical main bars plus lateral ties, with weights.",
    kw:"column rebar calculator, rebar calculator for columns, column reinforcement, column steel calculation",
    intro:"Estimate the steel in a column. Enter the column size and height, the number and size of vertical bars, plus the tie spacing and size — the tool returns vertical steel, tie steel and the total weight.",
    howto:["Enter column height and cross-section.","Set the number and size of vertical bars and the lap allowance.","Set tie spacing and bar size for the total."],
    formula:"Vertical steel = bars × (height + lap) × kg/m. Ties = floor(height ÷ spacing) + 1, each at the stirrup cutting length.",
    faqs:[["How is column rebar calculated?","Add the vertical bar weight to the tie weight; ties use the stirrup cutting-length method."],
          ["How many vertical bars in a column?","A minimum of 4 for rectangular and 6 for circular columns, subject to design."]] },

  { id:"beam", slug:"beam-rebar-calculator", cat:"Members",
    metaTitle:"Beam Rebar Calculator — Main Bars + Stirrups",
    h1:"Beam Rebar Calculator",
    desc:"Calculate total rebar for a beam: top and bottom main bars plus stirrups, with weights.",
    kw:"beam rebar calculator, beam rebar estimate, beam reinforcement calculation, beam steel calculation",
    intro:"Estimate the steel in a beam. Enter the beam size and span, the number of top and bottom bars, and the stirrup spacing — the tool returns main steel, stirrup steel and the total weight.",
    howto:["Enter beam length and cross-section.","Set the number and size of top and bottom bars.","Set stirrup spacing and bar size."],
    formula:"Main steel = (top + bottom bars) × length × kg/m. Stirrups = floor(length ÷ spacing) + 1 at the stirrup cutting length.",
    faqs:[["How do you calculate beam reinforcement?","Add the main bar weight to the stirrup weight along the beam length."],
          ["What is the spacing of stirrups in a beam?","Often closer near supports; commonly 100–200 mm — design governs."]] },

  { id:"cost", slug:"rebar-cost-calculator", cat:"Commercial",
    metaTitle:"Rebar Cost Calculator — Estimate Material Price",
    h1:"Rebar Cost Calculator",
    desc:"Estimate rebar material cost from total weight and unit price, including a wastage allowance.",
    kw:"rebar cost calculator, rebar price calculator, rebar material calculator, cost of rebar",
    intro:"Turn a steel weight into a price. Enter the total weight, your price per kg and a wastage allowance, and the tool returns the estimated cost including waste and the per-ton rate.",
    howto:["Enter the total rebar weight.","Enter your price per kg.","Add a wastage percentage to get the cost."],
    formula:"Cost = weight × (1 + wastage%) × price per kg.",
    faqs:[["How much does rebar cost?","It varies by market and size; enter your local price per kg for an accurate estimate."],
          ["What wastage should I allow for rebar?","Typically 3–5% to cover offcuts and laps."]] },

  { id:"tonnage", slug:"rebar-tonnage-calculator", cat:"Commercial",
    metaTitle:"Rebar Tonnage Calculator — Convert Bars to Tons",
    h1:"Rebar Tonnage Calculator",
    desc:"Convert a bar schedule (size × length × quantity) into total tonnage in metric and US tons.",
    kw:"rebar tonnage calculator, rebar ton calculator, rebar weight to tons, steel tonnage",
    intro:"Convert quantities of bars into tonnage for ordering and pricing. Enter the bar size, length and quantity to get metric tons, US tons and total kilograms.",
    howto:["Pick the bar size.","Enter length per bar and quantity.","Read the tonnage."],
    formula:"Weight (kg) = kg/m × length × quantity. Metric ton = kg ÷ 1000.",
    faqs:[["How many bars in a ton of rebar?","Divide 1000 by (kg/m × bar length). For 12 mm × 12 m bars, about 94 bars per ton."],
          ["What is the difference between metric and US tons?","A metric ton is 1000 kg; a US (short) ton is 907.2 kg."]] },

  { id:"area", slug:"rebar-area-calculator", cat:"Weight",
    metaTitle:"Rebar Area Calculator (Ast) — Area of Steel",
    h1:"Rebar Area Calculator (Ast)",
    desc:"Calculate the cross-sectional area of one bar and the total steel area Ast, plus the steel percentage of a section.",
    kw:"rebar area calculator, area of rebar formula, area of steel, ast calculator, steel percentage",
    intro:"Find the area of steel in a section. Enter the bar size and number of bars to get the area of one bar and the total Ast, and optionally the steel percentage of a given section.",
    howto:["Pick the bar size and number of bars.","Optionally enter the section width and depth.","Read Ast and the steel percentage."],
    formula:"Area of one bar = π/4 × d². Ast = number of bars × area. Steel % = Ast ÷ (b × D) × 100.",
    faqs:[["What is the area of a 12mm rebar?","π/4 × 12² ≈ 113.1 mm² per bar."],
          ["What is Ast in reinforcement?","Ast is the total cross-sectional area of tension steel in a section."]] },

  { id:"quantity", slug:"rebar-quantity-calculator", cat:"Weight",
    metaTitle:"Rebar Quantity Calculator — kg/m², per ft² & Takeoff",
    h1:"Rebar Quantity & Takeoff Calculator",
    desc:"Estimate rebar weight for a slab or area from spacing alone: get kg/m², kg/ft² and the total weight.",
    kw:"rebar quantity calculator, rebar per square foot, rebar calculator by square foot, rebar takeoff calculator",
    intro:"Estimate reinforcement for any area quickly. Enter the area and grid spacing, and the tool returns the steel density in kg/m² and kg/ft² plus the total weight — ideal for fast take-offs.",
    howto:["Enter the area to be reinforced.","Set the grid spacing (both ways).","Pick the bar size for kg/m² and the total."],
    formula:"Bar length per m² = 2 ÷ spacing(m). Weight/m² = that × kg/m. Total = weight/m² × area.",
    faqs:[["How much rebar per square foot?","It depends on spacing and bar size; the tool gives kg/ft² for your inputs."],
          ["How do you do a rebar takeoff?","Estimate bar length per unit area from the spacing, then multiply by area and unit weight."]] },

  { id:"concrete", slug:"concrete-and-rebar-calculator", cat:"Estimating",
    metaTitle:"Concrete & Rebar Calculator — Volume + Steel Estimate",
    h1:"Concrete & Rebar Estimator",
    desc:"Calculate concrete volume and an estimate of the reinforcement steel using a kg/m³ ratio.",
    kw:"concrete and rebar calculator, concrete rebar estimator, concrete rebar calculator, concrete volume and steel",
    intro:"Estimate both concrete and steel for a pour. Enter the dimensions to get the concrete volume in m³, yd³ and ft³, plus a steel estimate from a reinforcement ratio (kg/m³).",
    howto:["Enter length, width and thickness.","Set the steel ratio (kg per m³ of concrete).","Read the volume and steel estimate."],
    formula:"Volume = L × W × thickness. Steel = volume × ratio (typically 80–120 kg/m³ for slabs).",
    faqs:[["How much steel per m³ of concrete?","Roughly 80–120 kg/m³ for slabs, more for columns and beams — design governs."],
          ["How do I calculate concrete volume?","Multiply length × width × thickness in consistent units."]] },

  { id:"driveway", slug:"driveway-rebar-calculator", cat:"Estimating",
    metaTitle:"Driveway Rebar Calculator — Reinforcement Mat & Weight",
    h1:"Driveway Rebar Calculator",
    desc:"Calculate the single reinforcement mat for a driveway slab: bar count both ways, length and weight.",
    kw:"driveway rebar calculator, rebar for driveway, driveway reinforcement, concrete driveway rebar",
    intro:"Size the rebar mat for a driveway. Enter the driveway length and width, the bar spacing and cover, and get the bar count both ways plus the total steel weight.",
    howto:["Enter driveway length and width.","Set the bar spacing and edge cover.","Pick the bar size for the total."],
    formula:"Bars each way = floor((dimension − 2 × cover) ÷ spacing) + 1, × kg/m for the weight.",
    faqs:[["What size rebar for a driveway?","#3–#4 (10–13 mm) at 300–450 mm centres is common for residential driveways."],
          ["Do driveways need rebar?","Reinforcement helps control cracking; thickness and bar size depend on loading."]] },

  { id:"wall", slug:"wall-rebar-calculator", cat:"Members",
    metaTitle:"Wall Rebar Calculator — Vertical + Horizontal Bars",
    h1:"Wall Rebar Calculator",
    desc:"Calculate reinforcement for a concrete or block wall: vertical and horizontal bars, counts and weight.",
    kw:"rebar calculator for wall, block wall rebar calculator, wall reinforcement, retaining wall rebar",
    intro:"Estimate the steel in a wall — retaining, basement or block. Enter the wall length and height, the vertical and horizontal spacing and bar sizes, and get the bar counts and total weight.",
    howto:["Enter wall length and height.","Set vertical and horizontal spacing and cover.","Pick bar sizes for each direction."],
    formula:"Vertical bars = floor((L − 2cover) ÷ spV) + 1; horizontal bars = floor((H − 2cover) ÷ spH) + 1; sum × kg/m.",
    faqs:[["How do you calculate rebar for a wall?","Count vertical and horizontal bars from the spacing, then multiply lengths by unit weight."],
          ["What is rebar spacing in a block wall?","Often vertical bars at 400–800 mm and horizontal bars per course or bond beam — design governs."]] },

  { id:"pool", slug:"pool-rebar-calculator", cat:"Members",
    metaTitle:"Swimming Pool Rebar Calculator — Wall Reinforcement",
    h1:"Swimming Pool Rebar Calculator",
    desc:"Calculate reinforcement for a swimming pool wall panel: vertical and horizontal bars, counts and weight.",
    kw:"pool rebar calculator, swimming pool rebar, rebar calculation for swimming pool, pool reinforcement",
    intro:"Size the reinforcement for a pool wall. Enter the wall length and height with the vertical and horizontal spacing — calculate each wall, then add the floor using the slab tool.",
    howto:["Enter the pool wall length and height.","Set vertical and horizontal spacing.","Pick bar sizes for the total per wall."],
    formula:"Same grid method as a wall: bars each way from spacing, summed × kg/m. Repeat per wall and add the floor.",
    faqs:[["What size rebar for a pool?","#3–#4 (10–13 mm) at 250–300 mm centres each way is typical; follow your engineer."],
          ["How do I calculate pool rebar?","Calculate each wall panel and the floor separately, then add them together."]] },

  { id:"chair", slug:"rebar-chair-calculator", cat:"Detailing",
    metaTitle:"Rebar Chair Calculator — Bar Support Count",
    h1:"Rebar Chair / Bar Support Calculator",
    desc:"Calculate how many bar chairs (supports) are needed to hold a top reinforcement mat on a square grid.",
    kw:"rebar chair calculator, bar support calculator, rebar chairs per square meter, slab bolster count",
    intro:"Work out how many bar chairs you need to support a top mat. Enter the slab size and the chair grid spacing, and get the total number of chairs and the chairs-per-m² density.",
    howto:["Enter slab length and width.","Set the chair grid spacing.","Read the total chairs required."],
    formula:"Chairs = (floor(L ÷ spacing) + 1) × (floor(W ÷ spacing) + 1).",
    faqs:[["How many rebar chairs do I need?","Roughly one per square metre at 1 m spacing — the tool gives the exact grid count."],
          ["What spacing for bar chairs?","Commonly 1.0–1.2 m each way for slab top mats."]] },

  { id:"tiewire", slug:"rebar-tie-wire-calculator", cat:"Detailing",
    metaTitle:"Rebar Tie Wire Calculator — Binding Wire Estimate",
    h1:"Rebar Tie Wire Calculator",
    desc:"Estimate binding (tie) wire for a reinforcement grid from slab size, spacing and wire used per tie.",
    kw:"rebar tie wire calculator, binding wire calculator, tie wire for rebar, rebar tying wire quantity",
    intro:"Estimate the binding wire for a reinforcement grid. Enter the slab size, bar spacing, the percentage of intersections tied and the wire used per tie to get the total length and weight.",
    howto:["Enter slab length and width and the bar spacing.","Set the wire used per tie and the % of intersections tied.","Read the total wire length and weight."],
    formula:"Intersections = nx × ny. Ties = intersections × ratio. Wire length = ties × wire-per-tie; weight uses ~1.6 mm wire.",
    faqs:[["How much tie wire do I need for rebar?","Allow roughly 250–350 mm of wire per tie; the tool totals it from your grid."],
          ["Do you tie every rebar intersection?","Often every intersection on edges and ~50% in the field — set the percentage to match."]] },
];

/* ---------- i18n ---------- */
const I = require("./i18n.js");
const { LANGS, CALC, UI, TPL, G } = I;
const trG = (s, lang) => (lang==="en" || !G[s] || !G[s][lang]) ? s : G[s][lang];

const HUB_H1 = { en:"Steel Rebar Calculator", es:"Calculadora de Acero Corrugado",
  fr:"Calculateur d'Armature en Acier", de:"Stahlbewehrungs-Rechner",
  it:"Calcolatore Armature in Acciaio", pt:"Calculadora de Vergalhão de Aço",
  nl:"Staal Wapeningscalculator", pl:"Kalkulator Zbrojenia Stalowego",
  ro:"Calculator Armătură din Oțel", sv:"Stålarmeringskalkylator",
  cs:"Kalkulátor Ocelové Výztuže", da:"Stålarmering Beregner",
  el:"Υπολογιστής Χαλύβδινου Οπλισμού", hu:"Acél Vasalás Kalkulátor",
  fi:"Teräsraudoituslaskuri", bg:"Калкулатор за Стоманена Армировка",
  hr:"Kalkulator Čelične Armature", sk:"Kalkulačka Oceľovej Výstuže",
  sl:"Kalkulator Jeklene Armature", et:"Terassarruse Kalkulaator",
  lv:"Tērauda Stiegrojuma Kalkulators", lt:"Plieninės Armatūros Skaičiuotuvas" };
const HUB_TAG = { en:"Free Steel Rebar Weight, Slab, Spacing & Cost Tools",
  es:"Peso, losa, separación y coste de acero — gratis",
  fr:"Poids, dalle, espacement et coût d'armature — gratuit",
  de:"Bewehrungsgewicht, Platte, Abstand & Kosten — kostenlos",
  it:"Peso, soletta, interasse e costo armature — gratis",
  pt:"Peso, laje, espaçamento e custo de aço — grátis",
  nl:"Gratis tools voor wapeningsgewicht, vloerplaat, afstand & kosten",
  pl:"Darmowe narzędzia: masa, płyta, rozstaw i koszt zbrojenia",
  ro:"Instrumente gratuite: greutate, placă, distanță și cost armătură",
  sv:"Gratis verktyg: armeringsvikt, platta, avstånd och kostnad",
  cs:"Bezplatné nástroje: hmotnost, deska, rozteč a cena výztuže",
  da:"Gratis værktøjer: armeringsvægt, plade, afstand og pris",
  el:"Δωρεάν εργαλεία: βάρος, πλάκα, απόσταση και κόστος οπλισμού",
  hu:"Ingyenes eszközök: vasalás tömege, lemez, kiosztás és költség",
  fi:"Ilmaiset työkalut: raudoituksen paino, laatta, jako ja kustannus",
  bg:"Безплатни инструменти: тегло, плоча, разстояние и цена на армировка",
  hr:"Besplatni alati: težina, ploča, razmak i trošak armature",
  sk:"Bezplatné nástroje: hmotnosť, doska, rozstup a cena výstuže",
  sl:"Brezplačna orodja: teža, plošča, razmik in strošek armature",
  et:"Tasuta tööriistad: sarruse kaal, plaat, samm ja maksumus",
  lv:"Bezmaksas rīki: stiegrojuma svars, plātne, atstatums un izmaksas",
  lt:"Nemokami įrankiai: armatūros svoris, plokštė, žingsnis ir kaina" };

/* ---------- silo structure ----------
   Each silo = a themed group of calculators with its own landing page.
   silo.cat must match the `cat` field used in PAGES / script.js CALCS.   */
const SILOS = [
  { cat:"Weight",     slug:"rebar-weight-calculators" },
  { cat:"Estimating", slug:"concrete-rebar-estimating-calculators" },
  { cat:"Members",    slug:"structural-rebar-calculators" },
  { cat:"Detailing",  slug:"rebar-detailing-calculators" },
  { cat:"Commercial", slug:"rebar-cost-tonnage-calculators" },
];
const siloOfCat = cat => SILOS.find(s => s.cat === cat);
const siloOfId  = id  => siloOfCat(PAGES.find(p => p.id === id).cat);
const siloPages = silo => PAGES.filter(p => p.cat === silo.cat);

/* "Calculators" noun + "Home" label per language (one place, no i18n edits) */
const CALCSWORD = { en:"Calculators", es:"Calculadoras", fr:"Calculateurs", de:"Rechner",
  it:"Calcolatori", pt:"Calculadoras", nl:"Calculators", pl:"Kalkulatory", ro:"Calculatoare",
  sv:"Kalkylatorer", cs:"Kalkulačky", da:"Beregnere", el:"Υπολογιστές", hu:"Kalkulátorok",
  fi:"Laskurit", bg:"Калкулатори", hr:"Kalkulatori", sk:"Kalkulačky", sl:"Kalkulatorji",
  et:"Kalkulaatorid", lv:"Kalkulatori", lt:"Skaičiuotuvai" };
const HOMEWORD = { en:"Home", es:"Inicio", fr:"Accueil", de:"Startseite", it:"Home", pt:"Início",
  nl:"Home", pl:"Strona główna", ro:"Acasă", sv:"Hem", cs:"Domů", da:"Hjem", el:"Αρχική",
  hu:"Főoldal", fi:"Etusivu", bg:"Начало", hr:"Početna", sk:"Domov", sl:"Domov",
  et:"Avaleht", lv:"Sākums", lt:"Pradžia" };
const siloName = (silo, lang) => trG(silo.cat, lang);
const siloH1   = (silo, lang) => `${trG(silo.cat, lang)} — ${CALCSWORD[lang]}`;

/* ---------- URL + path helpers ---------- */
const dirOf = lang => LANGS.find(l=>l.code===lang).dir;
function urlFor(lang, slug){
  const prefix = lang==="en" ? "" : "/"+dirOf(lang);
  return slug==="index" ? SITE+prefix+"/" : SITE+prefix+"/"+slug+".html";
}
function switchHref(curLang, targetLang, slug){
  const file = (slug==="index"?"index":slug)+".html";
  const td = dirOf(targetLang);
  if(curLang==="en") return targetLang==="en" ? file : td+"/"+file;
  return targetLang==="en" ? "../"+file : "../"+td+"/"+file;
}
function altLinks(slug){
  return LANGS.map(l=>`<link rel="alternate" hreflang="${l.code}" href="${urlFor(l.code,slug)}" />`).join("\n")
    + `\n<link rel="alternate" hreflang="x-default" href="${urlFor('en',slug)}" />`;
}
/* localized getters (en uses the rich PAGES content) */
const pH1   = (p,lang) => lang==="en" ? p.h1 : CALC[p.id].title[lang];
const pDesc = (p,lang) => lang==="en" ? p.desc : CALC[p.id].desc[lang];
const pTitle= (p,lang) => lang==="en" ? p.metaTitle : `${CALC[p.id].title[lang]} — ${TPL[lang].metaSuffix}`;
const pIntro= (p,lang) => lang==="en" ? p.intro : CALC[p.id].desc[lang];
const pHowto= (p,lang) => lang==="en" ? p.howto : TPL[lang].howto;
const pFaqs = (p,lang) => lang==="en" ? p.faqs : TPL[lang].faq(CALC[p.id].title[lang], CALC[p.id].desc[lang]);

/* ---------- shared HTML pieces ---------- */
function langSwitch(curLang, slug){
  const cur = LANGS.find(l=>l.code===curLang);
  return `<details class="lang-dropdown">
      <summary>🌐 ${cur.label} <span class="caret">▾</span></summary>
      <div class="lang-menu">${LANGS.map(l=>`<a class="lang${l.code===curLang?' active':''}" hreflang="${l.code}" href="${switchHref(curLang,l.code,slug)}">${l.name}</a>`).join("")}</div>
    </details>`;
}
function header(lang, slug){
  const u = UI[lang];
  return `
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="index.html"><span class="brand-mark">▦</span>
      <span class="brand-text">Rebar<strong>Calc</strong></span></a>
    <nav class="top-nav">
      <a href="index.html">${u.allCalcs}</a>
      <a href="index.html#charts">${u.weightChart}</a>
      <a href="index.html#faq">${u.faq}</a>
    </nav>
    ${langSwitch(lang, slug)}
  </div>
</header>`;
}
function footer(lang){
  const u = UI[lang];
  return `
<footer class="site-footer">
  <div class="wrap">
    <p><strong>Rebar Calculator</strong> — ${u.footer}</p>
    <p class="muted">${u.disclaimer}</p>
  </div>
</footer>`;
}
const toolShell = `
  <div class="calc-shell">
    <aside class="calc-tabs" id="calc-tabs" role="tablist" aria-label="Choose a calculator"></aside>
    <div class="calc-panel">
      <h2 id="calc-title"></h2>
      <p id="calc-desc" class="calc-desc"></p>
      <div id="inputs" class="inputs"></div>
      <div class="result" aria-live="polite">
        <div class="result-main">
          <span class="result-val" id="r-total">0</span>
          <span class="result-unit" id="r-total-unit"></span>
        </div>
        <div class="result-label" id="r-label"></div>
        <div class="result-grid" id="result-grid"></div>
        <p class="result-formula" id="r-formula"></p>
      </div>
    </div>
  </div>`;

/* scripts block: assets live at root, so sub-dir pages prefix ../ */
function scripts(lang, calcId){
  const base = lang==="en" ? "" : "../";
  return `<script>window.PAGE_LANG="${lang}";${calcId?`window.PAGE_CALC="${calcId}";`:""}</script>
<script src="${base}i18n.js"></script>
<script src="${base}slugs.js"></script>
<script src="${base}script.js"></script>`;
}

/* silo interlinking: a calculator page links only to its silo siblings
   and up to the silo landing page (concentrates topical authority). */
function relatedGrid(currentId, lang){
  const u = UI[lang];
  const silo = siloOfId(currentId);
  const siblings = siloPages(silo).filter(p => p.id !== currentId);
  const cards = siblings.map(p =>
    `<a class="rel-card" href="${p.slug}.html"><b>${pH1(p,lang)}</b><span>${pDesc(p,lang).slice(0,48)}…</span></a>`
  ).join("\n      ");
  return `
  <section class="related">
    <h2>${u.more} — ${siloName(silo,lang)}</h2>
    <div class="related-grid">
      ${cards}
    </div>
    <p class="silo-all"><a href="${silo.slug}.html">↗ ${siloH1(silo,lang)}</a></p>
  </section>`;
}

function faqJsonLd(faqs){
  return JSON.stringify({"@context":"https://schema.org","@type":"FAQPage",
    mainEntity: faqs.map(([q,a])=>({"@type":"Question",name:q,acceptedAnswer:{"@type":"Answer",text:a}}))});
}
/* visible breadcrumb trail (links are same-dir relative within each language) */
function crumbs(lang, trail){
  const parts = trail.map((c,i) => c.slug
    ? `<a href="${c.slug==="index"?"index":c.slug}.html">${c.name}</a>`
    : `<span>${c.name}</span>`);
  return `<div class="wrap"><nav class="crumbs" aria-label="Breadcrumb">${parts.join(" <i>›</i> ")}</nav></div>`;
}
function breadcrumbJsonLd(items){
  return JSON.stringify({"@context":"https://schema.org","@type":"BreadcrumbList",
    itemListElement: items.map((it,i)=>({"@type":"ListItem",position:i+1,name:it.name,item:it.url}))});
}

/* ---------- calculator page ---------- */
function renderPage(p, lang){
  const base = lang==="en" ? "" : "../";
  const u = UI[lang];
  const h1 = pH1(p,lang), title = pTitle(p,lang), desc = pDesc(p,lang);
  const faqs = pFaqs(p,lang);
  const faqHtml = faqs.map(([q,a],i)=>`<details${i===0?" open":""}><summary>${q}</summary><p>${a}</p></details>`).join("\n    ");
  const howHtml = pHowto(p,lang).map(s=>`<li>${s}</li>`).join("");
  const cleanH1 = h1.replace(/ \(.*/,"");
  const silo = siloOfId(p.id);
  const crumbTrail = crumbs(lang, [
    {name:HOMEWORD[lang], slug:"index"},
    {name:siloName(silo,lang), slug:silo.slug},
    {name:cleanH1}
  ]);
  const crumbLd = breadcrumbJsonLd([
    {name:HOMEWORD[lang], url:urlFor(lang,"index")},
    {name:siloName(silo,lang), url:urlFor(lang,silo.slug)},
    {name:h1, url:urlFor(lang,p.slug)}
  ]);
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<meta name="description" content="${desc}" />
<meta name="keywords" content="${p.kw}" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="${urlFor(lang,p.slug)}" />
${altLinks(p.slug)}
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:type" content="website" />
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"WebApplication",name:h1,applicationCategory:"BusinessApplication",operatingSystem:"All",inLanguage:lang,offers:{"@type":"Offer",price:"0",priceCurrency:"USD"},description:desc})}</script>
<script type="application/ld+json">${faqJsonLd(faqs)}</script>
<script type="application/ld+json">${crumbLd}</script>
<link rel="stylesheet" href="${base}styles.css" />
</head>
<body>
${header(lang, p.slug)}
${crumbTrail}
<section class="hero">
  <div class="wrap">
    <h1>${h1}</h1>
    <p class="hero-sub">${pIntro(p,lang)}</p>
  </div>
</section>

<main class="wrap" id="calculator">
${toolShell}
${relatedGrid(p.id, lang)}

  <section class="content-block">
    <h2>${u.howtoH}: ${cleanH1}</h2>
    <ol class="howto">${howHtml}</ol>
    <h3>${u.formulaH}</h3>
    <p class="formula-callout">${p.formula}</p>
    <p><a href="index.html#charts">${u.seeChart}</a></p>
  </section>

  <section id="faq" class="content-block">
    <h2>${cleanH1} — ${u.faq}</h2>
    ${faqHtml}
  </section>
</main>
${footer(lang)}
${scripts(lang, p.id)}
</body>
</html>
`;
}

/* ---------- silo landing page ---------- */
function renderSilo(silo, lang){
  const base = lang==="en" ? "" : "../";
  const u = UI[lang];
  const name = siloName(silo,lang), h1 = siloH1(silo,lang);
  const pages = siloPages(silo);
  const title = `${h1} | ${HUB_H1[lang]}`;
  const desc = `${CALCSWORD[lang]}: ${pages.map(p=>pH1(p,lang)).join(", ")}`.slice(0,158);
  const cards = pages.map(p =>
    `<a class="rel-card" href="${p.slug}.html"><b>${pH1(p,lang)}</b><span>${pDesc(p,lang).slice(0,70)}…</span></a>`
  ).join("\n      ");
  const crumbTrail = crumbs(lang, [
    {name:HOMEWORD[lang], slug:"index"},
    {name:name}
  ]);
  const crumbLd = breadcrumbJsonLd([
    {name:HOMEWORD[lang], url:urlFor(lang,"index")},
    {name:name, url:urlFor(lang,silo.slug)}
  ]);
  const itemList = JSON.stringify({"@context":"https://schema.org","@type":"ItemList",
    itemListElement: pages.map((p,i)=>({"@type":"ListItem",position:i+1,name:pH1(p,lang),url:urlFor(lang,p.slug)}))});
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<meta name="description" content="${desc}" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="${urlFor(lang,silo.slug)}" />
${altLinks(silo.slug)}
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:type" content="website" />
<script type="application/ld+json">${crumbLd}</script>
<script type="application/ld+json">${itemList}</script>
<link rel="stylesheet" href="${base}styles.css" />
</head>
<body>
${header(lang, silo.slug)}
${crumbTrail}
<section class="hero">
  <div class="wrap">
    <h1>${h1}</h1>
    <p class="hero-sub">${desc}</p>
  </div>
</section>

<main class="wrap">
  <section class="related">
    <div class="related-grid">
      ${cards}
    </div>
    <p class="silo-all"><a href="index.html">↗ ${u.all}</a></p>
  </section>
</main>
${footer(lang)}
</body>
</html>
`;
}

/* ---------- hub (index) per language ---------- */
function renderHub(lang){
  const base = lang==="en" ? "" : "../";
  const u = UI[lang];
  const h1 = HUB_H1[lang], title = `${h1} — ${HUB_TAG[lang]}`, desc = u.heroSub;
  const cats = {};
  PAGES.forEach(p => (cats[p.cat] ||= []).push(p));
  const directory = Object.entries(cats).map(([cat, items]) => {
    const silo = siloOfCat(cat);
    return `
      <div class="dir-cat">
        <h3><a href="${silo.slug}.html">${trG(cat,lang)} ${CALCSWORD[lang]} ↗</a></h3>
        <div class="related-grid">
          ${items.map(p=>`<a class="rel-card" href="${p.slug}.html"><b>${pH1(p,lang)}</b><span>${pDesc(p,lang).slice(0,52)}…</span></a>`).join("\n          ")}
        </div>
      </div>`;
  }).join("\n");

  const hubFaqs = (lang==="en")
    ? [["How do you calculate rebar weight?","Rebar weight per metre = d² ÷ 162.28, where d is the bar diameter in mm. Multiply by length and quantity for the total."],
       ["How do I calculate rebar for a concrete slab?","Bars one way = floor((slab dimension − 2×cover) ÷ spacing) + 1, both directions, × the bar's kg/m."],
       ["What is the development length of rebar?","Per IS 456, Ld = (φ × 0.87 × fy) ÷ (4 × τbd)."]]
    : TPL[lang].faq(h1, desc);
  const hubFaqHtml = hubFaqs.map(([q,a],i)=>`<details${i===0?" open":""}><summary>${q}</summary><p>${a}</p></details>`).join("\n    ");

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<meta name="description" content="${desc}" />
<meta name="keywords" content="rebar calculator, steel rebar calculator, rebar weight calculator, concrete slab rebar calculator, rebar spacing calculator, rebar cost calculator" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="${urlFor(lang,'index')}" />
${altLinks('index')}
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:type" content="website" />
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"WebApplication",name:h1,applicationCategory:"BusinessApplication",operatingSystem:"All",inLanguage:lang,offers:{"@type":"Offer",price:"0",priceCurrency:"USD"},description:desc})}</script>
<script type="application/ld+json">${faqJsonLd(hubFaqs)}</script>
<link rel="stylesheet" href="${base}styles.css" />
</head>
<body>
${header(lang, 'index')}
<section class="hero">
  <div class="wrap">
    <h1>${h1}</h1>
    <p class="hero-sub">${u.heroSub}</p>
    <ul class="hero-badges">${u.badges.map(b=>`<li>✔ ${b}</li>`).join("")}</ul>
  </div>
</section>

<main class="wrap" id="calculator">
${toolShell}

  <section class="related">
    <h2>${u.all}</h2>
    ${directory}
  </section>

  <section id="charts" class="content-block">
    <h2>${u.chartTitle}</h2>
    <div class="chart-2col">
      <div><h3>Metric</h3>
        <div class="formula-table"><table id="chart-metric">
          <thead><tr><th>Ø</th><th>kg/m</th><th>kg/ft</th><th>12 m</th></tr></thead><tbody></tbody>
        </table></div>
      </div>
      <div><h3>Imperial (US #)</h3>
        <div class="formula-table"><table id="chart-imperial">
          <thead><tr><th>#</th><th>Ø</th><th>lb/ft</th><th>kg/m</th></tr></thead><tbody></tbody>
        </table></div>
      </div>
    </div>
  </section>

  <section id="faq" class="content-block">
    <h2>${u.faqH}</h2>
    ${hubFaqHtml}
  </section>
</main>
${footer(lang)}
${scripts(lang, null)}
</body>
</html>
`;
}

/* ---------- write everything ---------- */
const slugMap = {}; PAGES.forEach(p => slugMap[p.id] = p.slug);
fs.writeFileSync(path.join(OUT,"slugs.js"),
  "window.REBAR_SLUGS = " + JSON.stringify(slugMap, null, 2) + ";\n");

let pageCount = 0;
LANGS.forEach(l => {
  const lang = l.code;
  const outDir = lang==="en" ? OUT : path.join(OUT, l.dir);
  if(lang!=="en") fs.mkdirSync(outDir, { recursive:true });
  fs.writeFileSync(path.join(outDir,"index.html"), renderHub(lang));
  SILOS.forEach(s => { fs.writeFileSync(path.join(outDir, s.slug+".html"), renderSilo(s, lang)); pageCount++; });
  PAGES.forEach(p => { fs.writeFileSync(path.join(outDir, p.slug+".html"), renderPage(p, lang)); pageCount++; });
});

/* ---------- sitemap generation ----------
   Hierarchical & organized by Silo with SEO metadata:
   - Priority & changefreq tailored per page level
   - lastmod automatically set to build date
   - Primary English pages grouped strictly by Silo hierarchy
   - Full coverage for all 22 localized languages
   ---------------------------------------- */
const today = new Date().toISOString().slice(0, 10);

function xmlUrl(loc, lastmod, changefreq, priority) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

function buildEnglishSitemapSection() {
  const chunks = [];
  chunks.push(`  <!-- ============================================================ -->`);
  chunks.push(`  <!-- ENGLISH PAGES (Primary Hub, Silos, and Calculators)          -->`);
  chunks.push(`  <!-- ============================================================ -->`);
  chunks.push(`  <!-- Main Hub / Homepage -->`);
  chunks.push(xmlUrl(urlFor("en", "index"), today, "weekly", "1.0"));

  SILOS.forEach(silo => {
    chunks.push(`\n  <!-- Silo: ${silo.cat} Calculators -->`);
    chunks.push(xmlUrl(urlFor("en", silo.slug), today, "weekly", "0.8"));
    const children = PAGES.filter(p => p.cat === silo.cat);
    children.forEach(p => {
      chunks.push(xmlUrl(urlFor("en", p.slug), today, "monthly", "0.6"));
    });
  });
  return chunks.join("\n");
}

function buildInternationalSitemapSection() {
  const chunks = [];
  chunks.push(`\n  <!-- ============================================================ -->`);
  chunks.push(`  <!-- INTERNATIONAL / LOCALIZED PAGES                              -->`);
  chunks.push(`  <!-- ============================================================ -->`);

  LANGS.filter(l => l.code !== "en").forEach(l => {
    chunks.push(`\n  <!-- Language: ${l.name} (${l.code}) -->`);
    chunks.push(xmlUrl(urlFor(l.code, "index"), today, "weekly", "0.7"));
    SILOS.forEach(silo => {
      chunks.push(xmlUrl(urlFor(l.code, silo.slug), today, "weekly", "0.6"));
      const children = PAGES.filter(p => p.cat === silo.cat);
      children.forEach(p => {
        chunks.push(xmlUrl(urlFor(l.code, p.slug), today, "monthly", "0.5"));
      });
    });
  });
  return chunks.join("\n");
}

const enXmlSection = buildEnglishSitemapSection();
const intlXmlSection = buildInternationalSitemapSection();

// 1. Comprehensive Master sitemap.xml (all pages: English + 21 international languages)
const masterSitemapXml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  enXmlSection + `\n` +
  intlXmlSection + `\n` +
  `</urlset>\n`;
fs.writeFileSync(path.join(OUT, "sitemap.xml"), masterSitemapXml);

// 2. Clean English-only sitemap (sitemap-en.xml)
const enSitemapXml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  enXmlSection + `\n` +
  `</urlset>\n`;
fs.writeFileSync(path.join(OUT, "sitemap-en.xml"), enSitemapXml);

fs.writeFileSync(path.join(OUT, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\nSitemap: ${SITE}/sitemap-en.xml\n`);

const totalUrls = (1 + SILOS.length + PAGES.length) * LANGS.length;
const enUrls = 1 + SILOS.length + PAGES.length;
console.log(`Generated ${LANGS.length} languages × (${PAGES.length} pages + hub) = ${pageCount + LANGS.length} HTML files`);
console.log(`Sitemap: ${totalUrls} total URLs organized across ${LANGS.length} languages (${enUrls} English URLs in sitemap-en.xml)`);

