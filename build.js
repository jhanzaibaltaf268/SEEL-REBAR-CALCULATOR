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
  { cat:"Detailing",  slug:"rebar-detailing-calculators" },
  { cat:"Members",    slug:"structural-rebar-calculators" },
  { cat:"Commercial", slug:"rebar-cost-tonnage-calculators" },
];
const siloOfCat = cat => SILOS.find(s => s.cat === cat);
const siloOfId  = id  => siloOfCat(PAGES.find(p => p.id === id).cat);
const siloPages = silo => PAGES.filter(p => p.cat === silo.cat);

/* Workflow companion tools for hybrid cross-silo linking */
const WORKFLOW_COMPANIONS = {
  slab:     ["spacing", "chair", "tiewire", "cost"],
  footing:  ["column", "chair", "develop", "cost"],
  mat:      ["tiewire", "chair", "lap", "quantity"],
  spacing:  ["slab", "wall", "area", "quantity"],
  develop:  ["lap", "hook", "column", "beam"],
  lap:      ["develop", "column", "beam", "hook"],
  hook:     ["stirrup", "weight", "beam", "column"],
  stirrup:  ["column", "beam", "hook", "weight"],
  column:   ["stirrup", "lap", "footing", "cost"],
  beam:     ["stirrup", "develop", "lap", "tonnage"],
  cost:     ["weight", "tonnage", "concrete", "slab"],
  tonnage:  ["cost", "weight", "quantity", "slab"],
  area:     ["spacing", "beam", "column", "weight"],
  quantity: ["slab", "concrete", "cost", "tonnage"],
  concrete: ["slab", "driveway", "cost", "quantity"],
  driveway: ["chair", "tiewire", "concrete", "cost"],
  wall:     ["footing", "develop", "spacing", "cost"],
  pool:     ["slab", "wall", "tiewire", "chair"],
  chair:    ["slab", "footing", "driveway", "mat"],
  tiewire:  ["slab", "mat", "pool", "chair"],
  weight:   ["cost", "tonnage", "area", "quantity"]
};

const WORKFLOW_HEADING = {
  en: "Recommended Workflow & Companion Tools",
  es: "Herramientas recomendadas del proceso",
  fr: "Outils recommandés pour votre métré",
  de: "Empfohlene Werkzeuge für den Arbeitsablauf",
  it: "Strumenti correlati consigliati",
  pt: "Ferramentas complementares recomendadas",
  nl: "Aanbevolen tools voor de workflow",
  pl: "Powiązane narzędzia do obliczeń",
  ro: "Instrumente recomandate pentru fluxul de lucru",
  sv: "Rekommenderade verktyg för arbetsflödet",
  cs: "Doporučené nástroje pro pracovní postup",
  da: "Anbefalede værktøjer til arbejdsgangen",
  el: "Προτεινόμενα συνδεδεμένα εργαλεία",
  hu: "Ajánlott kapcsolódó eszközök",
  fi: "Suositellut liittyvät työkalut",
  bg: "Препоръчани свързани инструменти",
  hr: "Preporučeni povezani alati",
  sk: "Odporúčané súvisiace nástroje",
  sl: "Priporočena povezana orodja",
  et: "Soovitatavad seotud tööriistad",
  lv: "Ieteicamie saistītie rīki",
  lt: "Rekomenduojami susiję įrankiai"
};

