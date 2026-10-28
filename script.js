/* ============================================================
   Rebar Calculator Suite
   A generic calculator framework: every tool defines its fields
   and a compute() that returns result rows + a formula note.
   ============================================================ */

/* ---------- Reference data ---------- */
/* Metric rebar: weight per metre = d²/162.28 (kg/m) */
const REBAR_METRIC = [6,8,10,12,16,20,25,28,32,36,40].map(d => ({
  label:`${d} mm`, dia:d, kgm:+(d*d/162.28).toFixed(3), sys:"metric"
}));
/* Imperial (US) bar sizes – nominal dia (mm) + weight */
const REBAR_IMPERIAL = [
  {n:"#3",dia:9.5, lbft:0.376}, {n:"#4",dia:12.7,lbft:0.668},
  {n:"#5",dia:15.9,lbft:1.043},{n:"#6",dia:19.1,lbft:1.502},
  {n:"#7",dia:22.2,lbft:2.044},{n:"#8",dia:25.4,lbft:2.670},
  {n:"#9",dia:28.7,lbft:3.400},{n:"#10",dia:32.3,lbft:4.303},
  {n:"#11",dia:35.8,lbft:5.313},{n:"#14",dia:43.0,lbft:7.650},
  {n:"#18",dia:57.3,lbft:13.600}
].map(b => ({ label:`${b.n} (${b.dia}mm)`, dia:b.dia,
  kgm:+(b.lbft*1.48816).toFixed(3), lbft:b.lbft, sys:"imperial", n:b.n }));

/* one combined size list; option value = "kgm|dia" */
const ALL_BARS = [...REBAR_METRIC, ...REBAR_IMPERIAL];
function barOptions(){ return ALL_BARS.map(b => ({ v:`${b.kgm}|${b.dia}`, t:`${b.label} — ${b.kgm} kg/m` })); }
function barKgm(v){ return parseFloat(v.split("|")[0]); }
function barDia(v){ return parseFloat(v.split("|")[1]); }

/* concrete grade -> bond stress τbd (N/mm²) for DEFORMED bars in tension (IS456, ×1.6) */
const TBD = { "M20":1.92, "M25":2.24, "M30":2.40, "M35":2.72, "M40":3.04 };
const FY  = { "Fe250":250, "Fe415":415, "Fe500":500, "Fe550":550 };

/* ---------- helper formatters ---------- */
const r2 = n => (Math.round(n*100)/100);
const fmt = n => {
  if(!isFinite(n)) return "0";
  if(Math.abs(n) >= 1000) return n.toLocaleString(undefined,{maximumFractionDigits:1});
  if(Math.abs(n) >= 1) return n.toFixed(2);
  return n.toFixed(3);
};

/* ============================================================
   CALCULATOR REGISTRY
   field types: number | select
   compute(v) -> { rows:[{label,value,unit,primary?}], note }
   ============================================================ */
const CALCS = {

  /* ---- WEIGHT ---- */
  weight: {
    cat:"Weight", name:"Rebar Weight",
    title:"Rebar Weight Calculator",
    desc:"Calculate the weight of steel rebar by bar size, length and quantity in kg, lb and tons — or reverse calculate total length and standard bars from weight.",
    fields:[
      {k:"calcMode", label:"Calculation Mode", type:"select", options:[
        {v:"standard", t:"Standard: Calculate Weight from Length & Qty"},
        {v:"reverse", t:"Reverse: Calculate Length & Bars from Weight"}
      ], default:"standard"},
      {k:"bar", label:"Bar size", type:"select", options:barOptions(), default:"0.888|12"},
      {k:"len", label:"Length per bar", type:"number", unit:"m", default:12},
      {k:"qty", label:"Quantity (pieces)", type:"number", unit:"pcs", default:100, step:1},
      {k:"totalWeight", label:"Total steel weight", type:"number", unit:"kg", default:2000},
      {k:"stockLen", label:"Standard stock bar length", type:"number", unit:"m", default:12}
    ],
    compute(v){
      const isReverse = v.calcMode === "reverse";
      const kgm = barKgm(v.bar);
      const dia = barDia(v.bar);
      const lbft = +(kgm * 0.671969).toFixed(3);

      if(isReverse){
        const totalKg = v.totalWeight || 0;
        const totalLb = totalKg * 2.20462;
        const totalLenM = kgm > 0 ? (totalKg / kgm) : 0;
        const totalLenFt = totalLenM * 3.28084;
        const stockM = v.stockLen > 0 ? v.stockLen : 12;
        const fullBars = Math.floor(totalLenM / stockM);
        const wholeBars = Math.ceil(totalLenM / stockM);
        const remainderM = +(totalLenM - (fullBars * stockM)).toFixed(2);

        return { rows:[
          {label:"Total bar length", value:totalLenM, unit:"m", primary:true},
          {label:"Total length (imperial)", value:totalLenFt, unit:"ft"},
          {label:"Standard bars needed", value:wholeBars, unit:`bars (${stockM}m stock)`},
          {label:"Full bars + offcut", value:fullBars, unit:`bars + ${remainderM}m`},
          {label:"Bar unit weight", value:kgm, unit:`kg/m (${lbft} lb/ft)`},
          {label:"Total weight entered", value:totalKg, unit:`kg (${fmt(totalLb)} lb)`},
          {label:"Metric tonnage", value:totalKg/1000, unit:"metric ton"},
        ], note:`Reverse derivation: ${fmt(totalKg)} kg ÷ ${kgm} kg/m = ${fmt(totalLenM)}m total length (${wholeBars} standard ${stockM}m bars).` };
      }

      // Standard mode
      const len = v.len || 0;
      const qty = v.qty || 0;
      const eachKg = kgm * len;
      const totalKg = eachKg * qty;
      const totalLb = totalKg * 2.20462;
      const eachLb = eachKg * 2.20462;
      const tonsMetric = totalKg / 1000;
      const tonsUS = totalLb / 2000;

      return { rows:[
        {label:"Total steel weight", value:totalKg, unit:"kg", primary:true},
        {label:"Total weight (imperial)", value:totalLb, unit:"lb"},
        {label:"Weight per piece", value:eachKg, unit:`kg (${fmt(eachLb)} lb)`},
        {label:"Unit weight", value:kgm, unit:`kg/m (${lbft} lb/ft)`},
        {label:"Metric tonnage", value:tonsMetric, unit:"metric ton"},
        {label:"US short tons", value:tonsUS, unit:"US ton"},
      ], note:`Standard derivation: ${kgm} kg/m (${lbft} lb/ft) × ${len}m × ${qty} pcs = ${fmt(totalKg)} kg (${fmt(totalLb)} lb).` };
    }
  },

  /* ---- CONCRETE SLAB ---- */
  slab: {
    cat:"Estimating", name:"Concrete Slab Rebar",
    title:"Concrete Slab Rebar Calculator",
    desc:"Calculate the number of bars, total length, weight and tie-wire for a reinforced slab grid (both directions).",
    fields:[
      {k:"L", label:"Slab length", type:"number", unit:"m", default:5},
      {k:"W", label:"Slab width", type:"number", unit:"m", default:4},
      {k:"sp", label:"Bar spacing (c/c)", type:"number", unit:"mm", default:150},
      {k:"cover", label:"Edge cover", type:"number", unit:"mm", default:50},
      {k:"bar", label:"Bar size", type:"select", options:barOptions(), default:"0.888|12"},
    ],
    compute(v){
      const sp = v.sp/1000, cover = v.cover/1000, kgm = barKgm(v.bar);
      // bars running along L (spaced across W) and along W (spaced across L)
      const nAlongL = Math.floor((v.W - 2*cover)/sp) + 1;
      const nAlongW = Math.floor((v.L - 2*cover)/sp) + 1;
      const lenAlongL = Math.max(0, v.L - 2*cover);
      const lenAlongW = Math.max(0, v.W - 2*cover);
      const totalLen = nAlongL*lenAlongL + nAlongW*lenAlongW;
      const weight = totalLen * kgm;
      const intersections = nAlongL * nAlongW;
      return { rows:[
        {label:"Total rebar weight", value:weight, unit:"kg", primary:true},
        {label:"Bars (long dir.)", value:nAlongL, unit:"pcs"},
        {label:"Bars (short dir.)", value:nAlongW, unit:"pcs"},
        {label:"Total bar length", value:totalLen, unit:"m"},
        {label:"Tie intersections", value:intersections, unit:"nos"},
        {label:"Weight", value:weight/1000, unit:"ton"},
      ], note:`grid both ways @ ${v.sp}mm c/c, cover ${v.cover}mm, ${kgm} kg/m` };
    }
  },

  footing: {
    cat:"Estimating", name:"Footing Rebar",
    title:"Footing Rebar Calculator",
    desc:"Calculate the rebar mesh for an isolated/rectangular footing — bars both ways, total length and weight.",
    fields:[
      {k:"L", label:"Footing length", type:"number", unit:"m", default:1.5},
      {k:"W", label:"Footing width", type:"number", unit:"m", default:1.5},
      {k:"sp", label:"Bar spacing (c/c)", type:"number", unit:"mm", default:150},
      {k:"cover", label:"Clear cover", type:"number", unit:"mm", default:50},
      {k:"bar", label:"Bar size", type:"select", options:barOptions(), default:"0.617|10"},
    ],
    compute(v){ return CALCS.slab.compute(v); }
  },

  mat: {
    cat:"Estimating", name:"Rebar Mat / Grid",
    title:"Rebar Mat & Grid Calculator",
    desc:"For a rectangular reinforcement mat: number of bars each way, intersections, total length and weight.",
    fields:[
      {k:"L", label:"Mat length", type:"number", unit:"m", default:6},
      {k:"W", label:"Mat width", type:"number", unit:"m", default:3},
      {k:"sp", label:"Spacing both ways", type:"number", unit:"mm", default:200},
      {k:"cover", label:"Edge offset", type:"number", unit:"mm", default:25},
      {k:"bar", label:"Bar size", type:"select", options:barOptions(), default:"0.617|10"},
    ],
    compute(v){ return CALCS.slab.compute(v); }
  },

  /* ---- SPACING ---- */
  spacing: {
    cat:"Detailing", name:"Rebar Spacing",
    title:"Rebar Spacing Calculator",
    desc:"Find the centre-to-centre spacing and bar count across a given width.",
    fields:[
      {k:"width", label:"Total width", type:"number", unit:"mm", default:3000},
      {k:"cover", label:"Edge cover (each side)", type:"number", unit:"mm", default:50},
      {k:"sp", label:"Desired spacing (c/c)", type:"number", unit:"mm", default:150},
      {k:"bar", label:"Bar size", type:"select", options:barOptions(), default:"0.888|12"},
    ],
    compute(v){
      const clear = Math.max(0, v.width - 2*v.cover);
      const n = Math.floor(clear/v.sp) + 1;
      const actual = n>1 ? clear/(n-1) : clear;
      const dia = barDia(v.bar);
      const clearGap = actual - dia;
      return { rows:[
        {label:"Number of bars", value:n, unit:"pcs", primary:true},
        {label:"Actual c/c spacing", value:actual, unit:"mm"},
        {label:"Clear gap between bars", value:clearGap, unit:"mm"},
        {label:"Reinforced width", value:clear, unit:"mm"},
      ], note:`bars = floor((${v.width}−2×${v.cover}) / ${v.sp}) + 1` };
    }
  },

  /* ---- DEVELOPMENT LENGTH ---- */
  develop: {
    cat:"Detailing", name:"Development Length",
    title:"Rebar Development Length Calculator",
    desc:"IS 456 development (anchorage) length for deformed bars: Ld = φ·0.87·fy / (4·τbd).",
    fields:[
      {k:"bar", label:"Bar size", type:"select", options:barOptions(), default:"0.888|12"},
      {k:"fy", label:"Steel grade", type:"select", options:Object.keys(FY).map(k=>({v:k,t:k})), default:"Fe500"},
      {k:"grade", label:"Concrete grade", type:"select", options:Object.keys(TBD).map(k=>({v:k,t:k})), default:"M25"},
      {k:"mode", label:"Stress type", type:"select", options:[{v:"tension",t:"Tension"},{v:"comp",t:"Compression"}], default:"tension"},
    ],
    compute(v){
      const d = barDia(v.bar), fy = FY[v.fy];
      let tbd = TBD[v.grade];
      if(v.mode==="comp") tbd *= 1.25;        // 25% increase for compression
      const Ld = (d * 0.87 * fy) / (4 * tbd);
      return { rows:[
        {label:"Development length Ld", value:Ld, unit:"mm", primary:true},
        {label:"As multiple of dia", value:Ld/d, unit:"× d"},
        {label:"In metres", value:Ld/1000, unit:"m"},
        {label:"τbd used", value:tbd, unit:"N/mm²"},
      ], note:`Ld = ${d} × 0.87 × ${fy} / (4 × ${r2(tbd)})` };
    }
  },

  /* ---- LAP / SPLICE ---- */
  lap: {
    cat:"Detailing", name:"Lap / Splice Length",
    title:"Rebar Lap & Splice Length Calculator",
    desc:"Tension lap = max(Ld, 30d); compression lap = max(Ld, 24d). Based on IS 456 development length.",
    fields:[
      {k:"bar", label:"Bar size", type:"select", options:barOptions(), default:"0.888|12"},
      {k:"fy", label:"Steel grade", type:"select", options:Object.keys(FY).map(k=>({v:k,t:k})), default:"Fe500"},
      {k:"grade", label:"Concrete grade", type:"select", options:Object.keys(TBD).map(k=>({v:k,t:k})), default:"M25"},
      {k:"mode", label:"Lap type", type:"select", options:[{v:"tension",t:"Tension"},{v:"comp",t:"Compression"}], default:"tension"},
    ],
    compute(v){
      const d = barDia(v.bar), fy = FY[v.fy];
      let tbd = TBD[v.grade];
      const comp = v.mode==="comp";
      if(comp) tbd *= 1.25;
      const Ld = (d * 0.87 * fy) / (4 * tbd);
      const minMult = comp ? 24 : 30;
      const lap = Math.max(Ld, minMult*d);
      return { rows:[
        {label:"Lap / splice length", value:lap, unit:"mm", primary:true},
        {label:"As multiple of dia", value:lap/d, unit:"× d"},
        {label:"Development length Ld", value:Ld, unit:"mm"},
        {label:"Code minimum", value:minMult*d, unit:`${minMult}d`},
      ], note:`lap = max(Ld ${Math.round(Ld)}, ${minMult}d ${minMult*d}) mm` };
    }
  },

  /* ---- HOOK / BEND CUTTING LENGTH ---- */
  hook: {
    cat:"Detailing", name:"Hook & Bend / Cut Length",
    title:"Rebar Hook, Bend & Cutting Length Calculator",
    desc:"Cutting length = straight length + hooks − bend deductions. Hook = 9d, deductions: 45°=1d, 90°=2d, 135°=3d.",
    fields:[
      {k:"straight", label:"Straight length", type:"number", unit:"mm", default:3000},
      {k:"bar", label:"Bar size", type:"select", options:barOptions(), default:"0.888|12"},
      {k:"hooks", label:"No. of hooks (9d)", type:"number", unit:"nos", default:2, step:1},
      {k:"b90", label:"No. of 90° bends", type:"number", unit:"nos", default:0, step:1},
      {k:"b45", label:"No. of 45° bends", type:"number", unit:"nos", default:0, step:1},
      {k:"b135", label:"No. of 135° bends", type:"number", unit:"nos", default:0, step:1},
    ],
    compute(v){
      const d = barDia(v.bar);
      const hookAdd = v.hooks * 9 * d;
      const deduct = v.b45*1*d + v.b90*2*d + v.b135*3*d;
      const cut = v.straight + hookAdd - deduct;
      return { rows:[
        {label:"Cutting length", value:cut, unit:"mm", primary:true},
        {label:"In metres", value:cut/1000, unit:"m"},
        {label:"Hook addition", value:hookAdd, unit:"mm"},
        {label:"Bend deduction", value:deduct, unit:"mm"},
      ], note:`${v.straight} + ${v.hooks}×9d − (45°,90°,135° bends)` };
    }
  },

  /* ---- STIRRUP / TIE ---- */
  stirrup: {
    cat:"Detailing", name:"Stirrup / Tie Cut Length",
    title:"Stirrup & Column Tie Cutting Length Calculator",
    desc:"Rectangular stirrup cutting length = 2(a+b) + 2×10d hooks − 3×2d (90°) − 2×3d (135°).",
    fields:[
      {k:"B", label:"Member width", type:"number", unit:"mm", default:300},
      {k:"D", label:"Member depth", type:"number", unit:"mm", default:450},
      {k:"cover", label:"Clear cover", type:"number", unit:"mm", default:25},
      {k:"bar", label:"Stirrup bar size", type:"select", options:barOptions(), default:"0.395|8"},
    ],
    compute(v){
      const d = barDia(v.bar);
      const a = v.B - 2*v.cover, b = v.D - 2*v.cover;
      const hooks = 2*10*d, ded90 = 3*2*d, ded135 = 2*3*d;
      const cut = 2*(a+b) + hooks - ded90 - ded135;
      return { rows:[
        {label:"Stirrup cutting length", value:cut, unit:"mm", primary:true},
        {label:"In metres", value:cut/1000, unit:"m"},
        {label:"Inner width a", value:a, unit:"mm"},
        {label:"Inner depth b", value:b, unit:"mm"},
        {label:"Weight per stirrup", value:(cut/1000)*barKgm(v.bar), unit:"kg"},
      ], note:`2(${a}+${b}) + 20d − 6d − 6d` };
    }
  },

  /* ---- COLUMN ---- */
  column: {
    cat:"Members", name:"Column Rebar",
    title:"Column Rebar Calculator",
    desc:"Vertical main steel + lateral ties for a rectangular column. Returns total weight.",
    fields:[
      {k:"H", label:"Column height", type:"number", unit:"m", default:3},
      {k:"B", label:"Column width", type:"number", unit:"mm", default:300},
      {k:"D", label:"Column depth", type:"number", unit:"mm", default:450},
      {k:"cover", label:"Clear cover", type:"number", unit:"mm", default:40},
      {k:"nVert", label:"No. of vertical bars", type:"number", unit:"nos", default:6, step:1},
      {k:"vbar", label:"Vertical bar size", type:"select", options:barOptions(), default:"1.578|16"},
      {k:"lap", label:"Lap/extra per bar", type:"number", unit:"m", default:0.6},
      {k:"tieSp", label:"Tie spacing (c/c)", type:"number", unit:"mm", default:150},
      {k:"tbar", label:"Tie bar size", type:"select", options:barOptions(), default:"0.395|8"},
    ],
    compute(v){
      const vkgm = barKgm(v.vbar);
      const vWeight = v.nVert * (v.H + v.lap) * vkgm;
      // ties
      const nTies = Math.floor(v.H*1000 / v.tieSp) + 1;
      const td = barDia(v.tbar);
      const a = v.B - 2*v.cover, b = v.D - 2*v.cover;
      const tieCut = (2*(a+b) + 2*10*td - 3*2*td - 2*3*td)/1000; // m
      const tWeight = nTies * tieCut * barKgm(v.tbar);
      const total = vWeight + tWeight;
      return { rows:[
        {label:"Total rebar weight", value:total, unit:"kg", primary:true},
        {label:"Vertical steel", value:vWeight, unit:"kg"},
        {label:"Tie steel", value:tWeight, unit:"kg"},
        {label:"Number of ties", value:nTies, unit:"nos"},
        {label:"Tie cut length", value:tieCut*1000, unit:"mm"},
        {label:"Total", value:total/1000, unit:"ton"},
      ], note:`${v.nVert} verticals × (${v.H}+${v.lap})m + ${nTies} ties` };
    }
  },

  /* ---- BEAM ---- */
  beam: {
    cat:"Members", name:"Beam Rebar",
    title:"Beam Rebar Calculator",
    desc:"Top + bottom main bars and stirrups for a beam. Returns total weight.",
    fields:[
      {k:"L", label:"Beam length", type:"number", unit:"m", default:5},
      {k:"B", label:"Beam width", type:"number", unit:"mm", default:230},
      {k:"D", label:"Beam depth", type:"number", unit:"mm", default:450},
      {k:"cover", label:"Clear cover", type:"number", unit:"mm", default:25},
      {k:"nTop", label:"No. of top bars", type:"number", unit:"nos", default:2, step:1},
      {k:"nBot", label:"No. of bottom bars", type:"number", unit:"nos", default:3, step:1},
      {k:"mbar", label:"Main bar size", type:"select", options:barOptions(), default:"1.578|16"},
      {k:"stSp", label:"Stirrup spacing (c/c)", type:"number", unit:"mm", default:150},
      {k:"sbar", label:"Stirrup bar size", type:"select", options:barOptions(), default:"0.395|8"},
    ],
    compute(v){
      const mkgm = barKgm(v.mbar);
      const mainWeight = (v.nTop + v.nBot) * v.L * mkgm;
      const nSt = Math.floor(v.L*1000 / v.stSp) + 1;
      const sd = barDia(v.sbar);
      const a = v.B - 2*v.cover, b = v.D - 2*v.cover;
      const stCut = (2*(a+b) + 2*10*sd - 3*2*sd - 2*3*sd)/1000;
      const stWeight = nSt * stCut * barKgm(v.sbar);
      const total = mainWeight + stWeight;
      return { rows:[
        {label:"Total rebar weight", value:total, unit:"kg", primary:true},
        {label:"Main steel", value:mainWeight, unit:"kg"},
        {label:"Stirrup steel", value:stWeight, unit:"kg"},
        {label:"Number of stirrups", value:nSt, unit:"nos"},
        {label:"Total", value:total/1000, unit:"ton"},
      ], note:`${v.nTop+v.nBot} main bars × ${v.L}m + ${nSt} stirrups` };
    }
  },

  /* ---- COST ---- */
  cost: {
    cat:"Commercial", name:"Rebar Cost",
    title:"Rebar Cost Calculator",
    desc:"Estimate material cost from total weight and unit price.",
    fields:[
      {k:"weight", label:"Total weight", type:"number", unit:"kg", default:1000},
      {k:"rate", label:"Price", type:"number", unit:"per kg", default:0.85, step:0.01},
      {k:"waste", label:"Wastage allowance", type:"number", unit:"%", default:3},
    ],
    compute(v){
      const withWaste = v.weight * (1 + v.waste/100);
      const cost = withWaste * v.rate;
      return { rows:[
        {label:"Estimated cost", value:cost, unit:"", primary:true},
        {label:"Weight + wastage", value:withWaste, unit:"kg"},
        {label:"Cost per ton", value:v.rate*1000, unit:""},
        {label:"In tons", value:withWaste/1000, unit:"ton"},
      ], note:`${fmt(withWaste)} kg × ${v.rate}/kg (incl. ${v.waste}% waste)` };
    }
  },

  /* ---- TONNAGE ---- */
  tonnage: {
    cat:"Commercial", name:"Rebar Tonnage",
    title:"Rebar Tonnage Calculator",
    desc:"Convert a bar schedule (size × length × quantity) into total tonnage.",
    fields:[
      {k:"bar", label:"Bar size", type:"select", options:barOptions(), default:"1.578|16"},
      {k:"len", label:"Length per bar", type:"number", unit:"m", default:12},
      {k:"qty", label:"Quantity", type:"number", unit:"pcs", default:500, step:1},
    ],
    compute(v){
      const kgm = barKgm(v.bar);
      const kg = kgm*v.len*v.qty;
      return { rows:[
        {label:"Total tonnage", value:kg/1000, unit:"metric ton", primary:true},
        {label:"Total weight", value:kg, unit:"kg"},
        {label:"US tons", value:kg/907.185, unit:"ton"},
        {label:"Per bar", value:kgm*v.len, unit:"kg"},
      ], note:`${kgm} kg/m × ${v.len}m × ${v.qty} = ${fmt(kg)} kg` };
    }
  },

  /* ---- REBAR AREA (Ast) ---- */
  area: {
    cat:"Weight", name:"Rebar Area (Ast)",
    title:"Rebar Area Calculator (Area of Steel, Ast)",
    desc:"Cross-sectional area of one bar and the total steel area, plus the steel percentage of a section.",
    fields:[
      {k:"bar", label:"Bar size", type:"select", options:barOptions(), default:"0.888|12"},
      {k:"n", label:"Number of bars", type:"number", unit:"nos", default:4, step:1},
      {k:"B", label:"Section width (optional)", type:"number", unit:"mm", default:300},
      {k:"D", label:"Section depth (optional)", type:"number", unit:"mm", default:450},
    ],
    compute(v){
      const d = barDia(v.bar);
      const one = Math.PI/4*d*d;            // mm²
      const total = one * v.n;
      const gross = v.B * v.D;
      const pt = gross>0 ? total/gross*100 : 0;
      return { rows:[
        {label:"Total steel area Ast", value:total, unit:"mm²", primary:true},
        {label:"Area of one bar", value:one, unit:"mm²"},
        {label:"Steel percentage", value:pt, unit:"%"},
        {label:"Ast", value:total/100, unit:"cm²"},
      ], note:`Ast = ${v.n} × π/4 × ${d}² = ${fmt(total)} mm²` };
    }
  },

  /* ---- QUANTITY PER AREA / TAKEOFF ---- */
  quantity: {
    cat:"Weight", name:"Rebar Quantity / per ft²",
    title:"Rebar Quantity & Takeoff Calculator (per area)",
    desc:"Estimate the rebar weight for a slab/area from spacing only — get kg/m², kg/ft² and the total.",
    fields:[
      {k:"area", label:"Area", type:"number", unit:"m²", default:50},
      {k:"sp", label:"Spacing (both ways, c/c)", type:"number", unit:"mm", default:200},
      {k:"bar", label:"Bar size", type:"select", options:barOptions(), default:"0.617|10"},
    ],
    compute(v){
      const kgm = barKgm(v.bar), sp = v.sp/1000;
      const lenPerM2 = 2/sp;                 // m of bar per m² (grid both ways)
      const kgPerM2 = lenPerM2 * kgm;
      const total = kgPerM2 * v.area;
      return { rows:[
        {label:"Total rebar weight", value:total, unit:"kg", primary:true},
        {label:"Per m²", value:kgPerM2, unit:"kg/m²"},
        {label:"Per ft²", value:kgPerM2/10.7639, unit:"kg/ft²"},
        {label:"Bar length", value:lenPerM2*v.area, unit:"m"},
        {label:"Weight", value:total/1000, unit:"ton"},
      ], note:`(2 ÷ ${sp}m) × ${kgm} kg/m × ${v.area} m²` };
    }
  },

  /* ---- CONCRETE + REBAR ---- */
  concrete: {
    cat:"Estimating", name:"Concrete + Rebar",
    title:"Concrete & Rebar Estimator",
    desc:"Concrete volume plus an estimate of the reinforcement steel using a kg/m³ ratio.",
    fields:[
      {k:"L", label:"Length", type:"number", unit:"m", default:5},
      {k:"W", label:"Width", type:"number", unit:"m", default:4},
      {k:"t", label:"Thickness / depth", type:"number", unit:"mm", default:150},
      {k:"ratio", label:"Steel ratio", type:"number", unit:"kg/m³", default:80},
    ],
    compute(v){
      const vol = v.L * v.W * (v.t/1000);
      const steel = vol * v.ratio;
      return { rows:[
        {label:"Concrete volume", value:vol, unit:"m³", primary:true},
        {label:"Volume", value:vol*1.30795, unit:"yd³"},
        {label:"Volume", value:vol*35.3147, unit:"ft³"},
        {label:"Estimated steel", value:steel, unit:"kg"},
        {label:"Steel", value:steel/1000, unit:"ton"},
      ], note:`${v.L}×${v.W}×${v.t/1000}m = ${fmt(vol)} m³ · steel @ ${v.ratio} kg/m³` };
    }
  },

  driveway: {
    cat:"Estimating", name:"Driveway Rebar",
    title:"Driveway Rebar Calculator",
    desc:"Single reinforcement mat for a driveway slab — bar count both ways, length and weight.",
    fields:[
      {k:"L", label:"Driveway length", type:"number", unit:"m", default:10},
      {k:"W", label:"Driveway width", type:"number", unit:"m", default:3},
      {k:"sp", label:"Bar spacing (c/c)", type:"number", unit:"mm", default:400},
      {k:"cover", label:"Edge cover", type:"number", unit:"mm", default:75},
      {k:"bar", label:"Bar size", type:"select", options:barOptions(), default:"0.994|12.7"},
    ],
    compute(v){ return CALCS.slab.compute(v); }
  },

  /* ---- WALL ---- */
  wall: {
    cat:"Members", name:"Wall Rebar",
    title:"Wall Rebar Calculator",
    desc:"Vertical + horizontal bars for a concrete or block wall. Works for retaining, basement & pool walls.",
    fields:[
      {k:"L", label:"Wall length", type:"number", unit:"m", default:6},
      {k:"H", label:"Wall height", type:"number", unit:"m", default:3},
      {k:"spV", label:"Vertical spacing (c/c)", type:"number", unit:"mm", default:200},
      {k:"spH", label:"Horizontal spacing (c/c)", type:"number", unit:"mm", default:200},
      {k:"cover", label:"Edge cover", type:"number", unit:"mm", default:40},
      {k:"vbar", label:"Vertical bar size", type:"select", options:barOptions(), default:"0.888|12"},
      {k:"hbar", label:"Horizontal bar size", type:"select", options:barOptions(), default:"0.617|10"},
    ],
    compute(v){
      const cov=v.cover/1000, spV=v.spV/1000, spH=v.spH/1000;
      const nV = Math.floor((v.L-2*cov)/spV)+1;
      const nH = Math.floor((v.H-2*cov)/spH)+1;
      const wV = nV * (v.H-2*cov) * barKgm(v.vbar);
      const wH = nH * (v.L-2*cov) * barKgm(v.hbar);
      const total = wV+wH;
      return { rows:[
        {label:"Total rebar weight", value:total, unit:"kg", primary:true},
        {label:"Vertical bars", value:nV, unit:"pcs"},
        {label:"Horizontal bars", value:nH, unit:"pcs"},
        {label:"Vertical steel", value:wV, unit:"kg"},
        {label:"Horizontal steel", value:wH, unit:"kg"},
        {label:"Weight", value:total/1000, unit:"ton"},
      ], note:`${nV} vert @ ${v.spV}mm + ${nH} horiz @ ${v.spH}mm` };
    }
  },

  pool: {
    cat:"Members", name:"Pool Rebar",
    title:"Swimming Pool Rebar Calculator",
    desc:"Reinforcement for a pool wall panel (per side). Use for each wall, then add the floor with the slab tool.",
    fields:[
      {k:"L", label:"Wall length", type:"number", unit:"m", default:8},
      {k:"H", label:"Wall height", type:"number", unit:"m", default:1.5},
      {k:"spV", label:"Vertical spacing (c/c)", type:"number", unit:"mm", default:250},
      {k:"spH", label:"Horizontal spacing (c/c)", type:"number", unit:"mm", default:250},
      {k:"cover", label:"Edge cover", type:"number", unit:"mm", default:50},
      {k:"vbar", label:"Vertical bar size", type:"select", options:barOptions(), default:"0.617|10"},
      {k:"hbar", label:"Horizontal bar size", type:"select", options:barOptions(), default:"0.617|10"},
    ],
    compute(v){ return CALCS.wall.compute(v); }
  },

  /* ---- BAR CHAIR ---- */
  chair: {
    cat:"Detailing", name:"Bar Chair / Support",
    title:"Rebar Chair / Bar Support Calculator",
    desc:"Number of bar chairs needed to support a top mat, laid out on a square grid.",
    fields:[
      {k:"L", label:"Slab length", type:"number", unit:"m", default:5},
      {k:"W", label:"Slab width", type:"number", unit:"m", default:4},
      {k:"sp", label:"Chair spacing (grid)", type:"number", unit:"m", default:1, step:0.1},
    ],
    compute(v){
      const nx = Math.floor(v.L/v.sp)+1;
      const ny = Math.floor(v.W/v.sp)+1;
      const total = nx*ny;
      const area = v.L*v.W;
      return { rows:[
        {label:"Bar chairs required", value:total, unit:"nos", primary:true},
        {label:"Rows × columns", value:nx, unit:`× ${ny}`},
        {label:"Slab area", value:area, unit:"m²"},
        {label:"Chairs per m²", value:total/area, unit:"/m²"},
      ], note:`(${nx} × ${ny}) chairs @ ${v.sp}m grid` };
    }
  },

  /* ---- TIE WIRE ---- */
  tiewire: {
    cat:"Detailing", name:"Tie Wire",
    title:"Rebar Tie Wire Calculator",
    desc:"Estimate the binding (tie) wire for a reinforcement grid from slab size, spacing and wire per tie.",
    fields:[
      {k:"L", label:"Slab length", type:"number", unit:"m", default:5},
      {k:"W", label:"Slab width", type:"number", unit:"m", default:4},
      {k:"sp", label:"Bar spacing (both ways)", type:"number", unit:"mm", default:150},
      {k:"perTie", label:"Wire per tie", type:"number", unit:"mm", default:300},
      {k:"ratio", label:"Intersections tied", type:"number", unit:"%", default:100},
    ],
    compute(v){
      const sp=v.sp/1000;
      const nx=Math.floor(v.L/sp)+1, ny=Math.floor(v.W/sp)+1;
      const inter = nx*ny;
      const ties = inter * v.ratio/100;
      const lenM = ties * v.perTie/1000;
      const wireKgm = 1.6*1.6/162.28;        // ~1.6 mm tie wire
      const weight = lenM * wireKgm;
      return { rows:[
        {label:"Tie wire length", value:lenM, unit:"m", primary:true},
        {label:"Intersections", value:inter, unit:"nos"},
        {label:"Ties made", value:ties, unit:"nos"},
        {label:"Wire weight", value:weight, unit:"kg"},
      ], note:`${fmt(ties)} ties × ${v.perTie}mm of 1.6mm wire` };
    }
  },
};