const SILO_CONTENT = {
  Weight: {
    heroSub: "Precision steel rebar weight, tensile cross-sectional area (Ast), and area takeoff density tools based on standard steel density and international building codes.",
    overview: `
      <h2>Engineering Fundamentals: Rebar Weight & Takeoff</h2>
      <p>Reinforcement bar weight calculations form the foundation of structural material takeoffs, freight planning, and steel procurement. Structural carbon steel has a nominal density of 7,850 kg/m³. In metric jurisdictions governed by standards such as IS 456, BS 4449, or Eurocode 2, the unit weight per metre follows the direct mathematical relationship of bar diameter: <code>kg/m = d² ÷ 162.28</code>, where d is the nominal diameter in millimetres.</p>
      <p>For US imperial reinforcement complying with ASTM A615 and ASTM A706, nominal bar designations (#3 through #18) are defined by eighths of an inch up to #8, transitioning to equivalent area cylinders for larger bars. Commercial suppliers bill against certified ASTM weight-per-foot specifications rather than pure volumetric cylinders to account for mill deformation ribs.</p>
    `,
    table: [
      { tool: "Rebar Weight Calculator", bestFor: "Single bars, cut lengths & custom schedules", output: "kg, lb, metric tons & US tons" },
      { tool: "Rebar Area Calculator (Ast)", bestFor: "Tensile steel area & reinforcement ratios", output: "Single bar area, Ast (mm²/in²), steel %" },
      { tool: "Rebar Quantity Calculator", bestFor: "Rapid square-metre / square-foot takeoffs", output: "kg/m², kg/ft², total pour weight" }
    ],
    faqs: [
      ["How is the metric rebar weight formula d² / 162.28 derived?", "Unit weight equals cross-sectional area multiplied by steel density: Area = (π/4)·d². Multiplying by density (7,850 kg/m³) and converting units gives (π/4)·(d/1000)² · 7850 · 1m = d² / 162.28 kg/m."],
      ["What is the weight of common metric rebar sizes?", "8mm = 0.395 kg/m, 10mm = 0.617 kg/m, 12mm = 0.888 kg/m, 16mm = 1.578 kg/m, 20mm = 2.466 kg/m, 25mm = 3.853 kg/m, and 32mm = 6.313 kg/m."],
      ["How do I convert steel weight into purchase orders?", "Sum your schedule's total weight in kilograms and convert to metric tons (divide by 1,000) or US short tons (divide by 907.2). Always add 3–5% for cutting offcuts and lap splices."]
    ],
    next: {
      title: "Next Steps in Your Estimating Workflow",
      text: "Once you know your bar weights and area densities, estimate exact element reinforcement or calculate purchase budgets:",
      links: [
        { name: "Concrete Pour Estimating", slug: "concrete-rebar-estimating-calculators" },
        { name: "Commercial Tonnage & Cost", slug: "rebar-cost-tonnage-calculators" }
      ]
    }
  },
  Estimating: {
    heroSub: "Calculate reinforcement bar counts, grid spacing, two-way mesh weights, and total steel quantities for slabs, footings, mats, and driveways.",
    overview: `
      <h2>Concrete Reinforcement Estimating Best Practices</h2>
      <p>Estimating rebar for cast-in-place concrete requires balancing three governing factors: structural grid spacing, clear cover offsets to prevent environmental corrosion, and lap splices required when spans exceed standard stock lengths (6m, 9m, or 12m). While rough preliminary budgets often assume rule-of-thumb ratios (80–120 kg of steel per m³ of slab concrete), actual construction ordering demands precise piece takeoffs.</p>
      <p>In two-way slabs, foundation mats, and footings, rebar is placed in orthogonal layers (bottom tension mats and suspended top mats). Our estimating tools automatically deduct edge cover on both sides before dividing by design spacing, giving you the exact piece counts and total bar lengths needed for orders.</p>
    `,
    table: [
      { tool: "Concrete Slab Rebar Calculator", bestFor: "Two-way slab grids & suspended floors", output: "Bar counts each way, total length, ties, weight" },
      { tool: "Footing Rebar Calculator", bestFor: "Pad, isolated & strip footings", output: "Mesh bar schedule, edge clearances, total steel" },
      { tool: "Rebar Mat & Grid Calculator", bestFor: "General rectangular reinforcement grids", output: "Grid layout, intersection count, linear metres" },
      { tool: "Concrete & Rebar Estimator", bestFor: "Combined pour volume & steel takeoff", output: "Volume (m³/yd³) + estimated reinforcement kg" },
      { tool: "Driveway Rebar Calculator", bestFor: "Residential & commercial vehicle pavements", output: "Crack-control single mat counts & total steel" }
    ],
    faqs: [
      ["What rebar size and spacing is typical for a concrete slab?", "Residential ground slabs commonly specify #3 (10mm) or #4 (12mm) bars at 150mm to 300mm (6\" to 12\") centres both ways, placed on bar chairs to maintain cover."],
      ["What is clear cover and why is it deducted from slab dimensions?", "Clear cover is the distance between outer rebar and the concrete face. It protects steel against moisture and fire. Subtracting double the edge cover ensures bars fit within formwork."],
      ["How much extra rebar should be ordered for lap splices?", "Whenever a slab dimension exceeds standard bar length (typically 12m or 40ft), bars must overlap. Plan an additional 5% to 10% steel allowance for splices and cutting scrap."]
    ],
    next: {
      title: "Next Steps in Your Estimating Workflow",
      text: "With element quantities estimated, calculate fabrication cutting lengths or determine on-site accessory requirements:",
      links: [
        { name: "Detailing & Splicing Calculators", slug: "rebar-detailing-calculators" },
        { name: "Commercial Cost & Tonnage", slug: "rebar-cost-tonnage-calculators" }
      ]
    }
  },
  Members: {
    heroSub: "Design and take-off reinforcement steel for primary structural members: columns, beams, retaining walls, and swimming pool shells.",
    overview: `
      <h2>Reinforced Concrete Member Design Principles</h2>
      <p>Structural members must resist complex combinations of axial gravity loads, bending moments, and lateral shear forces. Under IS 456, ACI 318, and Eurocode 2, member detailing separates steel into two vital functions: primary longitudinal reinforcement to resist tension and compression, and transverse confinement steel (stirrups and column ties) to prevent diagonal shear failure and bar buckling.</p>
      <p>In columns, vertical bars are confined within closed lateral ties that maintain column core integrity under extreme seismic and axial loads. In beams, bottom tensile bars carry positive sagging moments, while top bars carry negative hogging moments over supports. Our member calculators compute both longitudinal and transverse steel simultaneously.</p>
    `,
    table: [
      { tool: "Column Rebar Calculator", bestFor: "Rectangular columns & pedestals", output: "Vertical bars + lateral tie count, lap, total weight" },
      { tool: "Beam Rebar Calculator", bestFor: "Reinforced concrete beams & lintels", output: "Top & bottom main bars, stirrups, total weight" },
      { tool: "Wall Rebar Calculator", bestFor: "Retaining, basement & block walls", output: "Vertical stem steel, horizontal distribution bars" },
      { tool: "Swimming Pool Rebar Calculator", bestFor: "Pool shells & retaining water panels", output: "Dual-direction wall panel mesh and steel weight" }
    ],
    faqs: [
      ["What is the minimum number of vertical bars in a column?", "Rectangular columns require a minimum of 4 longitudinal bars (one in each corner); circular columns require at least 6 bars. Minimum bar diameter is generally 12mm (#4)."],
      ["Why are beam stirrups spaced closer near support faces?", "Shear forces peak at beam supports and decrease towards midspan. Tighter stirrup spacing (100–150mm) near supports prevents 45-degree diagonal shear cracks."],
      ["How are wall vertical bars anchored into footings?", "Vertical bars in retaining walls must be lapped with starter dowels anchored into the footing pad by at least the full development length (Ld) to transfer bending moment."]
    ],
    next: {
      title: "Next Steps in Your Estimating Workflow",
      text: "Need exact cutting lengths for column ties or beam splices? Use our detailing tools or calculate purchase budgets:",
      links: [
        { name: "Stirrup & Tie Cutting Length", slug: "stirrup-tie-cutting-length-calculator" },
        { name: "Rebar Detailing Calculators", slug: "rebar-detailing-calculators" }
      ]
    }
  },
  Detailing: {
    heroSub: "Engineering detailing tools for rebar development length (Ld), lap splices, hooks, bends, stirrup cutting lengths, chairs, and tie wire.",
    overview: `
      <h2>Structural Detailing, Splicing & Fabrication Standards</h2>
      <p>Structural integrity depends entirely on the mechanical bond between ribbed steel and surrounding concrete. Under IS 456:2000 and ACI 318-19, development length (Ld) determines how deeply a bar must be embedded into concrete so that it can develop its full yield strength without pullout. When two bars are spliced, lap length specifications ensure forces transfer seamlessly across the joint through surrounding concrete in tension or compression.</p>
      <p>Furthermore, bar bending stretches steel along outer curves, requiring standardized bend deductions (1d for 45°, 2d for 90°, 3d for 135°) to prevent fabricated cages from exceeding formwork dimensions. On-site physical accessories—bar chairs and 16-gauge black annealed tie wire—are essential to preserve designed cover and secure mesh during concrete vibration.</p>
    `,
    table: [
      { tool: "Rebar Spacing Calculator", bestFor: "Member bar distributions & clear gaps", output: "Bar count, actual c/c spacing, clear concrete gap" },
      { tool: "Rebar Development Length (Ld)", bestFor: "Full anchorage embedment depth", output: "Ld in mm, tension/compression multiples of dia" },
      { tool: "Rebar Lap / Splice Length", bestFor: "Tensile & compressive bar splices", output: "Tension lap (max Ld, 30d) & compression lap" },
      { tool: "Hook, Bend & Cutting Length", bestFor: "Fabricated bar cutting dimensions", output: "Straight length + 9d hooks − bend deductions" },
      { tool: "Stirrup & Tie Cutting Length", bestFor: "Rectangular closed shear ties", output: "Perimeter + dual 135° seismic hooks − deductions" },
      { tool: "Rebar Chair Calculator", bestFor: "Top mat elevation & support density", output: "Total chair count, chairs per m² / square foot" },
      { tool: "Rebar Tie Wire Calculator", bestFor: "Grid tying consumables & weight", output: "Total wire length, coil count, weight in kg/lb" }
    ],
    faqs: [
      ["What is the difference between development length and lap length?", "Development length is the anchorage embedment a single bar needs to reach yield strength in concrete. Lap length is the overlap between two spliced bars so stress safely transfers from one bar to another."],
      ["Why do rebar cutting formulas subtract deductions for bends?", "Bending steel stretches outer fibres while compressing inner fibres, increasing overall external length. Deducting 1d for 45°, 2d for 90°, and 3d for 135° ensures bent bars fit accurately into formwork."],
      ["How many bar chairs are needed per square metre?", "For typical slab reinforcement, plan 1.0 to 1.5 bar chairs per square metre (spacing chairs approximately 0.8m to 1.0m on a square grid) to prevent sagging under foot traffic."],
      ["What gauge tie wire is used for reinforcing steel?", "16-gauge (approx. 1.6mm) soft annealed black wire is the international standard, requiring approximately 250mm to 350mm of wire per tied intersection."]
    ],
    next: {
      title: "Next Steps in Your Estimating Workflow",
      text: "Turn your detailed cutting and bending schedules into supplier orders and project cost estimates:",
      links: [
        { name: "Rebar Cost & Tonnage", slug: "rebar-cost-tonnage-calculators" },
        { name: "Structural Member Calculators", slug: "structural-rebar-calculators" }
      ]
    }
  },
  Commercial: {
    heroSub: "Turn bar schedules into purchase orders, freight deliveries, and budgets: convert piece schedules into metric/US tons and calculate costs with wastage.",
    overview: `
      <h2>Commercial Procurement: Rebar Tonnage & Costing</h2>
      <p>Commercial rebar estimating bridges structural engineering drawings and steel mill procurement. Reinforcing steel is quoted and sold by weight—either per metric ton (1,000 kg / 2,204.6 lbs) in metric markets or per US short ton (2,000 lbs / 907.2 kg) or hundredweight (cwt) in US imperial markets.</p>
      <p>Accurate purchasing requires accounting for standard mill stock lengths (typically 12 metres in metric jurisdictions, or 20ft / 40ft / 60ft in imperial markets). Because standard bars must be cut and spliced on site, a cutting scrap and wastage allowance (typically 3% to 5% for simple slabs, rising to 7% to 10% for complex frames) must be budgeted to prevent project shortages.</p>
    `,
    table: [
      { tool: "Rebar Cost Calculator", bestFor: "Budgeting & purchase quotes", output: "Material total, wastage allowance cost, rate per ton" },
      { tool: "Rebar Tonnage Calculator", bestFor: "Bulk procurement & mill orders", output: "Metric tons, US short tons, total kilograms" }
    ],
    faqs: [
      ["What wastage percentage should be allowed when ordering rebar?", "Allow 3% to 5% for standard foundations, footings, and slabs. For complex structures with numerous bends, cutouts, and lap splices, budget 7% to 10% to prevent site shortages."],
      ["What is the difference between a metric ton and a US short ton?", "A metric ton is exactly 1,000 kg (2,204.6 lbs). A US short ton is 2,000 lbs (907.185 kg). Always verify which ton unit your steel supplier's quote is based on."],
      ["How many 12-metre bars are in one metric ton?", "For 12mm bar (0.888 kg/m), each 12m bar weighs ~10.66 kg, giving ~94 bars per ton. For 16mm bar (1.578 kg/m), each 12m bar weighs ~18.94 kg, giving ~53 bars per ton."]
    ],
    next: {
      title: "Next Steps in Your Estimating Workflow",
      text: "Need to revise bar schedules or calculate specific member steel before placing an order?",
      links: [
        { name: "Rebar Weight Calculators", slug: "rebar-weight-calculators" },
        { name: "Concrete Pour Estimating", slug: "concrete-rebar-estimating-calculators" }
      ]
    }
  }
};

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