/* ============================================================
   UI ENGINE
   ============================================================ */
const $ = id => document.getElementById(id);
/* Each page sets window.PAGE_CALC to the calculator it should open. */
let CURRENT = (typeof window!=="undefined" && window.PAGE_CALC && CALCS[window.PAGE_CALC])
  ? window.PAGE_CALC : "weight";
const SLUGS = (typeof window!=="undefined" && window.REBAR_SLUGS) || {};
const hrefFor = id => {
  if (SLUGS[LANG] && SLUGS[LANG][id]) return SLUGS[LANG][id];
  if (SLUGS[id]) return SLUGS[id];
  return "./";
};

/* ---- i18n: translate display strings (fallback to English) ---- */
const LANG = (typeof window!=="undefined" && window.PAGE_LANG) || "en";
const I18N = (typeof window!=="undefined" && window.REBAR_I18N) || null;

/* ---- browser-language redirect: German browsers landing on English pages ----
   First visit only: once a visitor has chosen English (flag set, or arriving
   from a /de/ page via the language switcher), never redirect them again. */
function langRedirectTarget(){
  if (typeof window === "undefined") return null;
  if (LANG !== "en") return null;
  var nav = (typeof navigator !== "undefined" && (navigator.language || (navigator.languages && navigator.languages[0]))) || "";
  if (!/^de(-|$)/i.test(nav)) return null;
  var path = window.location.pathname || "/";
  var isHome = path === "/" || path === "/index" || path === "/index.html";
  var calcId = (typeof window !== "undefined" && window.PAGE_CALC) || null;
  var target = null;
  if (calcId && SLUGS.de && SLUGS.de[calcId]) target = "/de/" + SLUGS.de[calcId];
  else if (isHome) target = "/de/";
  else return null;
  var fromGerman = false;
  try { fromGerman = (document.referrer || "").indexOf(window.location.origin + "/de/") === 0; } catch (e) {}
  var done = false;
  try { done = window.localStorage.getItem("rebar-lang-redirect") === "done"; } catch (e) {}
  if (fromGerman && !done) { try { window.localStorage.setItem("rebar-lang-redirect", "done"); } catch (e) {} }
  if (done || fromGerman) return null;
  try { window.localStorage.setItem("rebar-lang-redirect", "done"); } catch (e) {}
  return target;
}
(function(){
  if (typeof window === "undefined") return;
  var t = langRedirectTarget();
  if (t) window.location.replace(t);
})();
function tr(s){                                    // glossary lookup for short UI
  if(LANG==="en" || !I18N) return s;
  const g = I18N.G[s];
  if(g && g[LANG]) return g[LANG];
  // Spanish and German use a decimal comma: "0.222 kg/m" -> "0,222 kg/m"
  if((LANG==="es"||LANG==="de") && /kg\/m/.test(s)) return s.replace(/(\d)\.(\d)/g, "$1,$2");
  return s;
}
// Spanish wording for the formula notes; numbers and formulas stay as they are
const NOTE_ES = [
  [/Standard derivation:/g, "Cálculo estándar:"], [/grid both ways @/g, "malla en ambos sentidos @"],
  [/ 1m grid/g, " malla de 1 m"], [/\bgrid\b/g, "malla"], [/, cover /g, ", recubrimiento "], [/bars = floor/g, "barras = parte entera"],
  [/lap = max/g, "traslape = máx"], [/verticals/g, "verticales"], [/main bars/g, "barras principales"],
  [/stirrups/g, "estribos"], [/ ties × /g, " amarres × "], [/ ties\b/g, " estribos"], [/chairs/g, "soportes"],
  [/\bvert @/g, "verticales @"], [/\bhoriz @/g, "horizontales @"], [/bends/g, "dobleces"],
  [/incl\. 3% waste/g, "incl. 3 % de desperdicio"], [/steel @/g, "acero @"], [/\bpcs\b/g, "pzas"],
  [/ of /g, " de "], [/wire/g, "alambre"]
];
// German wording for the formula notes; numbers and formulas stay as they are
const NOTE_DE = [
  [/Standard derivation:/g, "Standard-Herleitung:"],
  [/Reverse derivation:/g, "Umgekehrte Herleitung:"],
  [/grid both ways @/g, "Raster beidseitig @"],
  [/main bars/g, "Hauptstäbe"],
  [/verticals/g, "Längsstäbe"],
  [/stirrups/g, "Bügel"],
  [/ ties × /g, " Bindungen × "],
  [/ of 1\.6mm wire/g, "-Draht (1,6 mm)"],
  [/ ties\b/g, " Bindungen"],
  [/wire/g, "Draht"],
  [/lap = max/g, "Übergreifung = max"],
  [/bars = floor/g, "Stäbe = floor"],
  [/standard (\d+)m bars/g, "Standard-$1-m-Stäbe"],
  [/\bbars\b/g, "Stäbe"],
  [/bends/g, "Biegungen"],
  [/chairs @/g, "Abstandhalter @"],
  [/ grid/g, " Raster"],
  [/steel @/g, "Stahl @"],
  [/\bvert @/g, "vertikal @"],
  [/\bhoriz @/g, "horizontal @"],
  [/\bcover\b/g, "Deckung"],
  [/c\/c/g, "M/M"],
  [/\bincl\./g, "inkl."],
  [/\bwaste\b/g, "Verschnitt"],
  [/\bpcs\b/g, "Stk."],
  [/total length/g, "Gesamtlänge"],
];
function trNote(s){
  if(!s) return s;
  if(LANG==="es") return NOTE_ES.reduce((t,[re,to]) => t.replace(re,to), s);
  if(LANG==="de") return NOTE_DE.reduce((t,[re,to]) => t.replace(re,to), s);
  return s;
}
function calcTitle(id){                             // localized calculator title
  const t = I18N && I18N.CALC[id] && I18N.CALC[id].title;
  return (t && t[LANG]) ? t[LANG] : CALCS[id].title;
}
function calcDesc(id){
  const d = I18N && I18N.CALC[id] && I18N.CALC[id].desc;
  return (d && d[LANG]) ? d[LANG] : CALCS[id].desc;
}

function buildSidebar(){
  const nav = $("calc-tabs");
  if(!nav) return;
  nav.setAttribute("aria-label", tr("Choose a calculator"));
  if(nav.children && nav.children.length > 0){
    nav.querySelectorAll(".tab").forEach(t => {
      t.classList.toggle("active", t.dataset.id === CURRENT);
    });
    return;
  }
  const cats = {};
  Object.entries(CALCS).forEach(([id,c])=>{ (cats[c.cat] ||= []).push([id,c]); });
  nav.innerHTML = "";
  Object.entries(cats).forEach(([cat, items])=>{
    const h = document.createElement("div");
    h.className = "tab-group"; h.textContent = tr(cat);
    nav.appendChild(h);
    items.forEach(([id,c])=>{
      const a = document.createElement("a");        // real internal link (SEO)
      a.className = "tab" + (id===CURRENT ? " active" : "");
      a.href = hrefFor(id); a.dataset.id = id; a.textContent = tr(c.name);
      nav.appendChild(a);
    });
  });
}

function updateDynamicFields(){
  if(CURRENT === "weight"){
    const modeEl = document.querySelector('#inputs [data-key="calcMode"]');
    const mode = modeEl ? modeEl.value : "standard";
    const stdWraps = ["field-wrap-len", "field-wrap-qty"];
    const revWraps = ["field-wrap-totalWeight", "field-wrap-stockLen"];

    stdWraps.forEach(id => {
      const el = document.getElementById(id);
      if(el) el.style.display = (mode === "standard") ? "" : "none";
    });
    revWraps.forEach(id => {
      const el = document.getElementById(id);
      if(el) el.style.display = (mode === "reverse") ? "" : "none";
    });
  }
}