/* ---------- Transliteration & Multilingual Slug Generation ---------- */
const SPECIAL_CHARS = {
  'ä':'ae','ö':'oe','ü':'ue','Ä':'ae','Ö':'oe','Ü':'ue',
  'æ':'ae','ø':'oe','å':'aa','ß':'ss','œ':'oe','đ':'d','ð':'d','þ':'th',
  'ł':'l','Ł':'l'
};

const GREEK_MULTI = {
  'ου':'ou','ού':'ou','ει':'ei','εί':'ei','αι':'ai','αί':'ai','οι':'oi','oí':'oi',
  'αυ':'av','αύ':'av','ευ':'ev','εύ':'ev'
};

const GREEK_MAP = {
  'α':'a','β':'v','γ':'g','δ':'d','ε':'e','ζ':'z','η':'i','θ':'th','ι':'i',
  'κ':'k','λ':'l','μ':'m','ν':'n','ξ':'x','ο':'o','π':'p','ρ':'r','σ':'s',
  'ς':'s','τ':'t','υ':'y','φ':'f','χ':'ch','ψ':'ps','ω':'o',
  'ά':'a','έ':'e','ή':'i','ί':'i','ό':'o','ύ':'y','ώ':'o','ϊ':'i','ϋ':'y',
  'ΐ':'i','ΰ':'y'
};

const CYRILLIC_MAP = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ж':'zh','з':'z','и':'i',
  'й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
  'с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sht',
  'ъ':'a','ь':'y','ю':'yu','я':'ya'
};

function slugify(text) {
  let s = String(text || '').toLowerCase();
  for (const [k, v] of Object.entries(SPECIAL_CHARS)) {
    s = s.replaceAll(k, v);
  }
  for (const [k, v] of Object.entries(GREEK_MULTI)) {
    s = s.replaceAll(k, v);
  }
  s = s.split('').map(c => GREEK_MAP[c] || c).join('');
  s = s.split('').map(c => CYRILLIC_MAP[c] || c).join('');
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return s;
}

function pageSlug(p, lang) {
  if (lang === "en") return p.slug;
  const t = CALC[p.id] && CALC[p.id].title && CALC[p.id].title[lang];
  return slugify(t || p.h1);
}

function siloSlug(silo, lang) {
  if (lang === "en") return silo.slug;
  const catName = trG(silo.cat, lang);
  return slugify(`${catName} ${CALCSWORD[lang]}`);
}

function pageHref(p, lang) {
  const prefix = lang === "en" ? "" : "/" + dirOf(lang);
  return `${prefix}/${pageSlug(p, lang)}`;
}

function siloHref(silo, lang) {
  const prefix = lang === "en" ? "" : "/" + dirOf(lang);
  return `${prefix}/${siloSlug(silo, lang)}`;
}

function homeHref(lang) {
  return lang === "en" ? "/" : `/${dirOf(lang)}/`;
}

/* ---------- URL + path helpers ---------- */
const dirOf = lang => LANGS.find(l=>l.code===lang).dir;
function urlFor(lang, slug){
  const prefix = lang==="en" ? "" : "/"+dirOf(lang);
  return slug==="index" ? SITE+prefix+"/" : SITE+prefix+"/"+slug;
}
function switchHref(curLang, targetLang, type, item){
  if (type === 'index') return homeHref(targetLang);
  if (type === 'page') return pageHref(item, targetLang);
  if (type === 'silo') return siloHref(item, targetLang);
  return homeHref(targetLang);
}
function altLinks(type, item){
  return LANGS.map(l => {
    let slug;
    if (type === 'index') slug = 'index';
    else if (type === 'page') slug = pageSlug(item, l.code);
    else if (type === 'silo') slug = siloSlug(item, l.code);
    return `<link rel="alternate" hreflang="${l.code}" href="${urlFor(l.code, slug)}" />`;
  }).join("\n")
    + `\n<link rel="alternate" hreflang="x-default" href="${urlFor('en', type === 'index' ? 'index' : (type === 'page' ? item.slug : item.slug))}" />`;
}
/* localized getters (en uses the rich PAGES content) */
const pH1   = (p,lang) => lang==="en" ? p.h1 : CALC[p.id].title[lang];
const pDesc = (p,lang) => lang==="en" ? p.desc : CALC[p.id].desc[lang];
const pTitle= (p,lang) => lang==="en" ? p.metaTitle : `${CALC[p.id].title[lang]} — ${TPL[lang].metaSuffix}`;
const pIntro= (p,lang) => lang==="en" ? p.intro : CALC[p.id].desc[lang];
const pHowto= (p,lang) => lang==="en" ? p.howto : TPL[lang].howto;
const pFaqs = (p,lang) => lang==="en" ? p.faqs : TPL[lang].faq(CALC[p.id].title[lang], CALC[p.id].desc[lang]);

/* ---------- shared HTML pieces ---------- */
function langSwitch(curLang, type, item){
  const cur = LANGS.find(l=>l.code===curLang);
  return `<details class="lang-dropdown">
      <summary>🌐 ${cur.label} <span class="caret">▾</span></summary>
      <div class="lang-menu">${LANGS.map(l=>`<a class="lang${l.code===curLang?' active':''}" hreflang="${l.code}" href="${switchHref(curLang, l.code, type, item)}">${l.name}</a>`).join("")}</div>
    </details>`;
}

function header(lang, type, item, activeSiloSlug){
  const u = UI[lang];
  const homeUrl = homeHref(lang);
  const siloPills = SILOS.map(s => {
    const s_slug = siloSlug(s, lang);
    const isActive = activeSiloSlug === s_slug || activeSiloSlug === s.slug;
    return `<a class="silo-bar-pill${isActive ? ' active' : ''}" href="${siloHref(s, lang)}"><b>${siloName(s, lang)}</b></a>`;
  }).join("");

  return `
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="${homeUrl}"><span class="brand-mark">▦</span>
      <span class="brand-text">Rebar<strong>Calc</strong></span></a>
    <nav class="top-nav">
      <a href="${homeUrl}">${u.allCalcs}</a>
      <a href="${homeUrl}#charts">${u.weightChart}</a>
      <a href="${homeUrl}#faq">${u.faq}</a>
    </nav>
    ${langSwitch(lang, type, item)}
  </div>
  <div class="silos-bar">
    <div class="wrap silos-bar-inner">
      <span class="silos-bar-label">${CALCSWORD[lang]}:</span>
      ${siloPills}
    </div>
  </div>
</header>`;
}

function footer(lang){
  const u = UI[lang];
  const homeUrl = homeHref(lang);
  const disclaimer = (lang === "en")
    ? "Results are estimates for material planning and ordering. Verify against your structural drawings and local building code before construction; safety-critical designs require review by a qualified engineer."
    : u.disclaimer;

  const cols = SILOS.map(s => {
    const children = siloPages(s);
    const links = children.map(p => `<li><a href="${pageHref(p, lang)}">${pH1(p, lang)}</a></li>`).join("\n          ");
    return `
      <div class="footer-col">
        <h4><a href="${siloHref(s, lang)}">${siloName(s, lang)} ${CALCSWORD[lang]}</a></h4>
        <ul>
          ${links}
        </ul>
      </div>`;
  }).join("\n");

  return `
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-silos-grid">
      ${cols}
    </div>
    <div class="footer-bottom">
      <div class="footer-brand">
        <a class="brand" href="${homeUrl}"><span class="brand-mark">▦</span>
          <span class="brand-text">Rebar<strong>Calc</strong></span></a>
        <p><strong>Rebar Calculator</strong> — ${u.footer}</p>
      </div>
      <div class="footer-quick-links">
        <a href="${homeUrl}">${u.allCalcs}</a>
        <a href="${homeUrl}#charts">${u.weightChart}</a>
        <a href="${homeUrl}#faq">${u.faq}</a>
      </div>
      <p class="muted">${disclaimer}</p>
    </div>
  </div>
</footer>`;
}