function renderCalc(){
  const c = CALCS[CURRENT];
  $("calc-title").textContent = calcTitle(CURRENT);
  $("calc-desc").textContent = calcDesc(CURRENT);
  document.querySelectorAll(".tab").forEach(t=> t.classList.toggle("active", t.dataset.id===CURRENT));

  const box = $("inputs"); box.innerHTML = "";
  c.fields.forEach(f=>{
    const wrap = document.createElement("div"); wrap.className="field";
    wrap.id = `field-wrap-${f.k}`;
    const unit = f.unit ? ` (${tr(f.unit)})` : "";
    if(f.type==="select"){
      const dia = v => String(v).split("|")[1];
      const pick = f.options.find(o => o.v === f.default)
        || f.options.find(o => dia(o.v) !== undefined && dia(o.v) === dia(f.default));
      const opts = f.options.map(o=>`<option value="${o.v}" ${o === pick ? "selected" : ""}>${tr(o.t)}</option>`).join("");
      wrap.innerHTML = `<label for="f-${f.k}">${tr(f.label)}${unit}</label><select id="f-${f.k}" data-key="${f.k}">${opts}</select>`;
    } else {
      wrap.innerHTML = `<label for="f-${f.k}">${tr(f.label)}${unit}</label>
        <input id="f-${f.k}" data-key="${f.k}" type="number" step="${f.step||"any"}" min="0" value="${f.default}">`;
    }
    box.appendChild(wrap);
  });
  box.querySelectorAll("input,select").forEach(el=> el.addEventListener("input", (e) => {
    if(e.target.dataset.key === "calcMode"){
      updateDynamicFields();
    }
    compute();
  }));
  updateDynamicFields();
  compute();
  setupResultActions();
}