function renderToolShell(lang, activeCalcId){
  const cats = {};
  PAGES.forEach(p => (cats[p.cat] ||= []).push(p));
  const tabsHtml = Object.entries(cats).map(([cat, items]) => {
    const isCatActive = activeCalcId && items.some(p => p.id === activeCalcId);
    const catTitle = trG(cat, lang);
    const links = items.map(p => {
      const isActive = p.id === activeCalcId;
      return `<a class="tab${isActive ? ' active' : ''}" href="${pageHref(p, lang)}" data-id="${p.id}">${pH1(p, lang)}</a>`;
    }).join("\n      ");
    return `<div class="tab-group${isCatActive ? ' active-group' : ''}">${catTitle}</div>\n      ${links}`;
  }).join("\n    ");

  return `
  <div class="calc-shell">
    <aside class="calc-tabs" id="calc-tabs" role="tablist" aria-label="Choose a calculator">
      ${tabsHtml}
    </aside>
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
}

/* scripts block: assets live at root, so sub-dir pages prefix ../ */
function scripts(lang, calcId){
  const base = lang==="en" ? "" : "../";
  return `<script>window.PAGE_LANG="${lang}";${calcId?`window.PAGE_CALC="${calcId}";`:""}</script>
<script src="${base}i18n.js"></script>
<script src="${base}slugs.js"></script>
<script src="${base}script.js"></script>`;
}

/* In-silo sibling cards */
function relatedGrid(currentId, lang){
  const u = UI[lang];
  const silo = siloOfId(currentId);
  const siblings = siloPages(silo).filter(p => p.id !== currentId);
  const cards = siblings.map(p =>
    `<a class="rel-card" href="${pageHref(p, lang)}"><b>${pH1(p,lang)}</b><span>${pDesc(p,lang).slice(0,48)}…</span></a>`
  ).join("\n      ");
  return `
  <section class="related">
    <h2>${u.more} — ${siloName(silo,lang)}</h2>
    <div class="related-grid">
      ${cards}
    </div>
    <p class="silo-all"><a href="${siloHref(silo, lang)}">↗ ${siloH1(silo,lang)}</a></p>
  </section>`;
}

/* Cross-silo workflow companion cards */
function workflowGrid(currentId, lang){
  const companionIds = WORKFLOW_COMPANIONS[currentId] || [];
  if (!companionIds.length) return "";
  const companionPages = companionIds.map(id => PAGES.find(p => p.id === id)).filter(Boolean);
  
  const heading = WORKFLOW_HEADING[lang] || WORKFLOW_HEADING.en;
  const subtext = (lang === "en")
    ? "Complete your reinforcement estimating sequence with these connected tools:"
    : "";

  const cards = companionPages.map(p => {
    const pSilo = siloOfId(p.id);
    return `<a class="rel-card workflow-card" href="${pageHref(p, lang)}">
        <span class="workflow-badge">${siloName(pSilo, lang)}</span>
        <b>${pH1(p, lang)}</b>
        <span>${pDesc(p, lang).slice(0, 52)}…</span>
      </a>`;
  }).join("\n      ");

  return `
  <section class="related workflow-section">
    <h2>⚡ ${heading}</h2>
    ${subtext ? `<p class="workflow-sub">${subtext}</p>` : ''}
    <div class="related-grid">
      ${cards}
    </div>
  </section>`;
}

function faqJsonLd(faqs){
  return JSON.stringify({"@context":"https://schema.org","@type":"FAQPage",
    mainEntity: faqs.map(([q,a])=>({"@type":"Question",name:q,acceptedAnswer:{"@type":"Answer",text:a}}))});
}
/* visible breadcrumb trail */
function crumbs(lang, trail){
  const parts = trail.map((c,i) => c.href
    ? `<a href="${c.href}">${c.name}</a>`
    : `<span>${c.name}</span>`);
  return `<div class="wrap"><nav class="crumbs" aria-label="Breadcrumb">${parts.join(" <i>›</i> ")}</nav></div>`;
}
function breadcrumbJsonLd(items){
  return JSON.stringify({"@context":"https://schema.org","@type":"BreadcrumbList",
    itemListElement: items.map((it,i)=>({"@type":"ListItem",position:i+1,name:it.name,item:it.url}))});
}

const TRACKING_HEAD = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-YLR474NHZW"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-YLR474NHZW');
</script>
<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "y5pzyawpgn");
</script>`;

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
  const curPageSlug = pageSlug(p, lang);
  const curSiloSlug = siloSlug(silo, lang);
  const crumbTrail = crumbs(lang, [
    {name:HOMEWORD[lang], href:homeHref(lang)},
    {name:siloName(silo,lang), href:siloHref(silo, lang)},
    {name:cleanH1}
  ]);
  const crumbLd = breadcrumbJsonLd([
    {name:HOMEWORD[lang], url:urlFor(lang,"index")},
    {name:siloName(silo,lang), url:urlFor(lang,curSiloSlug)},
    {name:h1, url:urlFor(lang,curPageSlug)}
  ]);
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
${TRACKING_HEAD}
<link rel="icon" type="image/svg+xml" href="${base}favicon.svg" />
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<meta name="description" content="${desc}" />
<meta name="keywords" content="${p.kw}" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="${urlFor(lang,curPageSlug)}" />
${altLinks('page', p)}
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:type" content="website" />
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"WebApplication",name:h1,applicationCategory:"BusinessApplication",operatingSystem:"All",inLanguage:lang,offers:{"@type":"Offer",price:"0",priceCurrency:"USD"},description:desc})}</script>
<script type="application/ld+json">${faqJsonLd(faqs)}</script>
<script type="application/ld+json">${crumbLd}</script>
<link rel="stylesheet" href="${base}styles.css" />
</head>
<body>
${header(lang, 'page', p, curSiloSlug)}
${crumbTrail}
<section class="hero">
  <div class="wrap">
    <h1>${h1}</h1>
    <p class="hero-sub">${pIntro(p,lang)}</p>
  </div>
</section>

<main class="wrap" id="calculator">
${renderToolShell(lang, p.id)}
${relatedGrid(p.id, lang)}
${workflowGrid(p.id, lang)}

  <section class="content-block">
    <h2>${u.howtoH}: ${cleanH1}</h2>
    <ol class="howto">${howHtml}</ol>
    <h3>${u.formulaH}</h3>
    <p class="formula-callout">${p.formula}</p>
    <p><a href="${homeHref(lang)}#charts">${u.seeChart}</a></p>
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
  const homeUrl = homeHref(lang);
  const name = siloName(silo,lang), h1 = siloH1(silo,lang);
  const pages = siloPages(silo);
  const title = `${h1} | ${HUB_H1[lang]}`;
  const sc = SILO_CONTENT[silo.cat] || {};
  const desc = (lang === "en" && sc.heroSub)
    ? sc.heroSub
    : `${CALCSWORD[lang]}: ${pages.map(p=>pH1(p,lang)).join(", ")}`.slice(0,158);

  const curSiloSlug = siloSlug(silo, lang);

  const cards = pages.map(p =>
    `<a class="rel-card" href="${pageHref(p, lang)}"><b>${pH1(p,lang)}</b><span>${pDesc(p,lang).slice(0,70)}…</span></a>`
  ).join("\n      ");

  const crumbTrail = crumbs(lang, [
    {name:HOMEWORD[lang], href:homeUrl},
    {name:name}
  ]);
  const crumbLd = breadcrumbJsonLd([
    {name:HOMEWORD[lang], url:urlFor(lang,"index")},
    {name:name, url:urlFor(lang,curSiloSlug)}
  ]);
  const itemList = JSON.stringify({"@context":"https://schema.org","@type":"ItemList",
    itemListElement: pages.map((p,i)=>({"@type":"ListItem",position:i+1,name:pH1(p,lang),url:urlFor(lang,pageSlug(p, lang))}))});

  const faqs = (lang === "en" && sc.faqs)
    ? sc.faqs
    : TPL[lang].faq(h1, desc);
  const faqHtml = faqs.map(([q,a],i)=>`<details${i===0?" open":""}><summary>${q}</summary><p>${a}</p></details>`).join("\n    ");

  const matrixRows = (lang === "en" && sc.table)
    ? sc.table.map(row => {
        const matchingPage = pages.find(p => p.h1.includes(row.tool.split(" ")[0]) || row.tool.includes(p.h1.split(" ")[0])) || pages[0];
        return `<tr>
          <td><a href="${pageHref(matchingPage, lang)}"><strong>${row.tool}</strong></a></td>
          <td>${row.bestFor}</td>
          <td><code>${row.output}</code></td>
        </tr>`;
      }).join("\n        ")
    : pages.map(p => `<tr>
          <td><a href="${pageHref(p, lang)}"><strong>${pH1(p, lang)}</strong></a></td>
          <td>${pDesc(p, lang).slice(0, 65)}…</td>
          <td><code>${trG("Quantity (pieces)", lang)} / ${trG("Total weight", lang)}</code></td>
        </tr>`).join("\n        ");

  const nextStepsBlock = (lang === "en" && sc.next)
    ? `
  <section class="silo-next-steps">
    <h3>🚀 ${sc.next.title}</h3>
    <p>${sc.next.text}</p>
    <div class="silo-next-links">
      ${sc.next.links.map(l => `<a class="silo-btn-next" href="${l.slug}">↗ ${l.name}</a>`).join("")}
    </div>
  </section>`
    : "";

  const enOverviewBlock = (lang === "en" && sc.overview)
    ? `<section class="content-block silo-hub-content">${sc.overview}</section>`
    : "";

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
${TRACKING_HEAD}
<link rel="icon" type="image/svg+xml" href="${base}favicon.svg" />
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<meta name="description" content="${desc}" />
<meta name="keywords" content="${name}, ${CALCSWORD[lang]}, rebar calculators" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="${urlFor(lang,curSiloSlug)}" />
${altLinks('silo', silo)}
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:type" content="website" />
<script type="application/ld+json">${crumbLd}</script>
<script type="application/ld+json">${itemList}</script>
<script type="application/ld+json">${faqJsonLd(faqs)}</script>
<link rel="stylesheet" href="${base}styles.css" />
</head>
<body>
${header(lang, 'silo', silo, curSiloSlug)}
${crumbTrail}
<section class="hero">
  <div class="wrap">
    <h1>${h1}</h1>
    <p class="hero-sub">${desc}</p>
  </div>