function readValues(){
  const v = {};
  document.querySelectorAll("#inputs [data-key]").forEach(el=>{
    v[el.dataset.key] = el.tagName==="SELECT" ? el.value : (parseFloat(el.value)||0);
  });
  return v;
}

function compute(){
  const c = CALCS[CURRENT];
  const res = c.compute(readValues());
  const rows = res.rows;
  const main = rows.find(r=>r.primary) || rows[0];
  const rest = rows.filter(r=>r!==main);

  $("r-total").textContent = fmt(main.value);
  $("r-total-unit").textContent = tr(main.unit);
  $("r-label").textContent = tr(main.label);

  const grid = $("result-grid"); grid.innerHTML = "";
  rest.forEach(r=>{
    const d = document.createElement("div");
    d.innerHTML = `<span>${fmt(r.value)}</span><small>${tr(r.label)} ${r.unit?`(${tr(r.unit)})`:""}</small>`;
    grid.appendChild(d);
  });
  $("r-formula").textContent = trNote(res.note || "");
}

function showToast(msg){
  let toast = document.getElementById("rebar-toast");
  if(!toast){
    toast = document.createElement("div");
    toast.id = "rebar-toast";
    toast.className = "rebar-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

function setupResultActions(){
  const copyBtn = $("btn-copy-result");
  const printBtn = $("btn-print-result");
  const shareBtn = $("btn-share-link");

  if(copyBtn && !copyBtn.dataset.bound){
    copyBtn.dataset.bound = "true";
    copyBtn.addEventListener("click", () => {
      const c = CALCS[CURRENT];
      const mainVal = $("r-total") ? $("r-total").textContent : "";
      const mainUnit = $("r-total-unit") ? $("r-total-unit").textContent : "";
      const mainLabel = $("r-label") ? $("r-label").textContent : "";
      const note = $("r-formula") ? $("r-formula").textContent : "";
      
      const gridItems = Array.from(document.querySelectorAll("#result-grid > div")).map(d => {
        const val = d.querySelector("span")?.textContent || "";
        const label = d.querySelector("small")?.textContent || "";
        return `${label}: ${val}`;
      }).join("\n");

      const text = `--- ${c.title} Result ---
${mainLabel}: ${mainVal} ${mainUnit}
${gridItems}
Calculation Basis: ${note}
Calculated at https://steelrebarcalculator.com`;

      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(() => {
          showToast("✓ Calculation copied to clipboard!");
        }).catch(() => {
          showToast("Calculation ready!");
        });
      } else {
        showToast("Calculation summary generated!");
      }
    });
  }

  if(printBtn && !printBtn.dataset.bound){
    printBtn.dataset.bound = "true";
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }

  if(shareBtn && !shareBtn.dataset.bound){
    shareBtn.dataset.bound = "true";
    shareBtn.addEventListener("click", () => {
      const url = new URL(window.location.href);
      url.searchParams.set("tool", CURRENT);
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(url.toString()).then(() => {
          showToast("✓ Shareable calculation link copied!");
        }).catch(() => {
          showToast("Link: " + url.toString());
        });
      }
    });
  }
}