</section>

<main class="wrap">
  <section class="related">
    <h2>${CALCSWORD[lang]} in this Category</h2>
    <div class="related-grid">
      ${cards}
    </div>
  </section>

  ${enOverviewBlock}

  <section class="content-block">
    <h2>Calculator Selection Guide</h2>
    <div class="formula-table">
      <table class="silo-matrix-table">
        <thead>
          <tr>
            <th>Calculator</th>
            <th>Best For</th>
            <th>Primary Outputs</th>
          </tr>
        </thead>
        <tbody>
          ${matrixRows}
        </tbody>
      </table>
    </div>
  </section>

  ${nextStepsBlock}

  <section id="faq" class="content-block">
    <h2>${name} — ${u.faq}</h2>
    ${faqHtml}
  </section>

  <p class="silo-all" style="text-align:center;margin-top:2rem"><a href="${homeUrl}">↗ ${u.all}</a></p>
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
  const hubH1 = (lang === "en") ? "Steel Rebar Calculator — 21 Free Tools for Weight, Spacing, Cost & Detailing" : h1;
  const hubMetaTitle = (lang === "en") ? "Steel Rebar Calculator — 21 Free Tools for Weight, Cost & Detailing" : title;
  const hubMetaDesc = (lang === "en") ? "21 free rebar calculators covering weight, slab & footing takeoff, spacing, lap & development length, cutting length, column & beam steel, tonnage and cost. IS 456 and ACI, metric and imperial, instant results." : desc;
  const heroSub = (lang === "en") ? "Every rebar question a concrete job throws at you — how much steel a slab needs, what a bar schedule weighs, how long a lap splice has to be — solved by one of 21 purpose-built calculators. Metric and imperial, IS 456 and ACI, instant results with no signup." : u.heroSub;

  const cats = {};
  PAGES.forEach(p => (cats[p.cat] ||= []).push(p));
  const directory = Object.entries(cats).map(([cat, items]) => {
    const silo = siloOfCat(cat);
    return `
      <div class="dir-cat">
        <h3><a href="${siloHref(silo, lang)}">${trG(cat,lang)} ${CALCSWORD[lang]} ↗</a></h3>
        <div class="related-grid">
          ${items.map(p=>`<a class="rel-card" href="${pageHref(p, lang)}"><b>${pH1(p,lang)}</b><span>${pDesc(p,lang).slice(0,52)}…</span></a>`).join("\n          ")}
        </div>
      </div>`;
  }).join("\n");

  const hubFaqs = (lang==="en")
    ? [["How do you calculate rebar weight?","Multiply the bar's weight-per-metre (metric: d² ÷ 162.28) or weight-per-foot (imperial: use the ASTM table) by its total length, then by the number of bars."],
       ["How much rebar does a concrete slab need?","Bars in each direction = floor((slab dimension − 2 × edge cover) ÷ spacing) + 1. Run the calculation in both directions and add the weight of each."],
       ["What's the difference between development length and lap length?","Development length is how far a single bar must extend into concrete to transfer its full design force. Lap length is how far two bars must overlap when splicing — it's usually a multiple of development length, not a separate calculation from scratch."],
       ["Should rebar be welded at joints?","Generally no. Standard reinforcing steel has a carbon content that makes it brittle under uncontrolled welding heat, which can leave a joint weaker than the bar itself. Tie wire is the standard method for holding a grid together at intersections."],
       ["Do I need rebar for a patio or walkway?","Light pedestrian slabs with no vehicle loading often skip reinforcement or use it only at control joints. Anything expecting vehicle weight, freeze-thaw cycling, or expansive soil should be reinforced — check local code before skipping it."],
       ["What bar size is standard for a residential slab?","#3 to #4 (10mm–12mm) is typical for residential slabs and driveways; heavier structural elements move up to #5–#8 (16mm–25mm) depending on load."],
       ["How is rebar cost estimated?","Total weight (or tonnage) × current price per kg or per ton. Steel pricing moves with the market, so treat any calculator's cost output as an estimate to check against a current supplier quote, not a locked-in number."],
       ["Can this calculator replace an engineer's design?","No. These tools estimate material quantities for ordering and budgeting. Structural design — bar size, spacing, and lap requirements for a specific load case — must come from engineered drawings and a qualified engineer."]]
    : TPL[lang].faq(h1, desc);
  const hubFaqHtml = hubFaqs.map(([q,a],i)=>`<details${i===0?" open":""}><summary>${q}</summary><p>${a}</p></details>`).join("\n    ");

  const enEducationSections = (lang === "en") ? `
  <section class="content-block">
    <h2>What is Rebar</h2>
    <p>Reinforcing bar is the ribbed steel rod embedded in concrete to carry the tension loads plain concrete can't handle on its own. Concrete resists compression well and tension poorly; rebar reverses that weakness, so a slab, column, or beam can flex slightly under load instead of cracking. The ribs on the bar surface exist for one reason — they lock the steel to the surrounding concrete so the two materials move as one unit under stress.</p>
  </section>

  <section class="content-block">
    <h2>Why One Calculator Isn't Enough</h2>
    <p>A single "rebar calculator" that only handles slab grids answers one question out of a dozen a real project asks. This site splits the problem the way an estimator actually works through it across 5 dedicated silos:</p>
    <ul>
      <li><a href="/rebar-weight-calculators"><strong>Weight & Takeoff</strong></a> — how much steel, by bar size and length (use the <a href="/rebar-weight-calculator">Rebar Weight Calculator</a> or <a href="/rebar-area-calculator">Rebar Area Calculator</a>)</li>
      <li><a href="/concrete-rebar-estimating-calculators"><strong>Pour Estimating</strong></a> — how much rebar a specific pour needs (<a href="/concrete-slab-rebar-calculator">slab</a>, <a href="/footing-rebar-calculator">footing</a>, <a href="/driveway-rebar-calculator">driveway</a>, <a href="/rebar-mat-grid-calculator">mat</a>)</li>
      <li><a href="/rebar-detailing-calculators"><strong>Detailing & Splicing</strong></a> — <a href="/rebar-spacing-calculator">spacing</a>, <a href="/rebar-development-length-calculator">development length</a>, <a href="/rebar-lap-length-calculator">lap length</a>, <a href="/rebar-hook-bend-cutting-length-calculator">cutting length</a>, <a href="/rebar-chair-calculator">chairs</a>, <a href="/rebar-tie-wire-calculator">tie wire</a></li>
      <li><a href="/structural-rebar-calculators"><strong>Structural Members</strong></a> — <a href="/column-rebar-calculator">column</a>, <a href="/beam-rebar-calculator">beam</a>, <a href="/wall-rebar-calculator">wall</a>, and <a href="/pool-rebar-calculator">pool</a>-specific reinforcement</li>
      <li><a href="/rebar-cost-tonnage-calculators"><strong>Commercial & Procurement</strong></a> — turning a bar schedule into <a href="/rebar-tonnage-calculator">tonnage</a> and <a href="/rebar-cost-calculator">cost</a></li>
    </ul>
  </section>

  <section class="content-block">
    <h2>How Rebar Weight is Calculated</h2>
    <p>For metric bar sizes, weight per metre follows a fixed relationship to the bar's diameter:</p>
    <p class="formula-callout"><strong>kg/m = d² ÷ 162.28</strong><br>where d is the bar diameter in millimetres.</p>
    <p>A 12mm bar weighs approximately 0.888 kg per metre; a 20mm bar weighs approximately 2.466 kg per metre. Multiply that figure by total bar length, then by quantity, to get total steel weight for a schedule. Calculate instantly with the <a href="/rebar-weight-calculator">Rebar Weight Calculator</a>.</p>
    <p>For imperial bar sizes (#3–#18), use the published <a href="#charts">ASTM weight-per-foot table</a> rather than the theoretical formula — mill tolerances and the ribbed profile mean the certified weight differs slightly from a pure cylinder calculation, and that certified figure is what a supplier will actually bill against.</p>
  </section>

  <section class="content-block">
    <h2>Worked Example: Concrete Slab Steel</h2>
    <p>A 6m × 4m slab, 12mm bars, 200mm spacing each way, 40mm edge cover (try it in the <a href="/concrete-slab-rebar-calculator">Concrete Slab Rebar Calculator</a>):</p>
    <ul>
      <li>Bars along the length: floor((6 − 2×0.04) / 0.2) + 1 = 30 bars</li>
      <li>Bars along the width: floor((4 − 2×0.04) / 0.2) + 1 = 20 bars</li>
      <li>Total bar length: (30 × 4m) + (20 × 6m) = 240m</li>
      <li>Total weight: 240 × 0.888 kg/m ≈ 213 kg</li>
    </ul>
  </section>

  <section class="content-block">
    <h2>Standards This Site Covers</h2>
    <p>Calculations follow IS 456:2000 for development and lap length (τbd-based anchorage) alongside ACI 318 conventions for US bar sizing and spacing practice, with BS 4449 bar designations noted where relevant. Pick the code your jurisdiction requires — the underlying steel doesn't change, but the required lap and development lengths do.</p>
  </section>
` : "";

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
${TRACKING_HEAD}
<link rel="icon" type="image/svg+xml" href="${base}favicon.svg" />
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${hubMetaTitle}</title>
<meta name="description" content="${hubMetaDesc}" />
<meta name="keywords" content="rebar calculator, steel rebar calculator, rebar weight calculator, concrete slab rebar calculator, rebar spacing calculator, rebar cost calculator" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="${urlFor(lang,'index')}" />
${altLinks('index', null)}
<meta property="og:title" content="${hubMetaTitle}" />
<meta property="og:description" content="${hubMetaDesc}" />
<meta property="og:url" content="${urlFor(lang, 'index')}" />
<meta property="og:type" content="website" />
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"WebApplication",name:h1,applicationCategory:"BusinessApplication",operatingSystem:"All",inLanguage:lang,offers:{"@type":"Offer",price:"0",priceCurrency:"USD"},description:hubMetaDesc})}</script>
<script type="application/ld+json">${faqJsonLd(hubFaqs)}</script>
<link rel="stylesheet" href="${base}styles.css" />
</head>
<body>
${header(lang, 'index', null, null)}
<section class="hero">
  <div class="wrap">
    <h1>${hubH1}</h1>
    <p class="hero-sub">${heroSub}</p>
    <ul class="hero-badges">${u.badges.map(b=>`<li>✔ ${b}</li>`).join("")}</ul>
  </div>
</section>

<main class="wrap" id="calculator">
${renderToolShell(lang, null)}
${enEducationSections}
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
const slugMapByLang = {};
LANGS.forEach(l => {
  slugMapByLang[l.code] = {};
  PAGES.forEach(p => {
    slugMapByLang[l.code][p.id] = pageSlug(p, l.code);
  });
});
PAGES.forEach(p => {
  slugMapByLang[p.id] = p.slug;
});
fs.writeFileSync(path.join(OUT,"slugs.js"),
  "window.REBAR_SLUGS = " + JSON.stringify(slugMapByLang, null, 2) + ";\n");

let pageCount = 0;
const redirects = [];

LANGS.forEach(l => {
  const lang = l.code;
  const outDir = lang==="en" ? OUT : path.join(OUT, l.dir);
  if(lang!=="en") {
    fs.mkdirSync(outDir, { recursive:true });
    // Clean up old html files in this language directory
    const existing = fs.readdirSync(outDir);
    existing.forEach(f => {
      if (f.endsWith(".html") && f !== "index.html") {
        fs.unlinkSync(path.join(outDir, f));
      }
    });
  }

  // Flagship English index.html is maintained as the Phase 1 rank-winning homepage.
  if (lang !== "en") {
    fs.writeFileSync(path.join(outDir,"index.html"), renderHub(lang));
  }

  SILOS.forEach(s => {
    const slug = siloSlug(s, lang);
    fs.writeFileSync(path.join(outDir, slug + ".html"), renderSilo(s, lang));
    pageCount++;
    if (lang !== "en") {
      redirects.push({
        source: `/${l.dir}/${s.slug}`,
        destination: `/${l.dir}/${slug}`,
        permanent: true
      });
      redirects.push({
        source: `/${l.dir}/${s.slug}.html`,
        destination: `/${l.dir}/${slug}`,
        permanent: true
      });
    }
  });

  PAGES.forEach(p => {
    const slug = pageSlug(p, lang);
    fs.writeFileSync(path.join(outDir, slug + ".html"), renderPage(p, lang));
    pageCount++;
    if (lang !== "en") {
      redirects.push({
        source: `/${l.dir}/${p.slug}`,
        destination: `/${l.dir}/${slug}`,
        permanent: true
      });
      redirects.push({
        source: `/${l.dir}/${p.slug}.html`,
        destination: `/${l.dir}/${slug}`,
        permanent: true
      });
    }
  });
});