/* charts (only present on pages that include the tables) */
function buildCharts(){
  const t1 = document.querySelector("#chart-metric tbody");
  if(t1 && t1.children.length === 0) REBAR_METRIC.forEach(b=>{
    t1.insertAdjacentHTML("beforeend",
      `<tr><td>${b.dia} mm</td><td>${b.kgm}</td><td>${(b.kgm*0.671969).toFixed(3)}</td><td>${(b.kgm*12).toFixed(2)}</td><td>${Math.round(1000/(b.kgm*12))}</td></tr>`);
  });
  const t2 = document.querySelector("#chart-imperial tbody");
  if(t2 && t2.children.length === 0) REBAR_IMPERIAL.forEach(b=>{
    t2.insertAdjacentHTML("beforeend",
      `<tr><td>${b.n}</td><td>${b.dia} mm</td><td>${b.lbft}</td><td>${b.kgm}</td></tr>`);
  });
}

function setupChartUnitSwitcher(){
  const switcher = document.querySelector(".chart-unit-switcher");
  const container = document.querySelector(".chart-container");
  if(!switcher || !container) return;
  const buttons = switcher.querySelectorAll(".unit-tab-btn");
  buttons.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const unit = btn.getAttribute("data-unit");
      if(!unit) return;
      buttons.forEach(b=>{
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      container.setAttribute("data-active-tab", unit);
    });
  });
}

document.addEventListener("DOMContentLoaded", ()=>{
  // Check URL param on load
  try {
    const params = new URLSearchParams(window.location.search);
    const toolParam = params.get("tool");
    if(toolParam && CALCS[toolParam]){
      CURRENT = toolParam;
    }
  } catch(e){}

  buildSidebar();
  if($("calc-title")) renderCalc();
  buildCharts();
  setupChartUnitSwitcher();
});