/* Write vercel.json with cleanUrls and 301 redirects */
const vercelConfig = {
  cleanUrls: true,
  headers: [
    {
      source: "/(.*sitemap.*\\.(?:xml|xsl))",
      headers: [
        {
          key: "Cache-Control",
          value: "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0"
        },
        {
          key: "Pragma",
          value: "no-cache"
        },
        {
          key: "Expires",
          value: "0"
        }
      ]
    },
    {
      source: "/sitemap.xsl",
      headers: [
        {
          key: "Content-Type",
          value: "text/xsl; charset=UTF-8"
        }
      ]
    }
  ],
  redirects: redirects
};
fs.writeFileSync(path.join(OUT, "vercel.json"), JSON.stringify(vercelConfig, null, 2) + "\n");

/* ---------- sitemap generation ----------
   Hierarchical & organized by Silo with SEO metadata:
   - Full reciprocal and self-referencing xhtml:link hreflang annotations
   - Prioritized coverage for the 8 primary languages (en, es, fr, de, it, pt, nl, pl)
   - x-default pointing to the canonical English URL
   - Standard sitemap index (sitemap_index.xml and sitemap.xml)
   - Clean per-language sitemaps (sitemap-en.xml, sitemap-es.xml, etc.)
   - Beautiful XSLT stylesheet (sitemap.xsl) for browser presentation
   ---------------------------------------- */
const today = new Date().toISOString().slice(0, 10);
const SITEMAP_LANGS = ["en", "es", "fr", "de", "it", "pt", "nl", "pl"];

function renderSitemapUrl(type, item, lang, lastmod, changefreq, priority) {
  let loc;
  let enUrl;
  if (type === "index") {
    loc = urlFor(lang, "index");
    enUrl = urlFor("en", "index");
  } else if (type === "silo") {
    loc = urlFor(lang, siloSlug(item, lang));
    enUrl = urlFor("en", siloSlug(item, "en"));
  } else if (type === "page") {
    loc = urlFor(lang, pageSlug(item, lang));
    enUrl = urlFor("en", pageSlug(item, "en"));
  }

  const lines = [];
  lines.push("  <url>");
  lines.push("    <loc>" + loc + "</loc>");

  // Alternate links for all 8 languages: en, es, fr, de, it, pt, nl, pl
  SITEMAP_LANGS.forEach(l => {
    let href;
    if (type === "index") href = urlFor(l, "index");
    else if (type === "silo") href = urlFor(l, siloSlug(item, l));
    else if (type === "page") href = urlFor(l, pageSlug(item, l));
    lines.push("    <xhtml:link rel=\"alternate\" hreflang=\"" + l + "\" href=\"" + href + "\"/>");
  });

  // x-default pointing to English URL
  lines.push("    <xhtml:link rel=\"alternate\" hreflang=\"x-default\" href=\"" + enUrl + "\"/>");
  lines.push("    <lastmod>" + lastmod + "</lastmod>");
  lines.push("    <changefreq>" + changefreq + "</changefreq>");
  lines.push("    <priority>" + priority + "</priority>");
  lines.push("  </url>");
  return lines.join("\n");
}

function buildLanguageSitemapSection(code) {
  const chunks = [];
  const langObj = LANGS.find(x => x.code === code);
  const isEn = code === "en";
  const hubPriority = isEn ? "1.0" : "0.7";
  const siloPriority = isEn ? "0.8" : "0.6";
  const pagePriority = isEn ? "0.6" : "0.5";

  chunks.push("  <!-- ============================================================ -->");
  chunks.push("  <!-- " + (isEn ? "ENGLISH PAGES (Primary Hub, Silos, and Calculators)" : "Language: " + langObj.name + " (" + code + ")") + " -->");
  chunks.push("  <!-- ============================================================ -->");
  chunks.push("  <!-- Main Hub / Homepage (" + code + ") -->");
  chunks.push(renderSitemapUrl("index", null, code, today, "monthly", hubPriority));

  // Hierarchical Silo Order: Each Silo Hub is immediately followed by its calculators
  SILOS.forEach(silo => {
    chunks.push("\n  <!-- Silo: " + silo.cat + " Calculators (" + code + ") -->");
    // 1. Silo Hub Page
    chunks.push(renderSitemapUrl("silo", silo, code, today, "yearly", siloPriority));

    // 2. Calculators belonging to this specific Silo
    const childPages = PAGES.filter(p => p.cat === silo.cat);
    childPages.forEach(p => {
      chunks.push(renderSitemapUrl("page", p, code, today, "yearly", pagePriority));
    });
  });

  return chunks.join("\n");
}

// 1. Generate dedicated per-language sitemaps (sitemap-en.xml, sitemap-es.xml, etc.)
const languageXmlSections = {};
SITEMAP_LANGS.forEach(code => {
  const section = buildLanguageSitemapSection(code);
  languageXmlSections[code] = section;

  const langSitemapXml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    section + '\n' +
    '</urlset>\n';

  fs.writeFileSync(path.join(OUT, `sitemap-${code}.xml`), langSitemapXml);
});

// 2. Generate Master Sitemap Index (sitemap_index.xml and sitemap.xml)
const sitemapIndexXml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n' +
  '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  SITEMAP_LANGS.map(code => {
    return '  <sitemap>\n' +
      '    <loc>' + SITE + '/sitemap-' + code + '.xml</loc>\n' +
      '    <lastmod>' + today + '</lastmod>\n' +
      '  </sitemap>';
  }).join('\n') + '\n' +
  '</sitemapindex>\n';

fs.writeFileSync(path.join(OUT, "sitemap_index.xml"), sitemapIndexXml);
fs.writeFileSync(path.join(OUT, "sitemap.xml"), sitemapIndexXml);

// 3. Generate Unified Combined Sitemap (sitemap-all.xml)
const allSections = SITEMAP_LANGS.map(code => languageXmlSections[code]).join('\n');
const masterSitemapXml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
  allSections + '\n' +
  '</urlset>\n';
fs.writeFileSync(path.join(OUT, "sitemap-all.xml"), masterSitemapXml);

// 4. Update robots.txt with all index and primary sitemaps
fs.writeFileSync(path.join(OUT, "robots.txt"),
  'User-agent: *\nAllow: /\n' +
  'Sitemap: ' + SITE + '/sitemap.xml\n' +
  'Sitemap: ' + SITE + '/sitemap_index.xml\n' +
  'Sitemap: ' + SITE + '/sitemap-en.xml\n');

const totalSitemapUrls = (1 + SILOS.length + PAGES.length) * SITEMAP_LANGS.length;
const enUrls = 1 + SILOS.length + PAGES.length;
console.log('Generated ' + LANGS.length + ' languages × (' + PAGES.length + ' pages + hub) = ' + (pageCount + LANGS.length) + ' HTML files');
console.log('Sitemap Index: Generated sitemap.xml and sitemap_index.xml indexing ' + SITEMAP_LANGS.length + ' language sitemaps');
console.log('Sitemaps: ' + totalSitemapUrls + ' total URLs organized hierarchically by silo across ' + SITEMAP_LANGS.length + ' languages (' + enUrls + ' URLs in sitemap-en.xml)');
console.log('Vercel: Generated ' + redirects.length + ' 301 redirects in vercel.json for legacy URLs');
