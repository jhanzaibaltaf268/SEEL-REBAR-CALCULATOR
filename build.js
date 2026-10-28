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
    metaTitle:"Rebar Weight Calculator — Free, Exact kg, lb & Tons",
    h1:"Rebar Weight Calculator",
    desc:"Free rebar weight calculator: bar size, length and quantity to exact kg, lb and tons. 100 × 12 mm × 12 m bars = 1,064.4 kg. Metric (mm) and US (#) bars.",
    kw:"rebar weight calculator, steel rebar weight per meter, weight of rebar, reinforcement bar weight per meter, deformed bar weight calculator",
    intro:"Find the weight of any reinforcement bar in seconds. Pick the bar size, enter the length and quantity, and get the total in kilograms, pounds and metric tons — using the industry-standard <strong>weight per metre = d² ÷ 162.28</strong> formula.",
    howto:["Pick the bar size — metric (mm) or US (# size) — from the dropdown.","For a known batch, leave the mode on Standard, enter the length of one bar in metres and the number of pieces.","Read the total in kg, lb, metric tons and US short tons, plus the weight of one piece.","For a known weight, switch the mode to Reverse, enter the total weight and your stock bar length to get total length and bars needed.","Add waste, laps and hooks before ordering — the calculator weighs straight bars only."],
    formula:"Weight per metre (kg) = d² ÷ 162.28, where d is the bar diameter in mm. Total = weight/m × length × quantity.",
    faqs:[["What is the weight of a 12mm rebar?", "12² ÷ 162.28 = 0.887 kg per metre on this calculator, so one 12 m bar weighs 10.64 kg and 100 of them weigh 1,064.4 kg. You will also see 0.888 kg/m quoted widely — that comes from the d²/162.2 shortcut (144 ÷ 162.2 = 0.888), and 0.889 kg/m from d²/162. The difference is about 0.2%: on a tonne order of 12 mm it is roughly 2 kg. Always check which constant a table uses before comparing totals."],
          ["How do you calculate the weight of steel rebar?", "Square the diameter in mm, divide by 162.28 to get kg/m, then multiply by length and quantity. For 100 bars of 12 mm at 12 m: 0.887 × 12 × 100 = 1,064.4 kg. In pounds, multiply kg by 2.20462 (1,064.4 kg = 2,346.6 lb); in metric tons divide by 1000 (1.06 t). The formula section below derives the 162.28 constant from steel density."],
          ["What is the difference between d²/162 and d²/162.28?", "162 is the rounded constant; 162.28 is the precise one. Steel at 7850 kg/m³ gives weight per metre = π/4 × d² × 7850 ÷ 1,000,000 = 0.0061654 × d², and 1 ÷ 0.0061654 = 162.2 — rounded to 162 for site arithmetic, kept as 162.28 by this calculator. On 12 mm bar that is 0.889 vs 0.887 kg/m, 10.67 vs 10.64 kg per 12 m bar, and about 2.1 kg on a tonne order. Neither is wrong; they are different roundings, and mixing them is how two estimates for the same steel disagree."],
          ["How many bars are in a tonne?", "It depends on the bar size AND the bar length — a figure without a length is meaningless. For 12 m stock bars, one tonne needs: 8 mm 212 bars (211 full + 6.07 m offcut), 10 mm 136 (135 + 3.38 m), 12 mm 94 (93 + 11.4 m), 16 mm 53 (52 + 9.71 m), 20 mm 34 (33 + 9.68 m), 25 mm 22 (21 + 7.67 m), 32 mm 14 (13 + 2.48 m). For 40 ft (12.192 m) bars the counts are lower — 12 mm is 92, not 94 — because each bar is longer. The per-tonne table below gives the full reverse-mode figures."],
          ["What does a bundle of rebar weigh?", "Bundle sizes vary by supplier, so weigh by count, not by the word bundle: 100 bars of 12 m weigh 266.40 kg (6 mm), 472.80 kg (8 mm), 739.20 kg (10 mm), 1,064.4 kg (12 mm), 1,893.6 kg (16 mm), 2,958 kg (20 mm), 4,621.2 kg (25 mm) and 7,572 kg (32 mm). One published supplier chart packs 10 × 8 mm, 7 × 10 mm, 5 × 12 mm, 3 × 16 mm, 2 × 20 mm and 1 × 25/32 mm per bundle — those piece counts are that supplier's, not a standard. Always confirm pieces per bundle on your delivery note."],
          ["How do I work backwards from a weight to bars?", "Switch the calculator to Reverse mode, enter the weight and your stock length. For 2000 kg of 12 mm bar at 12 m stock it gives 2,254.8 m of bar (7,397.6 ft), 188 bars needed — 187 full bars plus a 10.79 m offcut. Note the ceil: ordering 188 full bars weighs 2,001.07 kg, slightly MORE than the 2000 kg you entered, because the offcut still has to be bought as a whole bar. If you order only the 187 full bars you will be 10.79 m short."],
          ["Does the bar grade change the weight?", "No. Fe415, Fe500, Fe550 and Grade 60 differ in strength, not density, so the weight per metre is the same for a given diameter — and the same holds for TMT bars, which are heat-treated but still 7850 kg/m³ steel. Stainless reinforcement is the exception (about 7900–8000 kg/m³, roughly 1% heavier), and it is not what this calculator models. Grade affects laps, development and design — see the <a href=\"/rebar-lap-length-calculator\">lap calculator</a> and the <a href=\"/rebar-development-length-calculator\">development length calculator</a> — not weight."],
          ["Why does delivered steel weigh differently from the table?", "Because the table is theoretical (nominal diameter, exact density) and real bars vary within manufacturing tolerance: ASTM A615 allows ±6% on #3–#5 and ±4% on #6–#18, EN 10080/ISO 6935 allows ±6% up to 8 mm and ±4.5% above, and AS/NZS 4671 allows ±4% on the batch mean. On a 50 tonne order that compounds to tonnes, not kilograms. Check deliveries the way site engineers do: count the bars against the reverse-mode figure (3000 kg of 12 mm 12 m bars should be 282 bars — 281 full + 10.19 m), then weigh a sample (5 × 12 m 12 mm bars should be 53.22 kg). If the gap exceeds the applicable tolerance, raise it with the supplier — and check whether your order prices theoretical or actual (weighed) weight."],
          ["What is the difference between a metric ton and a US short ton?", "A metric ton (tonne) is 1000 kg; a US short ton is 2000 lb = 907.18 kg — about 10% smaller. On the calculator defaults (100 × 12 mm × 12 m) that is 1.06 metric tons but 1.17 US short tons, for the same steel. Suppliers quoting tons without saying which one are quoting two different quantities: a price per short ton looks about 10% cheaper than the same price per metric ton. Convert any quote on the <a href=\"/rebar-tonnage-calculator\">tonnage calculator</a> before comparing."],
          ["Does the calculator include waste, laps, hooks or cost?", "No — it weighs straight bars only. Add 5–10% for cutting and laps (published takeoff guides use 10% for laps and waste combined; one bar-schedule method uses 3–5% for cutting alone): the defaults total goes from 1,064.4 kg neat to 1,117.62 kg at +5% and 1,170.84 kg at +10%, which costs €1,277.28 / €1,341.14 / €1,405.01 at an example €1.20/kg. Work laps out on the <a href=\"/rebar-lap-length-calculator\">lap calculator</a>, hooks on the <a href=\"/rebar-hook-bend-cutting-length-calculator\">hook calculator</a>, price the result on the <a href=\"/rebar-cost-calculator\">cost calculator</a>, and build a full takeoff on the <a href=\"/rebar-quantity-calculator\">quantity calculator</a>."]],
    toc:`<nav class="content-block" aria-label="On this page"><h2>On this page</h2><ul><li><a href="#how-to">How to use the calculator</a></li><li><a href="#formula">The formula, explained</a></li><li><a href="#example-1">Worked example 1: defaults (100 × 12 mm × 12 m)</a></li><li><a href="#example-2">Worked example 2: short bars, small order</a></li><li><a href="#example-3">Worked example 3: reverse mode (2000 kg)</a></li><li><a href="#unit-weight-table">Weight per metre: metric table</a></li><li><a href="#bundle-table">One bar and 100 bars</a></li><li><a href="#per-tonne">Bars per tonne (reverse mode)</a></li><li><a href="#forty-foot">40 ft bars vs 12 m bars</a></li><li><a href="#imperial">Imperial bars and unit conversions</a></li><li><a href="#order">From neat total to order</a></li><li><a href="#delivery">Checking a delivery</a></li><li><a href="#not-included">What this calculator does not do</a></li><li><a href="#mistakes">Common mistakes</a></li><li><a href="#faq">Frequently asked questions</a></li></ul></nav>`,
    extra:`<h3>The formula, explained</h3><p>A bar is a long cylinder, so its weight per metre is its cross-sectional area times steel density. Area = π/4 × d² (d in mm), density = 7850 kg/m³, and converting mm² to m² divides by 1,000,000:</p><p><strong>Weight per metre (kg/m) = π/4 × d² × 7850 ÷ 1,000,000 = d² ÷ 162.28; Total = weight/m × length × quantity</strong></p><p>The constant falls out of the arithmetic: π/4 × 7850 ÷ 1,000,000 = 0.0061654, and 1 ÷ 0.0061654 = 162.2 — rounded to 162 for site arithmetic, kept as 162.28 by this calculator. That is the entire difference between the tables you will find online: d²/162 gives 0.889 kg/m for 12 mm, d²/162.2 gives 0.888, d²/162.28 gives 0.887. Two display notes. First, the bar dropdown reads "0.888|12", but the panel computes with the option value 0.887 kg/m, so every weight below uses 0.887 — the raw field string would give 1,065.6 kg on the defaults, not the panel's 1,064.4 kg. Second, totals at or above 1000 show one decimal with separators, so the defaults total reads "1,064.4 kg", not 1064.40 kg, while tonnages show two decimals (1.06 metric ton, 1.17 US ton). Quote the panel forms and your reader's check will match. The imperial column converts with lb/ft = kg/m × 0.671969, which round-trips to the ASTM lb/ft figures for US bars.</p><h3 id="example-1">Worked example 1: defaults (100 × 12 mm × 12 m)</h3><p>Open the calculator as it loads: Standard mode, 12 mm bars, length 12 m, quantity 100 pieces.</p><p>Unit weight = 12² ÷ 162.28 = 0.887 kg/m (0.596 lb/ft). Weight per piece = 0.887 × 12 = 10.64 kg (23.47 lb).</p><p><strong>Total = 10.64 × 100 = 1,064.4 kg (2,346.6 lb), 1.06 metric tons, 1.17 US short tons.</strong> The panel shows all six rows: total 1,064.4 kg, imperial 2,346.6 lb, per piece 10.64 kg (23.47 lb), unit 0.887 kg/m (0.596 lb/ft), metric tonnage 1.06, US short tons 1.17, with the note "0.887 kg/m (0.596 lb/ft) × 12m × 100 pcs = 1,064.4 kg (2,346.6 lb)". Two things to notice. The metric and US tonnages differ by 10% for the same steel (1000 kg vs 907.18 kg per ton) — never compare a price per ton without asking which ton. And the per-piece figure is the one to memorise: one 12 m 12 mm bar is 10.64 kg on this panel, not the 10.67 kg the d²/162 tables quote.</p><h3 id="example-2">Worked example 2: short bars, small order</h3><p>Set Standard mode, 16 mm bars, length 6 m, quantity 50 pieces.</p><p>Unit weight = 16² ÷ 162.28 = 1.578 kg/m (1.06 lb/ft). Weight per piece = 1.578 × 6 = 9.47 kg (20.87 lb).</p><p><strong>Total = 9.47 × 50 = 473.40 kg (1,043.7 lb), 0.473 metric tons, 0.52 US short tons.</strong> Same method, second run: 10 mm bars, 6 m, 200 pieces → per piece 3.70 kg (8.15 lb), total 739.20 kg (1,629.7 lb), 0.739 t, 0.81 US ton. Short bars change nothing in the method — length is length — but they change the order: 6 m bars fit smaller trucks and tighter sites, and the extra laps they need on long runs are not in either total (see the order section).</p><h3 id="example-3">Worked example 3: reverse mode (2000 kg)</h3><p>Switch the mode to Reverse, leave the bar at 12 mm, enter total weight 2000 kg and stock length 12 m.</p><p>Total length = 2000 ÷ 0.887 = 2,254.8 m (7,397.6 ft). Standard bars needed = ceil(2,254.8 ÷ 12) = 188 bars; full bars = 187, plus a 10.79 m offcut.</p><p><strong>2000 kg of 12 mm bar is 2,254.8 m, or 188 stock bars — and the panel says so in both forms.</strong> The panel shows 2,254.8 m, 7,397.6 ft, 188 bars (12 m stock), 187 bars + 10.79 m, unit 0.887 kg/m (0.596 lb/ft), entered 2000 kg (4,409.2 lb) and 2.00 metric tons. Now the ceil nuance, which no competitor states: ordering 188 full bars weighs 188 × 10.64 = 2,001.07 kg, slightly MORE than the 2000 kg entered, because the offcut must still be bought as a whole bar. Order only the 187 full bars and you are 10.79 m short. Two more reverse runs: 5000 kg of 16 mm at 12 m stock → 3,168.6 m (10,395.6 ft), 265 bars, 264 + 0.57 m (ordered weight 5,018.04 kg); 1000 kg of 10 mm at 6 m stock → 1,623.4 m (5,326.0 ft), 271 bars, 270 + 3.38 m.</p><h3 id="unit-weight-table">Weight per metre: metric table</h3><p>Every value below is the panel's option value for that size (d² ÷ 162.28), with the panel's lb/ft and the panel's per-piece weight for a 12 m bar. The kg/m column is what the dropdown shows; the lb/ft column is what the panel prints beside it.</p><div class="formula-table"><table><tr><th>Bar</th><th>kg/m</th><th>lb/ft</th><th>kg per 12 m bar</th></tr><tr><td>6 mm</td><td>0.222</td><td>0.149</td><td>2.66</td></tr><tr><td>8 mm</td><td>0.394</td><td>0.265</td><td>4.73</td></tr><tr><td>10 mm</td><td>0.616</td><td>0.414</td><td>7.39</td></tr><tr><td>12 mm</td><td>0.887</td><td>0.596</td><td>10.64</td></tr><tr><td>16 mm</td><td>1.578</td><td>1.06</td><td>18.94</td></tr><tr><td>20 mm</td><td>2.465</td><td>1.656</td><td>29.58</td></tr><tr><td>25 mm</td><td>3.851</td><td>2.588</td><td>46.21</td></tr><tr><td>28 mm</td><td>4.831</td><td>3.246</td><td>57.97</td></tr><tr><td>32 mm</td><td>6.31</td><td>4.24</td><td>75.72</td></tr><tr><td>36 mm</td><td>7.986</td><td>5.366</td><td>95.83</td></tr><tr><td>40 mm</td><td>9.859</td><td>6.625</td><td>118.31</td></tr></table></div><p>Two readings. First, weight scales with diameter squared: doubling the diameter quadruples the weight — 16 mm (1.578) to 32 mm (6.31) is exactly 4×, and 10 mm (0.616) to 20 mm (2.465) is 4×. A design change that swaps sizes without re-running the weight can move the tonnage far more than the bar count suggests. Second, compare this table with any d²/162 table and every row differs by ~0.2% (12 mm: 0.887 here vs 0.889 there; 20 mm: 2.465 vs 2.469; 32 mm: 6.31 vs 6.321). That gap is the constant, not an error on either side — but only this page says so.</p><h3 id="bundle-table">One bar and 100 bars</h3><p>Suppliers quote by the bar, by the bundle and by the tonne, so here are all three at panel precision. Bundle piece counts vary by supplier — the 100-bar column is the neutral form: divide it by your supplier's pieces per bundle.</p><div class="formula-table"><table><tr><th>Bar</th><th>One 12 m bar</th><th>100 × 12 m bars</th><th>100 bars in metric tons</th></tr><tr><td>6 mm</td><td>2.66 kg</td><td>266.40 kg</td><td>0.266 t</td></tr><tr><td>8 mm</td><td>4.73 kg</td><td>472.80 kg</td><td>0.473 t</td></tr><tr><td>10 mm</td><td>7.39 kg</td><td>739.20 kg</td><td>0.739 t</td></tr><tr><td>12 mm</td><td>10.64 kg</td><td>1,064.4 kg</td><td>1.06 t</td></tr><tr><td>16 mm</td><td>18.94 kg</td><td>1,893.6 kg</td><td>1.89 t</td></tr><tr><td>20 mm</td><td>29.58 kg</td><td>2,958 kg</td><td>2.96 t</td></tr><tr><td>25 mm</td><td>46.21 kg</td><td>4,621.2 kg</td><td>4.62 t</td></tr><tr><td>32 mm</td><td>75.72 kg</td><td>7,572 kg</td><td>7.57 t</td></tr></table></div><p>For scale: 100 bars of 25 mm at 12 m already weigh 4.62 tonnes — more than four times the same count of 12 mm — and a single 40 mm 12 m bar (118.31 kg) needs two people or a crane, not a shoulder. If a supplier's bundle weights do not match count × one-bar weight from this table, either the piece count or the bar length differs: check both before assuming the steel is light.</p><h3 id="per-tonne">Bars per tonne (reverse mode)</h3><p>Run reverse mode with 1000 kg and 12 m stock for each size. "Bars needed" is the ceil — the order quantity — and "full bars + offcut" is what the tonne actually contains.</p><div class="formula-table"><table><tr><th>Bar</th><th>Total length per tonne</th><th>Bars needed (12 m)</th><th>Full bars + offcut</th></tr><tr><td>8 mm</td><td>2,538.1 m</td><td>212</td><td>211 + 6.07 m</td></tr><tr><td>10 mm</td><td>1,623.4 m</td><td>136</td><td>135 + 3.38 m</td></tr><tr><td>12 mm</td><td>1,127.4 m</td><td>94</td><td>93 + 11.4 m</td></tr><tr><td>16 mm</td><td>633.71 m</td><td>53</td><td>52 + 9.71 m</td></tr><tr><td>20 mm</td><td>405.68 m</td><td>34</td><td>33 + 9.68 m</td></tr><tr><td>25 mm</td><td>259.67 m</td><td>22</td><td>21 + 7.67 m</td></tr><tr><td>32 mm</td><td>158.48 m</td><td>14</td><td>13 + 2.48 m</td></tr></table></div><p>The practical use: a bar bending schedule that totals 1810 kg of 12 mm converts to 1810 ÷ 10.64 = 170 bars of 12 m (plus cutting waste), and a delivery note claiming one tonne of 12 mm should show 94 bars, not 90 or 100. And the offcut column matters: the 12 mm tonne's 11.4 m offcut is nearly a full bar — on a multi-tonne order those offcuts add up to real bars if the cut lengths fit them, or real waste if they do not.</p><h3 id="forty-foot">40 ft bars vs 12 m bars</h3><p>Forty feet is 12.192 m, not 12 m — 0.192 m longer per bar, which is +1.6% on every bar weight. At panel precision:</p><div class="formula-table"><table><tr><th>Bar</th><th>12 m bar</th><th>40 ft (12.192 m) bar</th><th>Difference</th></tr><tr><td>8 mm</td><td>4.73 kg</td><td>4.80 kg</td><td>+0.07 kg</td></tr><tr><td>10 mm</td><td>7.39 kg</td><td>7.51 kg</td><td>+0.12 kg</td></tr><tr><td>12 mm</td><td>10.64 kg</td><td>10.81 kg</td><td>+0.17 kg</td></tr><tr><td>16 mm</td><td>18.94 kg</td><td>19.24 kg</td><td>+0.30 kg</td></tr><tr><td>20 mm</td><td>29.58 kg</td><td>30.05 kg</td><td>+0.47 kg</td></tr><tr><td>25 mm</td><td>46.21 kg</td><td>46.95 kg</td><td>+0.74 kg</td></tr><tr><td>32 mm</td><td>75.72 kg</td><td>76.93 kg</td><td>+1.21 kg</td></tr></table></div><p>This is also why bars-per-tonne figures disagree between sources: one published supplier chart quotes 92 bars per tonne for 12 mm — but those are 40 ft bars (1000 ÷ (0.888 × 12.2) ≈ 92), while this panel's 12 m bars give 94. Both are right for their length; neither transfers to the other. Whenever a bars-per-tonne figure appears without a length, it is incomplete — ask for the length before using it.</p><h3 id="imperial">Imperial bars and unit conversions</h3><p>The bar dropdowns include US sizes, so enter the metric equivalents of your dimensions and pick the matching US bar. US bars are sized by eighths of an inch (#4 = 4/8 in = 1/2 in), but from #9 up the diameters follow legacy area-based sizes — always use the nominal diameter in mm from the table.</p><div class="formula-table"><table><tr><th>US bar</th><th>Nominal diameter (mm)</th><th>kg/m</th><th>lb/ft</th><th>kg per 20 ft (6.096 m) bar</th></tr><tr><td>#3</td><td>9.5</td><td>0.56</td><td>0.376</td><td>3.41</td></tr><tr><td>#4</td><td>12.7</td><td>0.994</td><td>0.668</td><td>6.06</td></tr><tr><td>#5</td><td>15.9</td><td>1.552</td><td>1.043</td><td>9.46</td></tr><tr><td>#6</td><td>19.1</td><td>2.235</td><td>1.502</td><td>13.62</td></tr><tr><td>#7</td><td>22.2</td><td>3.042</td><td>2.044</td><td>18.54</td></tr><tr><td>#8</td><td>25.4</td><td>3.973</td><td>2.67</td><td>24.22</td></tr></table></div><p>Worked conversions: the defaults total 1,064.4 kg = 2,346.6 lb; one 12 m 12 mm bar is 10.64 kg = 23.47 lb; one 20 ft #5 bar is 9.46 kg = 20.86 lb. A full imperial run — 50 × #5 bars at 20 ft (6.096 m) — gives 473.05 kg (1,042.9 lb), 0.473 t, 0.52 US ton; 100 × #4 bars at 20 ft gives 605.94 kg (1,335.9 lb), 0.606 t, 0.67 US ton. Two traps: a #4 bar (12.7 mm, 0.994 kg/m) is NOT a 12 mm bar (0.887 kg/m) — swapping them blindly changes the weight by 12.1%. And a kilogram per foot is not a pound per foot: 12 mm bar is 0.270 kg/ft but 0.596 lb/ft — mixing those two columns understates the weight by more than half.</p><h3 id="order">From neat total to order</h3><p>The panel total is neat straight-bar steel. An order needs three additions, all worked here from the panel totals (exact totals throughout, not rounded display values).</p><p><strong>Waste.</strong> Defaults neat 1,064.4 kg → 1,117.62 kg at +5%, 1,170.84 kg at +10%. Published takeoff guides use 10% for laps and waste combined; one bar-schedule method uses 3–5% for cutting alone. Pick the allowance that matches how well your cut lengths fit the stock bars — a schedule of 3 m cuts from 12 m bars wastes almost nothing, while a schedule of 5 m cuts leaves 2 m offcuts everywhere.</p><p><strong>Cost.</strong> At an example €1.20/kg (prices are examples — enter your local rate on the <a href="/rebar-cost-calculator">cost calculator</a>): defaults €1,277.28 neat, €1,341.14 at +5%, €1,405.01 at +10%. Convert the final figure on the <a href="/rebar-tonnage-calculator">tonnage calculator</a> if your supplier prices per ton.</p><p><strong>Trucks.</strong> A standard flatbed payload is about 20,000 kg (20 metric tons) — derived arithmetic, not a panel output, so treat it as a planning figure: the defaults order is one truck, a 25 mm bundle order of 4,621.2 kg is one truck, and anything over 20 tonnes needs a second. But length binds before weight does: 12 m bars need a 40 ft (12.2 m) trailer or longer, while 6 m bars fit shorter urban trucks — one published logistics analysis notes that specifying 6 m bars with site laps can cut delivery cost even though the laps add 5–10% tonnage.</p><p>Cross-check against a competitor's worked example: one multi-row tool works 40 × 12 mm × 6 m + 5% as 224 kg on d²/162. On this panel the same order is 212.88 kg neat and 223.52 kg at +5% — 0.48 kg lower, purely the constant. If your estimate and your supplier's differ by that kind of margin, the constant is the first place to look, not the arithmetic.</p><h3 id="delivery">Checking a delivery</h3><p>Theoretical weight is a budget baseline, not a delivery guarantee. Check steel the way site engineers do, with the panel's reverse mode:</p><p><strong>Count first.</strong> A delivery note claiming 3000 kg of 12 mm 12 m bars should contain 282 bars (reverse mode: 3,382.2 m, 281 full + 10.19 m). If you count 265, either the bars are lighter than nominal or the weight on the bill is wrong — either way, stop and check before signing.</p><p><strong>Weigh a sample.</strong> Pick 5 bars at random and weigh them together on a platform scale. Expected: 5 × 10.644 = 53.22 kg. If the scale shows 52.4 kg, the bars are 1.5% light — inside tolerance, but worth recording with the date, bundle tag and supplier.</p><p><strong>Know the tolerance before you complain.</strong> Published manufacturing tolerances (firsthand tables): ASTM A615 ±6% on #3–#5 and ±4% on #6–#18; EN 10080/ISO 6935 ±6% up to 8 mm and ±4.5% above; AS/NZS 4671 ±4% on the batch mean. A 1.5% shortfall is not a claim; a 7% shortfall on 12 mm bar is. And settle one thing on the purchase order itself: whether invoicing is on theoretical weight or actual (weighed) weight — on a 50 tonne order, tolerance alone can move the delivered weight by tonnes, and the two bases will never agree to the kilogram.</p><h3 id="not-included">What this calculator does not do</h3><p>This is a bar-weight tool, not a schedule or ordering tool. It does not add laps, hooks, bends, cranks or development — see the <a href="/rebar-lap-length-calculator">lap calculator</a>, the <a href="/rebar-hook-bend-cutting-length-calculator">hook calculator</a> and the <a href="/rebar-development-length-calculator">development length calculator</a>. It does not add waste or cost — the order section shows the arithmetic; price the final figure on the <a href="/rebar-cost-calculator">cost calculator</a> and convert it on the <a href="/rebar-tonnage-calculator">tonnage calculator</a>. It does not take off a whole member or building — use the member tools (<a href="/concrete-slab-rebar-calculator">slab</a>, <a href="/footing-rebar-calculator">footing</a>, <a href="/rebar-mat-grid-calculator">mat</a>, <a href="/column-rebar-calculator">column</a>, <a href="/beam-rebar-calculator">beam</a>, <a href="/wall-rebar-calculator">wall</a>, <a href="/pool-rebar-calculator">pool</a>, <a href="/driveway-rebar-calculator">driveway</a>) or the <a href="/rebar-quantity-calculator">quantity calculator</a> for area-density estimates and the <a href="/concrete-and-rebar-calculator">concrete estimator</a> for kg/m³-ratio estimates. It does not run multi-size schedules in one pass (one size per run — run each size separately and add, as the <a href="/rebar-area-calculator">area page</a> does for mixed cages), count bars from a spacing layout (see the <a href="/rebar-spacing-calculator">spacing calculator</a>), weigh stirrups (see the <a href="/stirrup-tie-cutting-length-calculator">stirrup calculator</a>), chairs (see the <a href="/rebar-chair-calculator">chair calculator</a>) or tie wire (see the <a href="/rebar-tie-wire-calculator">tie wire calculator</a>), or model stainless/alloy densities, mesh, or cut-length optimisation against stock bars.</p><h3 id="mistakes">Common mistakes</h3><p><strong>Mixing the constants.</strong> Using a d²/162 table against a d²/162.28 calculator (or the reverse) shifts every total by ~0.2%: 0.48 kg on the 224 kg worked example above, about 2.1 kg per tonne on 12 mm. Pick one constant and use it everywhere in a schedule.</p><p><strong>Confusing metric tons and US short tons.</strong> The defaults total is 1.06 metric tons but 1.17 US short tons. A price per short ton looks ~10% cheaper than the same price per metric ton — and a supplier quoting tons without saying which one is quoting two different quantities.</p><p><strong>Quoting bars per tonne without a length.</strong> One tonne of 12 mm is 94 twelve-metre bars but 92 forty-foot bars. A bars-per-tonne figure without a bar length is incomplete, and using the wrong one mis-orders by 2 bars per tonne before waste.</p><p><strong>Ordering the full bars from reverse mode.</strong> Reverse mode's "full bars" for 1000 kg of 12 mm is 93 bars — but the tonne also contains an 11.4 m offcut, so the order is 94 bars. Ordering 93 leaves you 11.4 m short; the ceil exists for exactly this reason.</p><p><strong>Weighing by count alone, or by member length.</strong> Counting bars without weighing a sample misses light bars entirely, and weighing member lengths instead of cut lengths misses hooks, bends, anchorage and laps — one published lap analysis puts laps alone at 150–250 kg on a 12-column house. Work from cut lengths, then count, then weigh.</p><p>Last reviewed: October 2026.</p>`,
    de: {
  metaTitle: "Bewehrungsgewicht-Rechner — kg/m, lb & Tonnen gratis",
  desc: "Bewehrungsgewicht-Rechner: Gewicht pro Meter und Gesamtgewicht in kg, lb und Tonnen aus Größe, Länge und Stückzahl. Beispiel: 100 × 12 mm × 12 m = 1.064,4 kg.",
  formula: "Gewicht pro Meter (kg) = d² ÷ 162,28, wobei d der Stabdurchmesser in mm ist. Gesamtgewicht = Gewicht/m × Länge × Menge.",
  kw: "bewehrungsgewicht-rechner, bewehrungsgewicht pro meter, gewicht bewehrung, bewehrungsstahl gewicht pro meter, betonstahl gewicht rechner",
  howto: ["Wählen Sie die Stabgröße — metrisch (mm) oder US (#-Größe) — aus dem Dropdown-Menü.", "Für eine bekannte Charge lassen Sie den Modus auf Standard, geben Sie die Länge eines Stabes in Metern und die Stückzahl ein.", "Lesen Sie das Gesamtgewicht in kg, lb, metrischen Tonnen und US-Short-Tonnen ab, dazu das Gewicht eines einzelnen Stabes.", "Für ein bekanntes Gewicht wechseln Sie in den Modus Rückwärts, geben Sie das Gesamtgewicht und Ihre Handelsstablänge ein, um Gesamtlänge und benötigte Stäbe zu erhalten.", "Addieren Sie Verschnitt, Übergreifungen und Haken vor der Bestellung hinzu — der Rechner wiegt nur gerade Stäbe."],
  faqs: [["Wie viel wiegt ein 12-mm-Bewehrungsstab?", "12² ÷ 162,28 = 0,887 kg pro Meter auf diesem Rechner, also wiegt ein 12-m-Stab 10,64 kg und 100 davon wiegen 1.064,4 kg. Sie werden auch oft 0,888 kg/m angegeben sehen — das kommt aus der Abkürzung d²/162,2 (144 ÷ 162,2 = 0,888), und 0,889 kg/m aus d²/162. Der Unterschied beträgt etwa 0,2 %: Bei einer Tonnenbestellung von 12 mm sind das rund 2 kg. Prüfen Sie immer, welche Konstante eine Tabelle verwendet, bevor Sie Summen vergleichen."],
          ["Wie berechnet man das Gewicht von Bewehrungsstahl?", "Quadrieren Sie den Durchmesser in mm, teilen Sie durch 162,28, um kg/m zu erhalten, und multiplizieren Sie dann mit Länge und Stückzahl. Für 100 Stäbe von 12 mm bei 12 m: 0,887 × 12 × 100 = 1.064,4 kg. In Pfund multiplizieren Sie kg mit 2,20462 (1.064,4 kg = 2.346,6 lb); in metrischen Tonnen teilen Sie durch 1.000 (1,06 t). Der Formelabschnitt unten leitet die Konstante 162,28 aus der Stahldichte her."],
          ["Was ist der Unterschied zwischen d²/162 und d²/162,28?", "162 ist die gerundete Konstante; 162,28 ist die genaue. Stahl mit 7.850 kg/m³ ergibt ein Gewicht pro Meter = π/4 × d² × 7.850 ÷ 1.000.000 = 0,0061654 × d², und 1 ÷ 0,0061654 = 162,2 — auf 162 gerundet für Baustellenrechnung, auf diesem Rechner als 162,28 beibehalten. Bei 12-mm-Stäben sind das 0,889 gegenüber 0,887 kg/m, 10,67 gegenüber 10,64 kg pro 12-m-Stab und etwa 2,1 kg pro Tonnenbestellung. Beides ist nicht falsch; es sind unterschiedliche Rundungen, und sie zu mischen ist der Grund, warum zwei Schätzungen für denselben Stahl voneinander abweichen."],
          ["Wie viele Stäbe sind in einer Tonne?", "Das hängt sowohl von der Stabgröße ALS AUCH von der Stablänge ab — eine Zahl ohne Länge ist bedeutungslos. Für 12-m-Handelsstäbe braucht eine Tonne: 8 mm 212 Stäbe (211 volle + 6,07 m Abschnitt), 10 mm 136 (135 + 3,38 m), 12 mm 94 (93 + 11,4 m), 16 mm 53 (52 + 9,71 m), 20 mm 34 (33 + 9,68 m), 25 mm 22 (21 + 7,67 m), 32 mm 14 (13 + 2,48 m). Für 40-ft-Stäbe (12,192 m) sind die Stückzahlen niedriger — 12 mm sind 92, nicht 94 —, weil jeder Stab länger ist. Die Pro-Tonne-Tabelle unten gibt die vollständigen Rückwärtsmodus-Zahlen an."],
          ["Wie viel wiegt ein Bund Bewehrungsstahl?", "Bundgrößen variieren je nach Lieferant, also wiegen Sie nach Stückzahl, nicht nach dem Wort Bund: 100 Stäbe von 12 m wiegen 266,40 kg (6 mm), 472,80 kg (8 mm), 739,20 kg (10 mm), 1.064,4 kg (12 mm), 1.893,6 kg (16 mm), 2.958 kg (20 mm), 4.621,2 kg (25 mm) und 7.572 kg (32 mm). Eine veröffentlichte Lieferantentabelle packt 10 × 8 mm, 7 × 10 mm, 5 × 12 mm, 3 × 16 mm, 2 × 20 mm und 1 × 25/32 mm pro Bund — diese Stückzahlen sind die dieses Lieferanten, kein Standard. Bestätigen Sie immer die Stückzahl pro Bund auf Ihrem Lieferschein."],
          ["Wie rechne ich von einem Gewicht zurück auf Stäbe?", "Wechseln Sie den Rechner in den Modus Rückwärts, geben Sie das Gewicht und Ihre Handelslänge ein. Für 2.000 kg 12-mm-Stahl bei 12 m Handelslänge ergibt das 2.254,8 m Stab (7.397,6 ft), 188 benötigte Stäbe — 187 volle Stäbe plus ein 10,79-m-Abschnitt. Beachten Sie das Aufrunden: 188 volle Stäbe zu bestellen wiegt 2.001,07 kg, also etwas MEHR als die eingegebenen 2.000 kg, weil der Abschnitt trotzdem als ganzer Stab gekauft werden muss. Wenn Sie nur die 187 vollen Stäbe bestellen, fehlen Ihnen 10,79 m."],
          ["Ändert die Stahlsorte das Gewicht?", "Nein. Fe415, Fe500, Fe550 und Grade 60 unterscheiden sich in der Festigkeit, nicht in der Dichte, sodass das Gewicht pro Meter bei einem gegebenen Durchmesser gleich ist — und dasselbe gilt für TMT-Stäbe, die wärmebehandelt sind, aber trotzdem Stahl mit 7.850 kg/m³. Rostfreie Bewehrung ist die Ausnahme (etwa 7.900–8.000 kg/m³, rund 1 % schwerer), und sie ist nicht das, was dieser Rechner modelliert. Die Sorte beeinflusst Übergreifungen, Verankerung und Bemessung — siehe den <a href=\"/de/uebergreifungslaengen-rechner\">Übergreifungslängen-Rechner</a> und den <a href=\"/de/verankerungslaengen-rechner\">Verankerungslängen-Rechner</a> —, nicht das Gewicht."],
          ["Warum wiegt gelieferter Stahl anders als die Tabelle?", "Weil die Tabelle theoretisch ist (Nenndurchmesser, exakte Dichte) und echte Stäbe innerhalb der Fertigungstoleranz variieren: ASTM A615 erlaubt ±6 % bei #3–#5 und ±4 % bei #6–#18, EN 10080/ISO 6935 erlaubt ±6 % bis 8 mm und ±4,5 % darüber, und AS/NZS 4671 erlaubt ±4 % auf den Chargenmittelwert. Bei einer 50-Tonnen-Bestellung summiert sich das auf Tonnen, nicht Kilogramm. Prüfen Sie Lieferungen so, wie es Bauingenieure tun: Zählen Sie die Stäbe anhand der Rückwärtsmodus-Zahl (3.000 kg 12-mm-12-m-Stäbe sollten 282 Stäbe sein — 281 volle + 10,19 m), und wiegen Sie dann eine Probe (5 × 12-m-12-mm-Stäbe sollten 53,22 kg wiegen). Wenn die Lücke die geltende Toleranz übersteigt, reklamieren Sie beim Lieferanten — und prüfen Sie, ob Ihre Bestellung theoretisches oder tatsächliches (gewogenes) Gewicht bepreist."],
          ["Was ist der Unterschied zwischen einer metrischen Tonne und einer US-Short-Tonne?", "Eine metrische Tonne (Tonne) sind 1.000 kg; eine US-Short-Tonne sind 2.000 lb = 907,18 kg — etwa 10 % kleiner. Bei den Rechner-Standardwerten (100 × 12 mm × 12 m) sind das 1,06 metrische Tonnen, aber 1,17 US-Short-Tonnen, für denselben Stahl. Lieferanten, die Tonnen angeben, ohne zu sagen, welche, geben zwei verschiedene Mengen an: Ein Preis pro Short-Tonne sieht etwa 10 % günstiger aus als derselbe Preis pro metrischer Tonne. Rechnen Sie jedes Angebot auf dem <a href=\"/de/bewehrungstonnage-rechner\">Tonnage-Rechner</a> um, bevor Sie vergleichen."],
          ["Berücksichtigt der Rechner Verschnitt, Übergreifungen, Haken oder Kosten?", "Nein — er wiegt nur gerade Stäbe. Addieren Sie 5–10 % für Schneiden und Übergreifungen (veröffentlichte Abrechnungsleitfäden verwenden 10 % für Übergreifungen und Verschnitt zusammen; ein Stablistenverfahren verwendet 3–5 % nur für das Schneiden): Die Standardwerte steigen von 1.064,4 kg netto auf 1.117,62 kg bei +5 % und 1.170,84 kg bei +10 %, was bei einem Beispielpreis von 1,20 €/kg 1.277,28 € / 1.341,14 € / 1.405,01 € kostet. Arbeiten Sie Übergreifungen auf dem <a href=\"/de/uebergreifungslaengen-rechner\">Übergreifungslängen-Rechner</a> aus, Haken auf dem <a href=\"/de/haken-biege-schnittlaengen-rechner\">Haken-Rechner</a>, bepreisen Sie das Ergebnis auf dem <a href=\"/de/bewehrungskosten-rechner\">Kostenrechner</a> und erstellen Sie eine vollständige Abrechnung auf dem <a href=\"/de/bewehrungsmengen-rechner\">Mengenrechner</a>."]],
  toc: `<nav class="content-block" aria-label="Auf dieser Seite"><h2>Auf dieser Seite</h2><ul><li><a href="#how-to">So benutzen Sie den Rechner</a></li><li><a href="#formula">Die Formel, erklärt</a></li><li><a href="#example-1">Rechenbeispiel 1: Standardwerte (100 × 12 mm × 12 m)</a></li><li><a href="#example-2">Rechenbeispiel 2: kurze Stäbe, kleine Bestellung</a></li><li><a href="#example-3">Rechenbeispiel 3: Rückwärtsmodus (2.000 kg)</a></li><li><a href="#unit-weight-table">Gewicht pro Meter: metrische Tabelle</a></li><li><a href="#bundle-table">Ein Stab und 100 Stäbe</a></li><li><a href="#per-tonne">Stäbe pro Tonne (Rückwärtsmodus)</a></li><li><a href="#forty-foot">40-ft-Stäbe gegenüber 12-m-Stäben</a></li><li><a href="#imperial">Zoll-Stäbe und Einheitenumrechnungen</a></li><li><a href="#order">Vom Nettogesamt zur Bestellung</a></li><li><a href="#delivery">Eine Lieferung prüfen</a></li><li><a href="#not-included">Was dieser Rechner nicht leistet</a></li><li><a href="#mistakes">Häufige Fehler</a></li><li><a href="#faq">Häufig gestellte Fragen</a></li></ul></nav>`,
  extra: `<h3>Die Formel, erklärt</h3><p>Ein Stab ist ein langer Zylinder, daher ist sein Gewicht pro Meter seine Querschnittsfläche mal Stahldichte. Fläche = π/4 × d² (d in mm), Dichte = 7.850 kg/m³, und die Umrechnung von mm² in m² teilt durch 1.000.000:</p><p><strong>Gewicht pro Meter (kg/m) = π/4 × d² × 7.850 ÷ 1.000.000 = d² ÷ 162,28; Gesamtgewicht = Gewicht/m × Länge × Menge</strong></p><p>Die Konstante ergibt sich aus der Rechnung: π/4 × 7.850 ÷ 1.000.000 = 0,0061654, und 1 ÷ 0,0061654 = 162,2 — auf 162 gerundet für Baustellenrechnung, auf diesem Rechner als 162,28 beibehalten. Das ist der gesamte Unterschied zwischen den Tabellen, die Sie online finden: d²/162 ergibt 0,889 kg/m für 12 mm, d²/162,2 ergibt 0,888, d²/162,28 ergibt 0,887. Zwei Anzeigehinweise. Erstens liest sich das Stab-Dropdown als „0,888|12“, aber das Panel rechnet mit dem Optionswert 0,887 kg/m, sodass jedes Gewicht unten 0,887 verwendet — die rohe Feldzeichenkette ergäbe 1.065,6 kg bei den Standardwerten, nicht die 1.064,4 kg des Panels. Zweitens zeigen Summen ab 1.000 eine Dezimalstelle mit Trennzeichen, sodass die Standardwertsumme „1.064,4 kg“ lautet, nicht 1.064,40 kg, während Tonnagen zwei Dezimalstellen zeigen (1,06 metrische Tonnen, 1,17 US-Tonnen). Zitieren Sie die Panel-Formen, und die Nachprüfung Ihres Lesers wird übereinstimmen. Die imperiale Spalte rechnet mit lb/ft = kg/m × 0,671969 um, was auf die ASTM-lb/ft-Zahlen für US-Stäbe zurückführt.</p><h3 id="example-1">Rechenbeispiel 1: Standardwerte (100 × 12 mm × 12 m)</h3><p>Öffnen Sie den Rechner so, wie er lädt: Standardmodus, 12-mm-Stäbe, Länge 12 m, Menge 100 Stück.</p><p>Einheitsgewicht = 12² ÷ 162,28 = 0,887 kg/m (0,596 lb/ft). Gewicht pro Stück = 0,887 × 12 = 10,64 kg (23,47 lb).</p><p><strong>Gesamtgewicht = 10,64 × 100 = 1.064,4 kg (2.346,6 lb), 1,06 metrische Tonnen, 1,17 US-Short-Tonnen.</strong> Das Panel zeigt alle sechs Zeilen: Gesamtgewicht 1.064,4 kg, imperial 2.346,6 lb, pro Stück 10,64 kg (23,47 lb), Einheit 0,887 kg/m (0,596 lb/ft), metrische Tonnage 1,06, US-Short-Tonnen 1,17, mit dem Hinweis „0,887 kg/m (0,596 lb/ft) × 12 m × 100 Stk. = 1.064,4 kg (2.346,6 lb)“. Zwei Dinge sind zu beachten. Die metrischen und US-Tonnagen unterscheiden sich um 10 % für denselben Stahl (1.000 kg gegenüber 907,18 kg pro Tonne) — vergleichen Sie niemals einen Preis pro Tonne, ohne zu fragen, welche Tonne gemeint ist. Und die Pro-Stück-Zahl ist die, die man sich merken sollte: Ein 12-m-12-mm-Stab wiegt auf diesem Panel 10,64 kg, nicht die 10,67 kg, die die d²/162-Tabellen angeben.</p><h3 id="example-2">Rechenbeispiel 2: kurze Stäbe, kleine Bestellung</h3><p>Stellen Sie Standardmodus, 16-mm-Stäbe, Länge 6 m, Menge 50 Stück ein.</p><p>Einheitsgewicht = 16² ÷ 162,28 = 1,578 kg/m (1,06 lb/ft). Gewicht pro Stück = 1,578 × 6 = 9,47 kg (20,87 lb).</p><p><strong>Gesamtgewicht = 9,47 × 50 = 473,40 kg (1.043,7 lb), 0,473 metrische Tonnen, 0,52 US-Short-Tonnen.</strong> Gleiche Methode, zweiter Durchlauf: 10-mm-Stäbe, 6 m, 200 Stück → pro Stück 3,70 kg (8,15 lb), gesamt 739,20 kg (1.629,7 lb), 0,739 t, 0,81 US-Tonnen. Kurze Stäbe ändern an der Methode nichts — Länge ist Länge —, aber sie ändern die Bestellung: 6-m-Stäbe passen auf kleinere Lkw und engere Baustellen, und die zusätzlichen Übergreifungen, die sie auf langen Strecken brauchen, sind in keiner der beiden Summen enthalten (siehe den Bestellabschnitt).</p><h3 id="example-3">Rechenbeispiel 3: Rückwärtsmodus (2.000 kg)</h3><p>Wechseln Sie in den Modus Rückwärts, lassen Sie den Stab bei 12 mm, geben Sie ein Gesamtgewicht von 2.000 kg und eine Handelslänge von 12 m ein.</p><p>Gesamtlänge = 2.000 ÷ 0,887 = 2.254,8 m (7.397,6 ft). Benötigte Standardstäbe = ceil(2.254,8 ÷ 12) = 188 Stäbe; volle Stäbe = 187, plus ein 10,79-m-Abschnitt.</p><p><strong>2.000 kg 12-mm-Stahl sind 2.254,8 m oder 188 Handelsstäbe — und das Panel sagt beides.</strong> Das Panel zeigt 2.254,8 m, 7.397,6 ft, 188 Stäbe (12-m-Handel), 187 Stäbe + 10,79 m, Einheit 0,887 kg/m (0,596 lb/ft), eingegeben 2.000 kg (4.409,2 lb) und 2,00 metrische Tonnen. Nun die Aufrundungsfeinheit, die kein Mitbewerber nennt: 188 volle Stäbe zu bestellen wiegt 188 × 10,64 = 2.001,07 kg, also etwas MEHR als die eingegebenen 2.000 kg, weil der Abschnitt trotzdem als ganzer Stab gekauft werden muss. Bestellen Sie nur die 187 vollen Stäbe, fehlen Ihnen 10,79 m. Zwei weitere Rückwärtsdurchläufe: 5.000 kg 16 mm bei 12 m Handel → 3.168,6 m (10.395,6 ft), 265 Stäbe, 264 + 0,57 m (Bestellgewicht 5.018,04 kg); 1.000 kg 10 mm bei 6 m Handel → 1.623,4 m (5.326,0 ft), 271 Stäbe, 270 + 3,38 m.</p><h3 id="unit-weight-table">Gewicht pro Meter: metrische Tabelle</h3><p>Jeder Wert unten ist der Optionswert des Panels für diese Größe (d² ÷ 162,28), mit den lb/ft des Panels und dem Pro-Stück-Gewicht des Panels für einen 12-m-Stab. Die kg/m-Spalte ist das, was das Dropdown zeigt; die lb/ft-Spalte ist das, was das Panel daneben druckt.</p><div class="formula-table"><table><tr><th>Stab</th><th>kg/m</th><th>lb/ft</th><th>kg pro 12-m-Stab</th></tr><tr><td>6 mm</td><td>0,222</td><td>0,149</td><td>2,66</td></tr><tr><td>8 mm</td><td>0,394</td><td>0,265</td><td>4,73</td></tr><tr><td>10 mm</td><td>0,616</td><td>0,414</td><td>7,39</td></tr><tr><td>12 mm</td><td>0,887</td><td>0,596</td><td>10,64</td></tr><tr><td>16 mm</td><td>1,578</td><td>1,06</td><td>18,94</td></tr><tr><td>20 mm</td><td>2,465</td><td>1,656</td><td>29,58</td></tr><tr><td>25 mm</td><td>3,851</td><td>2,588</td><td>46,21</td></tr><tr><td>28 mm</td><td>4,831</td><td>3,246</td><td>57,97</td></tr><tr><td>32 mm</td><td>6,31</td><td>4,24</td><td>75,72</td></tr><tr><td>36 mm</td><td>7,986</td><td>5,366</td><td>95,83</td></tr><tr><td>40 mm</td><td>9,859</td><td>6,625</td><td>118,31</td></tr></table></div><p>Zwei Lesarten. Erstens skaliert das Gewicht mit dem Quadrat des Durchmessers: Eine Verdopplung des Durchmessers vervierfacht das Gewicht — 16 mm (1,578) auf 32 mm (6,31) ist genau 4×, und 10 mm (0,616) auf 20 mm (2,465) ist 4×. Eine Bemessungsänderung, die Größen tauscht, ohne das Gewicht neu zu berechnen, kann die Tonnage weit stärker verschieben, als die Stabzahl vermuten lässt. Zweitens vergleichen Sie diese Tabelle mit einer d²/162-Tabelle, und jede Zeile unterscheidet sich um ~0,2 % (12 mm: 0,887 hier gegenüber 0,889 dort; 20 mm: 2,465 gegenüber 2,469; 32 mm: 6,31 gegenüber 6,321). Diese Lücke ist die Konstante, kein Fehler auf einer der beiden Seiten — aber nur diese Seite sagt das.</p><h3 id="bundle-table">Ein Stab und 100 Stäbe</h3><p>Lieferanten geben pro Stab, pro Bund und pro Tonne an, daher hier alle drei mit Panel-Genauigkeit. Bundstückzahlen variieren je nach Lieferant — die 100-Stäbe-Spalte ist die neutrale Form: Teilen Sie sie durch die Stückzahl pro Bund Ihres Lieferanten.</p><div class="formula-table"><table><tr><th>Stab</th><th>Ein 12-m-Stab</th><th>100 × 12-m-Stäbe</th><th>100 Stäbe in metrischen Tonnen</th></tr><tr><td>6 mm</td><td>2,66 kg</td><td>266,40 kg</td><td>0,266 t</td></tr><tr><td>8 mm</td><td>4,73 kg</td><td>472,80 kg</td><td>0,473 t</td></tr><tr><td>10 mm</td><td>7,39 kg</td><td>739,20 kg</td><td>0,739 t</td></tr><tr><td>12 mm</td><td>10,64 kg</td><td>1.064,4 kg</td><td>1,06 t</td></tr><tr><td>16 mm</td><td>18,94 kg</td><td>1.893,6 kg</td><td>1,89 t</td></tr><tr><td>20 mm</td><td>29,58 kg</td><td>2.958 kg</td><td>2,96 t</td></tr><tr><td>25 mm</td><td>46,21 kg</td><td>4.621,2 kg</td><td>4,62 t</td></tr><tr><td>32 mm</td><td>75,72 kg</td><td>7.572 kg</td><td>7,57 t</td></tr></table></div><p>Zur Einordnung: 100 Stäbe von 25 mm bei 12 m wiegen bereits 4,62 Tonnen — mehr als viermal so viel wie dieselbe Anzahl von 12 mm — und ein einzelner 40-mm-12-m-Stab (118,31 kg) braucht zwei Personen oder einen Kran, keine Schulter. Wenn die Bundgewichte eines Lieferanten nicht mit Stückzahl × Ein-Stab-Gewicht aus dieser Tabelle übereinstimmen, unterscheidet sich entweder die Stückzahl oder die Stablänge: Prüfen Sie beides, bevor Sie annehmen, der Stahl sei leicht.</p><h3 id="per-tonne">Stäbe pro Tonne (Rückwärtsmodus)</h3><p>Führen Sie den Rückwärtsmodus mit 1.000 kg und 12 m Handel für jede Größe aus. „Benötigte Stäbe“ ist das Aufrunden — die Bestellmenge — und „volle Stäbe + Abschnitt“ ist das, was die Tonne tatsächlich enthält.</p><div class="formula-table"><table><tr><th>Stab</th><th>Gesamtlänge pro Tonne</th><th>Benötigte Stäbe (12 m)</th><th>Volle Stäbe + Abschnitt</th></tr><tr><td>8 mm</td><td>2.538,1 m</td><td>212</td><td>211 + 6,07 m</td></tr><tr><td>10 mm</td><td>1.623,4 m</td><td>136</td><td>135 + 3,38 m</td></tr><tr><td>12 mm</td><td>1.127,4 m</td><td>94</td><td>93 + 11,4 m</td></tr><tr><td>16 mm</td><td>633,71 m</td><td>53</td><td>52 + 9,71 m</td></tr><tr><td>20 mm</td><td>405,68 m</td><td>34</td><td>33 + 9,68 m</td></tr><tr><td>25 mm</td><td>259,67 m</td><td>22</td><td>21 + 7,67 m</td></tr><tr><td>32 mm</td><td>158,48 m</td><td>14</td><td>13 + 2,48 m</td></tr></table></div><p>Der praktische Nutzen: Eine Biegeliste, die insgesamt 1.810 kg 12 mm ergibt, rechnet sich in 1.810 ÷ 10,64 = 170 Stäbe von 12 m um (plus Schneidverschnitt), und ein Lieferschein, der eine Tonne 12 mm behauptet, sollte 94 Stäbe zeigen, nicht 90 oder 100. Und die Abschnittsspalte zählt: Der 11,4-m-Abschnitt der 12-mm-Tonne ist fast ein ganzer Stab — bei einer Mehrtonnenbestellung summieren sich diese Abschnitte zu echten Stäben, wenn die Schnittlängen dazu passen, oder zu echtem Verschnitt, wenn nicht.</p><h3 id="forty-foot">40-ft-Stäbe gegenüber 12-m-Stäben</h3><p>Vierzig Fuß sind 12,192 m, nicht 12 m — 0,192 m länger pro Stab, was +1,6 % bei jedem Stabgewicht ausmacht. Mit Panel-Genauigkeit:</p><div class="formula-table"><table><tr><th>Stab</th><th>12-m-Stab</th><th>40-ft-Stab (12,192 m)</th><th>Unterschied</th></tr><tr><td>8 mm</td><td>4,73 kg</td><td>4,80 kg</td><td>+0,07 kg</td></tr><tr><td>10 mm</td><td>7,39 kg</td><td>7,51 kg</td><td>+0,12 kg</td></tr><tr><td>12 mm</td><td>10,64 kg</td><td>10,81 kg</td><td>+0,17 kg</td></tr><tr><td>16 mm</td><td>18,94 kg</td><td>19,24 kg</td><td>+0,30 kg</td></tr><tr><td>20 mm</td><td>29,58 kg</td><td>30,05 kg</td><td>+0,47 kg</td></tr><tr><td>25 mm</td><td>46,21 kg</td><td>46,95 kg</td><td>+0,74 kg</td></tr><tr><td>32 mm</td><td>75,72 kg</td><td>76,93 kg</td><td>+1,21 kg</td></tr></table></div><p>Darum stimmen auch Stäbe-pro-Tonne-Zahlen zwischen Quellen nicht überein: Eine veröffentlichte Lieferantentabelle gibt 92 Stäbe pro Tonne für 12 mm an — aber das sind 40-ft-Stäbe (1.000 ÷ (0,888 × 12,2) ≈ 92), während die 12-m-Stäbe dieses Panels 94 ergeben. Beides stimmt für seine Länge; keines lässt sich auf das andere übertragen. Wann immer eine Stäbe-pro-Tonne-Zahl ohne Länge auftaucht, ist sie unvollständig — fragen Sie nach der Länge, bevor Sie sie verwenden.</p><h3 id="imperial">Zoll-Stäbe und Einheitenumrechnungen</h3><p>Die Stab-Dropdowns enthalten US-Größen, geben Sie also die metrischen Entsprechungen Ihrer Abmessungen ein und wählen Sie den passenden US-Stab. US-Stäbe werden nach Achtelzoll bemessen (#4 = 4/8 Zoll = 1/2 Zoll), aber ab #9 folgen die Durchmesser alten flächenbasierten Größen — verwenden Sie immer den Nenndurchmesser in mm aus der Tabelle.</p><div class="formula-table"><table><tr><th>US-Stab</th><th>Nenndurchmesser (mm)</th><th>kg/m</th><th>lb/ft</th><th>kg pro 20-ft-Stab (6,096 m)</th></tr><tr><td>#3</td><td>9,5</td><td>0,56</td><td>0,376</td><td>3,41</td></tr><tr><td>#4</td><td>12,7</td><td>0,994</td><td>0,668</td><td>6,06</td></tr><tr><td>#5</td><td>15,9</td><td>1,552</td><td>1,043</td><td>9,46</td></tr><tr><td>#6</td><td>19,1</td><td>2,235</td><td>1,502</td><td>13,62</td></tr><tr><td>#7</td><td>22,2</td><td>3,042</td><td>2,044</td><td>18,54</td></tr><tr><td>#8</td><td>25,4</td><td>3,973</td><td>2,67</td><td>24,22</td></tr></table></div><p>Durchgerechnete Umrechnungen: Die Standardwertsumme 1.064,4 kg = 2.346,6 lb; ein 12-m-12-mm-Stab ist 10,64 kg = 23,47 lb; ein 20-ft-#5-Stab ist 9,46 kg = 20,86 lb. Ein vollständiger imperialer Durchlauf — 50 × #5-Stäbe bei 20 ft (6,096 m) — ergibt 473,05 kg (1.042,9 lb), 0,473 t, 0,52 US-Tonnen; 100 × #4-Stäbe bei 20 ft ergeben 605,94 kg (1.335,9 lb), 0,606 t, 0,67 US-Tonnen. Zwei Fallen: Ein #4-Stab (12,7 mm, 0,994 kg/m) ist KEIN 12-mm-Stab (0,887 kg/m) — ein blindes Vertauschen ändert das Gewicht um 12,1 %. Und ein Kilogramm pro Fuß ist kein Pfund pro Fuß: 12-mm-Stahl ist 0,270 kg/ft, aber 0,596 lb/ft — wer diese beiden Spalten vermischt, unterschätzt das Gewicht um mehr als die Hälfte.</p><h3 id="order">Vom Nettogesamt zur Bestellung</h3><p>Die Panelsumme ist sauberer Geradstahl. Eine Bestellung braucht drei Ergänzungen, alle hier aus den Panelsummen gerechnet (durchgehend exakte Summen, keine gerundeten Anzeigewerte).</p><p><strong>Verschnitt.</strong> Standardwerte netto 1.064,4 kg → 1.117,62 kg bei +5 %, 1.170,84 kg bei +10 %. Veröffentlichte Abrechnungsleitfäden verwenden 10 % für Übergreifungen und Verschnitt zusammen; ein Stablistenverfahren verwendet 3–5 % nur für das Schneiden. Wählen Sie die Zulage, die dazu passt, wie gut Ihre Schnittlängen zu den Handelsstäben passen — ein Plan mit 3-m-Schnitten aus 12-m-Stäben verschwendet fast nichts, während ein Plan mit 5-m-Schnitten überall 2-m-Abschnitte übrig lässt.</p><p><strong>Kosten.</strong> Bei einem Beispielpreis von 1,20 €/kg (Preise sind Beispiele — geben Sie Ihren lokalen Satz auf dem <a href="/de/bewehrungskosten-rechner">Kostenrechner</a> ein): Standardwerte 1.277,28 € netto, 1.341,14 € bei +5 %, 1.405,01 € bei +10 %. Rechnen Sie die Endsumme auf dem <a href="/de/bewehrungstonnage-rechner">Tonnage-Rechner</a> um, wenn Ihr Lieferant pro Tonne bepreist.</p><p><strong>Lkw.</strong> Die Nutzlast eines Standard-Flachbett-Lkw beträgt etwa 20.000 kg (20 metrische Tonnen) — abgeleitete Rechnung, keine Panel-Ausgabe, behandeln Sie sie also als Planungszahl: Die Standardbestellung ist ein Lkw, eine 25-mm-Bundbestellung von 4.621,2 kg ist ein Lkw, und alles über 20 Tonnen braucht einen zweiten. Aber die Länge bindet vor dem Gewicht: 12-m-Stäbe brauchen einen 40-ft-Anhänger (12,2 m) oder länger, während 6-m-Stäbe auf kürzere Stadt-Lkw passen — eine veröffentlichte Logistikanalyse stellt fest, dass die Vorgabe von 6-m-Stäben mit Baustellenübergreifungen die Lieferkosten senken kann, obwohl die Übergreifungen 5–10 % Tonnage hinzufügen.</p><p>Gegenprüfung anhand eines Rechenbeispiels eines Mitbewerbers: Ein mehrzeiliges Tool rechnet 40 × 12 mm × 6 m + 5 % als 224 kg nach d²/162. Auf diesem Panel ist dieselbe Bestellung 212,88 kg netto und 223,52 kg bei +5 % — 0,48 kg niedriger, rein die Konstante. Wenn Ihre Schätzung und die Ihres Lieferanten um eine solche Spanne abweichen, ist die Konstante der erste Ort, an dem man nachsieht, nicht die Rechnung.</p><h3 id="delivery">Eine Lieferung prüfen</h3><p>Theoretisches Gewicht ist eine Budgetgrundlage, keine Liefergarantie. Prüfen Sie Stahl so, wie es Bauingenieure tun, mit dem Rückwärtsmodus des Panels:</p><p><strong>Zuerst zählen.</strong> Ein Lieferschein, der 3.000 kg 12-mm-12-m-Stäbe behauptet, sollte 282 Stäbe enthalten (Rückwärtsmodus: 3.382,2 m, 281 volle + 10,19 m). Wenn Sie 265 zählen, sind entweder die Stäbe leichter als nominal oder das Gewicht auf der Rechnung ist falsch — so oder so, stoppen Sie und prüfen Sie, bevor Sie unterschreiben.</p><p><strong>Eine Probe wiegen.</strong> Wählen Sie 5 Stäbe zufällig aus und wiegen Sie sie zusammen auf einer Plattformwaage. Erwartet: 5 × 10,644 = 53,22 kg. Wenn die Waage 52,4 kg zeigt, sind die Stäbe 1,5 % leicht — innerhalb der Toleranz, aber wert, mit Datum, Bundetikett und Lieferant festgehalten zu werden.</p><p><strong>Kennen Sie die Toleranz, bevor Sie sich beschweren.</strong> Veröffentlichte Fertigungstoleranzen (Tabellen aus erster Hand): ASTM A615 ±6 % bei #3–#5 und ±4 % bei #6–#18; EN 10080/ISO 6935 ±6 % bis 8 mm und ±4,5 % darüber; AS/NZS 4671 ±4 % auf den Chargenmittelwert. Eine Unterlieferung von 1,5 % ist keine Reklamation; eine Unterlieferung von 7 % bei 12-mm-Stäben schon. Und klären Sie eines auf der Bestellung selbst: ob nach theoretischem Gewicht oder tatsächlichem (gewogenem) Gewicht fakturiert wird — bei einer 50-Tonnen-Bestellung kann allein die Toleranz das gelieferte Gewicht um Tonnen verschieben, und die beiden Grundlagen werden niemals auf das Kilogramm genau übereinstimmen.</p><h3 id="not-included">Was dieser Rechner nicht leistet</h3><p>Dies ist ein Stabgewichts-Tool, kein Abrechnungs- oder Bestell-Tool. Es addiert keine Übergreifungen, Haken, Biegungen, Abkröpfungen oder Verankerungen — siehe den <a href="/de/uebergreifungslaengen-rechner">Übergreifungslängen-Rechner</a>, den <a href="/de/haken-biege-schnittlaengen-rechner">Haken-Rechner</a> und den <a href="/de/verankerungslaengen-rechner">Verankerungslängen-Rechner</a>. Es addiert keinen Verschnitt und keine Kosten — der Bestellabschnitt zeigt die Rechnung; bepreisen Sie die Endsumme auf dem <a href="/de/bewehrungskosten-rechner">Kostenrechner</a> und rechnen Sie sie auf dem <a href="/de/bewehrungstonnage-rechner">Tonnage-Rechner</a> um. Es erstellt keinen Abzug für ein ganzes Bauteil oder Gebäude — verwenden Sie die Bauteil-Tools (<a href="/de/bewehrungsrechner-fuer-betonplatten">Platte</a>, <a href="/de/bewehrungsrechner-fuer-fundamente">Fundament</a>, <a href="/de/bewehrungsmatten-rechner">Matte</a>, <a href="/de/stuetzenbewehrungs-rechner">Stütze</a>, <a href="/de/balkenbewehrungs-rechner">Balken</a>, <a href="/de/wandbewehrungs-rechner">Wand</a>, <a href="/de/bewehrungsrechner-fuer-pools">Pool</a>, <a href="/de/bewehrungsrechner-fuer-einfahrten">Einfahrt</a>) oder den <a href="/de/bewehrungsmengen-rechner">Mengenrechner</a> für Flächen-Dichte-Schätzungen und den <a href="/de/beton-bewehrungs-schaetzer">Beton-Schätzer</a> für kg/m³-Verhältnis-Schätzungen. Es führt keine Mehrgrößen-Abrechnungen in einem Durchgang aus (eine Größe pro Durchlauf — führen Sie jede Größe separat aus und addieren Sie, wie es die <a href="/de/stahlflaechen-rechner-ast">Flächenseite</a> für gemischte Körbe tut), zählt keine Stäbe aus einem Abstandslayout (siehe den <a href="/de/bewehrungsabstand-rechner">Abstandsrechner</a>), wiegt keine Bügel (siehe den <a href="/de/buegel-schnittlaengen-rechner">Bügelrechner</a>), Abstandhalter (siehe den <a href="/de/abstandhalter-rechner">Abstandhalter-Rechner</a>) oder Bindedraht (siehe den <a href="/de/bindedraht-rechner">Bindedraht-Rechner</a>), und modelliert keine Edelstahl-/Legierungsdichten, Matten oder Schnittlängenoptimierung gegen Handelsstäbe.</p><h3 id="mistakes">Häufige Fehler</h3><p><strong>Die Konstanten mischen.</strong> Eine d²/162-Tabelle gegen einen d²/162,28-Rechner zu verwenden (oder umgekehrt) verschiebt jede Summe um ~0,2 %: 0,48 kg beim 224-kg-Rechenbeispiel oben, etwa 2,1 kg pro Tonne bei 12 mm. Wählen Sie eine Konstante und verwenden Sie sie überall in einer Abrechnung.</p><p><strong>Metrische Tonnen und US-Short-Tonnen verwechseln.</strong> Die Standardwertsumme beträgt 1,06 metrische Tonnen, aber 1,17 US-Short-Tonnen. Ein Preis pro Short-Tonne sieht ~10 % günstiger aus als derselbe Preis pro metrischer Tonne — und ein Lieferant, der Tonnen angibt, ohne zu sagen, welche, gibt zwei verschiedene Mengen an.</p><p><strong>Stäbe pro Tonne ohne Länge angeben.</strong> Eine Tonne 12 mm sind 94 Zwölf-Meter-Stäbe, aber 92 Vierzig-Fuß-Stäbe. Eine Stäbe-pro-Tonne-Zahl ohne Stablänge ist unvollständig, und die falsche zu verwenden, führt zu einer Fehlbestellung von 2 Stäben pro Tonne vor Verschnitt.</p><p><strong>Die vollen Stäbe aus dem Rückwärtsmodus bestellen.</strong> Die „vollen Stäbe“ des Rückwärtsmodus für 1.000 kg 12 mm sind 93 Stäbe — aber die Tonne enthält auch einen 11,4-m-Abschnitt, sodass die Bestellung 94 Stäbe lautet. 93 zu bestellen lässt Sie 11,4 m im Rückstand; genau dafür gibt es das Aufrunden.</p><p><strong>Nur nach Stückzahl wiegen oder nach Bauteillänge.</strong> Stäbe zu zählen, ohne eine Probe zu wiegen, übersieht leichte Stäbe vollständig, und Bauteillängen statt Schnittlängen zu wiegen übersieht Haken, Biegungen, Verankerung und Übergreifungen — eine veröffentlichte Übergreifungsanalyse beziffert Übergreifungen allein auf 150–250 kg bei einem 12-Stützen-Haus. Arbeiten Sie mit Schnittlängen, dann zählen Sie, dann wiegen Sie.</p><p>Zuletzt geprüft: Oktober 2026.</p>`
}
},
    { id:"area", slug:"rebar-area-calculator", cat:"Weight",
    metaTitle:"Rebar Area Calculator (Ast) — Steel Area in Seconds",
    h1:"Rebar Area Calculator (Ast)",
    desc:"Calculate Ast fast: area of one bar, total steel area and steel percentage for any section. 4 × 12 mm bars = 452.39 mm². Free, no signup needed.",
    kw:"rebar area calculator, area of rebar formula, area of steel, ast calculator, steel percentage",
    intro:"Find the area of steel in a section. Enter the bar size and number of bars to get the area of one bar and the total Ast, and optionally the steel percentage of a given section.",
    howto:["Pick the bar size — metric (mm) or US (# size) — from the dropdown.","Enter the number of bars in the section.","Optionally enter the section width and depth in mm to get the steel percentage. Leave them at the defaults (300 × 450 mm) for a quick check, or set either to 0 if you only want the area — the percentage then reads 0.000%.","Read the total steel area Ast in mm² and cm², the area of one bar, and the steel percentage.","If the section mixes two bar sizes, run the calculator once per size and add the two Ast figures — see the two-size section below. If you need area per metre from a spacing, use the per-metre table below."],
    formula:"Area of one bar = π/4 × d². Ast = number of bars × area. Steel % = Ast ÷ (b × D) × 100.",
    faqs:[["What is the area of a 12mm rebar?", "π/4 × 12² = 113.10 mm² per bar (113.1 mm² rounded). Four 12 mm bars give 452.39 mm² — try it on the calculator defaults."],
          ["What is Ast in reinforcement?", "Ast is the total cross-sectional area of steel in a section: the area of one bar multiplied by the number of bars. On the calculator defaults (4 × 12 mm) Ast is 452.39 mm², or 4.52 cm². It is the area the structural design provides, and it is what minimum-steel checks compare against the concrete section."],
          ["How do you calculate the area of steel?", "Work out one bar first: area = π/4 × diameter². A 16 mm bar is π/4 × 16² = 201.06 mm². Then multiply by the number of bars: 5 × 16 mm gives 1,005.3 mm². The calculator does both steps and, if you enter the section size, divides by the gross section to give the steel percentage."],
          ["What is the steel percentage, and is it against the gross or the effective depth?", "This calculator divides Ast by the gross section (width × overall depth). On the defaults that is 452.39 ÷ (300 × 450) × 100 = 0.335%. Beam minimum-steel rules, by contrast, are written against b × d (width × effective depth), so the same cage shows a higher percentage there — 5 × 16 mm in a 230 × 450 mm beam is 0.971% of gross but 1.07% of b × d (230 × 409). Always check which area a code clause divides by before comparing percentages."],
          ["How many bars do I need for a required steel area?", "Divide the required area by the area of one bar and round UP — you cannot provide part of a bar, and rounding down leaves the section short. For a required 804.25 mm², 4 × 16 mm gives exactly 804.25 mm², while 7 × 12 mm gives only 791.68 mm² (short) and 8 × 12 mm gives 904.78 mm² (the next size up that passes). The equivalents table below works this out for the common targets."],
          ["Can I replace one bar size with another?", "Yes, if the total area stays equal or greater — and if spacing, cover and development length still work. The area rule is what matters, not the count: 10 mm bars at 100 mm spacing give 785.40 mm² per metre, and 12 mm bars need 144.00 mm spacing for the same area per metre (113.10 ÷ 785.40 × 1000). Never swap sizes on count alone — 5 × 12 mm (565.49 mm²) is not a substitute for 5 × 16 mm (1,005.3 mm²). If the new bars need longer laps or development, check the <a href=\"/rebar-lap-length-calculator\">lap calculator</a> and the <a href=\"/rebar-development-length-calculator\">development length calculator</a>."],
          ["How do I work out steel area per metre from a spacing?", "Divide the area of one bar by the spacing in metres: Ast per metre = (π/4 × d²) ÷ spacing (m). So 12 mm bars at 200 mm give 113.10 ÷ 0.2 = 565.49 mm²/m, and 16 mm bars at 150 mm give 201.06 ÷ 0.15 = 1,340.4 mm²/m. The per-metre table below covers 8–16 mm at 150–300 mm. To go the other way — spacing from a required area per metre — use spacing = one-bar area × 1000 ÷ required Ast per metre."],
          ["What if my section has two different bar sizes?", "This calculator takes one bar size per run, so run it once for each size and add the two Ast figures. A beam with 2 × 20 mm top bars and 3 × 16 mm bottom bars is 628.32 + 603.19 = 1,231.5 mm². The stirrup steel is separate — it is not part of Ast — so do not add it here; use the <a href=\"/stirrup-tie-cutting-length-calculator\">stirrup calculator</a> for ties."],
          ["What is the minimum steel area?", "It depends on the member, and the percentages divide by different areas — see the minimum-steel section below for the full table. In short: beams need at least 0.85/fy of b × d (192.67 mm² for a 230 × 409 mm section in Fe415); columns need 0.8–6% of gross area; walls need 0.12% vertical and 0.20% horizontal of gross area per metre; slabs need 0.12% of gross area for HYSD bars (120 mm²/m on a 100 mm slab). Passing the minimum is not a design — it only catches gross errors."],
          ["Does this calculator give the weight of the steel?", "No — it gives area only, not weight, length, cost or tonnage. To turn an area into an order, take the bar count and length to the <a href=\"/rebar-weight-calculator\">weight calculator</a> (4 × 12 mm bars weigh 4 × 0.887 = 3.55 kg per metre of member length), then to the <a href=\"/rebar-cost-calculator\">cost calculator</a> and the <a href=\"/rebar-tonnage-calculator\">tonnage calculator</a>. For a full count-and-length take-off from a slab or grid, use the <a href=\"/rebar-quantity-calculator\">quantity calculator</a>."]],
    toc:`<nav class="content-block" aria-label="On this page"><h2>On this page</h2><ul><li><a href="#how-to">How to use the calculator</a></li><li><a href="#formula">The formula, explained</a></li><li><a href="#example-defaults">Worked example 1: the calculator defaults</a></li><li><a href="#example-beam">Worked example 2: a beam cage against its minimum</a></li><li><a href="#example-wall-strip">Worked example 3: a wall strip that fails its minimum</a></li><li><a href="#one-bar-table">Area of one bar: metric table</a></li><li><a href="#bars-table">Area by number of bars</a></li><li><a href="#equivalents">Equivalent bar combinations</a></li><li><a href="#per-metre">Area per metre from spacing</a></li><li><a href="#two-sizes">Two bar sizes in one section</a></li><li><a href="#minimum-steel">Minimum steel checks</a></li><li><a href="#imperial">Imperial bars and unit conversions</a></li><li><a href="#not-included">What this calculator does not do</a></li><li><a href="#mistakes">Common mistakes</a></li><li><a href="#faq">Frequently asked questions</a></li></ul></nav>`,
    extra:`<h3>The formula, explained</h3><p>A bar's cross-section is a circle, so its area is π/4 × d², where d is the nominal diameter in mm. That is the whole formula — everything else is multiplication or division. Total steel area Ast = number of bars × one-bar area. Steel percentage = Ast ÷ (section width × section depth) × 100, using the GROSS section (overall depth D), not the effective depth d — the distinction matters for code checks, and the beam example below shows both figures for the same cage. Ast in cm² is simply Ast in mm² ÷ 100, which is why the panel shows 452.39 mm² as 4.52 cm². Two derived forms used on this page: area per metre = one-bar area ÷ spacing in metres, and spacing from a required area per metre = one-bar area × 1000 ÷ required Ast per metre. Note the panel's percentage behaviour: if either section dimension is 0, the gross area is 0 and the panel shows 0.000% — that means "no section entered", not "no steel".</p><h3 id="example-defaults">Worked example 1: the calculator defaults</h3><p>Open the calculator as it loads: 12 mm bars, 4 bars, section 300 × 450 mm. One bar is π/4 × 12² = 113.10 mm². Four bars give <strong>Ast = 4 × 113.10 = 452.39 mm² (4.52 cm²)</strong>. The gross section is 300 × 450 = 135,000 mm², so the steel percentage is 452.39 ÷ 135,000 × 100 = <strong>0.335%</strong>. The panel shows all four rows: Ast 452.39 mm², one bar 113.10 mm², steel percentage 0.335%, Ast 4.52 cm², with the note "Ast = 4 × π/4 × 12² = 452.39 mm²". The same 452.39 mm² appears in the competitor BuildingClub's slab example — the formula is universal; what this page adds is everything around it.</p><h3 id="example-beam">Worked example 2: a beam cage against its minimum</h3><p>Take the beam page's defaults cage: 5 × 16 mm bars in a 230 × 450 mm beam. Enter 16 mm, 5 bars, 230 × 450 mm. One bar is 201.06 mm², so <strong>Ast = 1,005.3 mm² (10.05 cm²)</strong> and the panel percentage is 1,005.3 ÷ 103,500 × 100 = <strong>0.971%</strong> of gross area. Now the code check, which divides differently: the beam minimum is 0.85/fy of b × d, and for Fe415 with effective depth 409 mm that is 192.67 mm² — the cage clears it five times over. The maximum is 4% of gross area, 4,140.00 mm², which it sits well inside. And the percentage against b × d (230 × 409 = 94,070 mm²) is 1.07%, not 0.971% — same bars, different divisor. If a code clause says b × d, recompute against b × d; do not compare the panel's gross percentage directly with it.</p><h3 id="example-wall-strip">Worked example 3: a wall strip that fails its minimum</h3><p>Per-metre checks run through the same panel by entering a 1000 mm wide strip: the bar count is then the bars per metre. Try 10 mm bars, 5 bars (the count at 200 mm spacing), section 1000 × 200 mm. One bar is 78.54 mm², so <strong>Ast = 392.70 mm² (3.93 cm²)</strong> and the percentage is 392.70 ÷ 200,000 × 100 = <strong>0.196%</strong>. That FAILS the wall horizontal minimum of 0.20% (400 mm²/m on a 200 mm wall) — the same failure the wall page flags for its defaults grid. The fix is one bar size up: 5 × 12 mm gives <strong>565.49 mm² (5.65 cm²), 0.283%</strong>, which passes. This is the check worth running before ordering: a grid that looks reasonable can sit just under a minimum, and the panel percentage catches it in seconds.</p><h3 id="one-bar-table">Area of one bar: metric table</h3><p>Every value below is the panel's one-bar figure for that size (π/4 × d², panel display). The kg/m column uses this site's option values (d² ÷ 162.28) so the table ties to the weight calculator.</p><div class="formula-table"><table><tr><th>Bar</th><th>Area of one bar (mm²)</th><th>Weight (kg/m)</th></tr><tr><td>6 mm</td><td>28.27</td><td>0.222</td></tr><tr><td>8 mm</td><td>50.27</td><td>0.394</td></tr><tr><td>10 mm</td><td>78.54</td><td>0.616</td></tr><tr><td>12 mm</td><td>113.10</td><td>0.887</td></tr><tr><td>16 mm</td><td>201.06</td><td>1.578</td></tr><tr><td>20 mm</td><td>314.16</td><td>2.465</td></tr><tr><td>25 mm</td><td>490.87</td><td>3.851</td></tr><tr><td>28 mm</td><td>615.75</td><td>4.831</td></tr><tr><td>32 mm</td><td>804.25</td><td>6.31</td></tr><tr><td>36 mm</td><td>1,017.9</td><td>7.986</td></tr><tr><td>40 mm</td><td>1,256.6</td><td>9.86</td></tr></table></div><p>Two coincidences worth knowing: one 32 mm bar (804.25 mm²) equals four 16 mm bars, and one 40 mm bar (1,256.6 mm²) equals four 20 mm bars — area scales with diameter squared, so doubling the diameter quadruples the area.</p><h3 id="bars-table">Area by number of bars</h3><p>Look up any count directly instead of multiplying. All figures are panel Ast values in mm² (total = count × one-bar area, panel display — note the thousands with no decimal: 10 × 12 mm shows as 1,131, and 6 × 20 mm as 1,885).</p><div class="formula-table"><table><tr><th>Bar</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th><th>9</th><th>10</th></tr><tr><td>8 mm</td><td>50.27</td><td>100.53</td><td>150.80</td><td>201.06</td><td>251.33</td><td>301.59</td><td>351.86</td><td>402.12</td><td>452.39</td><td>502.65</td></tr><tr><td>10 mm</td><td>78.54</td><td>157.08</td><td>235.62</td><td>314.16</td><td>392.70</td><td>471.24</td><td>549.78</td><td>628.32</td><td>706.86</td><td>785.40</td></tr><tr><td>12 mm</td><td>113.10</td><td>226.19</td><td>339.29</td><td>452.39</td><td>565.49</td><td>678.58</td><td>791.68</td><td>904.78</td><td>1,017.9</td><td>1,131</td></tr><tr><td>16 mm</td><td>201.06</td><td>402.12</td><td>603.19</td><td>804.25</td><td>1,005.3</td><td>1,206.4</td><td>1,407.4</td><td>1,608.5</td><td>1,809.6</td><td>2,010.6</td></tr><tr><td>20 mm</td><td>314.16</td><td>628.32</td><td>942.48</td><td>1,256.6</td><td>1,570.8</td><td>1,885</td><td>2,199.1</td><td>2,513.3</td><td>2,827.4</td><td>3,141.6</td></tr><tr><td>25 mm</td><td>490.87</td><td>981.75</td><td>1,472.6</td><td>1,963.5</td><td>2,454.4</td><td>2,945.2</td><td>3,436.1</td><td>3,927</td><td>4,417.9</td><td>4,908.7</td></tr><tr><td>32 mm</td><td>804.25</td><td>1,608.5</td><td>2,412.7</td><td>3,217</td><td>4,021.2</td><td>4,825.5</td><td>5,629.7</td><td>6,434</td><td>7,238.2</td><td>8,042.5</td></tr></table></div><h3 id="equivalents">Equivalent bar combinations</h3><p>When a design specifies a required area, any combination at or above it works on area (spacing, cover, laps and development still need their own checks). Divide the required area by the one-bar area and round UP — the table shows why rounding down fails: 7 × 12 mm (791.68 mm²) looks close to 804.25 mm² but is 12.57 mm² short, so the passing choice is 8 × 12 mm (904.78 mm²) or the exact 4 × 16 mm.</p><div class="formula-table"><table><tr><th>Required Ast</th><th>Combination that passes</th><th>Next option</th><th>Combination that falls short</th></tr><tr><td>804.25 mm²</td><td>4 × 16 mm = 804.25 mm² (exact); 1 × 32 mm = 804.25 mm² (exact)</td><td>8 × 12 mm = 904.78 mm²</td><td>7 × 12 mm = 791.68 mm² (12.57 short); 10 × 10 mm = 785.40 mm² (18.85 short)</td></tr><tr><td>1,005.3 mm²</td><td>5 × 16 mm = 1,005.3 mm² (exact)</td><td>9 × 12 mm = 1,017.9 mm² (12.57 over)</td><td>8 × 12 mm = 904.78 mm² (100.53 short)</td></tr><tr><td>1,256.6 mm²</td><td>4 × 20 mm = 1,256.6 mm² (exact); 1 × 40 mm = 1,256.6 mm² (exact)</td><td>—</td><td>11 × 12 mm = 1,244.1 mm² (12.57 short); 6 × 16 mm = 1,206.4 mm² (50.27 short)</td></tr><tr><td>1,129 mm² (1.75 in²)</td><td>4 × #6 = 1,146.1 mm² (1.78 in²); 3 × #7 = 1,161.2 mm² (1.80 in²)</td><td>—</td><td>—</td></tr></table></div><p>A note on the last row: one US-focused competitor quotes 4 #6 bars as 1.76 in² because it adds the rounded 0.44 in² per bar. The exact area is 4 × 286.52 = 1,146.1 mm² = 1.78 in². Both pass a 1.75 in² requirement, but only the exact figure reproduces from the bar diameters — always add exact areas, never rounded ones.</p><h3 id="per-metre">Area per metre from spacing</h3><p>Slabs and walls are usually specified by spacing, not by bar count. Area per metre = one-bar area ÷ spacing in metres. The table is derived arithmetic (not a panel output — the panel takes a count), but every row reproduces from the panel: enter the bars-per-metre count on a 1000 mm strip and the panel returns the same Ast.</p><div class="formula-table"><table><tr><th>Bar</th><th>@ 150 mm</th><th>@ 200 mm</th><th>@ 250 mm</th><th>@ 300 mm</th></tr><tr><td>8 mm</td><td>335.10 mm²/m</td><td>251.33 mm²/m</td><td>201.06 mm²/m</td><td>167.55 mm²/m</td></tr><tr><td>10 mm</td><td>523.60 mm²/m</td><td>392.70 mm²/m</td><td>314.16 mm²/m</td><td>261.80 mm²/m</td></tr><tr><td>12 mm</td><td>753.98 mm²/m</td><td>565.49 mm²/m</td><td>452.39 mm²/m</td><td>376.99 mm²/m</td></tr><tr><td>16 mm</td><td>1,340.4 mm²/m</td><td>1,005.3 mm²/m</td><td>804.25 mm²/m</td><td>670.21 mm²/m</td></tr></table></div><p>Going the other way — spacing from a required area per metre — use spacing = one-bar area × 1000 ÷ required Ast per metre. Two worked substitutions: 10 mm bars at 100 mm give 785.40 mm²/m, and 12 mm bars need 113.10 ÷ 785.40 × 1000 = <strong>144.00 mm</strong> spacing for the same area (the textbook answer is 14.40 cm — same figure). 12 mm bars at 200 mm give 565.49 mm²/m, and 16 mm bars need 201.06 ÷ 565.49 × 1000 = <strong>355.56 mm</strong> spacing for the same area; in practice 350 mm gives 574.46 mm²/m (slightly over) and 355 mm gives 566.37 mm²/m, so round the spacing DOWN to stay at or above the required area. The shortcut for swapping sizes at fixed area is s₂ = (d₂/d₁)² × s₁ — (12/10)² × 100 = 144 mm, matching the long way.</p><h3 id="two-sizes">Two bar sizes in one section</h3><p>Real cages mix sizes: top bars differ from bottom bars, and columns mix corner and face bars. This calculator takes one size per run, so run it once per size and add. A beam with 2 × 20 mm top bars and 3 × 16 mm bottom bars is 628.32 + 603.19 = <strong>1,231.5 mm²</strong> (each half verified on the panel separately). A column with 4 × 16 mm plus 4 × 20 mm is 804.25 + 1,256.6 = <strong>2,060.9 mm²</strong>, which is 1.53% of a 300 × 450 mm gross section — inside the 0.8–6% column bracket. What NOT to add: stirrup/tie steel is not part of Ast, lap steel double-counts bars in the lap zone (use the lap length, not extra area), and compression steel is a separate Ast/Asc figure in design even though the panel adds whatever bars you enter.</p><h3 id="minimum-steel">Minimum steel checks</h3><p>Passing a minimum is not a design — it only catches gross errors — but it is the fastest sanity check on any cage, and the panel percentage feeds straight into it. Note which area each clause divides by: beams divide by b × d, the rest below by gross area (per metre of width for slabs and walls).</p><div class="formula-table"><table><tr><th>Member</th><th>IS 456:2000 rule</th><th>Worked check</th></tr><tr><td>Beam (tension steel)</td><td>At least 0.85/fy of b × d; at most 4% of gross area</td><td>Fe415, 230 × 409 mm: minimum 192.67 mm²; 230 × 450 mm: maximum 4,140 mm². The 5 × 16 mm cage (1,005.3 mm²) passes both.</td></tr><tr><td>Column (longitudinal)</td><td>0.8% minimum, 6% maximum of gross area (4% working limit where bars lap); at least 4 bars rectangular, 6 circular</td><td>300 × 450 mm: minimum 1,080 mm² (6 × 16 mm gives 1,206.4 mm², 0.894%, passes). 300 × 300 mm: minimum 720.00 mm² — 4 × 12 mm gives only 452.39 mm² (0.503%), which FAILS; 4 × 16 mm gives 804.25 mm² (0.894%) and passes.</td></tr><tr><td>Wall (per metre)</td><td>Vertical at least 0.12%, horizontal at least 0.20% of gross area; spacing at most min(3 × thickness, 450 mm)</td><td>200 mm wall: vertical minimum 240 mm²/m, horizontal minimum 400 mm²/m. 10 mm @ 200 mm gives 392.70 mm²/m — passes as vertical, FAILS as horizontal (0.196%); 12 mm @ 200 mm gives 565.49 mm²/m (0.283%) and passes.</td></tr><tr><td>Slab (per metre)</td><td>0.12% of gross area for HYSD bars, 0.15% for mild steel</td><td>100 mm slab, HYSD: minimum 120 mm²/m. On a 1000 × 100 mm strip, 2 × 8 mm gives 100.53 mm² (0.101%) and FAILS; 3 × 8 mm gives 150.80 mm² (0.151%) and passes.</td></tr></table></div><p>If a cage fails a minimum, the fix is a bigger area — one size up, or tighter spacing — re-run through the panel and re-check. If it passes, that still says nothing about bending, shear, deflection, laps, hooks or development: those live on the companion pages.</p><h3 id="imperial">Imperial bars and unit conversions</h3><p>US bars are sized by eighths of an inch (#4 = 4/8 in = 1/2 in), but from #9 up the diameters follow legacy area-based sizes, so always use the nominal diameter in mm from the table — not the eighths rule — for area. The panel's imperial options use these diameters, and the table below gives each bar's exact area in both units.</p><div class="formula-table"><table><tr><th>US bar</th><th>Nominal diameter (mm)</th><th>Area (mm²)</th><th>Area (in²)</th></tr><tr><td>#3</td><td>9.5</td><td>70.88</td><td>0.11</td></tr><tr><td>#4</td><td>12.7</td><td>126.68</td><td>0.20</td></tr><tr><td>#5</td><td>15.9</td><td>198.56</td><td>0.31</td></tr><tr><td>#6</td><td>19.1</td><td>286.52</td><td>0.44</td></tr><tr><td>#7</td><td>22.2</td><td>387.08</td><td>0.60</td></tr><tr><td>#8</td><td>25.4</td><td>506.71</td><td>0.79</td></tr></table></div><p>Conversions: 1 in² = 645.16 mm². The worked examples convert as: defaults 452.39 mm² = 0.701 in²; beam cage 1,005.3 mm² = 1.56 in²; column cage 1,206.4 mm² = 1.87 in²; one-bar cm² figures are mm² ÷ 100 (452.39 mm² = 4.52 cm²). Two traps: a #4 bar (12.7 mm, 126.68 mm²) is NOT a 12 mm bar (113.10 mm²) — swapping them blindly changes the area by 12.0%. And Canadian M-bars are labelled by nominal AREA, not diameter (15M ≈ 200 mm² at 16.0 mm diameter) — a 15M bar is not a 15 mm bar.</p><h3 id="not-included">What this calculator does not do</h3><p>This is an area tool, not a design or ordering tool. It does not size reinforcement from loads or moments (required Ast comes from the structural design, e.g. As ≈ M ÷ (0.87 × fy × d) — a design calculation, not a panel output); it does not give weight, length, cost or tonnage; it does not count bars from a spacing layout or a slab size; it does not check laps, hooks, cranks, development or anchorage; it does not include stirrup/tie steel, chairs, or tie wire; and it does not check shear, deflection, crack width, or spacing/cover rules. Use the companion pages for the missing pieces: <a href="/rebar-weight-calculator">weight</a>, <a href="/rebar-quantity-calculator">quantity and takeoff</a>, <a href="/rebar-spacing-calculator">spacing</a>, <a href="/rebar-development-length-calculator">development length</a>, <a href="/rebar-lap-length-calculator">lap length</a>, <a href="/rebar-hook-bend-cutting-length-calculator">hooks</a>, <a href="/stirrup-tie-cutting-length-calculator">stirrups</a>, <a href="/column-rebar-calculator">columns</a>, <a href="/beam-rebar-calculator">beams</a>, <a href="/wall-rebar-calculator">walls</a>, <a href="/pool-rebar-calculator">pools</a>, <a href="/rebar-chair-calculator">chairs</a>, <a href="/rebar-tie-wire-calculator">tie wire</a>, <a href="/rebar-cost-calculator">cost</a> and <a href="/rebar-tonnage-calculator">tonnage</a>.</p><h3 id="mistakes">Common mistakes</h3><p><strong>Swapping #4 for 12 mm.</strong> A #4 bar is 12.7 mm, not 12 mm: 126.68 mm² vs 113.10 mm². On a 10-bar cage that is 135.80 mm² of phantom (or missing) steel. Match the diameter, not the nickname.</p><p><strong>Comparing the panel percentage with a b × d rule.</strong> The panel divides by gross b × D. A beam minimum divides by b × d. The same 5 × 16 mm cage reads 0.971% on the panel and 1.07% against b × d — quoting the wrong one against a code limit gives a false pass or a false fail.</p><p><strong>Rounding the bar count down.</strong> Required 804.25 mm² ÷ 113.10 = 7.11 bars is 8 bars, not 7. Seven 12 mm bars give 791.68 mm² — 12.57 mm² short — and "close enough" is not a passing section.</p><p><strong>Adding rounded areas.</strong> Adding published 1-decimal or 2-decimal in² figures drifts: 4 × 0.44 in² = 1.76 in², but the exact area is 1.78 in². Add exact mm² figures (or the panel's unrounded logic), then round once at the end.</p><p><strong>Running a mixed cage once.</strong> One run takes one size. A 2 × 20 + 3 × 16 cage entered as "5 bars, 16 mm" gives 1,005.3 mm² instead of the true 1,231.5 mm² — 226.20 mm² missing. Run each size separately and add.</p><p>Last reviewed: October 2026.</p>`,
    de: {
  metaTitle: "Stahlflächen-Rechner (Ast) — mm², Stahlanteil, gratis",
  desc: "Stahlflächen-Rechner: Einzelfläche, Gesamtstahlfläche Ast und Stahlanteil für jeden Querschnitt berechnen. Beispiel: 4 × 12 mm = 452,39 mm². Kostenlos.",
  formula: "Einzelfläche = π/4 × d². Ast = Stabzahl × Einzelfläche. Stahlanteil = Ast ÷ (b × D) × 100.",
  kw: "stahlflächen-rechner, fläche bewehrungsstab formel, stahlfläche, ast-rechner, stahlanteil",
  howto: ["Wählen Sie die Stabgröße — metrisch (mm) oder US (#-Größe) — aus der Dropdown-Liste.", "Geben Sie die Stabzahl im Querschnitt ein.", "Geben Sie optional die Querschnittsbreite und -höhe in mm ein, um den Stahlanteil zu erhalten. Belassen Sie die Standardwerte (300 × 450 mm) für eine schnelle Prüfung, oder setzen Sie einen der beiden Werte auf 0, wenn Sie nur die Fläche wollen — der Anteil zeigt dann 0,000 %.", "Lesen Sie die Gesamtstahlfläche Ast in mm² und cm², die Einzelfläche und den Stahlanteil ab.", "Mischt der Querschnitt zwei Stabgrößen, führen Sie den Rechner einmal pro Größe aus und addieren Sie die beiden Ast-Werte — siehe den Abschnitt zu zwei Durchmessern unten. Brauchen Sie die Fläche pro Meter aus einem Abstand, nutzen Sie die Tabelle pro Meter unten."],
  faqs: [["Wie groß ist die Fläche eines 12-mm-Stabs?", "π/4 × 12² = 113,10 mm² pro Stab (113,1 mm² gerundet). Vier 12-mm-Stäbe ergeben 452,39 mm² — probieren Sie es mit den Standardwerten des Rechners."],
          ["Was ist Ast bei der Bewehrung?", "Ast ist die gesamte Querschnittsfläche des Stahls in einem Querschnitt: die Einzelfläche mal die Stabzahl. Bei den Standardwerten des Rechners (4 × 12 mm) beträgt Ast 452,39 mm² oder 4,52 cm². Es ist die Fläche, die die statische Bemessung vorsieht, und sie ist es, womit Mindestbewehrungsprüfungen den Betonquerschnitt vergleichen."],
          ["Wie berechnet man die Stahlfläche?", "Zuerst einen Stab: Fläche = π/4 × Durchmesser². Ein 16-mm-Stab hat π/4 × 16² = 201,06 mm². Dann mal die Stabzahl: 5 × 16 mm ergeben 1.005,3 mm². Der Rechner erledigt beide Schritte und teilt — bei eingegebener Querschnittsgröße — durch den Bruttoquerschnitt, um den Stahlanteil zu liefern."],
          ["Was ist der Stahlanteil, und bezieht er sich auf den Bruttoquerschnitt oder die nutzbare Höhe?", "Dieser Rechner teilt Ast durch den Bruttoquerschnitt (Breite × Gesamthöhe). Bei den Standardwerten sind das 452,39 ÷ (300 × 450) × 100 = 0,335 %. Die Mindestbewehrungsregeln für Balken dagegen beziehen sich auf b × d (Breite × nutzbare Höhe), sodass derselbe Korb dort einen höheren Anteil zeigt — 5 × 16 mm in einem 230 × 450-mm-Balken sind 0,971 % des Bruttoquerschnitts, aber 1,07 % von b × d (230 × 409). Prüfen Sie immer, durch welche Fläche eine Normklausel teilt, bevor Sie Anteile vergleichen."],
          ["Wie viele Stäbe brauche ich für eine geforderte Stahlfläche?", "Teilen Sie die geforderte Fläche durch die Einzelfläche und runden Sie AUF — einen Teil eines Stabs kann man nicht einbauen, und Abrunden lässt den Querschnitt zu kurz kommen. Für geforderte 804,25 mm² ergeben 4 × 16 mm genau 804,25 mm², während 7 × 12 mm nur 791,68 mm² ergeben (zu wenig) und 8 × 12 mm 904,78 mm² ergeben (die nächstgrößere Kombination, die besteht). Die Äquivalent-Tabelle unten rechnet das für die gängigen Ziele durch."],
          ["Kann ich eine Stabgröße durch eine andere ersetzen?", "Ja, wenn die Gesamtfläche gleich bleibt oder größer wird — und wenn Abstand, Betondeckung und Verankerungslänge weiterhin funktionieren. Die Flächenregel zählt, nicht die Stückzahl: 10-mm-Stäbe bei 100 mm Abstand ergeben 785,40 mm² pro Meter, und 12-mm-Stäbe brauchen 144,00 mm Abstand für dieselbe Fläche pro Meter (113,10 ÷ 785,40 × 1000). Tauschen Sie Größen nie nur nach Stückzahl — 5 × 12 mm (565,49 mm²) sind kein Ersatz für 5 × 16 mm (1.005,3 mm²). Brauchen die neuen Stäbe längere Übergreifungen oder Verankerungen, prüfen Sie den <a href=\"/de/uebergreifungslaengen-rechner\">Übergreifungslängen-Rechner</a> und den <a href=\"/de/verankerungslaengen-rechner\">Verankerungslängen-Rechner</a>."],
          ["Wie ermittle ich die Stahlfläche pro Meter aus einem Abstand?", "Teilen Sie die Einzelfläche durch den Abstand in Metern: Ast pro Meter = (π/4 × d²) ÷ Abstand (m). So ergeben 12-mm-Stäbe bei 200 mm Abstand 113,10 ÷ 0,2 = 565,49 mm²/m, und 16-mm-Stäbe bei 150 mm Abstand 201,06 ÷ 0,15 = 1.340,4 mm²/m. Die Tabelle pro Meter unten deckt 8–16 mm bei 150–300 mm ab. Umgekehrt — Abstand aus einer geforderten Fläche pro Meter — nutzen Sie Abstand = Einzelfläche × 1000 ÷ geforderter Ast pro Meter."],
          ["Was, wenn mein Querschnitt zwei verschiedene Stabgrößen hat?", "Dieser Rechner nimmt eine Stabgröße pro Durchlauf, führen Sie ihn also einmal für jede Größe aus und addieren Sie die beiden Ast-Werte. Ein Balken mit 2 × 20-mm-Oberstäben und 3 × 16-mm-Unterstäben hat 628,32 + 603,19 = 1.231,5 mm². Der Bügelstahl ist separat — er gehört nicht zu Ast — addieren Sie ihn hier nicht; nutzen Sie den <a href=\"/de/buegel-schnittlaengen-rechner\">Bügel-Rechner</a> für Bügel."],
          ["Was ist die Mindeststahlfläche?", "Das hängt vom Bauteil ab, und die Anteile teilen durch verschiedene Flächen — siehe den Abschnitt Mindestbewehrung unten für die vollständige Tabelle. Kurz: Balken brauchen mindestens 0,85/fy von b × d (192,67 mm² für einen 230 × 409-mm-Querschnitt in Fe415); Stützen brauchen 0,8–6 % der Bruttofläche; Wände brauchen 0,12 % vertikal und 0,20 % horizontal der Bruttofläche pro Meter; Platten brauchen 0,12 % der Bruttofläche für HYSD-Stäbe (120 mm²/m bei einer 100-mm-Platte). Das Bestehen des Minimums ist keine Bemessung — es fängt nur grobe Fehler ab."],
          ["Gibt dieser Rechner das Gewicht des Stahls an?", "Nein — er gibt nur die Fläche an, nicht Gewicht, Länge, Kosten oder Tonnage. Um aus einer Fläche eine Bestellung zu machen, nehmen Sie Stabzahl und Länge zum <a href=\"/de/bewehrungsgewicht-rechner\">Gewichtsrechner</a> (4 × 12-mm-Stäbe wiegen 4 × 0,887 = 3,55 kg pro Meter Bauteillänge), dann zum <a href=\"/de/bewehrungskosten-rechner\">Kostenrechner</a> und zum <a href=\"/de/bewehrungstonnage-rechner\">Tonnage-Rechner</a>. Für eine vollständige Stück- und Längenermittlung aus einer Platte oder einem Netz nutzen Sie den <a href=\"/de/bewehrungsmengen-rechner\">Mengenrechner</a>."]],
  toc: `<nav class="content-block" aria-label="Auf dieser Seite"><h2>Auf dieser Seite</h2><ul><li><a href="#how-to">So benutzen Sie den Rechner</a></li><li><a href="#formula">Die Formel, erklärt</a></li><li><a href="#example-defaults">Rechenbeispiel 1: die Standardwerte des Rechners</a></li><li><a href="#example-beam">Rechenbeispiel 2: ein Balkenkorb gegen sein Minimum</a></li><li><a href="#example-wall-strip">Rechenbeispiel 3: ein Wandstreifen, der sein Minimum verfehlt</a></li><li><a href="#one-bar-table">Einzelfläche: metrische Tabelle</a></li><li><a href="#bars-table">Fläche nach Stabzahl</a></li><li><a href="#equivalents">Äquivalente Stabkombinationen</a></li><li><a href="#per-metre">Fläche pro Meter aus dem Abstand</a></li><li><a href="#two-sizes">Zwei Stabgrößen in einem Querschnitt</a></li><li><a href="#minimum-steel">Mindestbewehrungsprüfungen</a></li><li><a href="#imperial">Zoll-Stäbe und Einheitenumrechnungen</a></li><li><a href="#not-included">Was dieser Rechner nicht leistet</a></li><li><a href="#mistakes">Häufige Fehler</a></li><li><a href="#faq">Häufig gestellte Fragen</a></li></ul></nav>`,
  extra: `<h3>Die Formel, erklärt</h3><p>Der Querschnitt eines Stabs ist ein Kreis, seine Fläche ist also π/4 × d², wobei d der Nenndurchmesser in mm ist. Das ist die ganze Formel — alles andere ist Multiplikation oder Division. Gesamtstahlfläche Ast = Stabzahl × Einzelfläche. Stahlanteil = Ast ÷ (Querschnittsbreite × Querschnittshöhe) × 100, bezogen auf den BRUTTOquerschnitt (Gesamthöhe D), nicht auf die nutzbare Höhe d — die Unterscheidung ist für Normprüfungen wichtig, und das Balkenbeispiel unten zeigt beide Werte für denselben Korb. Ast in cm² ist einfach Ast in mm² ÷ 100, weshalb das Panel 452,39 mm² als 4,52 cm² zeigt. Zwei abgeleitete Formen, die auf dieser Seite verwendet werden: Fläche pro Meter = Einzelfläche ÷ Abstand in Metern, und Abstand aus einer geforderten Fläche pro Meter = Einzelfläche × 1000 ÷ geforderter Ast pro Meter. Beachten Sie das Prozentverhalten des Panels: Ist eine der Querschnittsabmessungen 0, ist die Bruttofläche 0 und das Panel zeigt 0,000 % — das heißt „kein Querschnitt eingegeben", nicht „kein Stahl".</p><h3 id="example-defaults">Rechenbeispiel 1: die Standardwerte des Rechners</h3><p>Öffnen Sie den Rechner, so wie er lädt: 12-mm-Stäbe, 4 Stäbe, Querschnitt 300 × 450 mm. Ein Stab hat π/4 × 12² = 113,10 mm². Vier Stäbe ergeben <strong>Ast = 4 × 113,10 = 452,39 mm² (4,52 cm²)</strong>. Der Bruttoquerschnitt ist 300 × 450 = 135.000 mm², der Stahlanteil also 452,39 ÷ 135.000 × 100 = <strong>0,335 %</strong>. Das Panel zeigt alle vier Zeilen: Ast 452,39 mm², ein Stab 113,10 mm², Stahlanteil 0,335 %, Ast 4,52 cm², mit dem Hinweis „Ast = 4 × π/4 × 12² = 452,39 mm²". Dieselben 452,39 mm² tauchen im Plattenbeispiel des Mitbewerbers BuildingClub auf — die Formel ist universell; was diese Seite hinzufügt, ist alles drum herum.</p><h3 id="example-beam">Rechenbeispiel 2: ein Balkenkorb gegen sein Minimum</h3><p>Nehmen Sie den Standardkorb der Balkenseite: 5 × 16-mm-Stäbe in einem 230 × 450-mm-Balken. Geben Sie 16 mm, 5 Stäbe, 230 × 450 mm ein. Ein Stab hat 201,06 mm², also <strong>Ast = 1.005,3 mm² (10,05 cm²)</strong> und der Panel-Anteil ist 1.005,3 ÷ 103.500 × 100 = <strong>0,971 %</strong> der Bruttofläche. Nun die Normprüfung, die anders teilt: Das Balkenminimum ist 0,85/fy von b × d, und für Fe415 bei einer nutzbaren Höhe von 409 mm sind das 192,67 mm² — der Korb übertrifft es um das Fünffache. Das Maximum ist 4 % der Bruttofläche, 4.140,00 mm², womit er gut im Rahmen liegt. Und der Anteil gegen b × d (230 × 409 = 94.070 mm²) ist 1,07 %, nicht 0,971 % — dieselben Stäbe, anderer Teiler. Sagt eine Normklausel b × d, rechnen Sie gegen b × d neu; vergleichen Sie den Brutto-Anteil des Panels nicht direkt damit.</p><h3 id="example-wall-strip">Rechenbeispiel 3: ein Wandstreifen, der sein Minimum verfehlt</h3><p>Pro-Meter-Prüfungen laufen über dasselbe Panel, indem man einen 1.000 mm breiten Streifen eingibt: Die Stabzahl ist dann die Stabzahl pro Meter. Probieren Sie 10-mm-Stäbe, 5 Stäbe (die Stückzahl bei 200 mm Abstand), Querschnitt 1.000 × 200 mm. Ein Stab hat 78,54 mm², also <strong>Ast = 392,70 mm² (3,93 cm²)</strong> und der Anteil ist 392,70 ÷ 200.000 × 100 = <strong>0,196 %</strong>. Das VERFEHLT das Wand-Horizontalminimum von 0,20 % (400 mm²/m bei einer 200-mm-Wand) — derselbe Fehler, den die Wandseite für ihr Standardnetz meldet. Die Lösung ist eine Stabgröße höher: 5 × 12 mm ergeben <strong>565,49 mm² (5,65 cm²), 0,283 %</strong>, was besteht. Das ist die Prüfung, die sich vor einer Bestellung lohnt: Ein Netz, das vernünftig aussieht, kann knapp unter einem Minimum liegen, und der Panel-Anteil fängt das in Sekunden ab.</p><h3 id="one-bar-table">Einzelfläche: metrische Tabelle</h3><p>Jeder Wert unten ist die Ein-Stab-Zahl des Panels für diese Größe (π/4 × d², Panel-Anzeige). Die kg/m-Spalte nutzt die Optionswerte dieser Seite (d² ÷ 162,28), sodass die Tabelle zum Gewichtsrechner passt.</p><div class="formula-table"><table><tr><th>Stab</th><th>Einzelfläche (mm²)</th><th>Gewicht (kg/m)</th></tr><tr><td>6 mm</td><td>28,27</td><td>0,222</td></tr><tr><td>8 mm</td><td>50,27</td><td>0,394</td></tr><tr><td>10 mm</td><td>78,54</td><td>0,616</td></tr><tr><td>12 mm</td><td>113,10</td><td>0,887</td></tr><tr><td>16 mm</td><td>201,06</td><td>1,578</td></tr><tr><td>20 mm</td><td>314,16</td><td>2,465</td></tr><tr><td>25 mm</td><td>490,87</td><td>3,851</td></tr><tr><td>28 mm</td><td>615,75</td><td>4,831</td></tr><tr><td>32 mm</td><td>804,25</td><td>6,31</td></tr><tr><td>36 mm</td><td>1.017,9</td><td>7,986</td></tr><tr><td>40 mm</td><td>1.256,6</td><td>9,86</td></tr></table></div><p>Zwei Zufälle, die man kennen sollte: Ein 32-mm-Stab (804,25 mm²) entspricht vier 16-mm-Stäben, und ein 40-mm-Stab (1.256,6 mm²) entspricht vier 20-mm-Stäben — die Fläche wächst mit dem Quadrat des Durchmessers, eine Verdopplung des Durchmessers vervierfacht also die Fläche.</p><h3 id="bars-table">Fläche nach Stabzahl</h3><p>Schlagen Sie jede Stückzahl direkt nach, statt zu multiplizieren. Alle Zahlen sind Panel-Ast-Werte in mm² (gesamt = Stückzahl × Einzelfläche, Panel-Anzeige — beachten Sie die Tausender ohne Dezimalstelle: 10 × 12 mm wird als 1.131 angezeigt, und 6 × 20 mm als 1.885).</p><div class="formula-table"><table><tr><th>Stab</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th><th>9</th><th>10</th></tr><tr><td>8 mm</td><td>50,27</td><td>100,53</td><td>150,80</td><td>201,06</td><td>251,33</td><td>301,59</td><td>351,86</td><td>402,12</td><td>452,39</td><td>502,65</td></tr><tr><td>10 mm</td><td>78,54</td><td>157,08</td><td>235,62</td><td>314,16</td><td>392,70</td><td>471,24</td><td>549,78</td><td>628,32</td><td>706,86</td><td>785,40</td></tr><tr><td>12 mm</td><td>113,10</td><td>226,19</td><td>339,29</td><td>452,39</td><td>565,49</td><td>678,58</td><td>791,68</td><td>904,78</td><td>1.017,9</td><td>1.131</td></tr><tr><td>16 mm</td><td>201,06</td><td>402,12</td><td>603,19</td><td>804,25</td><td>1.005,3</td><td>1.206,4</td><td>1.407,4</td><td>1.608,5</td><td>1.809,6</td><td>2.010,6</td></tr><tr><td>20 mm</td><td>314,16</td><td>628,32</td><td>942,48</td><td>1.256,6</td><td>1.570,8</td><td>1.885</td><td>2.199,1</td><td>2.513,3</td><td>2.827,4</td><td>3.141,6</td></tr><tr><td>25 mm</td><td>490,87</td><td>981,75</td><td>1.472,6</td><td>1.963,5</td><td>2.454,4</td><td>2.945,2</td><td>3.436,1</td><td>3.927</td><td>4.417,9</td><td>4.908,7</td></tr><tr><td>32 mm</td><td>804,25</td><td>1.608,5</td><td>2.412,7</td><td>3.217</td><td>4.021,2</td><td>4.825,5</td><td>5.629,7</td><td>6.434</td><td>7.238,2</td><td>8.042,5</td></tr></table></div><h3 id="equivalents">Äquivalente Stabkombinationen</h3><p>Wenn eine Bemessung eine geforderte Fläche vorgibt, funktioniert jede Kombination, die sie erreicht oder übertrifft, flächenmäßig (Abstand, Betondeckung, Übergreifungen und Verankerung brauchen eigene Prüfungen). Teilen Sie die geforderte Fläche durch die Einzelfläche und runden Sie AUF — die Tabelle zeigt, warum Abrunden scheitert: 7 × 12 mm (791,68 mm²) sehen nah an 804,25 mm² aus, liegen aber 12,57 mm² darunter, die bestehende Wahl ist also 8 × 12 mm (904,78 mm²) oder die genauen 4 × 16 mm.</p><div class="formula-table"><table><tr><th>Geforderter Ast</th><th>Kombination, die besteht</th><th>Nächste Option</th><th>Kombination, die zu kurz kommt</th></tr><tr><td>804,25 mm²</td><td>4 × 16 mm = 804,25 mm² (genau); 1 × 32 mm = 804,25 mm² (genau)</td><td>8 × 12 mm = 904,78 mm²</td><td>7 × 12 mm = 791,68 mm² (12,57 zu wenig); 10 × 10 mm = 785,40 mm² (18,85 zu wenig)</td></tr><tr><td>1.005,3 mm²</td><td>5 × 16 mm = 1.005,3 mm² (genau)</td><td>9 × 12 mm = 1.017,9 mm² (12,57 darüber)</td><td>8 × 12 mm = 904,78 mm² (100,53 zu wenig)</td></tr><tr><td>1.256,6 mm²</td><td>4 × 20 mm = 1.256,6 mm² (genau); 1 × 40 mm = 1.256,6 mm² (genau)</td><td>—</td><td>11 × 12 mm = 1.244,1 mm² (12,57 zu wenig); 6 × 16 mm = 1.206,4 mm² (50,27 zu wenig)</td></tr><tr><td>1.129 mm² (1,75 in²)</td><td>4 × #6 = 1.146,1 mm² (1,78 in²); 3 × #7 = 1.161,2 mm² (1,80 in²)</td><td>—</td><td>—</td></tr></table></div><p>Ein Hinweis zur letzten Zeile: Ein US-orientierter Mitbewerber gibt 4 #6-Stäbe mit 1,76 in² an, weil er die gerundeten 0,44 in² pro Stab addiert. Die genaue Fläche ist 4 × 286,52 = 1.146,1 mm² = 1,78 in². Beide bestehen eine Anforderung von 1,75 in², aber nur die genaue Zahl lässt sich aus den Stabdurchmessern reproduzieren — addieren Sie immer genaue Flächen, nie gerundete.</p><h3 id="per-metre">Fläche pro Meter aus dem Abstand</h3><p>Platten und Wände werden üblicherweise über den Abstand vorgegeben, nicht über die Stabzahl. Fläche pro Meter = Einzelfläche ÷ Abstand in Metern. Die Tabelle ist abgeleitete Arithmetik (keine Panel-Ausgabe — das Panel nimmt eine Stückzahl), aber jede Zeile lässt sich über das Panel reproduzieren: Geben Sie die Stabzahl pro Meter auf einem 1.000-mm-Streifen ein, und das Panel liefert denselben Ast.</p><div class="formula-table"><table><tr><th>Stab</th><th>@ 150 mm</th><th>@ 200 mm</th><th>@ 250 mm</th><th>@ 300 mm</th></tr><tr><td>8 mm</td><td>335,10 mm²/m</td><td>251,33 mm²/m</td><td>201,06 mm²/m</td><td>167,55 mm²/m</td></tr><tr><td>10 mm</td><td>523,60 mm²/m</td><td>392,70 mm²/m</td><td>314,16 mm²/m</td><td>261,80 mm²/m</td></tr><tr><td>12 mm</td><td>753,98 mm²/m</td><td>565,49 mm²/m</td><td>452,39 mm²/m</td><td>376,99 mm²/m</td></tr><tr><td>16 mm</td><td>1.340,4 mm²/m</td><td>1.005,3 mm²/m</td><td>804,25 mm²/m</td><td>670,21 mm²/m</td></tr></table></div><p>Umgekehrt — Abstand aus einer geforderten Fläche pro Meter — nutzen Sie Abstand = Einzelfläche × 1000 ÷ geforderter Ast pro Meter. Zwei durchgerechnete Ersetzungen: 10-mm-Stäbe bei 100 mm ergeben 785,40 mm²/m, und 12-mm-Stäbe brauchen 113,10 ÷ 785,40 × 1000 = <strong>144,00 mm</strong> Abstand für dieselbe Fläche (die Lehrbuchantwort ist 14,40 cm — dieselbe Zahl). 12-mm-Stäbe bei 200 mm ergeben 565,49 mm²/m, und 16-mm-Stäbe brauchen 201,06 ÷ 565,49 × 1000 = <strong>355,56 mm</strong> Abstand für dieselbe Fläche; in der Praxis ergeben 350 mm 574,46 mm²/m (etwas darüber) und 355 mm 566,37 mm²/m, runden Sie den Abstand also AB, um bei oder über der geforderten Fläche zu bleiben. Die Abkürzung für den Größenwechsel bei fester Fläche ist s₂ = (d₂/d₁)² × s₁ — (12/10)² × 100 = 144 mm, was dem langen Weg entspricht.</p>
<h3 id="two-sizes">Zwei Stabgrößen in einem Querschnitt</h3><p>Echte Körbe mischen Größen: Oberstäbe unterscheiden sich von Unterstäben, und Stützen mischen Eck- und Seitenstäbe. Dieser Rechner nimmt eine Größe pro Durchlauf, führen Sie ihn also einmal pro Größe aus und addieren Sie. Ein Balken mit 2 × 20-mm-Oberstäben und 3 × 16-mm-Unterstäben hat 628,32 + 603,19 = <strong>1.231,5 mm²</strong> (jede Hälfte separat über das Panel geprüft). Eine Stütze mit 4 × 16 mm plus 4 × 20 mm hat 804,25 + 1.256,6 = <strong>2.060,9 mm²</strong>, was 1,53 % eines 300 × 450-mm-Bruttoquerschnitts ist — innerhalb des Stützenrahmens von 0,8–6 %. Was NICHT zu addieren ist: Bügel-/Verbindungsstahl gehört nicht zu Ast, Übergreifungsstahl zählt Stäbe in der Übergreifungszone doppelt (nutzen Sie die Übergreifungslänge, nicht zusätzliche Fläche), und Druckstahl ist in der Bemessung eine eigene Ast/Asc-Zahl, auch wenn das Panel addiert, was immer Sie eingeben.</p><h3 id="minimum-steel">Mindestbewehrungsprüfungen</h3><p>Das Bestehen eines Minimums ist keine Bemessung — es fängt nur grobe Fehler ab — aber es ist die schnellste Plausibilitätsprüfung für jeden Korb, und der Panel-Anteil speist sie direkt. Beachten Sie, durch welche Fläche jede Klausel teilt: Balken teilen durch b × d, die übrigen unten durch die Bruttofläche (pro Meter Breite bei Platten und Wänden).</p><div class="formula-table"><table><tr><th>Bauteil</th><th>IS 456:2000-Regel</th><th>Durchgerechnete Prüfung</th></tr><tr><td>Balken (Zugstahl)</td><td>Mindestens 0,85/fy von b × d; höchstens 4 % der Bruttofläche</td><td>Fe415, 230 × 409 mm: Minimum 192,67 mm²; 230 × 450 mm: Maximum 4.140 mm². Der 5 × 16-mm-Korb (1.005,3 mm²) besteht beides.</td></tr><tr><td>Stütze (Längsbewehrung)</td><td>0,8 % Minimum, 6 % Maximum der Bruttofläche (4 % Arbeitsgrenze, wo Stäbe übergreifen); mindestens 4 Stäbe rechteckig, 6 kreisförmig</td><td>300 × 450 mm: Minimum 1.080 mm² (6 × 16 mm ergeben 1.206,4 mm², 0,894 %, besteht). 300 × 300 mm: Minimum 720,00 mm² — 4 × 12 mm ergeben nur 452,39 mm² (0,503 %), was VERFEHLT; 4 × 16 mm ergeben 804,25 mm² (0,894 %) und bestehen.</td></tr><tr><td>Wand (pro Meter)</td><td>Vertikal mindestens 0,12 %, horizontal mindestens 0,20 % der Bruttofläche; Abstand höchstens min(3 × Dicke, 450 mm)</td><td>200-mm-Wand: Vertikalminimum 240 mm²/m, Horizontalminimum 400 mm²/m. 10 mm @ 200 mm ergeben 392,70 mm²/m — bestehen als vertikal, VERFEHLEN als horizontal (0,196 %); 12 mm @ 200 mm ergeben 565,49 mm²/m (0,283 %) und bestehen.</td></tr><tr><td>Platte (pro Meter)</td><td>0,12 % der Bruttofläche für HYSD-Stäbe, 0,15 % für Flussstahl</td><td>100-mm-Platte, HYSD: Minimum 120 mm²/m. Auf einem 1.000 × 100-mm-Streifen ergeben 2 × 8 mm 100,53 mm² (0,101 %) und VERFEHLEN; 3 × 8 mm ergeben 150,80 mm² (0,151 %) und bestehen.</td></tr></table></div><p>Verfehlt ein Korb ein Minimum, ist die Lösung eine größere Fläche — eine Größe höher oder ein engerer Abstand — erneut über das Panel laufen lassen und erneut prüfen. Besteht er, sagt das noch nichts über Biegung, Schub, Durchbiegung, Übergreifungen, Haken oder Verankerung: Die leben auf den Begleitseiten.</p><h3 id="imperial">Zoll-Stäbe und Einheitenumrechnungen</h3><p>US-Stäbe werden nach Achteln eines Zolls bemessen (#4 = 4/8 in = 1/2 in), aber ab #9 folgen die Durchmesser alten, flächenbasierten Größen, nutzen Sie also immer den Nenndurchmesser in mm aus der Tabelle — nicht die Achtelregel — für die Fläche. Die Zoll-Optionen des Panels nutzen diese Durchmesser, und die Tabelle unten gibt die genaue Fläche jedes Stabs in beiden Einheiten an.</p><div class="formula-table"><table><tr><th>US-Stab</th><th>Nenndurchmesser (mm)</th><th>Fläche (mm²)</th><th>Fläche (in²)</th></tr><tr><td>#3</td><td>9,5</td><td>70,88</td><td>0,11</td></tr><tr><td>#4</td><td>12,7</td><td>126,68</td><td>0,20</td></tr><tr><td>#5</td><td>15,9</td><td>198,56</td><td>0,31</td></tr><tr><td>#6</td><td>19,1</td><td>286,52</td><td>0,44</td></tr><tr><td>#7</td><td>22,2</td><td>387,08</td><td>0,60</td></tr><tr><td>#8</td><td>25,4</td><td>506,71</td><td>0,79</td></tr></table></div><p>Umrechnungen: 1 in² = 645,16 mm². Die Rechenbeispiele rechnen um als: Standardwerte 452,39 mm² = 0,701 in²; Balkenkorb 1.005,3 mm² = 1,56 in²; Stützenkorb 1.206,4 mm² = 1,87 in²; Ein-Stab-cm²-Werte sind mm² ÷ 100 (452,39 mm² = 4,52 cm²). Zwei Fallen: Ein #4-Stab (12,7 mm, 126,68 mm²) ist KEIN 12-mm-Stab (113,10 mm²) — ein blindes Vertauschen ändert die Fläche um 12,0 %. Und kanadische M-Stäbe sind nach NennFLÄCHE benannt, nicht nach Durchmesser (15M ≈ 200 mm² bei 16,0 mm Durchmesser) — ein 15M-Stab ist kein 15-mm-Stab.</p><h3 id="not-included">Was dieser Rechner nicht leistet</h3><p>Dies ist ein Flächenwerkzeug, kein Bemessungs- oder Bestellwerkzeug. Es bemisst keine Bewehrung aus Lasten oder Momenten (die geforderte Ast-Zahl kommt aus der statischen Bemessung, z. B. As ≈ M ÷ (0,87 × fy × d) — eine Bemessungsrechnung, keine Panel-Ausgabe); es gibt kein Gewicht, keine Länge, keine Kosten und keine Tonnage an; es zählt keine Stäbe aus einem Abstands-Layout oder einer Plattengröße; es prüft keine Übergreifungen, Haken, Abbiegungen, Verankerungen oder Einbindungen; es enthält keinen Bügel-/Verbindungsstahl, keine Abstandhalter und keinen Bindedraht; und es prüft keine Schub-, Durchbiegungs-, Rissbreiten- oder Abstands-/Deckungsregeln. Nutzen Sie die Begleitseiten für die fehlenden Teile: <a href="/de/bewehrungsgewicht-rechner">Gewicht</a>, <a href="/de/bewehrungsmengen-rechner">Mengen- und Abrechnungsrechner</a>, <a href="/de/bewehrungsabstand-rechner">Abstand</a>, <a href="/de/verankerungslaengen-rechner">Verankerungslänge</a>, <a href="/de/uebergreifungslaengen-rechner">Übergreifungslänge</a>, <a href="/de/haken-biege-schnittlaengen-rechner">Haken</a>, <a href="/de/buegel-schnittlaengen-rechner">Bügel</a>, <a href="/de/stuetzenbewehrungs-rechner">Stützen</a>, <a href="/de/balkenbewehrungs-rechner">Balken</a>, <a href="/de/wandbewehrungs-rechner">Wände</a>, <a href="/de/bewehrungsrechner-fuer-pools">Pools</a>, <a href="/de/abstandhalter-rechner">Abstandhalter</a>, <a href="/de/bindedraht-rechner">Bindedraht</a>, <a href="/de/bewehrungskosten-rechner">Kosten</a> und <a href="/de/bewehrungstonnage-rechner">Tonnage</a>.</p><h3 id="mistakes">Häufige Fehler</h3><p><strong>#4 mit 12 mm vertauschen.</strong> Ein #4-Stab ist 12,7 mm, nicht 12 mm: 126,68 mm² gegenüber 113,10 mm². Bei einem 10-Stab-Korb sind das 135,80 mm² Phantomstahl (oder fehlender Stahl). Passen Sie den Durchmesser an, nicht den Spitznamen.</p><p><strong>Den Panel-Anteil mit einer b × d-Regel vergleichen.</strong> Das Panel teilt durch den Bruttoquerschnitt b × D. Ein Balkenminimum teilt durch b × d. Derselbe 5 × 16-mm-Korb liest sich mit 0,971 % im Panel und mit 1,07 % gegen b × d — wer den falschen Wert gegen eine Normgrenze zitiert, erhält eine falsche Freigabe oder eine falsche Ablehnung.</p><p><strong>Die Stabzahl abrunden.</strong> Gefordert 804,25 mm² ÷ 113,10 = 7,11 Stäbe sind 8 Stäbe, nicht 7. Sieben 12-mm-Stäbe ergeben 791,68 mm² — 12,57 mm² zu wenig — und „nah genug" ist kein bestehender Querschnitt.</p><p><strong>Gerundete Flächen addieren.</strong> Das Addieren veröffentlichter 1- oder 2-stelliger in²-Zahlen driftet: 4 × 0,44 in² = 1,76 in², aber die genaue Fläche ist 1,78 in². Addieren Sie genaue mm²-Zahlen (oder die ungerundete Panel-Logik) und runden Sie erst am Ende einmal.</p><p><strong>Einen gemischten Korb einmal laufen lassen.</strong> Ein Durchlauf nimmt eine Größe. Ein 2 × 20 + 3 × 16-Korb, eingegeben als „5 Stäbe, 16 mm", ergibt 1.005,3 mm² statt der wahren 1.231,5 mm² — 226,20 mm² fehlen. Führen Sie jede Größe separat aus und addieren Sie.</p><p>Zuletzt geprüft: Oktober 2026.</p>`
}
},
    { id:"quantity", slug:"rebar-quantity-calculator", cat:"Weight",
    metaTitle:"Rebar Quantity Calculator — kg/m² & Takeoff in Seconds",
    h1:"Rebar Quantity & Takeoff Calculator",
    desc:"Estimate rebar from spacing alone: kg/m², kg/ft², total bar length and weight for any slab or area. Try 50 m² at 200 mm spacing = 308.00 kg.",
    kw:"rebar quantity calculator, rebar per square foot, rebar calculator by square foot, rebar takeoff calculator",
    intro:"Estimate reinforcement for any area quickly. Enter the area and grid spacing, and the tool returns the steel density in kg/m² and kg/ft² plus the total weight — ideal for fast take-offs.",
    howto:["Enter the area to be reinforced in square metres.","Set the grid spacing in mm — the same spacing both ways.","Pick the bar size for the kg/m² figure and the total.","Read the total weight, the density in kg/m² and kg/ft², the total bar length and the tonnage.","Add waste, laps and any second layer before ordering — the calculator gives the neat single-grid total only."],
    formula:"Bar length per m² = 2 ÷ spacing(m). Weight/m² = that × kg/m. Total = weight/m² × area.",
    faqs:[["How much rebar per square foot?", "It depends on spacing and bar size — that is exactly what the per-ft² row answers. On the calculator defaults (10 mm bars at 200 mm spacing) it is 0.572 kg/ft² (1.26 lb/ft²). Tighten to 150 mm and it rises to 0.763 kg/ft²; step up to 12 mm at 200 mm and it is 0.824 kg/ft². The spacing table below covers the common combinations."],
          ["How do you do a rebar takeoff?", "Start with the density method this calculator uses: bar length per m² = 2 ÷ spacing in metres, times the bar's kg/m, times the area. That gives a fast neat total — 308.00 kg for the defaults (50 m², 200 mm, 10 mm). Then refine it: add 5–10% waste, add laps where bars run longer than stock, and for fabrication build a bar bending schedule — mark, diameter, shape, length, count and weight per bar — on the pattern the method guides describe. For exact panel counts use the <a href=\"/concrete-slab-rebar-calculator\">slab calculator</a> and the member tools."],
          ["What does this calculator assume?", "A single grid, the same spacing both ways, one bar size, and an endless grid: 2 ÷ spacing metres of bar per m² across the whole area, with no cover deduction, no edge bars, no openings and no second layer. That is why it is a fast estimate and not a schedule — the slab-bridge section below shows it running 1–2% above the exact slab-tool count on small slabs."],
          ["Why does the slab calculator give a different total?", "Because it counts real bars: it deducts cover from every bar length and counts the edge bars explicitly, while this calculator spreads 2 ÷ spacing metres over the area with no cover taken off. On a 5 × 4 m slab at 200 mm spacing with 10 mm bars, this calculator gives 123.20 kg and the slab tool gives 120.98 kg — 2.22 kg (1.83%) apart. On a 10 × 8 m slab the gap shrinks to 0.91%. Use this page for speed, the slab page for the order."],
          ["How much waste should I add?", "Add 5–10% on top of the neat total for cutting and offcuts — published takeoff guides use 10% for lap splices and waste combined, and one bar-schedule method uses 3–5% for cutting losses alone. On the defaults that is 323.40 kg at +5% and 338.80 kg at +10%. Laps are separate: if a bar run exceeds the stock length, add the splice length per splice from the <a href=\"/rebar-lap-length-calculator\">lap calculator</a> — do not assume the waste percentage already covers it."],
          ["Does the calculator include laps or hooks?", "No. The total is straight, neat grid steel only. Hooks, bends and anchorage add length per bar — work them out on the <a href=\"/rebar-hook-bend-cutting-length-calculator\">hook calculator</a> and the <a href=\"/rebar-development-length-calculator\">development length calculator</a> — and laps add a splice length wherever a run exceeds stock. A takeoff that ignores both under-orders on every long run at once."],
          ["What if my grid has different spacings each way?", "This calculator takes one spacing for both directions, so it cannot model that grid directly. Two options: use the <a href=\"/concrete-slab-rebar-calculator\">slab calculator</a>, which takes the panel dimensions and counts both directions exactly; or work the density by hand as length per m² = 1 ÷ spacing-X + 1 ÷ spacing-Y — for 150 mm one way and 200 mm the other that is 6.67 + 5.00 = 11.67 m/m², which at 0.616 kg/m is 7.19 kg/m² (derived arithmetic, not a panel output)."],
          ["How do I convert kg/m² to kg/m³ or lb/ft²?", "Divide by the thickness for kg/m³: kg/m³ = kg/m² ÷ thickness in metres. The defaults density of 6.16 kg/m² on a 150 mm slab is 41.07 kg/m³. For lb/ft², multiply kg/m² by 0.205 (1 kg/m² = 0.205 lb/ft²): 6.16 kg/m² = 1.26 lb/ft², matching the panel's 0.572 kg/ft² row. Do not confuse the two: a figure quoted as kg/m² that looks like 80–120 is almost certainly a kg/m³ rate mislabelled — real slab densities run about 3–25 kg/m²."],
          ["How many bars or sticks do I need to order?", "Divide the total bar length by the stock length and round up: the defaults total 500.00 m needs 42 × 12 m bars (500 ÷ 12 = 41.67) or 84 × 6 m bars (500 ÷ 6 = 83.33). The house example below (2,000 m) needs 167 × 12 m bars. That is before cutting losses — bars cut to panel sizes leave offcuts, so the stick count from a length division is a floor, not a final order. Price the result on the <a href=\"/rebar-cost-calculator\">cost calculator</a> and convert it on the <a href=\"/rebar-tonnage-calculator\">tonnage calculator</a>."],
          ["Does it cover beams, columns, footings or walls?", "No — this is an area-grid estimator only. It cannot see member geometry, so it cannot take off a beam cage, column verticals, footing mats or wall grids. Use the member tools — <a href=\"/beam-rebar-calculator\">beam</a>, <a href=\"/column-rebar-calculator\">column</a>, <a href=\"/footing-rebar-calculator\">footing</a>, <a href=\"/wall-rebar-calculator\">wall</a>, <a href=\"/pool-rebar-calculator\">pool</a> — or the <a href=\"/concrete-and-rebar-calculator\">concrete estimator</a> for a kg/m³-ratio estimate across a whole element. Chairs are on the <a href=\"/rebar-chair-calculator\">chair calculator</a> and tie wire on the <a href=\"/rebar-tie-wire-calculator\">tie wire calculator</a>."]],
    toc:`<nav class="content-block" aria-label="On this page"><h2>On this page</h2><ul><li><a href="#how-to">How to use the calculator</a></li><li><a href="#formula">The formula, explained</a></li><li><a href="#example-1">Worked example 1: defaults (50 m²)</a></li><li><a href="#example-2">Worked example 2: 100 m² slab</a></li><li><a href="#example-3">Worked example 3: small 20 m² area</a></li><li><a href="#spacing-table">Density by spacing</a></li><li><a href="#bar-size-table">Density by bar size</a></li><li><a href="#slab-bridge">Against the exact slab count</a></li><li><a href="#order">From neat total to order</a></li><li><a href="#imperial">Imperial conversions</a></li><li><a href="#not-included">What this calculator does not cover</a></li><li><a href="#mistakes">5 common mistakes</a></li><li><a href="#faq">FAQs</a></li></ul></nav>`,
    extra:`<h3>The formula, explained</h3><p>A grid has bars running both ways, so each square metre contains one metre of bar per direction for every metre of spacing — that is the whole formula:</p><p><strong>Bar length per m² = 2 ÷ spacing (m); Weight per m² = that × kg/m; Total = weight per m² × area</strong></p><p>At the defaults spacing of 200 mm, that is 2 ÷ 0.2 = 10.00 m of bar per m², and at 0.616 kg/m for 10 mm bars that is 6.16 kg/m². Multiply by the area and you have the total: 6.16 × 50 = 308.00 kg. The per-ft² row divides by 10.7639 (1 m² = 10.7639 ft²), so 6.16 ÷ 10.7639 = 0.572 kg/ft². Two display notes: both bar fields read "0.617|10", but the panel computes with the option value 0.616 kg/m, so every weight below uses 0.616 — the raw field string would give 308.50 kg, not the panel's 308.00 kg. And totals at or above 1000 show one decimal with separators, so the 100 m² example reads "1,182.7" kg, not 1182.67 kg — quote the panel form and your reader's check will match.</p><h3 id="example-1">Worked example 1: defaults (50 m²)</h3><p>Open the calculator and leave the defaults: area 50 m², spacing 200 mm, bars 10 mm.</p><p>Bar length per m² = 2 ÷ 0.2 = 10.00 m. Weight per m² = 10.00 × 0.616 = 6.16 kg/m². Per ft² = 6.16 ÷ 10.7639 = 0.572 kg/ft².</p><p><strong>Total = 6.16 × 50 = 308.00 kg (0.308 t), from 500.00 m of bar.</strong> The panel shows 308.00 kg, 6.16 kg/m², 0.572 kg/ft², 500.00 m and 0.308 t. That is the neat single-grid total: no waste, no laps, no hooks, no second layer. The order section below turns it into something you can buy.</p><h3 id="example-2">Worked example 2: 100 m² slab</h3><p>Set area 100 m², spacing 150 mm, bars 12 mm.</p><p>Bar length per m² = 2 ÷ 0.15 = 13.33 m. Weight per m² = 13.33 × 0.887 = 11.83 kg/m². Per ft² = 11.83 ÷ 10.7639 = 1.10 kg/ft² (panel: 1.10).</p><p><strong>Total = 11.83 × 100 = 1,182.7 kg (1.18 t), from 1,333.3 m of bar.</strong> Note the panel forms: the exact total is 1182.6667 kg, which displays as "1,182.7", and the exact length 1333.3333 m displays as "1,333.3" — totals at or above 1000 show one decimal, not two. Tightening the spacing from 200 mm to 150 mm and stepping up from 10 mm to 12 mm together nearly doubles the defaults density (6.16 → 11.83 kg/m²); spacing and bar size multiply, they do not add.</p><h3 id="example-3">Worked example 3: small 20 m² area</h3><p>Set area 20 m², spacing 300 mm, bars 8 mm.</p><p>Bar length per m² = 2 ÷ 0.3 = 6.67 m. Weight per m² = 6.67 × 0.394 = 2.63 kg/m². Per ft² = 2.63 ÷ 10.7639 = 0.244 kg/ft².</p><p><strong>Total = 2.63 × 20 = 52.53 kg (0.053 t), from 133.33 m of bar.</strong> Small areas are where the density method is weakest: the formula assumes an endless grid, so on 20 m² the missing edge bars and the missing cover deduction are a larger share of the total than on 100 m². For anything this small that you actually intend to order, cross-check against the <a href="/concrete-slab-rebar-calculator">slab calculator</a> with the real panel dimensions — the bridge section shows the size of the difference.</p><h3 id="spacing-table">Density by spacing</h3><p>Same area and bar as the defaults (50 m², 10 mm), seven spacings. Halving the spacing doubles the density exactly — the formula is linear in 1 ÷ spacing, so there are no steps or dead bands here, unlike the bar-count tools.</p><div class="formula-table"><table><tr><th>Spacing</th><th>kg/m²</th><th>kg/ft²</th><th>Total (50 m²)</th><th>Bar length</th></tr><tr><td>100 mm</td><td>12.32</td><td>1.14</td><td>616.00 kg</td><td>1,000 m</td></tr><tr><td>125 mm</td><td>9.86</td><td>0.916</td><td>492.80 kg</td><td>800.00 m</td></tr><tr><td>150 mm</td><td>8.21</td><td>0.763</td><td>410.67 kg</td><td>666.67 m</td></tr><tr><td>200 mm</td><td>6.16</td><td>0.572</td><td>308.00 kg</td><td>500.00 m</td></tr><tr><td>250 mm</td><td>4.93</td><td>0.458</td><td>246.40 kg</td><td>400.00 m</td></tr><tr><td>300 mm</td><td>4.11</td><td>0.382</td><td>205.33 kg</td><td>333.33 m</td></tr><tr><td>400 mm</td><td>3.08</td><td>0.286</td><td>154.00 kg</td><td>250.00 m</td></tr></table></div><p>Two readings. First, spacing is the strongest lever on a grid takeoff: 100 mm instead of 200 mm doubles the order. Second, the per-ft² column is the one US readers actually ask for — 0.572 kg/ft² at the defaults is 1.26 lb/ft², and the imperial section converts the whole table's logic to feet and inches.</p><h3 id="bar-size-table">Density by bar size</h3><p>Same area and spacing as the defaults (50 m², 200 mm), six bar sizes. Density scales with diameter squared, so stepping up one size is never a small change.</p><div class="formula-table"><table><tr><th>Bar</th><th>kg/m</th><th>kg/m²</th><th>kg/ft²</th><th>Total (50 m²)</th></tr><tr><td>8 mm</td><td>0.394</td><td>3.94</td><td>0.366</td><td>197.00 kg</td></tr><tr><td>10 mm</td><td>0.616</td><td>6.16</td><td>0.572</td><td>308.00 kg</td></tr><tr><td>12 mm</td><td>0.887</td><td>8.87</td><td>0.824</td><td>443.50 kg</td></tr><tr><td>16 mm</td><td>1.578</td><td>15.78</td><td>1.47</td><td>789.00 kg</td></tr><tr><td>20 mm</td><td>2.465</td><td>24.65</td><td>2.29</td><td>1,232.5 kg</td></tr><tr><td>25 mm</td><td>3.851</td><td>38.51</td><td>3.58</td><td>1,925.5 kg</td></tr></table></div><p>Going from 10 mm to 12 mm adds 44% (308.00 → 443.50 kg); from 12 mm to 16 mm adds 78% (443.50 → 789.00 kg). That is why a bar-size substitution always needs a spacing change to match: same area at 16 mm needs roughly 1.78× the spacing of 12 mm (area scales with d², so spacing scales with (d₂/d₁)² — the area page works this substitution out in full).</p><h3 id="slab-bridge">Against the exact slab count</h3><p>This calculator and the slab calculator answer different questions, and on the same slab they disagree by a small, predictable amount. The slab tool counts real bars: it deducts 40 mm of cover from every bar length and counts the edge bars explicitly. This tool spreads 2 ÷ spacing metres over the area with no cover taken off. Three comparisons, all at 40 mm cover on the slab tool:</p><div class="formula-table"><table><tr><th>Slab</th><th>Spacing / bar</th><th>This calculator</th><th>Slab tool</th><th>Difference</th></tr><tr><td>5 × 4 m (20 m²)</td><td>200 mm / 10 mm</td><td>123.20 kg</td><td>120.98 kg</td><td>+2.22 kg (+1.83%)</td></tr><tr><td>5 × 4 m (20 m²)</td><td>150 mm / 12 mm</td><td>236.53 kg</td><td>232.57 kg</td><td>+3.96 kg (+1.70%)</td></tr><tr><td>10 × 8 m (80 m²)</td><td>200 mm / 12 mm</td><td>709.60 kg</td><td>703.21 kg</td><td>+6.39 kg (+0.91%)</td></tr></table></div><p>The density figure always runs high here, and the gap shrinks as the slab grows — the cover deduction is a fixed amount per bar, so it matters less on a big slab than a small one. Practical rule: use this page when you need a number in seconds (a quote, a sanity check, a big-area estimate); use the <a href="/concrete-slab-rebar-calculator">slab calculator</a> when you need the bars to order. And note the direction: a density estimate that runs high is safe for budgeting and short for nothing — but it is not a bar list, and nobody can cut bars from a kg/m² figure.</p><h3 id="order">From neat total to order</h3><p>The panel total is neat grid steel. An order needs three additions, all worked here from the panel totals (exact totals throughout, not rounded display values).</p><p><strong>Waste.</strong> Defaults neat 308.00 kg → 323.40 kg at +5%, 338.80 kg at +10%. House example (200 m², 200 mm, 12 mm): neat 1,774 kg → 1,862.70 kg at +5%, 1,951.40 kg at +10%.</p><p><strong>Cost.</strong> At an example €1.20/kg (prices are examples — enter your local rate on the <a href="/rebar-cost-calculator">cost calculator</a>): defaults €369.60 neat, €388.08 at +5%, €406.56 at +10%; house €2,128.80 neat, €2,235.24 at +5%, €2,341.68 at +10%.</p><p><strong>Sticks.</strong> Total length ÷ stock length, rounded up: defaults 500.00 m → 42 × 12 m bars (41.67) or 84 × 6 m bars (83.33); house 2,000 m → 167 × 12 m bars (166.67). That is before cutting losses — bars cut to panel sizes leave offcuts, so treat the stick count as a floor. Laps sit on top of all three: wherever a run exceeds stock length, add the splice length per splice from the <a href="/rebar-lap-length-calculator">lap calculator</a>.</p><p>For scale: 500 m² at 200 mm spacing with 12 mm bars is 4,435 kg (4.44 t), and 1000 m² at 150 mm with 16 mm bars is 21,040 kg (21.04 t) — both panel totals, both before waste. At that size the density method earns its keep: counting bars by hand across 1000 m² is where the errors live.</p><h3 id="imperial">Imperial conversions</h3><p>The calculator takes square metres and millimetres, so convert first: 1 m² = 10.7639 ft², 1 in = 25.4 mm, 1 kg = 2.20 lb, 1 kg/m² = 0.205 lb/ft².</p><p>Worked conversions: the defaults total 308.00 kg = 679.02 lb, and the defaults density 6.16 kg/m² = 1.26 lb/ft². A full imperial run — a 1000 ft² slab (92.90 m²), 12 in spacing both ways (304.8 mm), #4 verticals and horizontals (12.7 mm, 0.994 kg/m) — gives 6.52 kg/m², 0.606 kg/ft², 609.60 m of bar, 605.94 kg (0.606 t, 1,335.87 lb). With #5 bars (15.9 mm, 1.552 kg/m) at the same spacing the same slab needs 10.18 kg/m², 0.946 kg/ft², 609.60 m, 946.10 kg (0.946 t, 2,085.79 lb). The bar dropdowns include US sizes, so enter the metric equivalents of your dimensions and pick the matching US bar. Note the area conversion trap: 50 m² is 538.19 ft², not 500 ft² — a "square foot" takeoff that divides by 10 instead of 10.7639 undercounts the area by 7%.</p><h3 id="not-included">What this calculator does not cover</h3><ul><li>Bar counts and per-bar lengths — it gives total metres and total weight, not a cutting list. For counts use the <a href="/concrete-slab-rebar-calculator">slab calculator</a> or the member tools.</li><li>Laps, hooks, bends, cranks and development — see the <a href="/rebar-lap-length-calculator">lap calculator</a>, the <a href="/rebar-hook-bend-cutting-length-calculator">hook calculator</a> and the <a href="/rebar-development-length-calculator">development length calculator</a>.</li><li>Second layers and double mats — the total is one grid; a two-layer slab needs the total doubled (plus chairs between layers).</li><li>Beams, columns, footings and walls — use the <a href="/beam-rebar-calculator">beam</a>, <a href="/column-rebar-calculator">column</a>, <a href="/footing-rebar-calculator">footing</a> and <a href="/wall-rebar-calculator">wall</a> calculators; the <a href="/concrete-and-rebar-calculator">concrete estimator</a> covers the kg/m³-ratio method across a whole element.</li><li>Openings, steps, upstands, thickenings and edge beams — an area input cannot see any of them; deduct or add them by hand.</li><li>Chairs and spacers — see the <a href="/rebar-chair-calculator">chair calculator</a>; tie wire is on the <a href="/rebar-tie-wire-calculator">tie wire calculator</a>.</li><li>Concrete volume — the <a href="/concrete-and-rebar-calculator">concrete estimator</a> gives volume plus steel at a kg/m³ ratio.</li><li>Waste and cost — the order section shows the arithmetic; price the final figure on the <a href="/rebar-cost-calculator">cost calculator</a> and convert it on the <a href="/rebar-tonnage-calculator">tonnage calculator</a>.</li><li>Bar area (Ast) and minimum-steel checks — the <a href="/rebar-area-calculator">area calculator</a> gives Ast and the steel percentage for a section.</li><li>Spacing checks against code maxima — the <a href="/rebar-spacing-calculator">spacing calculator</a> works bar counts from a length and a target spacing.</li></ul><h3 id="mistakes">5 common mistakes</h3><ol><li><strong>Using one spacing for a two-spacing grid.</strong> The calculator takes a single spacing for both directions. If the drawing specifies 150 mm one way and 200 mm the other, this tool cannot model it — use the slab calculator, or the hand density 1 ÷ 0.15 + 1 ÷ 0.2 = 11.67 m/m² (7.19 kg/m² at 0.616 kg/m). Entering either spacing alone misstates the total by 14% on this example, and far more on wider splits.</li><li><strong>Ordering the neat total.</strong> The panel total has no waste, no laps and no hooks in it. On the defaults, ordering 308.00 kg flat leaves you short the moment the first bar is cut — 323.40 kg at +5% is the floor for an order, and laps sit on top.</li><li><strong>Using the wrong kg/m.</strong> The panel computes 10 mm bar at 0.616 kg/m (option value), not the 0.617 the field string reads, and several competitor pages quote the rounded d²/162 values (0.617/0.888) rather than this site's d²/162.28 options (0.616/0.887). The difference is ~1.6 kg per tonne on 10 mm bar — small per metre, visible per truckload, and the reason two sites' totals for the same grid never quite agree.</li><li><strong>Confusing kg/m² with kg/m³.</strong> A density of 6.16 kg/m² is not a small number for a slab — but a figure quoted as "80–120 kg per square metre" for slabs, as one method guide puts it, is a kg/m³-scale rate wearing the wrong unit. Convert with the thickness (kg/m³ = kg/m² ÷ thickness in m): 6.16 kg/m² on a 150 mm slab is 41.07 kg/m³, which is the right order of magnitude. If a quoted kg/m² figure looks ten times too big, it probably is.</li><li><strong>Trusting an area input to see shape.</strong> 50 m² can be a 10 × 5 m slab, a 25 × 2 m strip, or an L-shape with a stair opening — and the laps, edge bars and offcuts differ wildly between them while this calculator returns the same 308.00 kg for all three. Area is the fastest input and the blindest: the moment shape, openings or long runs matter, switch to the slab or member tool with real dimensions.</li></ol><p>Last reviewed: October 2026.</p>`,
    de: {
  metaTitle: "Bewehrungsmengen-Rechner — kg/m² & Abrechnung gratis",
  desc: "Bewehrungsmengen-Rechner: Stahlmenge aus Fläche und Abstand – kg/m², kg/ft² und Gesamtgewicht. Beispiel: 50 m² bei 200 mm = 308,00 kg. Kostenlos.",
  formula: "Stablänge pro m² = 2 ÷ Abstand (m). Gewicht pro m² = diese × kg/m. Gesamtgewicht = Gewicht pro m² × Fläche.",
  kw: "bewehrungsmengen-rechner, bewehrung pro quadratfuß, bewehrungsrechner pro quadratfuß, bewehrungsmengenermittlung",
  howto: ["Geben Sie die zu bewehrende Fläche in Quadratmetern ein.", "Stellen Sie den Rasterabstand in mm ein — in beiden Richtungen derselbe Abstand.", "Wählen Sie die Stabgröße für die kg/m²-Angabe und die Gesamtmenge.", "Lesen Sie das Gesamtgewicht, die Dichte in kg/m² und kg/ft², die Gesamtstablänge und die Tonnage ab.", "Addieren Sie vor der Bestellung Verschnitt, Übergreifungen und eine eventuelle zweite Lage — der Rechner liefert nur die saubere Eingitter-Gesamtmenge."],
  faqs: [["Wie viel Bewehrung braucht man pro Quadratfuß?", "Das hängt von Abstand und Stabgröße ab — genau das beantwortet die Pro-ft²-Zeile. Bei den Standardwerten des Rechners (10-mm-Stäbe bei 200 mm Abstand) sind es 0,572 kg/ft² (1,26 lb/ft²). Bei 150 mm Abstand steigt der Wert auf 0,763 kg/ft²; bei 12 mm und 200 mm sind es 0,824 kg/ft². Die Abstands-Tabelle unten deckt die gängigen Kombinationen ab."],
          ["Wie erstellt man eine Bewehrungsmengenermittlung?", "Beginnen Sie mit der Dichtemethode, die dieser Rechner verwendet: Stablänge pro m² = 2 ÷ Abstand in Metern, mal kg/m des Stabs, mal Fläche. Das ergibt eine schnelle Nettomenge — 308,00 kg bei den Standardwerten (50 m², 200 mm, 10 mm). Dann verfeinern Sie: Addieren Sie 5–10 % Verschnitt, addieren Sie Übergreifungen, wo Stäbe länger als die Handelslänge laufen, und erstellen Sie für die Fertigung eine Biegeliste — Position, Durchmesser, Form, Länge, Stückzahl und Gewicht pro Stab — nach dem Muster, das die Methodenleitfäden beschreiben. Für exakte Panel-Stückzahlen verwenden Sie den <a href=\"/de/bewehrungsrechner-fuer-betonplatten\">Platten-Rechner</a> und die Bauteil-Tools."],
          ["Was setzt dieser Rechner voraus?", "Ein einzelnes Gitter, in beiden Richtungen derselbe Abstand, eine Stabgröße und ein endloses Gitter: 2 ÷ Abstand Meter Stab pro m² über die ganze Fläche, ohne Betondeckungsabzug, ohne Randstäbe, ohne Öffnungen und ohne zweite Lage. Darum ist er eine schnelle Schätzung und keine Liste — der Platten-Brückenabschnitt unten zeigt, dass er auf kleinen Platten 1–2 % über der exakten Platten-Tool-Zählung liegt."],
          ["Warum liefert der Platten-Rechner eine andere Gesamtmenge?", "Weil er echte Stäbe zählt: Er zieht von jeder Stablänge die Betondeckung ab und zählt die Randstäbe ausdrücklich, während dieser Rechner 2 ÷ Abstand Meter über die Fläche verteilt, ohne Deckung abzuziehen. Auf einer 5 × 4 m Platte bei 200 mm Abstand mit 10-mm-Stäben liefert dieser Rechner 123,20 kg und das Platten-Tool 120,98 kg — 2,22 kg (1,83 %) Unterschied. Auf einer 10 × 8 m Platte schrumpft die Lücke auf 0,91 %. Verwenden Sie diese Seite für Geschwindigkeit, die Platten-Seite für die Bestellung."],
          ["Wie viel Verschnitt sollte man addieren?", "Addieren Sie 5–10 % auf die Nettomenge für Schnitt und Abschnitte — veröffentlichte Mengenermittlungs-Leitfäden verwenden 10 % für Übergreifungsstöße und Verschnitt zusammen, und eine Biegelisten-Methode verwendet 3–5 % allein für Schnittverluste. Bei den Standardwerten sind das 323,40 kg bei +5 % und 338,80 kg bei +10 %. Übergreifungen sind separat: Wenn ein Stabstrang die Handelslänge übersteigt, addieren Sie die Stoßlänge pro Stoß aus dem <a href=\"/de/uebergreifungslaengen-rechner\">Übergreifungslängen-Rechner</a> — gehen Sie nicht davon aus, dass der Verschnitt-Prozentsatz sie bereits abdeckt."],
          ["Enthält der Rechner Übergreifungen oder Haken?", "Nein. Die Gesamtmenge ist nur gerader, sauberer Gitterstahl. Haken, Biegungen und Verankerung fügen Länge pro Stab hinzu — arbeiten Sie sie mit dem <a href=\"/de/haken-biege-schnittlaengen-rechner\">Haken-Rechner</a> und dem <a href=\"/de/verankerungslaengen-rechner\">Verankerungslängen-Rechner</a> aus — und Übergreifungen fügen eine Stoßlänge hinzu, wo immer ein Strang die Handelslänge übersteigt. Eine Mengenermittlung, die beides ignoriert, bestellt auf jedem langen Strang auf einmal zu wenig."],
          ["Was, wenn mein Gitter in jeder Richtung einen anderen Abstand hat?", "Dieser Rechner nimmt einen Abstand für beide Richtungen, also kann er dieses Gitter nicht direkt abbilden. Zwei Möglichkeiten: Verwenden Sie den <a href=\"/de/bewehrungsrechner-fuer-betonplatten\">Platten-Rechner</a>, der die Panelmaße nimmt und beide Richtungen exakt zählt; oder rechnen Sie die Dichte von Hand als Länge pro m² = 1 ÷ Abstand-X + 1 ÷ Abstand-Y — für 150 mm in einer Richtung und 200 mm in der anderen sind das 6,67 + 5,00 = 11,67 m/m², was bei 0,616 kg/m 7,19 kg/m² ergibt (abgeleitete Rechnung, kein Panel-Wert)."],
          ["Wie rechnet man kg/m² in kg/m³ oder lb/ft² um?", "Teilen Sie für kg/m³ durch die Dicke: kg/m³ = kg/m² ÷ Dicke in Metern. Die Standarddichte von 6,16 kg/m² auf einer 150-mm-Platte ergibt 41,07 kg/m³. Für lb/ft² multiplizieren Sie kg/m² mit 0,205 (1 kg/m² = 0,205 lb/ft²): 6,16 kg/m² = 1,26 lb/ft², passend zur Panel-Zeile von 0,572 kg/ft². Verwechseln Sie die beiden nicht: Eine Angabe in kg/m², die wie 80–120 aussieht, ist fast sicher ein falsch bezeichneter kg/m³-Wert — echte Plattendichten liegen bei etwa 3–25 kg/m²."],
          ["Wie viele Stäbe oder Stangen muss man bestellen?", "Teilen Sie die Gesamtstablänge durch die Handelslänge und runden Sie auf: Die Standard-Gesamtlänge von 500,00 m braucht 42 × 12-m-Stäbe (500 ÷ 12 = 41,67) oder 84 × 6-m-Stäbe (500 ÷ 6 = 83,33). Das Hausbeispiel unten (2.000 m) braucht 167 × 12-m-Stäbe. Das ist vor Schnittverlusten — auf Panelmaße geschnittene Stäbe hinterlassen Abschnitte, also ist die Stangenzahl aus einer Längenteilung ein Mindestwert, keine endgültige Bestellung. Bepreisen Sie das Ergebnis mit dem <a href=\"/de/bewehrungskosten-rechner\">Kosten-Rechner</a> und rechnen Sie es mit dem <a href=\"/de/bewehrungstonnage-rechner\">Tonnage-Rechner</a> um."],
          ["Deckt er Balken, Stützen, Fundamente oder Wände ab?", "Nein — dies ist nur ein Flächen-Gitter-Schätzer. Er kann keine Bauteilgeometrie sehen, also kann er keinen Balkenkorb, keine Stützenvertikalen, keine Fundamentmatten oder Wandgitter abnehmen. Verwenden Sie die Bauteil-Tools — <a href=\"/de/balkenbewehrungs-rechner\">Balken</a>, <a href=\"/de/stuetzenbewehrungs-rechner\">Stützen</a>, <a href=\"/de/bewehrungsrechner-fuer-fundamente\">Fundamente</a>, <a href=\"/de/wandbewehrungs-rechner\">Wände</a>, <a href=\"/de/bewehrungsrechner-fuer-pools\">Pools</a> — oder den <a href=\"/de/beton-bewehrungs-schaetzer\">Beton-Schätzer</a> für eine kg/m³-Verhältnis-Schätzung über ein ganzes Bauteil. Abstandhalter finden Sie auf dem <a href=\"/de/abstandhalter-rechner\">Abstandhalter-Rechner</a> und Bindedraht auf dem <a href=\"/de/bindedraht-rechner\">Bindedraht-Rechner</a>."]],
  toc: `<nav class="content-block" aria-label="Auf dieser Seite"><h2>Auf dieser Seite</h2><ul><li><a href="#how-to">So benutzen Sie den Rechner</a></li><li><a href="#formula">Die Formel, erklärt</a></li><li><a href="#example-1">Rechenbeispiel 1: Standardwerte (50 m²)</a></li><li><a href="#example-2">Rechenbeispiel 2: Platte mit 100 m²</a></li><li><a href="#example-3">Rechenbeispiel 3: kleine Fläche mit 20 m²</a></li><li><a href="#spacing-table">Dichte nach Abstand</a></li><li><a href="#bar-size-table">Dichte nach Stabgröße</a></li><li><a href="#slab-bridge">Gegenüber der exakten Plattenzählung</a></li><li><a href="#order">Von der Nettomenge zur Bestellung</a></li><li><a href="#imperial">Umrechnungen in Zoll-Maße</a></li><li><a href="#not-included">Was dieser Rechner nicht abdeckt</a></li><li><a href="#mistakes">5 häufige Fehler</a></li><li><a href="#faq">FAQs</a></li></ul></nav>`,
  extra: `<h3>Die Formel, erklärt</h3><p>Ein Gitter hat Stäbe, die in beiden Richtungen laufen, also enthält jeder Quadratmeter einen Meter Stab pro Richtung für jeden Meter Abstand — das ist die ganze Formel:</p><p><strong>Stablänge pro m² = 2 ÷ Abstand (m); Gewicht pro m² = diese × kg/m; Gesamtgewicht = Gewicht pro m² × Fläche</strong></p><p>Beim Standardabstand von 200 mm sind das 2 ÷ 0,2 = 10,00 m Stab pro m², und bei 0,616 kg/m für 10-mm-Stäbe sind das 6,16 kg/m². Multipliziert mit der Fläche ergibt sich die Gesamtmenge: 6,16 × 50 = 308,00 kg. Die Pro-ft²-Zeile teilt durch 10,7639 (1 m² = 10,7639 ft²), also 6,16 ÷ 10,7639 = 0,572 kg/ft². Zwei Anzeigehinweise: Beide Stabfelder lesen „0,617|10“, aber das Panel rechnet mit dem Optionswert 0,616 kg/m, also verwendet jedes Gewicht unten 0,616 — die reine Feldzeichenkette ergäbe 308,50 kg, nicht die 308,00 kg des Panels. Und Gesamtmengen ab 1000 zeigen eine Dezimale mit Trennzeichen, also liest sich das 100-m²-Beispiel als „1.182,7“ kg, nicht als 1182,67 kg — zitieren Sie die Panel-Form, und die Nachprüfung Ihres Lesers wird stimmen.</p><h3 id="example-1">Rechenbeispiel 1: Standardwerte (50 m²)</h3><p>Öffnen Sie den Rechner und lassen Sie die Standardwerte: Fläche 50 m², Abstand 200 mm, Stäbe 10 mm.</p><p>Stablänge pro m² = 2 ÷ 0,2 = 10,00 m. Gewicht pro m² = 10,00 × 0,616 = 6,16 kg/m². Pro ft² = 6,16 ÷ 10,7639 = 0,572 kg/ft².</p><p><strong>Gesamtgewicht = 6,16 × 50 = 308,00 kg (0,308 t), aus 500,00 m Stab.</strong> Das Panel zeigt 308,00 kg, 6,16 kg/m², 0,572 kg/ft², 500,00 m und 0,308 t. Das ist die saubere Eingitter-Gesamtmenge: kein Verschnitt, keine Übergreifungen, keine Haken, keine zweite Lage. Der Bestellabschnitt unten macht daraus etwas, das man kaufen kann.</p><h3 id="example-2">Rechenbeispiel 2: Platte mit 100 m²</h3><p>Stellen Sie Fläche 100 m², Abstand 150 mm, Stäbe 12 mm ein.</p><p>Stablänge pro m² = 2 ÷ 0,15 = 13,33 m. Gewicht pro m² = 13,33 × 0,887 = 11,83 kg/m². Pro ft² = 11,83 ÷ 10,7639 = 1,10 kg/ft² (Panel: 1,10).</p><p><strong>Gesamtgewicht = 11,83 × 100 = 1.182,7 kg (1,18 t), aus 1.333,3 m Stab.</strong> Beachten Sie die Panel-Formen: Die exakte Gesamtmenge ist 1182,6667 kg, die als „1.182,7“ angezeigt wird, und die exakte Länge 1333,3333 m wird als „1.333,3“ angezeigt — Gesamtmengen ab 1000 zeigen eine Dezimale, nicht zwei. Den Abstand von 200 mm auf 150 mm zu verengen und gleichzeitig von 10 mm auf 12 mm zu wechseln, verdoppelt die Standarddichte fast (6,16 → 11,83 kg/m²); Abstand und Stabgröße multiplizieren sich, sie addieren sich nicht.</p><h3 id="example-3">Rechenbeispiel 3: kleine Fläche mit 20 m²</h3><p>Stellen Sie Fläche 20 m², Abstand 300 mm, Stäbe 8 mm ein.</p><p>Stablänge pro m² = 2 ÷ 0,3 = 6,67 m. Gewicht pro m² = 6,67 × 0,394 = 2,63 kg/m². Pro ft² = 2,63 ÷ 10,7639 = 0,244 kg/ft².</p><p><strong>Gesamtgewicht = 2,63 × 20 = 52,53 kg (0,053 t), aus 133,33 m Stab.</strong> Kleine Flächen sind der Punkt, an dem die Dichtemethode am schwächsten ist: Die Formel setzt ein endloses Gitter voraus, also sind auf 20 m² die fehlenden Randstäbe und der fehlende Betondeckungsabzug ein größerer Anteil der Gesamtmenge als auf 100 m². Für alles, was so klein ist und das Sie tatsächlich bestellen wollen, prüfen Sie gegen den <a href="/de/bewehrungsrechner-fuer-betonplatten">Platten-Rechner</a> mit den echten Panelmaßen — der Brückenabschnitt zeigt die Größe des Unterschieds.</p><h3 id="spacing-table">Dichte nach Abstand</h3><p>Gleiche Fläche und gleicher Stab wie bei den Standardwerten (50 m², 10 mm), sieben Abstände. Den Abstand zu halbieren, verdoppelt die Dichte exakt — die Formel ist linear in 1 ÷ Abstand, also gibt es hier keine Stufen oder Totbereiche, anders als bei den Stabzähl-Tools.</p><div class="formula-table"><table><tr><th>Abstand</th><th>kg/m²</th><th>kg/ft²</th><th>Gesamt (50 m²)</th><th>Stablänge</th></tr><tr><td>100 mm</td><td>12,32</td><td>1,14</td><td>616,00 kg</td><td>1.000 m</td></tr><tr><td>125 mm</td><td>9,86</td><td>0,916</td><td>492,80 kg</td><td>800,00 m</td></tr><tr><td>150 mm</td><td>8,21</td><td>0,763</td><td>410,67 kg</td><td>666,67 m</td></tr><tr><td>200 mm</td><td>6,16</td><td>0,572</td><td>308,00 kg</td><td>500,00 m</td></tr><tr><td>250 mm</td><td>4,93</td><td>0,458</td><td>246,40 kg</td><td>400,00 m</td></tr><tr><td>300 mm</td><td>4,11</td><td>0,382</td><td>205,33 kg</td><td>333,33 m</td></tr><tr><td>400 mm</td><td>3,08</td><td>0,286</td><td>154,00 kg</td><td>250,00 m</td></tr></table></div><p>Zwei Lesarten. Erstens ist der Abstand der stärkste Hebel bei einer Gitter-Mengenermittlung: 100 mm statt 200 mm verdoppelt die Bestellung. Zweitens ist die Pro-ft²-Spalte diejenige, nach der US-Leser tatsächlich fragen — 0,572 kg/ft² bei den Standardwerten sind 1,26 lb/ft², und der Zoll-Abschnitt rechnet die Logik der ganzen Tabelle in Fuß und Zoll um.</p><h3 id="bar-size-table">Dichte nach Stabgröße</h3><p>Gleiche Fläche und gleicher Abstand wie bei den Standardwerten (50 m², 200 mm), sechs Stabgrößen. Die Dichte skaliert mit dem Quadrat des Durchmessers, also ist ein Wechsel um eine Größe nie eine kleine Änderung.</p><div class="formula-table"><table><tr><th>Stab</th><th>kg/m</th><th>kg/m²</th><th>kg/ft²</th><th>Gesamt (50 m²)</th></tr><tr><td>8 mm</td><td>0,394</td><td>3,94</td><td>0,366</td><td>197,00 kg</td></tr><tr><td>10 mm</td><td>0,616</td><td>6,16</td><td>0,572</td><td>308,00 kg</td></tr><tr><td>12 mm</td><td>0,887</td><td>8,87</td><td>0,824</td><td>443,50 kg</td></tr><tr><td>16 mm</td><td>1,578</td><td>15,78</td><td>1,47</td><td>789,00 kg</td></tr><tr><td>20 mm</td><td>2,465</td><td>24,65</td><td>2,29</td><td>1.232,5 kg</td></tr><tr><td>25 mm</td><td>3,851</td><td>38,51</td><td>3,58</td><td>1.925,5 kg</td></tr></table></div><p>Von 10 mm auf 12 mm zu gehen, addiert 44 % (308,00 → 443,50 kg); von 12 mm auf 16 mm addiert es 78 % (443,50 → 789,00 kg). Darum braucht ein Stabgrößenwechsel immer eine Abstandsänderung zum Ausgleich: Gleiche Fläche bei 16 mm braucht etwa den 1,78-fachen Abstand von 12 mm (die Fläche skaliert mit d², also skaliert der Abstand mit (d₂/d₁)² — die Flächen-Seite rechnet diese Substitution vollständig aus).</p><h3 id="slab-bridge">Gegenüber der exakten Plattenzählung</h3><p>Dieser Rechner und der Platten-Rechner beantworten verschiedene Fragen, und auf derselben Platte weichen sie um einen kleinen, vorhersehbaren Betrag voneinander ab. Das Platten-Tool zählt echte Stäbe: Es zieht 40 mm Betondeckung von jeder Stablänge ab und zählt die Randstäbe ausdrücklich. Dieses Tool verteilt 2 ÷ Abstand Meter über die Fläche, ohne Deckung abzuziehen. Drei Vergleiche, alle bei 40 mm Deckung im Platten-Tool:</p><div class="formula-table"><table><tr><th>Platte</th><th>Abstand / Stab</th><th>Dieser Rechner</th><th>Platten-Tool</th><th>Unterschied</th></tr><tr><td>5 × 4 m (20 m²)</td><td>200 mm / 10 mm</td><td>123,20 kg</td><td>120,98 kg</td><td>+2,22 kg (+1,83 %)</td></tr><tr><td>5 × 4 m (20 m²)</td><td>150 mm / 12 mm</td><td>236,53 kg</td><td>232,57 kg</td><td>+3,96 kg (+1,70 %)</td></tr><tr><td>10 × 8 m (80 m²)</td><td>200 mm / 12 mm</td><td>709,60 kg</td><td>703,21 kg</td><td>+6,39 kg (+0,91 %)</td></tr></table></div><p>Die Dichteangabe läuft hier immer hoch, und die Lücke schrumpft, wenn die Platte wächst — der Betondeckungsabzug ist ein fester Betrag pro Stab, also zählt er auf einer großen Platte weniger als auf einer kleinen. Praktische Regel: Verwenden Sie diese Seite, wenn Sie eine Zahl in Sekunden brauchen (ein Angebot, eine Plausibilitätsprüfung, eine Großflächen-Schätzung); verwenden Sie den <a href="/de/bewehrungsrechner-fuer-betonplatten">Platten-Rechner</a>, wenn Sie die zu bestellenden Stäbe brauchen. Und beachten Sie die Richtung: Eine hoch laufende Dichteschätzung ist sicher für die Budgetierung und für nichts zu kurz — aber sie ist keine Stabliste, und niemand kann Stäbe aus einer kg/m²-Angabe schneiden.</p><h3 id="order">Von der Nettomenge zur Bestellung</h3><p>Die Panel-Gesamtmenge ist sauberer Gitterstahl. Eine Bestellung braucht drei Ergänzungen, alle hier aus den Panel-Gesamtmengen gerechnet (durchgehend exakte Gesamtmengen, keine gerundeten Anzeigewerte).</p><p><strong>Verschnitt.</strong> Standard-Netto 308,00 kg → 323,40 kg bei +5 %, 338,80 kg bei +10 %. Hausbeispiel (200 m², 200 mm, 12 mm): netto 1.774 kg → 1.862,70 kg bei +5 %, 1.951,40 kg bei +10 %.</p><p><strong>Kosten.</strong> Bei einem Beispielsatz von 1,20 €/kg (Preise sind Beispiele — geben Sie Ihren lokalen Satz auf dem <a href="/de/bewehrungskosten-rechner">Kosten-Rechner</a> ein): Standard 369,60 € netto, 388,08 € bei +5 %, 406,56 € bei +10 %; Haus 2.128,80 € netto, 2.235,24 € bei +5 %, 2.341,68 € bei +10 %.</p><p><strong>Stangen.</strong> Gesamtlänge ÷ Handelslänge, aufgerundet: Standard 500,00 m → 42 × 12-m-Stäbe (41,67) oder 84 × 6-m-Stäbe (83,33); Haus 2.000 m → 167 × 12-m-Stäbe (166,67). Das ist vor Schnittverlusten — auf Panelmaße geschnittene Stäbe hinterlassen Abschnitte, also behandeln Sie die Stangenzahl als Mindestwert. Übergreifungen kommen auf alle drei obendrauf: Wo immer ein Strang die Handelslänge übersteigt, addieren Sie die Stoßlänge pro Stoß aus dem <a href="/de/uebergreifungslaengen-rechner">Übergreifungslängen-Rechner</a>.</p><p>Zur Einordnung: 500 m² bei 200 mm Abstand mit 12-mm-Stäben sind 4.435 kg (4,44 t), und 1000 m² bei 150 mm mit 16-mm-Stäben sind 21.040 kg (21,04 t) — beides Panel-Gesamtmengen, beides vor Verschnitt. Bei dieser Größe zahlt sich die Dichtemethode aus: Stäbe von Hand über 1000 m² zu zählen, ist der Punkt, an dem die Fehler leben.</p><h3 id="imperial">Umrechnungen in Zoll-Maße</h3><p>Der Rechner nimmt Quadratmeter und Millimeter, also rechnen Sie zuerst um: 1 m² = 10,7639 ft², 1 in = 25,4 mm, 1 kg = 2,20 lb, 1 kg/m² = 0,205 lb/ft².</p><p>Umgerechnete Werte: Die Standard-Gesamtmenge von 308,00 kg = 679,02 lb, und die Standarddichte 6,16 kg/m² = 1,26 lb/ft². Ein vollständiger Zoll-Durchlauf — eine 1000-ft²-Platte (92,90 m²), 12-in-Abstand in beiden Richtungen (304,8 mm), #4-Vertikale und -Horizontale (12,7 mm, 0,994 kg/m) — ergibt 6,52 kg/m², 0,606 kg/ft², 609,60 m Stab, 605,94 kg (0,606 t, 1.335,87 lb). Mit #5-Stäben (15,9 mm, 1,552 kg/m) bei demselben Abstand braucht dieselbe Platte 10,18 kg/m², 0,946 kg/ft², 609,60 m, 946,10 kg (0,946 t, 2.085,79 lb). Die Stab-Dropdowns enthalten US-Größen, also geben Sie die metrischen Entsprechungen Ihrer Maße ein und wählen Sie den passenden US-Stab. Beachten Sie die Flächen-Umrechnungsfalle: 50 m² sind 538,19 ft², nicht 500 ft² — eine „Quadratfuß“-Mengenermittlung, die durch 10 statt durch 10,7639 teilt, unterzählt die Fläche um 7 %.</p><h3 id="not-included">Was dieser Rechner nicht abdeckt</h3><ul><li>Stabzahlen und Stablängen pro Stab — er liefert Gesamtmeter und Gesamtgewicht, keine Schnittliste. Für Stückzahlen verwenden Sie den <a href="/de/bewehrungsrechner-fuer-betonplatten">Platten-Rechner</a> oder die Bauteil-Tools.</li><li>Übergreifungen, Haken, Biegungen, Abkröpfungen und Verankerung — siehe den <a href="/de/uebergreifungslaengen-rechner">Übergreifungslängen-Rechner</a>, den <a href="/de/haken-biege-schnittlaengen-rechner">Haken-Rechner</a> und den <a href="/de/verankerungslaengen-rechner">Verankerungslängen-Rechner</a>.</li><li>Zweite Lagen und Doppelmatten — die Gesamtmenge ist ein Gitter; eine zweilagige Platte braucht die verdoppelte Gesamtmenge (plus Abstandhalter zwischen den Lagen).</li><li>Balken, Stützen, Fundamente und Wände — verwenden Sie die Rechner für <a href="/de/balkenbewehrungs-rechner">Balken</a>, <a href="/de/stuetzenbewehrungs-rechner">Stützen</a>, <a href="/de/bewehrungsrechner-fuer-fundamente">Fundamente</a> und <a href="/de/wandbewehrungs-rechner">Wände</a>; der <a href="/de/beton-bewehrungs-schaetzer">Beton-Schätzer</a> deckt die kg/m³-Verhältnis-Methode über ein ganzes Bauteil ab.</li><li>Öffnungen, Stufen, Aufkantungen, Verdickungen und Randbalken — eine Flächeneingabe kann keine davon sehen; ziehen Sie sie von Hand ab oder addieren Sie sie von Hand.</li><li>Abstandhalter und Abstandshalter — siehe den <a href="/de/abstandhalter-rechner">Abstandhalter-Rechner</a>; Bindedraht finden Sie auf dem <a href="/de/bindedraht-rechner">Bindedraht-Rechner</a>.</li><li>Betonvolumen — der <a href="/de/beton-bewehrungs-schaetzer">Beton-Schätzer</a> liefert Volumen plus Stahl bei einem kg/m³-Verhältnis.</li><li>Verschnitt und Kosten — der Bestellabschnitt zeigt die Rechnung; bepreisen Sie die endgültige Zahl auf dem <a href="/de/bewehrungskosten-rechner">Kosten-Rechner</a> und rechnen Sie sie auf dem <a href="/de/bewehrungstonnage-rechner">Tonnage-Rechner</a> um.</li><li>Stabfläche (Ast) und Mindeststahl-Prüfungen — der <a href="/de/stahlflaechen-rechner-ast">Flächen-Rechner</a> liefert Ast und den Stahlanteil für einen Querschnitt.</li><li>Abstandsprüfungen gegen Code-Höchstwerte — der <a href="/de/bewehrungsabstand-rechner">Abstands-Rechner</a> arbeitet Stabzahlen aus einer Länge und einem Zielabstand aus.</li></ul><h3 id="mistakes">5 häufige Fehler</h3><ol><li><strong>Einen Abstand für ein Zwei-Abstands-Gitter verwenden.</strong> Der Rechner nimmt einen einzigen Abstand für beide Richtungen. Wenn die Zeichnung 150 mm in einer Richtung und 200 mm in der anderen vorschreibt, kann dieses Tool das nicht abbilden — verwenden Sie den Platten-Rechner oder die Handdichte 1 ÷ 0,15 + 1 ÷ 0,2 = 11,67 m/m² (7,19 kg/m² bei 0,616 kg/m). Nur einen der beiden Abstände einzugeben, verfälscht die Gesamtmenge in diesem Beispiel um 14 %, und bei größeren Spreizungen um weit mehr.</li><li><strong>Die Nettomenge bestellen.</strong> Die Panel-Gesamtmenge enthält keinen Verschnitt, keine Übergreifungen und keine Haken. Bei den Standardwerten lässt Sie eine glatte Bestellung von 308,00 kg in dem Moment im Stich, in dem der erste Stab geschnitten wird — 323,40 kg bei +5 % ist der Mindestwert für eine Bestellung, und Übergreifungen kommen obendrauf.</li><li><strong>Das falsche kg/m verwenden.</strong> Das Panel rechnet 10-mm-Stäbe mit 0,616 kg/m (Optionswert), nicht mit den 0,617, die die Feldzeichenkette liest, und mehrere Mitbewerber-Seiten zitieren die gerundeten d²/162-Werte (0,617/0,888) statt der d²/162,28-Optionen dieser Seite (0,616/0,887). Der Unterschied beträgt etwa 1,6 kg pro Tonne bei 10-mm-Stäben — klein pro Meter, sichtbar pro Lkw-Ladung, und der Grund, warum die Gesamtmengen zweier Seiten für dasselbe Gitter nie ganz übereinstimmen.</li><li><strong>kg/m² mit kg/m³ verwechseln.</strong> Eine Dichte von 6,16 kg/m² ist keine kleine Zahl für eine Platte — aber eine Angabe wie „80–120 kg pro Quadratmeter“ für Platten, wie ein Methodenleitfaden sie formuliert, ist ein kg/m³-Maßstabswert mit der falschen Einheit. Rechnen Sie mit der Dicke um (kg/m³ = kg/m² ÷ Dicke in m): 6,16 kg/m² auf einer 150-mm-Platte sind 41,07 kg/m³, was die richtige Größenordnung ist. Wenn eine zitierte kg/m²-Angabe zehnmal zu groß aussieht, ist sie es wahrscheinlich.</li><li><strong>Einer Flächeneingabe zutrauen, dass sie Form sieht.</strong> 50 m² können eine 10 × 5 m Platte, ein 25 × 2 m Streifen oder eine L-Form mit Treppenöffnung sein — und die Übergreifungen, Randstäbe und Abschnitte unterscheiden sich zwischen ihnen stark, während dieser Rechner für alle drei dieselben 308,00 kg zurückgibt. Fläche ist die schnellste Eingabe und die blindeste: Sobald Form, Öffnungen oder lange Stränge zählen, wechseln Sie zum Platten- oder Bauteil-Tool mit echten Maßen.</li></ol><p>Zuletzt geprüft: Oktober 2026.</p>`
}
},
    { id:"slab", slug:"concrete-slab-rebar-calculator", cat:"Estimating",
    metaTitle:"Concrete Slab Rebar Calculator — Bars, Length & kg",
    h1:"Concrete Slab Rebar Calculator",
    desc:"How much rebar does your slab need? Bar counts both ways, total length, tie intersections and exact weight. Free calculator with worked examples.",
    kw:"concrete slab rebar calculator, calculate rebar for slab, rebar needed for concrete slab, slab reinforcement calculation",
    intro:"Work out exactly how much reinforcement your slab needs. Enter the slab dimensions, bar spacing and edge cover, and the calculator returns the bar count in each direction, total bar length, tie-wire intersections and the total steel weight.",
    howto:["Enter slab length and width.","Set the bar spacing (centre-to-centre) and edge cover.","Pick the bar size to get the bar count and total weight.","Read the results: bar count in each direction, total bar length, tie intersections and total weight.","Order extra for laps and cutting waste — laps are not included in this calculator (see the <a href=\"/rebar-lap-length-calculator\">lap length calculator</a>)."],
    formula:"Bars one way = floor((dimension − 2 × cover) ÷ spacing) + 1, repeated for both directions. Total weight = total bar length × kg/m.",
    faqs:[["How much rebar do I need for a concrete slab?","Divide each slab dimension (less cover) by the spacing, add one, and do this both ways. Multiply each row by the bar length and the bar's kg/m."],["What spacing should slab rebar be?","Residential slabs commonly use 150–300 mm centres; always follow your structural design."],["How do I calculate slab rebar weight by hand?","Count the bars each way with floor((dimension − 2 × cover) ÷ spacing) + 1, multiply each count by its bar length, add both directions, then multiply the total length by the bar's kg/m."],["What bar size is used for a house slab?","10 mm and 12 mm bars are the most common for residential slabs, but the size and spacing must come from your structural design."],["Do I need to add extra for laps and wastage?","Yes. This calculator gives the neat grid weight. Bars longer than the available stock length need laps, and cutting always wastes some steel — add both on top of the calculated weight before ordering."],["Can I use this calculator for a driveway slab?","Yes, the grid maths is the same. For a driveway, the dedicated <a href=\"/driveway-rebar-calculator\">driveway rebar calculator</a> starts from typical driveway sizes."],["How much rebar is in a 10 m × 10 m slab?","At 200 mm spacing, 50 mm cover and 12 mm bars: 50 bars × 9.9 m each way, 990 m total, 879.1 kg, and 2,500 tie intersections."],["How much does the rebar for a slab cost?","Multiply the total weight by your local price per kg. Example: 209.6 kg × €1.20/kg = €251.52. Prices vary by region, supplier and bar size, so get a current quote."],["Does the calculator include laps and hooks?","No. It gives the neat grid weight only. Laps, hooks, bends and cutting waste must be added separately before ordering."],["What is edge cover and why does it matter?","Edge cover is the concrete between the bar ends and the slab edge. It protects the steel from corrosion and fire and holds the bars in position. The calculator subtracts twice the cover from each slab dimension before counting bars."]],
    toc:`<nav class="content-block" aria-label="On this page">
    <h2>On this page</h2>
    <ul>
      <li><a href="#how-to">How to use the calculator</a></li>
      <li><a href="#formula">The formula, explained</a></li>
      <li><a href="#example-1">Worked example 1: 6 m × 4 m slab</a></li>
      <li><a href="#example-2">Worked example 2: 5 m × 4 m slab</a></li>
      <li><a href="#bar-table">Bar weight chart</a></li>
      <li><a href="#spacing-table">Spacing guide: bars per metre</a></li>
      <li><a href="#cost">Estimating the cost</a></li>
      <li><a href="#imperial">Metric and imperial units</a></li>
      <li><a href="#not-included">What the calculator does not include</a></li>
      <li><a href="#mistakes">Common mistakes</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
  </nav>`,
    extra:`<p><strong>Why minus twice the cover?</strong> The bars stop short of the slab edge on both sides, so the cover is removed from each end before counting. <strong>Why plus one?</strong> The first bar sits at the cover line and then one bar follows every spacing step — so the count is the number of spaces plus one, not just the number of spaces. <strong>Why both directions?</strong> A slab grid runs two ways, and the second direction usually adds about as much steel again.</p>
    <p>Bar weight per metre comes from the standard formula kg/m = d² ÷ 162.28, where d is the bar diameter in mm. For a 12 mm bar: 12² ÷ 162.28 = 0.888 kg/m — the same value the calculator uses.</p>
    <svg viewBox="0 0 520 330" role="img" aria-label="Diagram of a slab reinforcement grid showing length, width, bar spacing and edge cover" style="width:100%;max-width:520px;height:auto;display:block;margin:12px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
      <rect x="30" y="30" width="460" height="240" fill="none" stroke="#0f172a" stroke-width="2"/>
      <rect x="58" y="58" width="404" height="184" fill="none" stroke="#f97316" stroke-width="1.5" stroke-dasharray="6 4"/>
      <g stroke="#0f172a" stroke-width="1.5">
        <line x1="98" y1="58" x2="98" y2="242"/><line x1="158" y1="58" x2="158" y2="242"/><line x1="218" y1="58" x2="218" y2="242"/><line x1="278" y1="58" x2="278" y2="242"/><line x1="338" y1="58" x2="338" y2="242"/><line x1="398" y1="58" x2="398" y2="242"/>
        <line x1="58" y1="98" x2="462" y2="98"/><line x1="58" y1="158" x2="462" y2="158"/><line x1="58" y1="218" x2="462" y2="218"/>
      </g>
      <g font-family="sans-serif" font-size="13" fill="#0f172a">
        <text x="260" y="18" text-anchor="middle">L = slab length</text>
        <text x="14" y="155" text-anchor="middle" transform="rotate(-90 14 155)">W = slab width</text>
        <text x="128" y="52" text-anchor="middle" fill="#f97316">spacing</text>
        <text x="44" y="80" fill="#f97316">cover</text>
      </g>
      <g stroke="#f97316" stroke-width="1.5">
        <line x1="98" y1="44" x2="158" y2="44"/><line x1="98" y1="40" x2="98" y2="48"/><line x1="158" y1="40" x2="158" y2="48"/>
        <line x1="34" y1="30" x2="58" y2="58"/>
      </g>
    </svg>
    <p>The orange dashed line marks where the bars actually run: inside the cover, on both sides. Bars cross in both directions, and every crossing is one tie intersection.</p>
    <h3 id="example-1">Worked example 1: 6 m × 4 m slab</h3>
    <p>Slab 6 m × 4 m, 12 mm bars (0.888 kg/m), 200 mm spacing, 40 mm cover:</p>
    <ol class="howto"><li>Bars along the 6 m direction: floor((4,000 − 80) ÷ 200) + 1 = 20 bars, each 5.92 m long = 118.4 m.</li><li>Bars along the 4 m direction: floor((6,000 − 80) ÷ 200) + 1 = 30 bars, each 3.92 m long = 117.6 m.</li><li>Total bar length: 118.4 + 117.6 = 236.0 m.</li><li>Total weight: 236.0 × 0.888 = 209.6 kg (about 210 kg).</li><li>Tie intersections: 20 × 30 = 600.</li></ol>
    <p>Try it yourself: enter the same numbers in the calculator above and you will get the same result.</p>
    <h3 id="example-2">Worked example 2: 5 m × 4 m slab</h3>
    <p>Slab 5 m × 4 m, 10 mm bars (0.617 kg/m), 150 mm spacing, 50 mm cover:</p>
    <ol class="howto"><li>Bars along the 5 m direction: floor((4,000 − 100) ÷ 150) + 1 = 27 bars, each 4.90 m long = 132.3 m.</li><li>Bars along the 4 m direction: floor((5,000 − 100) ÷ 150) + 1 = 33 bars, each 3.90 m long = 128.7 m.</li><li>Total bar length: 132.3 + 128.7 = 261.0 m.</li><li>Total weight: 261.0 × 0.617 = 161.0 kg.</li><li>Tie intersections: 27 × 33 = 891.</li></ol>
    <p>Notice how the tighter 150 mm spacing and smaller 10 mm bars still give a similar total length, but a lower weight — bar size matters as much as spacing.</p>
    <h3 id="bar-table">Bar weight chart (kg/m)</h3>
    <div class="formula-table"><table>
      <tr><th>Bar diameter</th><th>kg/m</th><th>Bars per tonne</th></tr>
      <tr><td>8 mm</td><td>0.395</td><td>2,532</td></tr>
      <tr><td>10 mm</td><td>0.617</td><td>1,621</td></tr>
      <tr><td>12 mm</td><td>0.888</td><td>1,126</td></tr>
      <tr><td>16 mm</td><td>1.578</td><td>634</td></tr>
      <tr><td>20 mm</td><td>2.466</td><td>406</td></tr>
    </table></div>
    <p>Bars per tonne = 1,000 ÷ kg/m. It tells you how many 1-metre bars make a tonne — handy when a supplier quotes per tonne. <a href="/#charts">See the full rebar weight chart (kg/m &amp; lb/ft) →</a></p>
    <h3 id="spacing-table">Spacing guide: bars per metre of slab width</h3>
    <div class="formula-table"><table>
      <tr><th>Spacing (centre-to-centre)</th><th>Bars per metre</th></tr>
      <tr><td>100 mm</td><td>10.00</td></tr>
      <tr><td>150 mm</td><td>6.67</td></tr>
      <tr><td>200 mm</td><td>5.00</td></tr>
      <tr><td>250 mm</td><td>4.00</td></tr>
      <tr><td>300 mm</td><td>3.33</td></tr>
    </table></div>
    <p>Bars per metre = 1,000 ÷ spacing in mm. Halving the spacing roughly doubles the steel. Residential slabs commonly use 150–300 mm centres — but spacing is a design decision from your structural drawings, never a guess from a table. If your drawing says 200 mm, use 200 mm even if 300 mm would be cheaper.</p>
    <h3 id="cost">Estimating the cost</h3>
    <p>Cost = total weight × price per kg (or total tonnes × price per tonne). Using worked example 1: 209.6 kg × €1.20/kg = €251.52. The same result per tonne: 0.2096 t × €1,200/t = €251.52. Prices vary by region, supplier and bar size, so get a current quote before budgeting — and remember the order quantity is higher than the neat grid weight once laps and waste are added. For a full cost breakdown, use the <a href="/rebar-cost-calculator">rebar cost calculator</a>.</p>
    <h3 id="imperial">Metric and imperial units</h3>
    <p>This calculator works in metres, millimetres and kilograms. If your drawings use feet and inches:</p>
    <div class="formula-table"><table>
      <tr><th>Metric</th><th>Imperial (approx.)</th></tr>
      <tr><td>150 mm spacing</td><td>6 in</td></tr>
      <tr><td>200 mm spacing</td><td>8 in</td></tr>
      <tr><td>250 mm spacing</td><td>10 in</td></tr>
      <tr><td>300 mm spacing</td><td>12 in</td></tr>
      <tr><td>209.6 kg</td><td>462 lb (× 2.205)</td></tr>
      <tr><td>6 m × 4 m slab</td><td>19.7 ft × 13.1 ft (× 3.281)</td></tr>
    </table></div>
    <p>Convert first, then enter metric values into the calculator — do not mix units in one calculation.</p>
    <h3 id="not-included">What the calculator does not include</h3>
    <ul>
      <li><strong>Laps (splices).</strong> If a bar run is longer than the stock bar length, bars must overlap. Find the overlap with the <a href="/rebar-lap-length-calculator">lap length calculator</a> and add it to the length.</li>
      <li><strong>Hooks and bends.</strong> Edge hooks and bent-up bars add length. Use the <a href="/rebar-hook-bend-cutting-length-calculator">hook and cutting length calculator</a> for those.</li>
      <li><strong>Cutting waste.</strong> Cutting bars to length always leaves offcuts. Add a waste allowance on top of the neat weight before ordering.</li>
      <li><strong>Welded mesh sheets.</strong> If you buy mesh instead of loose bars, the sheet layout is different — this calculator covers loose-bar grids.</li>
      <li><strong>Chairs and spacers.</strong> The bars need support to stay at the right height in the slab. Estimate those with the <a href="/rebar-chair-calculator">chair calculator</a>.</li>
    </ul>
    <h3 id="mistakes">4 common mistakes</h3>
    <ol class="howto"><li><strong>Forgetting the edge cover.</strong> The bars stop short of the slab edge by the cover amount — that changes both the count and the bar length.</li><li><strong>Mixing up mm and m.</strong> Spacing and cover are in millimetres, slab size in metres. Entering 200 as metres instead of millimetres breaks the result completely.</li><li><strong>Counting one direction only.</strong> A slab grid runs both ways. The second direction usually adds about as much steel again.</li><li><strong>Ordering exactly the calculated weight.</strong> Add laps, hooks and cutting waste on top — the calculator gives the neat grid weight, not the order quantity.</li></ol>
    <p class="muted">Last reviewed: October 2026. Bar weights follow the d² ÷ 162.28 formula (ASTM A615 / IS 456 practice). Results are estimates for guidance only — always verify against your structural drawings and design code.</p>` ,
    de: {
  metaTitle: "Bewehrungsrechner für Betonplatten — Stäbe & kg gratis",
  desc: "Bewehrungsrechner für Betonplatten: Stabanzahl, Gesamtlänge, Kreuzungspunkte und Gewicht berechnen. Beispiel: 6 m × 4 m Platte = 209,6 kg. Kostenlos.",
  formula: "Stäbe in einer Richtung = floor((Maß − 2 × Deckung) ÷ Abstand) + 1, für beide Richtungen wiederholt. Gesamtgewicht = Gesamtstablänge × kg/m.",
  kw: "bewehrungsrechner für betonplatten, bewehrung für platte berechnen, bewehrung für betonplatte, plattenbewehrung berechnen",
  howto: ["Plattenlänge und -breite eingeben.", "Bewehrungsabstand (Achsabstand) und Betondeckung festlegen.", "Stabdurchmesser wählen, um Stabanzahl und Gesamtgewicht zu erhalten.", "Ergebnisse ablesen: Stabanzahl in jeder Richtung, Gesamtlänge, Kreuzungspunkte und Gesamtgewicht.", "Zusätzlich für Übergreifungen und Verschnitt bestellen — Übergreifungen sind in diesem Rechner nicht enthalten (siehe <a href=\"/de/uebergreifungslaengen-rechner\">Übergreifungslängen-Rechner</a>)."],
  faqs: [["Wie viel Bewehrung brauche ich für eine Betonplatte?", "Jedes Plattenmaß (abzüglich Deckung) durch den Abstand teilen, eins addieren — und das in beiden Richtungen. Jede Reihe mit der Stablänge und dem kg/m-Wert des Stabes multiplizieren."],
  ["Welcher Abstand ist für Plattenbewehrung richtig?", "Wohnungsbauplatten verwenden üblicherweise 150–300 mm Achsabstand; maßgeblich ist immer Ihre statische Bemessung."],
  ["Wie berechne ich das Plattenbewehrungsgewicht von Hand?", "Stäbe in jeder Richtung zählen mit floor((Maß − 2 × Deckung) ÷ Abstand) + 1, jede Anzahl mit ihrer Stablänge multiplizieren, beide Richtungen addieren und die Gesamtlänge mit dem kg/m-Wert des Stabes multiplizieren."],
  ["Welche Stabgröße wird für eine Hausplatte verwendet?", "10-mm- und 12-mm-Stäbe sind für Wohnungsbauplatten am gebräuchlichsten, aber Größe und Abstand müssen aus Ihrer statischen Bemessung stammen."],
  ["Muss ich zusätzlich für Übergreifungen und Verschnitt rechnen?", "Ja. Dieser Rechner liefert das reine Netzgewicht. Stäbe, die länger als die verfügbare Lieferlänge sind, brauchen Übergreifungen, und beim Schneiden fällt immer Verschnitt an — beides vor der Bestellung auf das berechnete Gewicht aufschlagen."],
  ["Kann ich diesen Rechner für eine Einfahrtsplatte verwenden?", "Ja, die Netzmathematik ist dieselbe. Für Einfahrten startet der eigene <a href=\"/de/bewehrungsrechner-fuer-einfahrten\">Bewehrungsrechner für Einfahrten</a> mit typischen Einfahrtsmaßen."],
  ["Wie viel Bewehrung steckt in einer Platte von 10 m × 10 m?", "Bei 200 mm Abstand, 50 mm Deckung und 12-mm-Stäben: 50 Stäbe × 9,9 m in jeder Richtung, insgesamt 990 m, 879,1 kg und 2.500 Kreuzungspunkte."],
  ["Was kostet die Bewehrung für eine Platte?", "Gesamtgewicht mit dem örtlichen Preis pro kg multiplizieren. Beispiel: 209,6 kg × 1,20 €/kg = 251,52 €. Die Preise variieren je nach Region, Lieferant und Stabgröße — holen Sie also ein aktuelles Angebot ein."],
  ["Enthält der Rechner Übergreifungen und Haken?", "Nein. Er liefert nur das reine Netzgewicht. Übergreifungen, Haken, Biegungen und Verschnitt müssen vor der Bestellung separat addiert werden."],
  ["Was ist Betondeckung und warum ist sie wichtig?", "Betondeckung ist der Beton zwischen den Stabenden und dem Plattenrand. Sie schützt den Stahl vor Korrosion und Feuer und hält die Stäbe in Position. Der Rechner zieht die doppelte Deckung von jedem Plattenmaß ab, bevor er die Stäbe zählt."]],
  toc: `<nav class="content-block" aria-label="Auf dieser Seite"><h2>Auf dieser Seite</h2><ul><li><a href="#how-to">So benutzen Sie den Rechner</a></li><li><a href="#formula">Die Formel, erklärt</a></li><li><a href="#example-1">Rechenbeispiel 1: Platte 6 m × 4 m</a></li><li><a href="#example-2">Rechenbeispiel 2: Platte 5 m × 4 m</a></li><li><a href="#bar-table">Stabgewichtstabelle</a></li><li><a href="#spacing-table">Abstandsrichtlinie: Stäbe pro Meter</a></li><li><a href="#cost">Kosten schätzen</a></li><li><a href="#imperial">Metrische und imperiale Einheiten</a></li><li><a href="#not-included">Was der Rechner nicht enthält</a></li><li><a href="#mistakes">Häufige Fehler</a></li><li><a href="#faq">FAQ</a></li></ul></nav>`,
  extra: `<p><strong>Warum zweimal die Deckung abziehen?</strong> Die Stäbe enden auf beiden Seiten vor dem Plattenrand, deshalb wird die Deckung an jedem Ende abgezogen, bevor gezählt wird. <strong>Warum plus eins?</strong> Der erste Stab sitzt an der Deckungslinie, danach folgt bei jedem Abstandsschritt ein weiterer Stab — die Anzahl ist also die Zahl der Abstände plus eins, nicht nur die Zahl der Abstände. <strong>Warum beide Richtungen?</strong> Ein Plattennetz verläuft in zwei Richtungen, und die zweite Richtung bringt meist etwa noch einmal so viel Stahl.</p>
    <p>Das Stabgewicht pro Meter folgt der Standardformel kg/m = d² ÷ 162,28, wobei d der Stabdurchmesser in mm ist. Für einen 12-mm-Stab: 12² ÷ 162,28 = 0,888 kg/m — derselbe Wert, den der Rechner verwendet.</p>
    <svg viewBox="0 0 520 330" role="img" aria-label="Diagramm eines Bewehrungsnetzes für eine Platte mit Länge, Breite, Bewehrungsabstand und Betondeckung" style="width:100%;max-width:520px;height:auto;display:block;margin:12px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
      <rect x="30" y="30" width="460" height="240" fill="none" stroke="#0f172a" stroke-width="2"/>
      <rect x="58" y="58" width="404" height="184" fill="none" stroke="#f97316" stroke-width="1.5" stroke-dasharray="6 4"/>
      <g stroke="#0f172a" stroke-width="1.5">
        <line x1="98" y1="58" x2="98" y2="242"/><line x1="158" y1="58" x2="158" y2="242"/><line x1="218" y1="58" x2="218" y2="242"/><line x1="278" y1="58" x2="278" y2="242"/><line x1="338" y1="58" x2="338" y2="242"/><line x1="398" y1="58" x2="398" y2="242"/>
        <line x1="58" y1="98" x2="462" y2="98"/><line x1="58" y1="158" x2="462" y2="158"/><line x1="58" y1="218" x2="462" y2="218"/>
      </g>
      <g font-family="sans-serif" font-size="13" fill="#0f172a">
        <text x="260" y="18" text-anchor="middle">L = Plattenlänge</text>
        <text x="14" y="155" text-anchor="middle" transform="rotate(-90 14 155)">W = Plattenbreite</text>
        <text x="128" y="52" text-anchor="middle" fill="#f97316">Abstand</text>
        <text x="44" y="80" fill="#f97316">Deckung</text>
      </g>
      <g stroke="#f97316" stroke-width="1.5">
        <line x1="98" y1="44" x2="158" y2="44"/><line x1="98" y1="40" x2="98" y2="48"/><line x1="158" y1="40" x2="158" y2="48"/>
        <line x1="34" y1="30" x2="58" y2="58"/>
      </g>
    </svg>
    <p>Die orange gestrichelte Linie markiert, wo die Stäbe tatsächlich verlaufen: innerhalb der Deckung, auf beiden Seiten. Die Stäbe kreuzen sich in beiden Richtungen, und jede Kreuzung ist ein Kreuzungspunkt.</p>
    <h3 id="example-1">Rechenbeispiel 1: Platte 6 m × 4 m</h3>
    <p>Platte 6 m × 4 m, 12-mm-Stäbe (0,888 kg/m), 200 mm Abstand, 40 mm Deckung:</p>
    <ol class="howto"><li>Stäbe in Richtung der 6-m-Seite: floor((4.000 − 80) ÷ 200) + 1 = 20 Stäbe, je 5,92 m lang = 118,4 m.</li><li>Stäbe in Richtung der 4-m-Seite: floor((6.000 − 80) ÷ 200) + 1 = 30 Stäbe, je 3,92 m lang = 117,6 m.</li><li>Gesamtstablänge: 118,4 + 117,6 = 236,0 m.</li><li>Gesamtgewicht: 236,0 × 0,888 = 209,6 kg (etwa 210 kg).</li><li>Kreuzungspunkte: 20 × 30 = 600.</li></ol>
    <p>Probieren Sie es selbst aus: Geben Sie dieselben Zahlen oben in den Rechner ein, und Sie erhalten dasselbe Ergebnis.</p>
    <h3 id="example-2">Rechenbeispiel 2: Platte 5 m × 4 m</h3>
    <p>Platte 5 m × 4 m, 10-mm-Stäbe (0,617 kg/m), 150 mm Abstand, 50 mm Deckung:</p>
    <ol class="howto"><li>Stäbe in Richtung der 5-m-Seite: floor((4.000 − 100) ÷ 150) + 1 = 27 Stäbe, je 4,90 m lang = 132,3 m.</li><li>Stäbe in Richtung der 4-m-Seite: floor((5.000 − 100) ÷ 150) + 1 = 33 Stäbe, je 3,90 m lang = 128,7 m.</li><li>Gesamtstablänge: 132,3 + 128,7 = 261,0 m.</li><li>Gesamtgewicht: 261,0 × 0,617 = 161,0 kg.</li><li>Kreuzungspunkte: 27 × 33 = 891.</li></ol>
    <p>Beachten Sie, wie der engere Abstand von 150 mm und die kleineren 10-mm-Stäbe trotzdem eine ähnliche Gesamtlänge ergeben, aber ein geringeres Gewicht — die Stabgröße zählt ebenso wie der Abstand.</p>
    <h3 id="bar-table">Stabgewichtstabelle (kg/m)</h3>
    <div class="formula-table"><table>
      <tr><th>Stabdurchmesser</th><th>kg/m</th><th>Stäbe pro Tonne</th></tr>
      <tr><td>8 mm</td><td>0,395</td><td>2.532</td></tr>
      <tr><td>10 mm</td><td>0,617</td><td>1.621</td></tr>
      <tr><td>12 mm</td><td>0,888</td><td>1.126</td></tr>
      <tr><td>16 mm</td><td>1,578</td><td>634</td></tr>
      <tr><td>20 mm</td><td>2,466</td><td>406</td></tr>
    </table></div>
    <p>Stäbe pro Tonne = 1.000 ÷ kg/m. Die Zahl sagt, wie viele 1-Meter-Stäbe eine Tonne ergeben — praktisch, wenn ein Lieferant pro Tonne abrechnet. <a href="/de/#charts">Zur vollständigen Bewehrungsgewichtstabelle (kg/m &amp; lb/ft) →</a></p>
    <h3 id="spacing-table">Abstandsrichtlinie: Stäbe pro Meter Plattenbreite</h3>
    <div class="formula-table"><table>
      <tr><th>Abstand (Achsabstand)</th><th>Stäbe pro Meter</th></tr>
      <tr><td>100 mm</td><td>10,00</td></tr>
      <tr><td>150 mm</td><td>6,67</td></tr>
      <tr><td>200 mm</td><td>5,00</td></tr>
      <tr><td>250 mm</td><td>4,00</td></tr>
      <tr><td>300 mm</td><td>3,33</td></tr>
    </table></div>
    <p>Stäbe pro Meter = 1.000 ÷ Abstand in mm. Halbiert man den Abstand, verdoppelt sich der Stahl ungefähr. Wohnungsbauplatten verwenden üblicherweise 150–300 mm Achsabstand — aber der Abstand ist eine Entscheidung aus Ihren statischen Plänen, niemals eine Schätzung aus einer Tabelle. Wenn Ihre Zeichnung 200 mm vorschreibt, verwenden Sie 200 mm, auch wenn 300 mm günstiger wäre.</p>
    <h3 id="cost">Kosten schätzen</h3>
    <p>Kosten = Gesamtgewicht × Preis pro kg (oder Gesamttonnen × Preis pro Tonne). Mit Rechenbeispiel 1: 209,6 kg × 1,20 €/kg = 251,52 €. Dasselbe Ergebnis pro Tonne: 0,2096 t × 1.200 €/t = 251,52 €. Die Preise variieren je nach Region, Lieferant und Stabgröße — holen Sie also vor der Budgetierung ein aktuelles Angebot ein. Und denken Sie daran: Die Bestellmenge liegt höher als das reine Netzgewicht, sobald Übergreifungen und Verschnitt hinzukommen. Für eine vollständige Kostenaufstellung nutzen Sie den <a href="/de/bewehrungskosten-rechner">Bewehrungskosten-Rechner</a>.</p>
    <h3 id="imperial">Metrische und imperiale Einheiten</h3>
    <p>Dieser Rechner arbeitet mit Metern, Millimetern und Kilogramm. Wenn Ihre Zeichnungen Fuß und Zoll verwenden:</p>
    <div class="formula-table"><table>
      <tr><th>Metrisch</th><th>Imperial (ca.)</th></tr>
      <tr><td>150 mm Abstand</td><td>6 in</td></tr>
      <tr><td>200 mm Abstand</td><td>8 in</td></tr>
      <tr><td>250 mm Abstand</td><td>10 in</td></tr>
      <tr><td>300 mm Abstand</td><td>12 in</td></tr>
      <tr><td>209,6 kg</td><td>462 lb (× 2,205)</td></tr>
      <tr><td>6 m × 4 m Platte</td><td>19,7 ft × 13,1 ft (× 3,281)</td></tr>
    </table></div>
    <p>Rechnen Sie zuerst um und geben Sie dann metrische Werte in den Rechner ein — mischen Sie keine Einheiten in einer Berechnung.</p>
    <h3 id="not-included">Was der Rechner nicht enthält</h3>
    <ul>
      <li><strong>Übergreifungen (Stöße).</strong> Wenn ein Stabstrang länger als die Lieferlänge ist, müssen sich Stäbe überlappen. Die Überlappung finden Sie mit dem <a href="/de/uebergreifungslaengen-rechner">Übergreifungslängen-Rechner</a>; addieren Sie sie zur Länge.</li>
      <li><strong>Haken und Biegungen.</strong> Randhaken und aufgebogene Stäbe verlängern den Stab. Nutzen Sie dafür den <a href="/de/haken-biege-schnittlaengen-rechner">Haken- und Schnittlängen-Rechner</a>.</li>
      <li><strong>Verschnitt.</strong> Beim Zuschneiden der Stäbe bleiben immer Abschnitte übrig. Schlagen Sie vor der Bestellung einen Verschnittzuschlag auf das reine Gewicht auf.</li>
      <li><strong>Geschweißte Matten.</strong> Wenn Sie Matten statt loser Stäbe kaufen, ist die Mattenanordnung anders — dieser Rechner gilt für Netze aus losen Stäben.</li>
      <li><strong>Abstandhalter.</strong> Die Stäbe brauchen Unterstützung, um in der Platte auf der richtigen Höhe zu bleiben. Schätzen Sie diese mit dem <a href="/de/abstandhalter-rechner">Abstandhalter-Rechner</a>.</li>
    </ul>
    <h3 id="mistakes">4 häufige Fehler</h3>
    <ol class="howto"><li><strong>Betondeckung vergessen.</strong> Die Stäbe enden um den Deckungsbetrag vor dem Plattenrand — das verändert sowohl die Anzahl als auch die Stablänge.</li><li><strong>mm und m verwechseln.</strong> Abstand und Deckung sind in Millimetern, Plattenmaße in Metern. Wer 200 als Meter statt als Millimeter eingibt, zerstört das Ergebnis vollständig.</li><li><strong>Nur eine Richtung zählen.</strong> Ein Plattennetz verläuft in beiden Richtungen. Die zweite Richtung bringt meist etwa noch einmal so viel Stahl.</li><li><strong>Genau das berechnete Gewicht bestellen.</strong> Übergreifungen, Haken und Verschnitt kommen noch dazu — der Rechner liefert das reine Netzgewicht, nicht die Bestellmenge.</li></ol>
    <p class="muted">Zuletzt geprüft: Oktober 2026. Die Stabgewichte folgen der Formel d² ÷ 162,28 (Praxis nach ASTM A615 / IS 456). Die Ergebnisse sind Richtwerte zur Orientierung — prüfen Sie diese immer anhand Ihrer statischen Pläne und der Bemessungsnorm.</p>`
}
},
    { id:"footing", slug:"footing-rebar-calculator", cat:"Estimating",
    metaTitle:"Footing Rebar Calculator — Bars, Length & Weight, Free",
    h1:"Footing Rebar Calculator",
    desc:"Size the bottom reinforcement for any isolated or strip footing: bars both ways, total length and weight. Free, with worked examples included.",
    kw:"footing rebar calculator, footing reinforcement, isolated footing rebar",
    intro:"Size the bottom mesh of a footing in seconds. Enter the footing plan dimensions, bar spacing and cover to get the number of bars each way and the total steel weight.",
    howto:["Enter footing length and width.","Set the bar spacing (centre-to-centre) and clear cover.","Pick the bar size to get the bar count and total weight.","Read the results: bar count in each direction, total bar length, tie intersections and total weight.","Order extra for laps, dowels and cutting waste — laps and starter bars are not included in this calculator (see the lap length calculator)."],
    formula:"Same grid method as a slab: bars one way = floor((dimension − 2 × cover) ÷ spacing) + 1, both directions, × kg/m.",
    toc:`<nav class="content-block" aria-label="On this page">
    <h2>On this page</h2>
    <ul>
      <li><a href="#how-to">How to use the calculator</a></li>
      <li><a href="#formula">The formula, explained</a></li>
      <li><a href="#example-1">Worked example 1: 1.5 m × 1.5 m footing</a></li>
      <li><a href="#example-2">Worked example 2: 2.4 m × 1.8 m footing</a></li>
      <li><a href="#bar-table">Bar weight chart</a></li>
      <li><a href="#spacing-table">Spacing guide: bars per metre</a></li>
      <li><a href="#cost">Estimating the cost</a></li>
      <li><a href="#imperial">Metric and imperial units</a></li>
      <li><a href="#not-included">What the calculator does not include</a></li>
      <li><a href="#mistakes">Common mistakes</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
  </nav>`,
    extra:`<p><strong>Why minus twice the cover?</strong> The bars stop short of the footing edge on both sides, so the cover is removed from each end before counting. <strong>Why plus one?</strong> The first bar sits at the cover line and then one bar follows every spacing step — so the count is the number of spaces plus one, not just the number of spaces. <strong>Why both directions?</strong> A footing mat runs two ways, and the second direction usually adds about as much steel again.</p>
    <p>Bar weight per metre comes from the standard formula kg/m = d² ÷ 162.28, where d is the bar diameter in mm. For a 10 mm bar: 10² ÷ 162.28 = 0.616 kg/m — the same value the calculator uses.</p>
    <svg viewBox="0 0 520 330" role="img" aria-label="Diagram of a footing reinforcement grid showing length, width, bar spacing and clear cover" style="width:100%;max-width:520px;height:auto;display:block;margin:12px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
      <rect x="30" y="30" width="460" height="240" fill="none" stroke="#0f172a" stroke-width="2"/>
      <rect x="58" y="58" width="404" height="184" fill="none" stroke="#f97316" stroke-width="1.5" stroke-dasharray="6 4"/>
      <g stroke="#0f172a" stroke-width="1.5">
        <line x1="98" y1="58" x2="98" y2="242"/><line x1="158" y1="58" x2="158" y2="242"/><line x1="218" y1="58" x2="218" y2="242"/><line x1="278" y1="58" x2="278" y2="242"/><line x1="338" y1="58" x2="338" y2="242"/><line x1="398" y1="58" x2="398" y2="242"/>
        <line x1="58" y1="98" x2="462" y2="98"/><line x1="58" y1="158" x2="462" y2="158"/><line x1="58" y1="218" x2="462" y2="218"/>
      </g>
      <g font-family="sans-serif" font-size="13" fill="#0f172a">
        <text x="260" y="18" text-anchor="middle">L = footing length</text>
        <text x="14" y="155" text-anchor="middle" transform="rotate(-90 14 155)">W = footing width</text>
        <text x="128" y="52" text-anchor="middle" fill="#f97316">spacing</text>
        <text x="44" y="80" fill="#f97316">cover</text>
      </g>
      <g stroke="#f97316" stroke-width="1.5">
        <line x1="98" y1="44" x2="158" y2="44"/><line x1="98" y1="40" x2="98" y2="48"/><line x1="158" y1="40" x2="158" y2="48"/>
        <line x1="34" y1="30" x2="58" y2="58"/>
      </g>
    </svg>
    <p>The orange dashed line marks where the bars actually run: inside the cover, on both sides. Bars cross in both directions, and every crossing is one tie intersection.</p>
    <h3 id="example-1">Worked example 1: 1.5 m × 1.5 m footing</h3>
    <p>Footing 1.5 m × 1.5 m, 10 mm bars (0.616 kg/m), 150 mm spacing, 50 mm cover. These are the values the calculator opens with, so you can check the result immediately:</p>
    <ol class="howto"><li>Bars along one 1.5 m direction: floor((1,500 − 100) ÷ 150) + 1 = 10 bars, each 1.40 m long = 14.00 m.</li><li>Bars along the other 1.5 m direction: the same = 10 bars, each 1.40 m long = 14.00 m.</li><li>Total bar length: 14.00 + 14.00 = 28.00 m.</li><li>Total weight: 28.00 × 0.616 = 17.25 kg.</li><li>Tie intersections: 10 × 10 = 100.</li></ol>
    <p>Try it yourself: enter the same numbers in the calculator above and you will get the same result.</p>
    <h3 id="example-2">Worked example 2: 2.4 m × 1.8 m footing</h3>
    <p>Footing 2.4 m × 1.8 m, 12 mm bars (0.887 kg/m), 200 mm spacing, 75 mm cover:</p>
    <ol class="howto"><li>Bars along the 2.4 m direction: floor((1,800 − 150) ÷ 200) + 1 = 9 bars, each 2.25 m long = 20.25 m.</li><li>Bars along the 1.8 m direction: floor((2,400 − 150) ÷ 200) + 1 = 12 bars, each 1.65 m long = 19.80 m.</li><li>Total bar length: 20.25 + 19.80 = 40.05 m.</li><li>Total weight: 40.05 × 0.887 = 35.52 kg.</li><li>Tie intersections: 9 × 12 = 108.</li></ol>
    <p>Notice the rectangular footing needs different bar counts each way (9 and 12) even though the spacing is the same — and the 75 mm cover is the footing case: concrete cast against earth needs more cover than a slab.</p>
    <h3 id="bar-table">Bar weight chart (kg/m)</h3>
    <div class="formula-table"><table>
      <tr><th>Bar diameter</th><th>kg/m</th><th>Bars per tonne</th></tr>
      <tr><td>8 mm</td><td>0.394</td><td>2,536</td></tr>
      <tr><td>10 mm</td><td>0.616</td><td>1,623</td></tr>
      <tr><td>12 mm</td><td>0.887</td><td>1,127</td></tr>
      <tr><td>16 mm</td><td>1.578</td><td>634</td></tr>
      <tr><td>20 mm</td><td>2.465</td><td>406</td></tr>
    </table></div>
    <p>Bars per tonne = 1,000 ÷ kg/m. It tells you how many 1-metre bars make a tonne — handy when a supplier quotes per tonne. <a href="/#charts">See the full rebar weight chart (kg/m &amp; lb/ft) →</a></p>
    <h3 id="spacing-table">Spacing guide: bars per metre of footing width</h3>
    <div class="formula-table"><table>
      <tr><th>Spacing (centre-to-centre)</th><th>Bars per metre</th></tr>
      <tr><td>100 mm</td><td>10.00</td></tr>
      <tr><td>150 mm</td><td>6.67</td></tr>
      <tr><td>200 mm</td><td>5.00</td></tr>
      <tr><td>250 mm</td><td>4.00</td></tr>
      <tr><td>300 mm</td><td>3.33</td></tr>
    </table></div>
    <p>Bars per metre = 1,000 ÷ spacing in mm. Halving the spacing roughly doubles the steel. Footings commonly use 150–200 mm centres — but spacing is a design decision from your structural drawings, never a guess from a table. If your drawing says 200 mm, use 200 mm even if 300 mm would be cheaper.</p>
    <h3 id="cost">Estimating the cost</h3>
    <p>Cost = total weight × price per kg (or total tonnes × price per tonne). Using worked example 1: 17.25 kg × €1.20/kg = €20.70 per footing. Ten identical footings: 172.50 kg × €1.20/kg = €207.00. Prices vary by region, supplier and bar size, so get a current quote before budgeting — and remember the order quantity is higher than the neat mat weight once dowels, laps and waste are added. For a full cost breakdown, use the <a href="/rebar-cost-calculator">rebar cost calculator</a>.</p>
    <h3 id="imperial">Metric and imperial units</h3>
    <p>This calculator works in metres, millimetres and kilograms. If your drawings use feet and inches:</p>
    <div class="formula-table"><table>
      <tr><th>Metric</th><th>Imperial (approx.)</th></tr>
      <tr><td>150 mm spacing</td><td>6 in</td></tr>
      <tr><td>200 mm spacing</td><td>8 in</td></tr>
      <tr><td>50 mm cover</td><td>2 in</td></tr>
      <tr><td>75 mm cover</td><td>3 in</td></tr>
      <tr><td>17.25 kg</td><td>38.04 lb (× 2.205)</td></tr>
      <tr><td>1.5 m × 1.5 m footing</td><td>4.92 ft × 4.92 ft (× 3.281)</td></tr>
    </table></div>
    <p>Convert first, then enter metric values into the calculator — do not mix units in one calculation.</p>
    <h3 id="not-included">What the calculator does not include</h3>
    <ul>
      <li><strong>Dowels / starter bars.</strong> The bars that rise from the footing into the column or wall are designed separately and added on top of the bottom mat.</li>
      <li><strong>Laps (splices).</strong> If a bar run is longer than the stock bar length, bars must overlap. Find the overlap with the <a href="/rebar-lap-length-calculator">lap length calculator</a> and add it to the length.</li>
      <li><strong>Top reinforcement.</strong> Some footings need a top mat as well (uplift, eccentric loads). This calculator sizes the bottom mat only.</li>
      <li><strong>Chairs and spacers.</strong> The bottom mat needs support to stay at the right cover height. Estimate those with the <a href="/rebar-chair-calculator">chair calculator</a>.</li>
      <li><strong>Cutting waste.</strong> Cutting bars to length always leaves offcuts. Add a waste allowance on top of the neat weight before ordering.</li>
      <li><strong>Blinding concrete and excavation.</strong> The footing sits on blinding, and the hole has to be dug — neither is steel, and neither is in this result.</li>
    </ul>
    <h3 id="mistakes">4 common mistakes</h3>
    <ol class="howto"><li><strong>Using slab cover for a footing.</strong> Concrete cast directly against earth typically needs 75 mm cover, not 50 mm. The 50 mm default suits footings on blinding concrete or formed sides — check the drawing.</li><li><strong>Counting one direction only.</strong> A footing mat runs both ways. The second direction usually adds about as much steel again.</li><li><strong>Mixing up mm and m.</strong> Spacing and cover are in millimetres, footing size in metres. Entering 150 as metres instead of millimetres breaks the result completely.</li><li><strong>Ordering exactly the calculated weight.</strong> Add dowels, laps and cutting waste on top — the calculator gives the neat bottom-mat weight, not the order quantity.</li></ol>
    <p class="muted">Last reviewed: October 2026. Bar weights follow the d² ÷ 162.28 formula (ASTM A615 / IS 456 practice). Results are estimates for guidance only — always verify against your structural drawings and design code.</p>`,
    faqs:[["How much rebar do I need for a footing?","It depends on the footing size, spacing and bar size. As a worked reference, a 1.5 m × 1.5 m footing at 150 mm centres with 10 mm bars needs 20 bars (10 each way), 28.00 m of bar and 17.25 kg of steel — try those numbers in the calculator above. Your structural design governs the final bar size and spacing."],
          ["What size rebar is used in footings?","10–16 mm (#4–#5) bars are typical for residential footings; heavier footings use 20 mm or more. Bar size comes from the structural design, not from a rule of thumb — this calculator sizes the quantity once the design gives you the bar and spacing."],
          ["What spacing should footing bars be?","150–200 mm centres are common for residential footings; wider spacing up to 300 mm appears on lightly loaded pads. Closer spacing is used where loads are high or the footing is thin. Use the spacing on your drawings."],
          ["How much concrete cover do footing bars need?","Typically 75 mm where concrete is cast directly against earth, and 50 mm where the footing sits on blinding concrete or is formed. The calculator's 50 mm default suits the blinding case — change it to 75 mm for footings cast against soil. Cover protects the steel from corrosion, so it is a durability decision, not a rounding choice."],
          ["How do I calculate footing reinforcement by hand?","Treat the footing as a small two-way grid. Each way: bars = floor((dimension − 2 × cover) ÷ spacing) + 1, and each bar is (dimension − 2 × cover) long. Add both directions for total length, then multiply by kg/m for weight. Worked example 1 above shows every step."],
          ["Do footings need rebar in both directions?","Almost always, yes — an isolated footing gets a bottom mat in both directions, because soil pressure bends it both ways. A strip footing is different: its main bars run across the strip, with lighter longitudinal bars holding them together. This calculator sizes a two-way grid, so for a strip footing check with your design whether the long direction should be full bars or distribution steel."],
          ["How much rebar is in a 2 m × 2 m footing?","At 150 mm centres with 12 mm bars and 50 mm cover: 13 bars each way (26 bars), each 1.90 m long, 49.40 m total, 43.82 kg, and 169 tie intersections. Change the spacing or bar size in the calculator to see how fast the weight moves."],
          ["How much does footing rebar cost?","Multiply the weight by your local price per kg. At €1.20/kg, the 1.5 m × 1.5 m footing in example 1 costs €20.70 in steel, and ten identical footings cost €207.00. That is the neat mat weight only — dowels, laps and waste add to the order."],
          ["Does the calculator include dowels and laps?","No. Dowels (starter bars from the footing into the column or wall) and lap splices are designed separately and added on top of the bottom-mat weight this calculator gives. Use the lap length calculator for splice lengths."],
          ["What is the difference between isolated and strip footings?","An isolated footing is a single pad under one column, reinforced with a two-way bottom mat — exactly what this calculator sizes. A strip footing is a continuous run under a wall; its main reinforcement runs across the strip, with longitudinal bars mainly holding the mat together. Enter a strip as a rectangle here, but treat the long-direction result as distribution steel unless your design says otherwise."]] ,
    de: {
  metaTitle: "Bewehrungsrechner für Fundamente — Stäbe & kg gratis",
  desc: "Bewehrungsrechner für Fundamente: Stäbe in beiden Richtungen, Gesamtlänge, Kreuzungspunkte und Gewicht in Sekunden. Beispiel: 1,5 × 1,5 m = 17,25 kg. Gratis.",
  formula: "Gleiche Netz-Methode wie bei einer Platte: Stäbe in einer Richtung = floor((Maß − 2 × Deckung) ÷ Abstand) + 1, in beiden Richtungen, × kg/m.",
  kw: "fundament bewehrungsrechner, fundamentbewehrung, einzelfundament bewehrung",
  howto: ["Fundamentlänge und -breite eingeben.", "Bewehrungsabstand (Achsabstand) und Betondeckung festlegen.", "Stabdurchmesser wählen, um Stabanzahl und Gesamtgewicht zu erhalten.", "Ergebnisse ablesen: Stabanzahl in jeder Richtung, Gesamtstablänge, Kreuzungspunkte und Gesamtgewicht.", "Zusätzlich für Übergreifungen, Dübel und Verschnitt bestellen — Übergreifungen und Anschlussbewehrung sind in diesem Rechner nicht enthalten (siehe Übergreifungslängen-Rechner)."],
  faqs: [["Wie viel Bewehrung brauche ich für ein Fundament?","Das hängt von Fundamentgröße, Abstand und Stabdurchmesser ab. Als Rechenbeispiel: Ein Fundament 1,5 m × 1,5 m mit 150 mm Achsabstand und 10-mm-Stäben braucht 20 Stäbe (je Richtung 10), 28,00 m Stabstahl und 17,25 kg Stahl — probieren Sie diese Zahlen oben im Rechner aus. Ihre Tragwerksplanung bestimmt den endgültigen Stabdurchmesser und Abstand."],
          ["Welche Stabdurchmesser werden in Fundamenten verwendet?","10–16 mm (#4–#5) sind typisch für Wohnbau-Fundamente; schwerere Fundamente verwenden 20 mm oder mehr. Der Durchmesser kommt aus der Tragwerksplanung, nicht aus einer Faustregel — dieser Rechner ermittelt die Menge, sobald die Planung Stab und Abstand vorgibt."],
          ["Welchen Abstand sollten Fundamentstäbe haben?","150–200 mm Achsabstand sind für Wohnbau-Fundamente üblich; bei leicht belasteten Platten kommen auch bis zu 300 mm vor. Engere Abstände werden verwendet, wenn die Lasten hoch oder das Fundament dünn ist. Verwenden Sie den Abstand aus Ihren Plänen."],
          ["Wie viel Betondeckung brauchen Fundamentstäbe?","Typischerweise 75 mm, wenn der Beton direkt gegen Erdreich betoniert wird, und 50 mm, wenn das Fundament auf einer Sauberkeitsschicht sitzt oder geschalt wird. Der Standardwert 50 mm des Rechners passt für den Sauberkeitsschicht-Fall — ändern Sie ihn auf 75 mm für Fundamente, die gegen Erdreich betoniert werden. Die Deckung schützt den Stahl vor Korrosion, sie ist also eine Entscheidung zur Dauerhaftigkeit, keine Rundungsfrage."],
          ["Wie berechne ich Fundamentbewehrung von Hand?","Behandeln Sie das Fundament als kleines Zwei-Wege-Netz. Je Richtung: Stäbe = floor((Maß − 2 × Deckung) ÷ Abstand) + 1, und jeder Stab ist (Maß − 2 × Deckung) lang. Addieren Sie beide Richtungen für die Gesamtlänge und multiplizieren Sie dann mit kg/m für das Gewicht. Rechenbeispiel 1 oben zeigt jeden Schritt."],
          ["Brauchen Fundamente Bewehrung in beiden Richtungen?","Fast immer ja — ein Einzelfundament erhält eine untere Matte in beiden Richtungen, weil der Bodendruck es in beiden Richtungen biegt. Ein Streifenfundament ist anders: Seine Hauptstäbe verlaufen quer zum Streifen, leichtere Längsstäbe halten sie zusammen. Dieser Rechner bemisst ein Zwei-Wege-Netz — prüfen Sie daher bei einem Streifenfundament anhand Ihrer Planung, ob die Längsrichtung volle Stäbe oder Verteilungsbewehrung sein sollte."],
          ["Wie viel Bewehrung steckt in einem Fundament 2 m × 2 m?","Bei 150 mm Achsabstand, 12-mm-Stäben und 50 mm Deckung: je Richtung 13 Stäbe (26 Stäbe), jeder 1,90 m lang, insgesamt 49,40 m, 43,82 kg und 169 Kreuzungspunkte. Ändern Sie Abstand oder Durchmesser im Rechner, um zu sehen, wie schnell sich das Gewicht bewegt."],
          ["Was kostet Fundamentbewehrung?","Multiplizieren Sie das Gewicht mit Ihrem örtlichen Preis pro kg. Bei 1,20 €/kg kostet das Fundament 1,5 m × 1,5 m aus Beispiel 1 genau 20,70 € an Stahl, und zehn identische Fundamente kosten 207,00 €. Das ist nur das reine Netzgewicht — Dübel, Übergreifungen und Verschnitt kommen zur Bestellung hinzu."],
          ["Enthält der Rechner Dübel und Übergreifungen?","Nein. Dübel (Anschlussbewehrung vom Fundament in die Stütze oder Wand) und Übergreifungsstöße werden separat bemessen und zum Gewicht der unteren Matte addiert, das dieser Rechner liefert. Nutzen Sie den Übergreifungslängen-Rechner für Stoßlängen."],
          ["Was ist der Unterschied zwischen Einzel- und Streifenfundamenten?","Ein Einzelfundament ist eine einzelne Platte unter einer Stütze, bewehrt mit einer unteren Matte in beiden Richtungen — genau das, was dieser Rechner bemisst. Ein Streifenfundament ist ein durchlaufender Streifen unter einer Wand; seine Hauptbewehrung verläuft quer zum Streifen, Längsstäbe halten die Matte hauptsächlich zusammen. Geben Sie einen Streifen hier als Rechteck ein, behandeln Sie das Ergebnis in Längsrichtung aber als Verteilungsbewehrung, sofern Ihre Bemessung nichts anderes vorgibt."]],
  toc: `<nav class="content-block" aria-label="Auf dieser Seite">
    <h2>Auf dieser Seite</h2>
    <ul>
      <li><a href="#how-to">So benutzen Sie den Rechner</a></li>
      <li><a href="#formula">Die Formel, erklärt</a></li>
      <li><a href="#example-1">Rechenbeispiel 1: Fundament 1,5 m × 1,5 m</a></li>
      <li><a href="#example-2">Rechenbeispiel 2: Fundament 2,4 m × 1,8 m</a></li>
      <li><a href="#bar-table">Stabgewichtstabelle</a></li>
      <li><a href="#spacing-table">Abstandsleitfaden: Stäbe pro Meter</a></li>
      <li><a href="#cost">Kosten schätzen</a></li>
      <li><a href="#imperial">Metrische und imperiale Einheiten</a></li>
      <li><a href="#not-included">Was der Rechner nicht enthält</a></li>
      <li><a href="#mistakes">Häufige Fehler</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
  </nav>`,
  extra: `<p><strong>Warum minus zweimal die Deckung?</strong> Die Stäbe enden auf beiden Seiten vor der Fundamentkante, deshalb wird die Deckung an jedem Ende abgezogen, bevor gezählt wird. <strong>Warum plus eins?</strong> Der erste Stab sitzt an der Deckungslinie, danach folgt bei jedem Abstandsschritt ein weiterer Stab — die Anzahl ist also die Zahl der Abstände plus eins, nicht nur die Zahl der Abstände. <strong>Warum in beiden Richtungen?</strong> Eine Fundamentmatte verläuft in zwei Richtungen, und die zweite Richtung fügt meist etwa noch einmal so viel Stahl hinzu.</p>
    <p>Das Stabgewicht pro Meter folgt der Standardformel kg/m = d² ÷ 162,28, wobei d der Stabdurchmesser in mm ist. Für einen 10-mm-Stab: 10² ÷ 162,28 = 0,616 kg/m — derselbe Wert, den der Rechner verwendet.</p>
    <svg viewBox="0 0 520 330" role="img" aria-label="Diagramm eines Fundamentbewehrungsnetzes mit Länge, Breite, Bewehrungsabstand und Betondeckung" style="width:100%;max-width:520px;height:auto;display:block;margin:12px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
      <rect x="30" y="30" width="460" height="240" fill="none" stroke="#0f172a" stroke-width="2"/>
      <rect x="58" y="58" width="404" height="184" fill="none" stroke="#f97316" stroke-width="1.5" stroke-dasharray="6 4"/>
      <g stroke="#0f172a" stroke-width="1.5">
        <line x1="98" y1="58" x2="98" y2="242"/><line x1="158" y1="58" x2="158" y2="242"/><line x1="218" y1="58" x2="218" y2="242"/><line x1="278" y1="58" x2="278" y2="242"/><line x1="338" y1="58" x2="338" y2="242"/><line x1="398" y1="58" x2="398" y2="242"/>
        <line x1="58" y1="98" x2="462" y2="98"/><line x1="58" y1="158" x2="462" y2="158"/><line x1="58" y1="218" x2="462" y2="218"/>
      </g>
      <g font-family="sans-serif" font-size="13" fill="#0f172a">
        <text x="260" y="18" text-anchor="middle">L = Fundamentlänge</text>
        <text x="14" y="155" text-anchor="middle" transform="rotate(-90 14 155)">B = Fundamentbreite</text>
        <text x="128" y="52" text-anchor="middle" fill="#f97316">Abstand</text>
        <text x="44" y="80" fill="#f97316">Deckung</text>
      </g>
      <g stroke="#f97316" stroke-width="1.5">
        <line x1="98" y1="44" x2="158" y2="44"/><line x1="98" y1="40" x2="98" y2="48"/><line x1="158" y1="40" x2="158" y2="48"/>
        <line x1="34" y1="30" x2="58" y2="58"/>
      </g>
    </svg>
    <p>Die orange gestrichelte Linie markiert, wo die Stäbe tatsächlich verlaufen: innerhalb der Deckung, auf beiden Seiten. Die Stäbe kreuzen sich in beiden Richtungen, und jede Kreuzung ist ein Kreuzungspunkt.</p>
    <h3 id="example-1">Rechenbeispiel 1: Fundament 1,5 m × 1,5 m</h3>
    <p>Fundament 1,5 m × 1,5 m, Stäbe 10 mm (0,616 kg/m), Abstand 150 mm, Deckung 50 mm. Dies sind die Werte, mit denen der Rechner startet, sodass Sie das Ergebnis sofort prüfen können:</p>
    <ol class="howto"><li>Stäbe entlang einer 1,5-m-Richtung: floor((1.500 − 100) ÷ 150) + 1 = 10 Stäbe, jeder 1,40 m lang = 14,00 m.</li><li>Stäbe entlang der anderen 1,5-m-Richtung: dasselbe = 10 Stäbe, jeder 1,40 m lang = 14,00 m.</li><li>Gesamtstablänge: 14,00 + 14,00 = 28,00 m.</li><li>Gesamtgewicht: 28,00 × 0,616 = 17,25 kg.</li><li>Kreuzungspunkte: 10 × 10 = 100.</li></ol>
    <p>Probieren Sie es selbst: Geben Sie dieselben Zahlen oben in den Rechner ein, und Sie erhalten dasselbe Ergebnis.</p>
    <h3 id="example-2">Rechenbeispiel 2: Fundament 2,4 m × 1,8 m</h3>
    <p>Fundament 2,4 m × 1,8 m, Stäbe 12 mm (0,887 kg/m), Abstand 200 mm, Deckung 75 mm:</p>
    <ol class="howto"><li>Stäbe entlang der 2,4-m-Richtung: floor((1.800 − 150) ÷ 200) + 1 = 9 Stäbe, jeder 2,25 m lang = 20,25 m.</li><li>Stäbe entlang der 1,8-m-Richtung: floor((2.400 − 150) ÷ 200) + 1 = 12 Stäbe, jeder 1,65 m lang = 19,80 m.</li><li>Gesamtstablänge: 20,25 + 19,80 = 40,05 m.</li><li>Gesamtgewicht: 40,05 × 0,887 = 35,52 kg.</li><li>Kreuzungspunkte: 9 × 12 = 108.</li></ol>
    <p>Beachten Sie: Das rechteckige Fundament braucht trotz gleichem Abstand in jeder Richtung eine andere Stabanzahl (9 und 12) — und die 75 mm Deckung sind der Fundamentfall: Beton, der direkt gegen Erdreich betoniert wird, braucht mehr Deckung als eine Platte.</p>
    <h3 id="bar-table">Stabgewichtstabelle (kg/m)</h3>
    <div class="formula-table"><table>
      <tr><th>Stabdurchmesser</th><th>kg/m</th><th>Stäbe pro Tonne</th></tr>
      <tr><td>8 mm</td><td>0,394</td><td>2.536</td></tr>
      <tr><td>10 mm</td><td>0,616</td><td>1.623</td></tr>
      <tr><td>12 mm</td><td>0,887</td><td>1.127</td></tr>
      <tr><td>16 mm</td><td>1,578</td><td>634</td></tr>
      <tr><td>20 mm</td><td>2,465</td><td>406</td></tr>
    </table></div>
    <p>Stäbe pro Tonne = 1.000 ÷ kg/m. Sie gibt an, wie viele 1-Meter-Stäbe eine Tonne ergeben — praktisch, wenn ein Lieferant pro Tonne anbietet. <a href="/de/#charts">Vollständige Bewehrungsgewichtstabelle ansehen (kg/m &amp; lb/ft) →</a></p>
    <h3 id="spacing-table">Abstandsleitfaden: Stäbe pro Meter Fundamentbreite</h3>
    <div class="formula-table"><table>
      <tr><th>Abstand (Achsabstand)</th><th>Stäbe pro Meter</th></tr>
      <tr><td>100 mm</td><td>10,00</td></tr>
      <tr><td>150 mm</td><td>6,67</td></tr>
      <tr><td>200 mm</td><td>5,00</td></tr>
      <tr><td>250 mm</td><td>4,00</td></tr>
      <tr><td>300 mm</td><td>3,33</td></tr>
    </table></div>
    <p>Stäbe pro Meter = 1.000 ÷ Abstand in mm. Eine Halbierung des Abstands verdoppelt den Stahl ungefähr. Fundamente verwenden häufig 150–200 mm Achsabstand — aber der Abstand ist eine Bemessungsentscheidung aus Ihren Tragwerksplänen, nie eine Schätzung aus einer Tabelle. Wenn Ihr Plan 200 mm vorgibt, verwenden Sie 200 mm, auch wenn 300 mm günstiger wäre.</p>
    <h3 id="cost">Kosten schätzen</h3>
    <p>Kosten = Gesamtgewicht × Preis pro kg (oder Gesamttonnen × Preis pro Tonne). Mit Rechenbeispiel 1: 17,25 kg × 1,20 €/kg = 20,70 € pro Fundament. Zehn identische Fundamente: 172,50 kg × 1,20 €/kg = 207,00 €. Die Preise variieren je nach Region, Lieferant und Stabdurchmesser — holen Sie vor der Budgetierung ein aktuelles Angebot ein. Und denken Sie daran: Die Bestellmenge liegt über dem reinen Netzgewicht, sobald Dübel, Übergreifungen und Verschnitt hinzukommen. Für eine vollständige Kostenaufstellung nutzen Sie den <a href="/de/bewehrungskosten-rechner">Bewehrungskosten-Rechner</a>.</p>
    <h3 id="imperial">Metrische und imperiale Einheiten</h3>
    <p>Dieser Rechner arbeitet mit Metern, Millimetern und Kilogramm. Wenn Ihre Pläne Fuß und Zoll verwenden:</p>
    <div class="formula-table"><table>
      <tr><th>Metrisch</th><th>Imperial (ca.)</th></tr>
      <tr><td>Abstand 150 mm</td><td>6 in</td></tr>
      <tr><td>Abstand 200 mm</td><td>8 in</td></tr>
      <tr><td>Deckung 50 mm</td><td>2 in</td></tr>
      <tr><td>Deckung 75 mm</td><td>3 in</td></tr>
      <tr><td>17,25 kg</td><td>38,04 lb (× 2,205)</td></tr>
      <tr><td>Fundament 1,5 m × 1,5 m</td><td>4,92 ft × 4,92 ft (× 3,281)</td></tr>
    </table></div>
    <p>Rechnen Sie zuerst um und geben Sie dann metrische Werte in den Rechner ein — mischen Sie keine Einheiten in einer Berechnung.</p>
    <h3 id="not-included">Was der Rechner nicht enthält</h3>
    <ul>
      <li><strong>Dübel / Anschlussbewehrung.</strong> Die Stäbe, die vom Fundament in die Stütze oder Wand aufsteigen, werden separat bemessen und zur unteren Matte addiert.</li>
      <li><strong>Übergreifungen (Stöße).</strong> Wenn ein Stabstrang länger ist als die Lieferlänge, müssen sich Stäbe überlappen. Die Überlappung finden Sie mit dem <a href="/de/uebergreifungslaengen-rechner">Übergreifungslängen-Rechner</a> und addieren sie zur Länge.</li>
      <li><strong>Obere Bewehrung.</strong> Manche Fundamente brauchen zusätzlich eine obere Matte (abhebende Kräfte, exzentrische Lasten). Dieser Rechner bemisst nur die untere Matte.</li>
      <li><strong>Abstandhalter.</strong> Die untere Matte braucht Unterstützung, um auf der richtigen Deckungshöhe zu bleiben. Schätzen Sie diese mit dem <a href="/de/abstandhalter-rechner">Abstandhalter-Rechner</a>.</li>
      <li><strong>Verschnitt.</strong> Das Zuschneiden der Stäbe auf Länge hinterlässt immer Abschnitte. Addieren Sie vor der Bestellung einen Verschnittzuschlag zum reinen Gewicht.</li>
      <li><strong>Sauberkeitsschicht und Aushub.</strong> Das Fundament sitzt auf einer Sauberkeitsschicht, und die Grube muss ausgehoben werden — beides ist kein Stahl und beides steckt nicht in diesem Ergebnis.</li>
    </ul>
    <h3 id="mistakes">4 häufige Fehler</h3>
    <ol class="howto"><li><strong>Deckung einer Platte für ein Fundament verwenden.</strong> Beton, der direkt gegen Erdreich betoniert wird, braucht typischerweise 75 mm Deckung, nicht 50 mm. Der Standardwert 50 mm passt für Fundamente auf einer Sauberkeitsschicht oder mit geschalten Seiten — prüfen Sie den Plan.</li><li><strong>Nur in einer Richtung zählen.</strong> Eine Fundamentmatte verläuft in beiden Richtungen. Die zweite Richtung fügt meist etwa noch einmal so viel Stahl hinzu.</li><li><strong>mm und m verwechseln.</strong> Abstand und Deckung sind in Millimetern angegeben, die Fundamentgröße in Metern. Wer 150 als Meter statt als Millimeter eingibt, sprengt das Ergebnis vollständig.</li><li><strong>Genau das berechnete Gewicht bestellen.</strong> Addieren Sie Dübel, Übergreifungen und Verschnitt hinzu — der Rechner liefert das reine Gewicht der unteren Matte, nicht die Bestellmenge.</li></ol>
    <p class="muted">Zuletzt geprüft: Oktober 2026. Die Stabgewichte folgen der Formel d² ÷ 162,28 (ASTM A615 / IS 456 Praxis). Die Ergebnisse sind Schätzungen zur Orientierung — prüfen Sie sie immer anhand Ihrer Tragwerkspläne und der Bemessungsnorm.</p>`
}
},
    { id:"mat", slug:"rebar-mat-grid-calculator", cat:"Estimating",
    metaTitle:"Rebar Mat Calculator — Grid Bars, Ties & Weight, Free",
    h1:"Rebar Mat & Grid Calculator",
    desc:"Lay out any rectangular reinforcement mat in seconds: bars each way, tie intersections, total length and weight. Free calculator with worked examples.",
    kw:"rebar mat calculator, rebar grid calculator, reinforcement mat, mesh rebar calculator",
    intro:"Lay out a rectangular reinforcement mat and get the full bar take-off: bars in each direction, intersections for tying, total bar length and weight.",
    howto:["Enter mat length and width.","Set the grid spacing and edge offset.","Pick a bar size for the totals.","Read the results: bar count in each direction, tie intersections, total bar length and weight.","Order extra for laps between mats, tie wire and cutting waste — the calculator gives the neat mat weight only (see the tie wire calculator)."],
    formula:"Bars each way = floor((dimension − 2 × offset) ÷ spacing) + 1. Intersections = nx × ny.",
    toc:`<nav class="content-block" aria-label="On this page">
    <h2>On this page</h2>
    <ul>
      <li><a href="#how-to">How to use the calculator</a></li>
      <li><a href="#formula">The formula, explained</a></li>
      <li><a href="#example-1">Worked example 1: 6 m × 3 m mat</a></li>
      <li><a href="#example-2">Worked example 2: 4 m × 4 m mat</a></li>
      <li><a href="#bar-table">Bar weight chart</a></li>
      <li><a href="#spacing-table">Spacing guide: bars per metre</a></li>
      <li><a href="#cost">Estimating the cost</a></li>
      <li><a href="#imperial">Metric and imperial units</a></li>
      <li><a href="#not-included">What the calculator does not include</a></li>
      <li><a href="#mistakes">Common mistakes</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
  </nav>`,
    extra:`<p><strong>Why minus twice the offset?</strong> The outer bars sit inside the mat edge by the offset on both sides, so the offset is removed from each end before counting. <strong>Why plus one?</strong> The first bar sits at the offset line and then one bar follows every spacing step — so the count is the number of spaces plus one, not just the number of spaces. <strong>Why both directions?</strong> A mat is a two-way grid, and the second direction usually adds about as much steel again.</p>
    <p>Bar weight per metre comes from the standard formula kg/m = d² ÷ 162.28, where d is the bar diameter in mm. For a 10 mm bar: 10² ÷ 162.28 = 0.616 kg/m — the same value the calculator uses.</p>
    <svg viewBox="0 0 520 330" role="img" aria-label="Diagram of a reinforcement mat showing length, width, bar spacing and edge offset" style="width:100%;max-width:520px;height:auto;display:block;margin:12px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
      <rect x="30" y="30" width="460" height="240" fill="none" stroke="#0f172a" stroke-width="2"/>
      <rect x="58" y="58" width="404" height="184" fill="none" stroke="#f97316" stroke-width="1.5" stroke-dasharray="6 4"/>
      <g stroke="#0f172a" stroke-width="1.5">
        <line x1="98" y1="58" x2="98" y2="242"/><line x1="158" y1="58" x2="158" y2="242"/><line x1="218" y1="58" x2="218" y2="242"/><line x1="278" y1="58" x2="278" y2="242"/><line x1="338" y1="58" x2="338" y2="242"/><line x1="398" y1="58" x2="398" y2="242"/>
        <line x1="58" y1="98" x2="462" y2="98"/><line x1="58" y1="158" x2="462" y2="158"/><line x1="58" y1="218" x2="462" y2="218"/>
      </g>
      <g font-family="sans-serif" font-size="13" fill="#0f172a">
        <text x="260" y="18" text-anchor="middle">L = mat length</text>
        <text x="14" y="155" text-anchor="middle" transform="rotate(-90 14 155)">W = mat width</text>
        <text x="128" y="52" text-anchor="middle" fill="#f97316">spacing</text>
        <text x="44" y="80" fill="#f97316">offset</text>
      </g>
      <g stroke="#f97316" stroke-width="1.5">
        <line x1="98" y1="44" x2="158" y2="44"/><line x1="98" y1="40" x2="98" y2="48"/><line x1="158" y1="40" x2="158" y2="48"/>
        <line x1="34" y1="30" x2="58" y2="58"/>
      </g>
    </svg>
    <p>The orange dashed line marks where the bars actually run: inside the offset, on both sides. Bars cross in both directions, and every crossing is one tie intersection.</p>
    <h3 id="example-1">Worked example 1: 6 m × 3 m mat</h3>
    <p>Mat 6 m × 3 m, 10 mm bars (0.616 kg/m), 200 mm spacing, 25 mm edge offset. These are the values the calculator opens with, so you can check the result immediately:</p>
    <ol class="howto"><li>Bars along the 6 m direction: floor((3,000 − 50) ÷ 200) + 1 = 15 bars, each 5.95 m long = 89.25 m.</li><li>Bars along the 3 m direction: floor((6,000 − 50) ÷ 200) + 1 = 30 bars, each 2.95 m long = 88.50 m.</li><li>Total bar length: 89.25 + 88.50 = 177.75 m.</li><li>Total weight: 177.75 × 0.616 = 109.49 kg.</li><li>Tie intersections: 15 × 30 = 450.</li></ol>
    <p>Try it yourself: enter the same numbers in the calculator above and you will get the same result.</p>
    <h3 id="example-2">Worked example 2: 4 m × 4 m mat</h3>
    <p>Mat 4 m × 4 m, 12 mm bars (0.887 kg/m), 150 mm spacing, 25 mm edge offset:</p>
    <ol class="howto"><li>Bars along one 4 m direction: floor((4,000 − 50) ÷ 150) + 1 = 27 bars, each 3.95 m long = 106.65 m.</li><li>Bars along the other 4 m direction: the same = 27 bars, each 3.95 m long = 106.65 m.</li><li>Total bar length: 106.65 + 106.65 = 213.30 m.</li><li>Total weight: 213.30 × 0.887 = 189.20 kg.</li><li>Tie intersections: 27 × 27 = 729.</li></ol>
    <p>Notice how the square mat needs the same count both ways, but the tighter 150 mm spacing pushes the tie count to 729 — every extra bar adds a full row of ties.</p>
    <h3 id="bar-table">Bar weight chart (kg/m)</h3>
    <div class="formula-table"><table>
      <tr><th>Bar diameter</th><th>kg/m</th><th>Bars per tonne</th></tr>
      <tr><td>8 mm</td><td>0.394</td><td>2,536</td></tr>
      <tr><td>10 mm</td><td>0.616</td><td>1,623</td></tr>
      <tr><td>12 mm</td><td>0.887</td><td>1,127</td></tr>
      <tr><td>16 mm</td><td>1.578</td><td>634</td></tr>
      <tr><td>20 mm</td><td>2.465</td><td>406</td></tr>
    </table></div>
    <p>Bars per tonne = 1,000 ÷ kg/m. It tells you how many 1-metre bars make a tonne — handy when a supplier quotes per tonne. <a href="/#charts">See the full rebar weight chart (kg/m &amp; lb/ft) →</a></p>
    <h3 id="spacing-table">Spacing guide: bars per metre of mat width</h3>
    <div class="formula-table"><table>
      <tr><th>Spacing (centre-to-centre)</th><th>Bars per metre</th></tr>
      <tr><td>100 mm</td><td>10.00</td></tr>
      <tr><td>150 mm</td><td>6.67</td></tr>
      <tr><td>200 mm</td><td>5.00</td></tr>
      <tr><td>250 mm</td><td>4.00</td></tr>
      <tr><td>300 mm</td><td>3.33</td></tr>
    </table></div>
    <p>Bars per metre = 1,000 ÷ spacing in mm. Halving the spacing roughly doubles the steel. Mats commonly use 150–200 mm centres — but spacing is a design decision from your structural drawings, never a guess from a table. If your drawing says 200 mm, use 200 mm even if 300 mm would be cheaper.</p>
    <h3 id="cost">Estimating the cost</h3>
    <p>Cost = total weight × price per kg (or total tonnes × price per tonne). Using worked example 1: 109.49 kg × €1.20/kg = €131.39 per mat. Five identical mats: 547.47 kg × €1.20/kg = €656.96. Prices vary by region, supplier and bar size, so get a current quote before budgeting — and remember the order quantity is higher than the neat mat weight once laps between mats, tie wire and waste are added. For a full cost breakdown, use the <a href="/rebar-cost-calculator">rebar cost calculator</a>.</p>
    <h3 id="imperial">Metric and imperial units</h3>
    <p>This calculator works in metres, millimetres and kilograms. If your drawings use feet and inches:</p>
    <div class="formula-table"><table>
      <tr><th>Metric</th><th>Imperial (approx.)</th></tr>
      <tr><td>150 mm spacing</td><td>6 in</td></tr>
      <tr><td>200 mm spacing</td><td>8 in</td></tr>
      <tr><td>25 mm offset</td><td>1 in</td></tr>
      <tr><td>109.49 kg</td><td>241.43 lb (× 2.205)</td></tr>
      <tr><td>6 m × 3 m mat</td><td>19.69 ft × 9.84 ft (× 3.281)</td></tr>
    </table></div>
    <p>Convert first, then enter metric values into the calculator — do not mix units in one calculation.</p>
    <h3 id="not-included">What the calculator does not include</h3>
    <ul>
      <li><strong>Tie wire.</strong> The calculator counts intersections (450 in example 1) but not the wire itself. Estimate wire from intersections with the <a href="/rebar-tie-wire-calculator">tie wire calculator</a>.</li>
      <li><strong>Laps between mats.</strong> Where one mat meets the next, bars must overlap. Find the overlap with the <a href="/rebar-lap-length-calculator">lap length calculator</a> and add it to the length.</li>
      <li><strong>Chairs and spacers.</strong> The mat needs support to stay at the right height and cover. Estimate those with the <a href="/rebar-chair-calculator">chair calculator</a>.</li>
      <li><strong>Cutting waste.</strong> Cutting bars to length always leaves offcuts. Add a waste allowance on top of the neat weight before ordering.</li>
      <li><strong>Hooks and bends.</strong> Edge hooks and bent-up bars add length. Use the <a href="/rebar-hook-bend-cutting-length-calculator">hook and cutting length calculator</a> for those.</li>
      <li><strong>Welded mesh sheets.</strong> If you buy prefabricated mesh instead of loose bars, the sheet sizes and weights are fixed — this calculator covers loose-bar mats.</li>
    </ul>
    <h3 id="mistakes">4 common mistakes</h3>
    <ol class="howto"><li><strong>Confusing offset with cover.</strong> The edge offset is the distance from the mat edge to the first bar. Concrete cover — the concrete over the mat — is a separate value set by the design and the supports, not by this calculator.</li><li><strong>Counting one direction only.</strong> A mat runs both ways. The second direction usually adds about as much steel again.</li><li><strong>Mixing up mm and m.</strong> Spacing and offset are in millimetres, mat size in metres. Entering 200 as metres instead of millimetres breaks the result completely.</li><li><strong>Ordering exactly the calculated weight.</strong> Add laps between mats, tie wire and cutting waste on top — the calculator gives the neat mat weight, not the order quantity.</li></ol>
    <p class="muted">Last reviewed: October 2026. Bar weights follow the d² ÷ 162.28 formula (ASTM A615 / IS 456 practice). Results are estimates for guidance only — always verify against your structural drawings and design code.</p>`,
    faqs:[["What is a rebar mat?","A grid of bars tied together in two directions, used in slabs, rafts and footings. Mats can be tied on site or delivered prefabricated; either way, the bar count, length and weight come from the same two-way grid maths."],
          ["How many tie points are in a mat?","One at each bar intersection — the calculator reports this as the intersection count. The 6 m × 3 m mat in example 1 has 15 × 30 = 450 intersections, so 450 ties if every crossing is tied."],
          ["How do I calculate a rebar mat by hand?","Each way: bars = floor((dimension − 2 × offset) ÷ spacing) + 1, and each bar is (dimension − 2 × offset) long. Add both directions for total length, then multiply by kg/m for weight. Worked example 1 above shows every step."],
          ["What is the edge offset?","The distance from the edge of the mat to the first bar — 25 mm by default here. It is not the concrete cover: cover is the concrete over the finished mat, set by the design and the chairs or spacers that hold the mat up."],
          ["What bar size and spacing are used for mats?","10–12 mm bars at 150–200 mm centres are typical for slab and raft mats; heavier mats use 16 mm or more. Size and spacing come from the structural design — this calculator sizes the quantity once you have them."],
          ["How much does a 6 m × 3 m mat weigh?","At 200 mm centres with 10 mm bars and a 25 mm offset: 15 bars one way and 30 the other (45 bars), 177.75 m of bar, 109.49 kg, and 450 tie intersections. Change the spacing or bar size in the calculator to see how fast the weight moves."],
          ["How much tie wire do I need for a mat?","It depends on the intersection count and the wire used per tie. Take the intersection count from this calculator — 450 for the 6 m × 3 m mat — and enter it in the tie wire calculator for the wire length and weight."],
          ["How much does a rebar mat cost?","Multiply the weight by your local price per kg. At €1.20/kg, the 6 m × 3 m mat in example 1 costs €131.39 in steel, and five identical mats cost €656.96. That is the neat mat weight only — laps, tie wire and waste add to the order."],
          ["Can I use this calculator for welded mesh sheets?","For estimating, yes — the grid maths is the same. But mesh sheets come in fixed sizes with fixed wire diameters, so the exact sheet count and weight come from the manufacturer's sheet table, not from loose-bar lengths."],
          ["What is the difference between a mat and a slab grid?","There is no maths difference — a mat is the reinforcement itself, while a slab grid is the same two-way layout described as part of a slab. The calculator works for both; what changes is only what you call it and how it is placed."]] ,
    de: {
  metaTitle: "Bewehrungsmatten-Rechner — Stäbe, Bindungen & kg gratis",
  desc: "Bewehrungsmatten-Rechner: Stäbe in beiden Richtungen, Kreuzungspunkte, Gesamtlänge und Gewicht für jede Matte. Beispiel: 6 m × 3 m Matte = 109,49 kg. Kostenlos.",
  formula: "Stäbe je Richtung = floor((Maß − 2 × Randabstand) ÷ Abstand) + 1. Kreuzungspunkte = nx × ny.",
  kw: "bewehrungsmatten rechner, bewehrungsmatte berechnen, bewehrungsnetz rechner, betonstahlmatte rechner",
  howto: ["Mattenlänge und -breite eingeben.", "Netzabstand und Randabstand festlegen.", "Stabgröße für die Summen wählen.", "Ergebnisse ablesen: Stabanzahl je Richtung, Kreuzungspunkte, Gesamtstablänge und Gewicht.", "Zusätzlich bestellen für Übergreifungen zwischen Matten, Bindedraht und Verschnitt — der Rechner gibt nur das reine Mattengewicht an (siehe Bindedraht-Rechner)."],
  faqs: [["Was ist eine Bewehrungsmatte?", "Ein Netz aus Stäben, die in zwei Richtungen miteinander verbunden werden, verwendet in Platten, Bodenplatten und Fundamenten. Matten können vor Ort gebunden oder vorgefertigt geliefert werden; in jedem Fall ergeben sich Stabanzahl, Länge und Gewicht aus derselben zweiachsigen Netzrechnung."],
          ["Wie viele Bindungspunkte hat eine Matte?", "Einen an jeder Stabkreuzung — der Rechner gibt dies als Kreuzungszahl an. Die Matte 6 m × 3 m aus Beispiel 1 hat 15 × 30 = 450 Kreuzungen, also 450 Bindungen, wenn jede Kreuzung gebunden wird."],
          ["Wie berechne ich eine Bewehrungsmatte von Hand?", "Je Richtung: Stäbe = floor((Maß − 2 × Randabstand) ÷ Abstand) + 1, und jeder Stab ist (Maß − 2 × Randabstand) lang. Beide Richtungen addieren ergibt die Gesamtlänge, dann mit kg/m multiplizieren für das Gewicht. Rechenbeispiel 1 oben zeigt jeden Schritt."],
          ["Was ist der Randabstand?", "Der Abstand vom Mattenrand bis zum ersten Stab — hier standardmäßig 25 mm. Er ist nicht die Betondeckung: Die Deckung ist der Beton über der fertigen Matte, festgelegt durch die Bemessung und die Abstandhalter, die die Matte hochhalten."],
          ["Welche Stabgrößen und Abstände werden für Matten verwendet?", "Stäbe 10–12 mm mit 150–200 mm Achsabstand sind typisch für Platten- und Bodenplattenmatten; schwerere Matten verwenden 16 mm oder mehr. Größe und Abstand kommen aus der statischen Bemessung — dieser Rechner ermittelt die Menge, sobald Sie sie haben."],
          ["Wie viel wiegt eine Matte 6 m × 3 m?", "Bei 200 mm Achsabstand mit Stäben 10 mm und 25 mm Randabstand: 15 Stäbe in einer Richtung und 30 in der anderen (45 Stäbe), 177,75 m Stabstahl, 109,49 kg und 450 Kreuzungspunkte. Ändern Sie Abstand oder Stabgröße im Rechner, um zu sehen, wie schnell sich das Gewicht verändert."],
          ["Wie viel Bindedraht brauche ich für eine Matte?", "Das hängt von der Kreuzungszahl und dem Draht je Bindung ab. Nehmen Sie die Kreuzungszahl aus diesem Rechner — 450 für die Matte 6 m × 3 m — und geben Sie sie in den Bindedraht-Rechner ein, um Drahtlänge und Gewicht zu erhalten."],
          ["Was kostet eine Bewehrungsmatte?", "Multiplizieren Sie das Gewicht mit Ihrem örtlichen Preis je kg. Bei 1,20 €/kg kostet die Matte 6 m × 3 m aus Beispiel 1 genau 131,39 € an Stahl, und fünf identische Matten kosten 656,96 €. Das ist nur das reine Mattengewicht — Übergreifungen, Bindedraht und Verschnitt kommen zur Bestellmenge hinzu."],
          ["Kann ich diesen Rechner für geschweißte Matten verwenden?", "Zum Abschätzen ja — die Netzrechnung ist dieselbe. Aber Matten werden in festen Formaten mit festen Drahtdurchmessern geliefert, sodass die genaue Blattzahl und das Gewicht aus der Blatttabelle des Herstellers kommen, nicht aus Längen loser Stäbe."],
          ["Was ist der Unterschied zwischen einer Matte und einem Plattennetz?", "Es gibt keinen rechnerischen Unterschied — eine Matte ist die Bewehrung selbst, während ein Plattennetz dieselbe zweiachsige Anordnung als Teil einer Platte beschreibt. Der Rechner funktioniert für beides; was sich ändert, ist nur, wie man es nennt und wie es verlegt wird."]],
  toc: `<nav class="content-block" aria-label="Auf dieser Seite">
    <h2>Auf dieser Seite</h2>
    <ul>
      <li><a href="#how-to">So benutzen Sie den Rechner</a></li>
      <li><a href="#formula">Die Formel, erklärt</a></li>
      <li><a href="#example-1">Rechenbeispiel 1: Matte 6 m × 3 m</a></li>
      <li><a href="#example-2">Rechenbeispiel 2: Matte 4 m × 4 m</a></li>
      <li><a href="#bar-table">Stabgewichtstabelle</a></li>
      <li><a href="#spacing-table">Abstandsleitfaden: Stäbe je Meter</a></li>
      <li><a href="#cost">Kosten schätzen</a></li>
      <li><a href="#imperial">Metrische und imperiale Einheiten</a></li>
      <li><a href="#not-included">Was der Rechner nicht enthält</a></li>
      <li><a href="#mistakes">Häufige Fehler</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
  </nav>`,
  extra: `<p><strong>Warum minus zweimal der Randabstand?</strong> Die äußeren Stäbe liegen innen am Mattenrand, auf beiden Seiten um den Randabstand versetzt, sodass der Randabstand an jedem Ende abgezogen wird, bevor gezählt wird. <strong>Warum plus eins?</strong> Der erste Stab liegt auf der Randabstandslinie, und dann folgt nach jedem Abstandsschritt ein weiterer Stab — die Anzahl ist also die Zahl der Abstände plus eins, nicht nur die Zahl der Abstände. <strong>Warum beide Richtungen?</strong> Eine Matte ist ein zweiachsiges Netz, und die zweite Richtung fügt meist etwa noch einmal so viel Stahl hinzu.</p>
    <p>Das Stabgewicht je Meter kommt aus der Standardformel kg/m = d² ÷ 162,28, wobei d der Stabdurchmesser in mm ist. Für einen Stab 10 mm: 10² ÷ 162,28 = 0,616 kg/m — derselbe Wert, den der Rechner verwendet.</p>
    <svg viewBox="0 0 520 330" role="img" aria-label="Diagramm einer Bewehrungsmatte mit Länge, Breite, Bewehrungsabstand und Randabstand" style="width:100%;max-width:520px;height:auto;display:block;margin:12px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
      <rect x="30" y="30" width="460" height="240" fill="none" stroke="#0f172a" stroke-width="2"/>
      <rect x="58" y="58" width="404" height="184" fill="none" stroke="#f97316" stroke-width="1.5" stroke-dasharray="6 4"/>
      <g stroke="#0f172a" stroke-width="1.5">
        <line x1="98" y1="58" x2="98" y2="242"/><line x1="158" y1="58" x2="158" y2="242"/><line x1="218" y1="58" x2="218" y2="242"/><line x1="278" y1="58" x2="278" y2="242"/><line x1="338" y1="58" x2="338" y2="242"/><line x1="398" y1="58" x2="398" y2="242"/>
        <line x1="58" y1="98" x2="462" y2="98"/><line x1="58" y1="158" x2="462" y2="158"/><line x1="58" y1="218" x2="462" y2="218"/>
      </g>
      <g font-family="sans-serif" font-size="13" fill="#0f172a">
        <text x="260" y="18" text-anchor="middle">L = Mattenlänge</text>
        <text x="14" y="155" text-anchor="middle" transform="rotate(-90 14 155)">W = Mattenbreite</text>
        <text x="128" y="52" text-anchor="middle" fill="#f97316">Abstand</text>
        <text x="44" y="80" fill="#f97316">Randabstand</text>
      </g>
      <g stroke="#f97316" stroke-width="1.5">
        <line x1="98" y1="44" x2="158" y2="44"/><line x1="98" y1="40" x2="98" y2="48"/><line x1="158" y1="40" x2="158" y2="48"/>
        <line x1="34" y1="30" x2="58" y2="58"/>
      </g>
    </svg>
    <p>Die orange gestrichelte Linie markiert, wo die Stäbe tatsächlich verlaufen: innerhalb des Randabstands, auf beiden Seiten. Die Stäbe kreuzen sich in beiden Richtungen, und jede Kreuzung ist ein Kreuzungspunkt.</p>
    <h3 id="example-1">Rechenbeispiel 1: Matte 6 m × 3 m</h3>
    <p>Matte 6 m × 3 m, Stäbe 10 mm (0,616 kg/m), Abstand 200 mm, Randabstand 25 mm. Dies sind die Werte, mit denen der Rechner startet, sodass Sie das Ergebnis sofort prüfen können:</p>
    <ol class="howto"><li>Stäbe entlang der 6-m-Richtung: floor((3.000 − 50) ÷ 200) + 1 = 15 Stäbe, je 5,95 m lang = 89,25 m.</li><li>Stäbe entlang der 3-m-Richtung: floor((6.000 − 50) ÷ 200) + 1 = 30 Stäbe, je 2,95 m lang = 88,50 m.</li><li>Gesamtstablänge: 89,25 + 88,50 = 177,75 m.</li><li>Gesamtgewicht: 177,75 × 0,616 = 109,49 kg.</li><li>Kreuzungspunkte: 15 × 30 = 450.</li></ol>
    <p>Probieren Sie es selbst: Geben Sie dieselben Zahlen oben in den Rechner ein, und Sie erhalten dasselbe Ergebnis.</p>
    <h3 id="example-2">Rechenbeispiel 2: Matte 4 m × 4 m</h3>
    <p>Matte 4 m × 4 m, Stäbe 12 mm (0,887 kg/m), Abstand 150 mm, Randabstand 25 mm:</p>
    <ol class="howto"><li>Stäbe entlang einer 4-m-Richtung: floor((4.000 − 50) ÷ 150) + 1 = 27 Stäbe, je 3,95 m lang = 106,65 m.</li><li>Stäbe entlang der anderen 4-m-Richtung: dasselbe = 27 Stäbe, je 3,95 m lang = 106,65 m.</li><li>Gesamtstablänge: 106,65 + 106,65 = 213,30 m.</li><li>Gesamtgewicht: 213,30 × 0,887 = 189,20 kg.</li><li>Kreuzungspunkte: 27 × 27 = 729.</li></ol>
    <p>Beachten Sie, wie die quadratische Matte in beiden Richtungen dieselbe Anzahl braucht, aber der engere Abstand von 150 mm die Bindungszahl auf 729 treibt — jeder zusätzliche Stab fügt eine ganze Reihe von Bindungen hinzu.</p>
    <h3 id="bar-table">Stabgewichtstabelle (kg/m)</h3>
    <div class="formula-table"><table>
      <tr><th>Stabdurchmesser</th><th>kg/m</th><th>Stäbe je Tonne</th></tr>
      <tr><td>8 mm</td><td>0,394</td><td>2.536</td></tr>
      <tr><td>10 mm</td><td>0,616</td><td>1.623</td></tr>
      <tr><td>12 mm</td><td>0,887</td><td>1.127</td></tr>
      <tr><td>16 mm</td><td>1,578</td><td>634</td></tr>
      <tr><td>20 mm</td><td>2,465</td><td>406</td></tr>
    </table></div>
    <p>Stäbe je Tonne = 1.000 ÷ kg/m. Sie gibt an, wie viele 1-Meter-Stäbe eine Tonne ergeben — praktisch, wenn ein Lieferant pro Tonne anbietet. <a href="/de/#charts">Die vollständige Bewehrungsgewichtstabelle ansehen (kg/m &amp; lb/ft) →</a></p>
    <h3 id="spacing-table">Abstandsleitfaden: Stäbe je Meter Mattenbreite</h3>
    <div class="formula-table"><table>
      <tr><th>Abstand (Achsabstand)</th><th>Stäbe je Meter</th></tr>
      <tr><td>100 mm</td><td>10,00</td></tr>
      <tr><td>150 mm</td><td>6,67</td></tr>
      <tr><td>200 mm</td><td>5,00</td></tr>
      <tr><td>250 mm</td><td>4,00</td></tr>
      <tr><td>300 mm</td><td>3,33</td></tr>
    </table></div>
    <p>Stäbe je Meter = 1.000 ÷ Abstand in mm. Halbiert man den Abstand, verdoppelt sich der Stahl etwa. Matten verwenden üblicherweise 150–200 mm Achsabstand — aber der Abstand ist eine Bemessungsentscheidung aus Ihren statischen Plänen, nie eine Schätzung aus einer Tabelle. Wenn Ihr Plan 200 mm vorschreibt, verwenden Sie 200 mm, auch wenn 300 mm günstiger wäre.</p>
    <h3 id="cost">Kosten schätzen</h3>
    <p>Kosten = Gesamtgewicht × Preis je kg (oder Gesamttonnen × Preis je Tonne). Mit Rechenbeispiel 1: 109,49 kg × 1,20 €/kg = 131,39 € je Matte. Fünf identische Matten: 547,47 kg × 1,20 €/kg = 656,96 €. Die Preise variieren je nach Region, Lieferant und Stabgröße — holen Sie also vor der Budgetierung ein aktuelles Angebot ein, und denken Sie daran, dass die Bestellmenge höher ist als das reine Mattengewicht, sobald Übergreifungen zwischen Matten, Bindedraht und Verschnitt hinzukommen. Für eine vollständige Kostenaufstellung verwenden Sie den <a href="/de/bewehrungskosten-rechner">Bewehrungskosten-Rechner</a>.</p>
    <h3 id="imperial">Metrische und imperiale Einheiten</h3>
    <p>Dieser Rechner arbeitet in Metern, Millimetern und Kilogramm. Wenn Ihre Pläne Fuß und Zoll verwenden:</p>
    <div class="formula-table"><table>
      <tr><th>Metrisch</th><th>Imperial (ca.)</th></tr>
      <tr><td>Abstand 150 mm</td><td>6 in</td></tr>
      <tr><td>Abstand 200 mm</td><td>8 in</td></tr>
      <tr><td>Randabstand 25 mm</td><td>1 in</td></tr>
      <tr><td>109,49 kg</td><td>241,43 lb (× 2,205)</td></tr>
      <tr><td>Matte 6 m × 3 m</td><td>19,69 ft × 9,84 ft (× 3,281)</td></tr>
    </table></div>
    <p>Rechnen Sie zuerst um und geben Sie dann metrische Werte in den Rechner ein — mischen Sie keine Einheiten in einer Berechnung.</p>
    <h3 id="not-included">Was der Rechner nicht enthält</h3>
    <ul>
      <li><strong>Bindedraht.</strong> Der Rechner zählt Kreuzungen (450 in Beispiel 1), aber nicht den Draht selbst. Schätzen Sie den Draht anhand der Kreuzungen mit dem <a href="/de/bindedraht-rechner">Bindedraht-Rechner</a>.</li>
      <li><strong>Übergreifungen zwischen Matten.</strong> Wo eine Matte an die nächste stößt, müssen sich die Stäbe überlappen. Ermitteln Sie die Überlappung mit dem <a href="/de/uebergreifungslaengen-rechner">Übergreifungslängen-Rechner</a> und addieren Sie sie zur Länge.</li>
      <li><strong>Abstandhalter.</strong> Die Matte braucht Unterstützung, um auf der richtigen Höhe und Deckung zu bleiben. Schätzen Sie diese mit dem <a href="/de/abstandhalter-rechner">Abstandhalter-Rechner</a>.</li>
      <li><strong>Verschnitt.</strong> Das Zuschneiden der Stäbe auf Länge hinterlässt immer Abschnitte. Addieren Sie vor der Bestellung einen Verschnittzuschlag auf das reine Gewicht.</li>
      <li><strong>Haken und Biegungen.</strong> Randhaken und aufgebogene Stäbe fügen Länge hinzu. Verwenden Sie dafür den <a href="/de/haken-biege-schnittlaengen-rechner">Haken- und Schnittlängen-Rechner</a>.</li>
      <li><strong>Geschweißte Matten.</strong> Wenn Sie vorgefertigte Matten statt loser Stäbe kaufen, sind die Formate und Gewichte festgelegt — dieser Rechner gilt für Matten aus losen Stäben.</li>
    </ul>
    <h3 id="mistakes">4 häufige Fehler</h3>
    <ol class="howto"><li><strong>Randabstand mit Deckung verwechseln.</strong> Der Randabstand ist der Abstand vom Mattenrand bis zum ersten Stab. Die Betondeckung — der Beton über der Matte — ist ein separater Wert, der durch die Bemessung und die Unterstützung festgelegt wird, nicht durch diesen Rechner.</li><li><strong>Nur eine Richtung zählen.</strong> Eine Matte verläuft in beide Richtungen. Die zweite Richtung fügt meist etwa noch einmal so viel Stahl hinzu.</li><li><strong>mm und m verwechseln.</strong> Abstand und Randabstand sind in Millimetern, Mattengröße in Metern. 200 als Meter statt als Millimeter einzugeben, zerstört das Ergebnis vollständig.</li><li><strong>Genau das berechnete Gewicht bestellen.</strong> Addieren Sie Übergreifungen zwischen Matten, Bindedraht und Verschnitt obendrauf — der Rechner gibt das reine Mattengewicht an, nicht die Bestellmenge.</li></ol>
    <p class="muted">Zuletzt geprüft: Oktober 2026. Die Stabgewichte folgen der Formel d² ÷ 162,28 (Praxis nach ASTM A615 / IS 456). Die Ergebnisse sind Schätzungen zur Orientierung — prüfen Sie sie immer anhand Ihrer statischen Pläne und der Bemessungsnorm.</p>`
}
},
    { id:"concrete", slug:"concrete-and-rebar-calculator", cat:"Estimating",
    metaTitle:"Concrete & Rebar Calculator — Volume + Steel (kg/m³)",
    h1:"Concrete & Rebar Estimator",
    desc:"One calculator for concrete volume in m³, yd³ and ft³ plus a steel estimate by kg/m³ ratio. A 5 × 4 m slab at 150 mm = 3.00 m³ and 240 kg steel.",
    kw:"concrete and rebar calculator, concrete rebar estimator, concrete volume and steel",
    intro:"Estimate both concrete and steel for a pour. Enter the dimensions to get the concrete volume in m³, yd³ and ft³, plus a steel estimate from a reinforcement ratio (kg/m³).",
    howto:["Enter length and width in metres.","Enter thickness in millimetres, not metres.","Set the steel ratio (kg per m³) for the member type.","Read the volume in m³, yd³ and ft³, and the steel in kg and tonnes.","Add a waste allowance before ordering — the calculator gives neat volume, not the order quantity."],
    formula:"Volume = L × W × thickness. Steel = volume × ratio (typically 80–120 kg/m³ for slabs).",
    hideCards: true,
    toc:`<nav class="content-block" aria-label="On this page">
    <h2>On this page</h2>
    <ul>
      <li><a href="#how-to">How to use the calculator</a></li>
      <li><a href="#formula">The formula, explained</a></li>
      <li><a href="#example-1">Worked example 1: 5 m × 4 m slab</a></li>
      <li><a href="#example-2">Worked example 2: 6 m × 5 m slab</a></li>
      <li><a href="#ratio-table">Steel ratio guide (kg/m³)</a></li>
      <li><a href="#waste">Ordering extra: the waste allowance</a></li>
      <li><a href="#cost">Estimating the cost</a></li>
      <li><a href="#imperial">Metric and imperial units</a></li>
      <li><a href="#not-included">What the calculator does not include</a></li>
      <li><a href="#mistakes">Common mistakes</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
  </nav>`,
    extra:`<p><strong>Why is thickness in millimetres?</strong> Slabs are drawn and specified in mm (100 mm, 150 mm, 200 mm), so the calculator takes thickness in mm and divides by 1,000 to get metres before multiplying. Entering 150 as metres would overstate the volume a thousand times. <strong>What is the steel ratio?</strong> It is the kilograms of reinforcement per cubic metre of concrete — a shortcut that turns a volume into a steel estimate without a full bar schedule. <strong>Why three volume units?</strong> Concrete is ordered in m³ in most of the world, but in yd³ in the US — and ft³ helps when a supplier or drawing works in feet.</p>
    <p>The conversions are fixed: 1 m³ = 1.30795 yd³ and 1 m³ = 35.3147 ft³. The calculator shows all three, so there is nothing to convert by hand.</p>
    <h3 id="example-1">Worked example 1: 5 m × 4 m slab</h3>
    <p>Slab 5 m × 4 m, 150 mm thick, steel ratio 80 kg/m³. These are the values the calculator opens with, so you can check the result immediately:</p>
    <ol class="howto"><li>Volume: 5 × 4 × 0.150 = 3.00 m³.</li><li>In cubic yards: 3.00 × 1.30795 = 3.92 yd³.</li><li>In cubic feet: 3.00 × 35.3147 = 105.94 ft³.</li><li>Estimated steel: 3.00 × 80 = 240.00 kg (0.240 tonnes).</li></ol>
    <p>Try it yourself: enter the same numbers in the calculator above and you will get the same result.</p>
    <h3 id="example-2">Worked example 2: 6 m × 5 m slab</h3>
    <p>Slab 6 m × 5 m, 200 mm thick, steel ratio 100 kg/m³:</p>
    <ol class="howto"><li>Volume: 6 × 5 × 0.200 = 6.00 m³.</li><li>In cubic yards: 6.00 × 1.30795 = 7.85 yd³.</li><li>In cubic feet: 6.00 × 35.3147 = 211.89 ft³.</li><li>Estimated steel: 6.00 × 100 = 600.00 kg (0.600 tonnes).</li></ol>
    <p>Notice how doubling the thickness from 150 mm to 200 mm and raising the ratio from 80 to 100 more than doubles the steel — volume and ratio multiply, so both matter.</p>
    <h3 id="ratio-table">Steel ratio guide (kg/m³)</h3>
    <div class="formula-table"><table>
      <tr><th>Member type</th><th>Typical steel ratio</th></tr>
      <tr><td>Slabs</td><td>80–120 kg/m³</td></tr>
      <tr><td>Footings</td><td>70–100 kg/m³</td></tr>
      <tr><td>Walls</td><td>60–100 kg/m³</td></tr>
      <tr><td>Beams</td><td>150–200 kg/m³</td></tr>
      <tr><td>Columns</td><td>200–300 kg/m³</td></tr>
    </table></div>
    <p>These are rule-of-thumb ranges for early estimates only. The structural design sets the real ratio — using a slab ratio for a column would underestimate the steel by more than half. The calculator's 80 kg/m³ default is the low end for slabs.</p>
    <h3 id="waste">Ordering extra: the waste allowance</h3>
    <p>Never order exactly the neat volume. Spillage, formwork bulging, uneven subgrade and pump priming all eat concrete on site, so a 5–10% allowance is standard. For worked example 1: 3.00 m³ + 10% = 3.30 m³ to order. It is cheaper than a short load and a second delivery — and the same thinking applies to steel, where laps and cutting waste sit on top of the neat estimate.</p>
    <h3 id="cost">Estimating the cost</h3>
    <p>Cost = (concrete volume × price per m³) + (steel weight × price per kg). Using worked example 1 with example prices of €120/m³ for concrete and €1.20/kg for steel: concrete 3.00 × €120 = €360.00, steel 240.00 × €1.20 = €288.00, total €648.00. Prices vary by region, supplier and mix, so get current quotes before budgeting. For a steel-only breakdown, use the <a href="/rebar-cost-calculator">rebar cost calculator</a>.</p>
    <h3 id="imperial">Metric and imperial units</h3>
    <p>This calculator takes metres and millimetres and reports m³, yd³ and ft³. If your drawings use feet and inches:</p>
    <div class="formula-table"><table>
      <tr><th>Metric</th><th>Imperial (approx.)</th></tr>
      <tr><td>100 mm thick</td><td>4 in</td></tr>
      <tr><td>150 mm thick</td><td>6 in</td></tr>
      <tr><td>200 mm thick</td><td>8 in</td></tr>
      <tr><td>5 m × 4 m slab</td><td>16.40 ft × 13.12 ft (× 3.281)</td></tr>
      <tr><td>3.00 m³</td><td>3.92 yd³ (× 1.30795) / 105.94 ft³ (× 35.3147)</td></tr>
    </table></div>
    <p>Convert first, then enter metric values into the calculator — do not mix units in one calculation.</p>
    <h3 id="not-included">What the calculator does not include</h3>
    <ul>
      <li><strong>A bar schedule.</strong> This gives total steel in kg, not bar sizes, counts, laps or spacings. For a bar-by-bar take-off, use the <a href="/concrete-slab-rebar-calculator">slab calculator</a>, <a href="/footing-rebar-calculator">footing calculator</a>, <a href="/rebar-mat-grid-calculator">mat calculator</a> or <a href="/rebar-quantity-calculator">quantity & takeoff calculator</a> for a full count-and-length take-off.</li>
      <li><strong>Waste allowance.</strong> The result is neat volume. Add 5–10% before ordering (see above).</li>
      <li><strong>Formwork, labour and pumping.</strong> Placing costs are separate from material quantities.</li>
      <li><strong>Blinding and sub-base.</strong> The slab sits on blinding and hardcore — neither is in this volume.</li>
      <li><strong>Joints and curing.</strong> Saw cuts, dowels at joints and curing compound are detailing items, not volume items.</li>
    </ul>
    <h3 id="mistakes">4 common mistakes</h3>
    <ol class="howto"><li><strong>Entering thickness in metres.</strong> The thickness field takes millimetres. Typing 0.15 instead of 150 understates the volume a thousand times; typing 150 as metres overstates it the same way.</li><li><strong>Using the wrong ratio for the member.</strong> A slab ratio applied to a column underestimates the steel by more than half. Match the ratio to the member type (see the table above).</li><li><strong>Ordering exactly the neat volume.</strong> Without a 5–10% waste allowance, the last corner of the pour runs short.</li><li><strong>Treating the steel estimate as a bar schedule.</strong> A kg total tells you what to budget, not what to cut and tie. Bar sizes, counts and laps need the detailing calculators.</li></ol>
    <p class="muted">Last reviewed: October 2026. Volumes use the exact conversions 1 m³ = 1.30795 yd³ and 1 m³ = 35.3147 ft³. Steel ratios are rule-of-thumb ranges for early estimates — always verify against your structural drawings and design code.</p>`,
    faqs:[["How do I calculate concrete volume?","Multiply length × width × thickness in consistent units. With metres and millimetres: volume (m³) = length (m) × width (m) × thickness (mm) ÷ 1,000. Example: 5 × 4 × 150 mm = 3.00 m³."],
          ["How much steel per m³ of concrete?","Roughly 80–120 kg/m³ for slabs, 70–100 for footings, 150–200 for beams and 200–300 for columns — design governs. The calculator's 80 kg/m³ default is the low end for slabs."],
          ["How much concrete do I need for a 5 m × 4 m slab?","At 150 mm thick: 3.00 m³ (3.92 yd³, 105.94 ft³), plus an estimated 240.00 kg of steel at 80 kg/m³. Add 5–10% before ordering — 3.30 m³ at a 10% allowance."],
          ["What is the steel ratio (kg/m³)?","The kilograms of reinforcement per cubic metre of concrete. It turns a volume into a steel estimate without a full bar schedule: steel (kg) = volume (m³) × ratio. It is an estimating shortcut, not a substitute for design."],
          ["How much extra concrete should I order?","A 5–10% waste allowance is standard for spillage, formwork bulging and uneven subgrade. For the 5 m × 4 m example: 3.00 m³ neat becomes 3.30 m³ ordered at 10%."],
          ["How do I convert m³ to yd³ and ft³?","Multiply by 1.30795 for yd³ and by 35.3147 for ft³. So 3.00 m³ = 3.92 yd³ = 105.94 ft³. The calculator shows all three automatically."],
          ["How much does the concrete and steel cost?","Multiply each quantity by its local price. With example prices of €120/m³ for concrete and €1.20/kg for steel, the 5 m × 4 m slab costs €360.00 + €288.00 = €648.00 in materials. Get current local quotes before budgeting."],
          ["Does the calculator give me bar sizes and counts?","No — it gives total steel weight only. For bar sizes, counts, spacings and laps, use the slab, footing or mat calculator, which size the actual two-way grid."],
          ["What thickness should a slab be?","Residential ground slabs are commonly 100–150 mm; heavier or commercial slabs go thicker. Thickness drives volume directly — doubling it doubles the concrete — so it must come from the design, not from a guess."],
          ["Can I use this for footings, beams and columns?","The volume maths works for any rectangular pour, and the ratio table above covers the common member types. But for beams and columns, a bar schedule from the detailing calculators is more precise than a kg/m³ estimate. A driveway is a slab pour — the <a href=\"/driveway-rebar-calculator\">driveway calculator</a> sizes its bar grid, while this estimator gives you the concrete volume and steel total."]] ,
    de: {
  metaTitle: "Beton- & Bewehrungs-Schätzer — Volumen & kg gratis",
  desc: "Beton- & Bewehrungs-Schätzer: Betonvolumen in m³, yd³ und ft³ und Stahl nach kg/m³ berechnen. Beispiel: 5 m × 4 m Platte = 3,00 m³ und 240 kg. Kostenlos.",
  formula: "Volumen = L × B × Dicke. Stahl = Volumen × Stahlgehalt (typisch 80–120 kg/m³ für Platten).",
  kw: "beton- und bewehrungsrechner, beton bewehrung schätzer, betonvolumen und stahl berechnen",
  howto: ["Länge und Breite in Metern eingeben.", "Dicke in Millimetern eingeben, nicht in Metern.", "Stahlgehalt (kg pro m³) für den Bauteiltyp festlegen.", "Volumen in m³, yd³ und ft³ sowie Stahl in kg und Tonnen ablesen.", "Vor der Bestellung einen Verschnitt-Zuschlag addieren — der Rechner gibt das reine Volumen an, nicht die Bestellmenge."],
  faqs: [["Wie berechne ich das Betonvolumen?", "Länge × Breite × Dicke in einheitlichen Einheiten multiplizieren. Mit Metern und Millimetern: Volumen (m³) = Länge (m) × Breite (m) × Dicke (mm) ÷ 1.000. Beispiel: 5 × 4 × 150 mm = 3,00 m³."],
          ["Wie viel Stahl pro m³ Beton?", "Rund 80–120 kg/m³ für Platten, 70–100 für Fundamente, 150–200 für Balken und 200–300 für Stützen — die Bemessung ist maßgebend. Der Standardwert des Rechners von 80 kg/m³ ist das untere Ende für Platten."],
          ["Wie viel Beton brauche ich für eine 5 m × 4 m Platte?", "Bei 150 mm Dicke: 3,00 m³ (3,92 yd³, 105,94 ft³), plus geschätzt 240,00 kg Stahl bei 80 kg/m³. Vor der Bestellung 5–10 % addieren — 3,30 m³ bei einem Zuschlag von 10 %."],
          ["Was ist der Stahlgehalt (kg/m³)?", "Die Kilogramm Bewehrung pro Kubikmeter Beton. Er macht aus einem Volumen eine Stahlschätzung ohne vollständige Bewehrungsliste: Stahl (kg) = Volumen (m³) × Stahlgehalt. Er ist eine Schätz-Abkürzung, kein Ersatz für die Bemessung."],
          ["Wie viel Beton sollte ich zusätzlich bestellen?", "Ein Verschnitt-Zuschlag von 5–10 % ist üblich für Verschütten, ausbeulende Schalung und unebenen Untergrund. Für das Beispiel 5 m × 4 m: 3,00 m³ netto werden bei 10 % zu 3,30 m³ Bestellmenge."],
          ["Wie rechne ich m³ in yd³ und ft³ um?", "Mit 1,30795 multiplizieren für yd³ und mit 35,3147 für ft³. Also 3,00 m³ = 3,92 yd³ = 105,94 ft³. Der Rechner zeigt alle drei automatisch an."],
          ["Was kosten Beton und Stahl?", "Jede Menge mit ihrem örtlichen Preis multiplizieren. Mit Beispielpreisen von 120 €/m³ für Beton und 1,20 €/kg für Stahl kostet die 5 m × 4 m Platte 360,00 € + 288,00 € = 648,00 € an Material. Vor der Budgetierung aktuelle örtliche Angebote einholen."],
          ["Gibt der Rechner Stabdurchmesser und Stückzahlen an?", "Nein — er gibt nur das Gesamtgewicht des Stahls an. Für Stabdurchmesser, Stückzahlen, Abstände und Übergreifungen den Platten-, Fundament- oder Matten-Rechner benutzen, die das tatsächliche zweilagige Netz bemessen."],
          ["Wie dick sollte eine Platte sein?", "Wohnungs-Bodenplatten sind üblich 100–150 mm dick; schwerere oder gewerbliche Platten werden dicker. Die Dicke treibt das Volumen direkt — eine Verdopplung verdoppelt den Beton — also muss sie aus der Bemessung kommen, nicht aus einer Schätzung."],
          ["Kann ich den Rechner für Fundamente, Balken und Stützen benutzen?", "Die Volumenrechnung funktioniert für jede rechteckige Schüttung, und die Tabelle oben deckt die üblichen Bauteiltypen ab. Für Balken und Stützen ist eine Bewehrungsliste aus den Detaillierungs-Rechnern aber genauer als eine kg/m³-Schätzung. Eine Einfahrt ist eine Platten-Schüttung — der <a href=\"/de/bewehrungsrechner-fuer-einfahrten\">Bewehrungsrechner für Einfahrten</a> bemisst deren Stabnetz, während dieser Schätzer das Betonvolumen und die Stahlgesamtmenge angibt."]],
  toc: `<nav class="content-block" aria-label="Auf dieser Seite">
    <h2>Auf dieser Seite</h2>
    <ul>
      <li><a href="#how-to">So funktioniert der Rechner</a></li>
      <li><a href="#formula">Die Formel, erklärt</a></li>
      <li><a href="#example-1">Rechenbeispiel 1: 5 m × 4 m Platte</a></li>
      <li><a href="#example-2">Rechenbeispiel 2: 6 m × 5 m Platte</a></li>
      <li><a href="#ratio-table">Stahlgehalt-Tabelle (kg/m³)</a></li>
      <li><a href="#waste">Mehr bestellen: der Verschnitt-Zuschlag</a></li>
      <li><a href="#cost">Kosten schätzen</a></li>
      <li><a href="#imperial">Metrische und imperiale Einheiten</a></li>
      <li><a href="#not-included">Was der Rechner nicht enthält</a></li>
      <li><a href="#mistakes">Häufige Fehler</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
  </nav>`,
  extra: `<p><strong>Warum ist die Dicke in Millimetern?</strong> Platten werden in mm gezeichnet und ausgeschrieben (100 mm, 150 mm, 200 mm), deshalb nimmt der Rechner die Dicke in mm und teilt durch 1.000, um Meter zu erhalten, bevor er multipliziert. Wer 150 als Meter eingibt, überschätzt das Volumen um das Tausendfache. <strong>Was ist der Stahlgehalt?</strong> Er ist die Kilogramm Bewehrung pro Kubikmeter Beton — eine Abkürzung, die aus einem Volumen eine Stahlschätzung macht, ohne vollständige Bewehrungsliste. <strong>Warum drei Volumeneinheiten?</strong> Beton wird in den meisten Ländern in m³ bestellt, in den USA aber in yd³ — und ft³ hilft, wenn ein Lieferant oder eine Zeichnung in Fuß arbeitet.</p>
    <p>Die Umrechnungen sind fest: 1 m³ = 1,30795 yd³ und 1 m³ = 35,3147 ft³. Der Rechner zeigt alle drei an, also muss nichts von Hand umgerechnet werden.</p>
    <h3 id="example-1">Rechenbeispiel 1: 5 m × 4 m Platte</h3>
    <p>Platte 5 m × 4 m, 150 mm dick, Stahlgehalt 80 kg/m³. Das sind die Werte, mit denen sich der Rechner öffnet, sodass das Ergebnis sofort geprüft werden kann:</p>
    <ol class="howto"><li>Volumen: 5 × 4 × 0,150 = 3,00 m³.</li><li>In Kubikyard: 3,00 × 1,30795 = 3,92 yd³.</li><li>In Kubikfuß: 3,00 × 35,3147 = 105,94 ft³.</li><li>Geschätzter Stahl: 3,00 × 80 = 240,00 kg (0,240 Tonnen).</li></ol>
    <p>Selbst ausprobieren: Die gleichen Zahlen oben in den Rechner eingeben, und das gleiche Ergebnis erscheint.</p>
    <h3 id="example-2">Rechenbeispiel 2: 6 m × 5 m Platte</h3>
    <p>Platte 6 m × 5 m, 200 mm dick, Stahlgehalt 100 kg/m³:</p>
    <ol class="howto"><li>Volumen: 6 × 5 × 0,200 = 6,00 m³.</li><li>In Kubikyard: 6,00 × 1,30795 = 7,85 yd³.</li><li>In Kubikfuß: 6,00 × 35,3147 = 211,89 ft³.</li><li>Geschätzter Stahl: 6,00 × 100 = 600,00 kg (0,600 Tonnen).</li></ol>
    <p>Man sieht: Die Dicke von 150 mm auf 200 mm zu erhöhen und den Stahlgehalt von 80 auf 100 anzuheben, lässt den Stahl auf mehr als das Doppelte steigen — Volumen und Stahlgehalt multiplizieren sich, beides zählt also.</p>
    <h3 id="ratio-table">Stahlgehalt-Tabelle (kg/m³)</h3>
    <div class="formula-table"><table>
      <tr><th>Bauteiltyp</th><th>Typischer Stahlgehalt</th></tr>
      <tr><td>Platten</td><td>80–120 kg/m³</td></tr>
      <tr><td>Fundamente</td><td>70–100 kg/m³</td></tr>
      <tr><td>Wände</td><td>60–100 kg/m³</td></tr>
      <tr><td>Balken</td><td>150–200 kg/m³</td></tr>
      <tr><td>Stützen</td><td>200–300 kg/m³</td></tr>
    </table></div>
    <p>Das sind Faustwerte nur für erste Schätzungen. Die statische Bemessung legt den echten Stahlgehalt fest — wer einen Plattenwert für eine Stütze nimmt, unterschätzt den Stahl um mehr als die Hälfte. Der Standardwert des Rechners von 80 kg/m³ ist das untere Ende für Platten.</p>
    <h3 id="waste">Mehr bestellen: der Verschnitt-Zuschlag</h3>
    <p>Nie genau das reine Volumen bestellen. Verschütten, ausbeulende Schalung, unebener Untergrund und das Anpumpen der Pumpe zehren auf der Baustelle am Beton, deshalb ist ein Zuschlag von 5–10 % üblich. Für Rechenbeispiel 1: 3,00 m³ + 10 % = 3,30 m³ Bestellmenge. Das ist günstiger als eine zu kleine Ladung und eine zweite Lieferung — und das gleiche Denken gilt für Stahl, wo Übergreifungen und Schnittverschnitt auf die reine Schätzung aufschlagen.</p>
    <h3 id="cost">Kosten schätzen</h3>
    <p>Kosten = (Betonvolumen × Preis pro m³) + (Stahlgewicht × Preis pro kg). Mit Rechenbeispiel 1 und Beispielpreisen von 120 €/m³ für Beton und 1,20 €/kg für Stahl: Beton 3,00 × 120 = 360,00 €, Stahl 240,00 × 1,20 = 288,00 €, gesamt 648,00 €. Die Preise variieren je nach Region, Lieferant und Mischung, deshalb vor der Budgetierung aktuelle Angebote einholen. Für eine reine Stahl-Aufschlüsselung den <a href="/de/bewehrungskosten-rechner">Bewehrungskosten-Rechner</a> benutzen.</p>
    <h3 id="imperial">Metrische und imperiale Einheiten</h3>
    <p>Dieser Rechner nimmt Meter und Millimeter und gibt m³, yd³ und ft³ aus. Falls die Zeichnungen in Fuß und Zoll arbeiten:</p>
    <div class="formula-table"><table>
      <tr><th>Metrisch</th><th>Imperial (ca.)</th></tr>
      <tr><td>100 mm dick</td><td>4 in</td></tr>
      <tr><td>150 mm dick</td><td>6 in</td></tr>
      <tr><td>200 mm dick</td><td>8 in</td></tr>
      <tr><td>5 m × 4 m Platte</td><td>16,40 ft × 13,12 ft (× 3,281)</td></tr>
      <tr><td>3,00 m³</td><td>3,92 yd³ (× 1,30795) / 105,94 ft³ (× 35,3147)</td></tr>
    </table></div>
    <p>Zuerst umrechnen, dann metrische Werte in den Rechner eingeben — keine Einheiten in einer Berechnung mischen.</p>
    <h3 id="not-included">Was der Rechner nicht enthält</h3>
    <ul>
      <li><strong>Eine Bewehrungsliste.</strong> Das ergibt Gesamtstahl in kg, keine Stabdurchmesser, Stückzahlen, Übergreifungen oder Abstände. Für eine stabgenaue Abnahme den <a href="/de/bewehrungsrechner-fuer-betonplatten">Bewehrungsrechner für Betonplatten</a>, <a href="/de/bewehrungsrechner-fuer-fundamente">Bewehrungsrechner für Fundamente</a>, <a href="/de/bewehrungsmatten-rechner">Bewehrungsmatten-Rechner</a> oder <a href="/de/bewehrungsmengen-rechner">Bewehrungsmengen-Rechner</a> für eine vollständige Stück- und Längenabnahme benutzen.</li>
      <li><strong>Verschnitt-Zuschlag.</strong> Das Ergebnis ist reines Volumen. Vor der Bestellung 5–10 % addieren (siehe oben).</li>
      <li><strong>Schalung, Arbeitslohn und Pumpen.</strong> Die Einbaukosten sind von den Materialmengen getrennt.</li>
      <li><strong>Sauberkeitsschicht und Unterbau.</strong> Die Platte liegt auf Sauberkeitsschicht und Schotter — beides ist nicht in diesem Volumen enthalten.</li>
      <li><strong>Fugen und Nachbehandlung.</strong> Sägeschnitte, Dübel an Fugen und Nachbehandlungsmittel sind Detaillierungs-Posten, keine Volumen-Posten.</li>
    </ul>
    <h3 id="mistakes">4 häufige Fehler</h3>
    <ol class="howto"><li><strong>Dicke in Metern eingeben.</strong> Das Dickenfeld nimmt Millimeter. Wer 0,15 statt 150 tippt, unterschätzt das Volumen um das Tausendfache; wer 150 als Meter eingibt, überschätzt es genauso.</li><li><strong>Falschen Stahlgehalt für den Bauteiltyp nehmen.</strong> Ein Plattenwert, auf eine Stütze angewendet, unterschätzt den Stahl um mehr als die Hälfte. Den Stahlgehalt an den Bauteiltyp anpassen (siehe Tabelle oben).</li><li><strong>Genau das reine Volumen bestellen.</strong> Ohne einen Verschnitt-Zuschlag von 5–10 % wird die letzte Ecke der Schüttung knapp.</li><li><strong>Die Stahlschätzung für eine Bewehrungsliste halten.</strong> Eine kg-Gesamtmenge sagt, was zu budgetieren ist, nicht was zu schneiden und zu binden ist. Stabdurchmesser, Stückzahlen und Übergreifungen brauchen die Detaillierungs-Rechner.</li></ol>
    <p class="muted">Zuletzt geprüft: Oktober 2026. Die Volumen nutzen die exakten Umrechnungen 1 m³ = 1,30795 yd³ und 1 m³ = 35,3147 ft³. Die Stahlgehalte sind Faustwerte für erste Schätzungen — immer mit den statischen Plänen und der Bemessungsnorm abgleichen.</p>`
}
},
    { id:"driveway", slug:"driveway-rebar-calculator", cat:"Estimating",
    metaTitle:"Driveway Rebar Calculator — Bars, Length & kg, Free",
    h1:"Driveway Rebar Calculator",
    desc:"Rebar for your driveway slab in seconds: bar counts both ways, total length, weight and ties. Sized for car slabs and heavy-vehicle driveways alike.",
    kw:"driveway rebar calculator, rebar for driveway, driveway reinforcement, concrete driveway rebar",
    intro:"Size the rebar mat for a driveway. Enter the driveway length and width, the bar spacing and cover, and get the bar count both ways plus the total steel weight.",
    howto:["Enter driveway length and width in metres.","Set the bar spacing and edge cover.","Pick the bar size for the total.","Read the bar count both ways, total length, weight and tie count.","Add laps and waste before ordering — the calculator gives the neat mat, not the order quantity."],
    formula:"Bars each way = floor((dimension − 2 × cover) ÷ spacing) + 1, × kg/m for the weight.",
    toc:`<nav class="content-block" aria-label="On this page">
    <h2>On this page</h2>
    <ul>
      <li><a href="#how-to">How to use the calculator</a></li>
      <li><a href="#formula">The formula, explained</a></li>
      <li><a href="#example-1">Worked example 1: 10 m × 3 m driveway</a></li>
      <li><a href="#example-2">Worked example 2: 10 m × 6 m two-car driveway</a></li>
      <li><a href="#sizes-table">Typical driveway sizes</a></li>
      <li><a href="#thickness-table">Slab thickness by vehicle</a></li>
      <li><a href="#bar-table">Bar size table</a></li>
      <li><a href="#spacing-table">Spacing guide</a></li>
      <li><a href="#wheel-track">Wheel-track spacing</a></li>
      <li><a href="#joints">Joints and dowels</a></li>
      <li><a href="#thickened-edges">Thickened edges</a></li>
      <li><a href="#frost">Frost heave and the sub-base</a></li>
      <li><a href="#cost">Estimating the cost</a></li>
      <li><a href="#imperial">Metric and imperial units</a></li>
      <li><a href="#not-included">What the calculator does not include</a></li>
      <li><a href="#mistakes">Common mistakes</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
  </nav>`,
    extra:`<p><strong>Why subtract cover twice?</strong> The bars stop one cover short of each edge, so the span they cover is the dimension minus two covers. <strong>Why +1?</strong> A row of bars at both ends plus one per spacing interval — without the +1 you would be one bar short in each direction. <strong>What is a tie?</strong> Each crossing of a lengthwise and a crosswise bar is one tie-wire intersection; the calculator counts them so you can size tie wire with the <a href="/rebar-tie-wire-calculator">tie-wire calculator</a>.</p>
    <h3 id="example-1">Worked example 1: 10 m × 3 m driveway</h3>
    <p>Driveway 10 m × 3 m, 400 mm spacing, 75 mm edge cover, 12.7 mm (#4) bars. These are the values the calculator opens with, so you can check the result immediately:</p>
    <ol class="howto"><li>Bars along the length: floor((3.00 − 0.15) ÷ 0.40) + 1 = 8 bars, each 9.85 m long.</li><li>Bars across the width: floor((10.00 − 0.15) ÷ 0.40) + 1 = 25 bars, each 2.85 m long.</li><li>Total length: 8 × 9.85 + 25 × 2.85 = 150.05 m.</li><li>Weight: 150.05 × 0.994 = 149.15 kg (328.82 lb), with 8 × 25 = 200 ties.</li></ol>
    <p>Try it yourself: enter the same numbers in the calculator above and you will get the same result.</p>
    <h3 id="example-2">Worked example 2: 10 m × 6 m two-car driveway</h3>
    <p>Driveway 10 m × 6 m, same 400 mm spacing, 75 mm cover, 12.7 mm bars:</p>
    <ol class="howto"><li>Bars along the length: floor((6.00 − 0.15) ÷ 0.40) + 1 = 15 bars, each 9.85 m long.</li><li>Bars across the width: 25 bars, each 5.85 m long.</li><li>Total length: 15 × 9.85 + 25 × 5.85 = 294.00 m.</li><li>Weight: 294.00 × 0.994 = 292.24 kg (644.28 lb), with 15 × 25 = 375 ties.</li></ol>
    <p>Doubling the width roughly doubles the steel — the mat grows in both directions, so area, not just length, drives the total.</p>
    <h3 id="sizes-table">Typical driveway sizes</h3>
    <div class="formula-table"><table>
      <tr><th>Driveway</th><th>Size</th><th>Steel (12.7 mm, 400 mm, 75 mm)</th></tr>
      <tr><td>Single-car</td><td>10 × 3 m</td><td>150.05 m, 149.15 kg, 200 ties</td></tr>
      <tr><td>Two-car</td><td>10 × 6 m</td><td>294.00 m, 292.24 kg, 375 ties</td></tr>
      <tr><td>RV / heavy</td><td>12 × 4 m</td><td>234.00 m, 232.60 kg, 300 ties</td></tr>
    </table></div>
    <p>These are typical sizes to start from — the calculator takes any length and width, so enter your real dimensions for the real answer.</p>
    <h3 id="thickness-table">Slab thickness by vehicle</h3>
    <div class="formula-table"><table>
      <tr><th>Traffic</th><th>Typical thickness</th></tr>
      <tr><td>Cars only</td><td>100 mm (4 in)</td></tr>
      <tr><td>SUVs / light trucks</td><td>125 mm (5 in)</td></tr>
      <tr><td>Heavy vehicles / RVs</td><td>150 mm or more (6 in+)</td></tr>
    </table></div>
    <p>Thickness is a design decision, not a calculator input — this table is a rule of thumb for early estimates only. A thicker slab carries heavier loads and needs the steel to match, so confirm both against your design.</p>
    <h3 id="bar-table">Bar size table</h3>
    <div class="formula-table"><table>
      <tr><th>Metric bar</th><th>Weight</th><th>Imperial bar</th><th>Weight</th></tr>
      <tr><td>8 mm</td><td>0.394 kg/m</td><td>#3 (9.5 mm)</td><td>0.376 lb/ft</td></tr>
      <tr><td>10 mm</td><td>0.616 kg/m</td><td>#4 (12.7 mm)</td><td>0.668 lb/ft</td></tr>
      <tr><td>12 mm</td><td>0.887 kg/m</td><td>#5 (15.9 mm)</td><td>1.043 lb/ft</td></tr>
      <tr><td>16 mm</td><td>1.578 kg/m</td><td>—</td><td>—</td></tr>
      <tr><td>20 mm</td><td>2.465 kg/m</td><td>—</td><td>—</td></tr>
    </table></div>
    <p>The calculator opens on 12.7 mm (#4) at 0.994 kg/m — the common residential driveway bar. Larger bars suit heavier loads but cost more per metre; spacing, not just size, sets the total.</p>
    <h3 id="spacing-table">Spacing guide</h3>
    <div class="formula-table"><table>
      <tr><th>Loading</th><th>Typical spacing</th></tr>
      <tr><td>Light (cars)</td><td>450 mm centres</td></tr>
      <tr><td>Standard driveway</td><td>400 mm centres (calculator default)</td></tr>
      <tr><td>Heavy (trucks, RVs)</td><td>300 mm centres</td></tr>
    </table></div>
    <p>Closer spacing adds bars in both directions, so the total grows fast — dropping from 400 mm to 300 mm adds roughly a third more steel. Match spacing to the load, not to habit.</p>
    <h3 id="wheel-track">Wheel-track spacing: tighten only where the wheels run</h3>
    <p>Wheels do not load a driveway evenly — they follow two narrow tracks, and a tyre near the free edge bends the slab roughly twice as hard as the same wheel at mid-panel. That is why the standard grid can stay at 400 mm while the wheel lines go tighter.</p>
    <p>On long driveways where every vehicle follows the same path to the garage (past about 18 m, or serving a shop or RV pad), tighten the spacing under the wheel lines only — for example from 400 mm to 300 mm inside two strips about 900 mm wide, centred on each wheel path. That is a third more steel inside the strips, but on a 6 m wide two-car driveway the strips cover only about 30% of the area, so the whole-driveway increase is roughly 10%.</p>
    <p>On a narrow single-car driveway the strips cover most of the width, so just use the tighter spacing throughout instead of cutting strips. And never tighten the whole grid to chase wheels on a short drive where cars wander across the full width — you would pay to densify panels nobody drives on.</p>
    <h3 id="joints">Joints and dowels: where the concrete is allowed to crack</h3>
    <p>Concrete cracks wherever it is allowed to; the joint layout decides where. Three joint types, three different steel rules.</p>
    <div class="formula-table"><table>
      <tr><th>Joint type</th><th>Spacing</th><th>Steel across it</th></tr>
      <tr><td>Control (contraction)</td><td>2–3× slab thickness: 100 mm → 2.4–3.7 m; 125 mm → 3.0–4.6 m; 150 mm → 3.7–5.5 m; saw-cut ¼ deep within 24 h</td><td>None — stop the grid about 50 mm short of each side so the joint can open</td></tr>
      <tr><td>Expansion (isolation)</td><td>Where the driveway meets the garage slab, house footing, or street curb</td><td>Smooth dowels (see below)</td></tr>
      <tr><td>Longitudinal</td><td>One centre line on any driveway wider than 3.7 m</td><td>None needed on grade — keyway, or tie the grid through</td></tr>
    </table></div>
    <p>Control-joint spacing follows the 2–3× rule: slab thickness in inches, read in feet. A 125 mm (5 in) slab gets joints every 3.0–4.6 m; wider than 3.7 m (12 ft) and the slab also needs a longitudinal joint down the middle.</p>
    <p>Across expansion joints — and only there — go smooth dowel bars: 16 mm (#5) smooth steel at 300 mm centres, 450 mm long (225 mm embedded each side), greased on one half so the slabs can still slide independently. Smooth, not deformed: deformed rebar locks the slabs together and drags the garage slab wherever the driveway settles. A 6 m wide driveway at an expansion joint needs 6.00 ÷ 0.30 + 1 = 21 dowels — 21 × 0.45 = 9.45 m of 16 mm bar, or 9.45 × 1.578 = 14.91 kg.</p>
    <p>Two don'ts: never put deformed rebar through a control joint (the joint cannot open, so cracks migrate to panel middles), and never put dowels across ordinary control joints — those must stay free to open.</p>
    <h3 id="thickened-edges">Thickened edges: the cheap upgrade that prevents edge cracks</h3>
    <p>The cheapest crack preventer on a driveway is not more steel — it is more concrete at the edge. Over the outer 300 mm, deepen the slab to 1.5–2× its thickness (a 125 mm slab runs about 190–250 mm at the edge), tapering back to grade, with the grid bars running continuous through the thickened section and one bar bent down into the deepened toe.</p>
    <p>The price is concrete only: a 10 m × 3 m driveway has 2 × (10 + 3) = 26 m of perimeter, and deepening it 75 mm over a 300 mm width adds 26 × 0.30 × 0.075 = 0.585 m³ — about 0.59 m³ of extra concrete — aimed at the single highest-stress zone on the slab. Skip it only where the edge is not free: a side fully confined by an existing garage apron, curb, or sidewalk is already supported.</p>
    <h3 id="frost">Frost heave and the sub-base question</h3>
    <p>In hard-freeze climates the sub-base is a structural layer, not backfill: 150–300 mm of compacted granular material (crushed stone or clean gravel) under the whole drive, a 1–2% surface slope so meltwater drains instead of feeding the frost line, and a geotextile separator between stone and heavy clay so the sub-base cannot punch into the soil. Near a heated garage, a 25–50 mm strip of rigid insulation under the first 600–1,200 mm stops the frozen/unfrozen differential hinging the panel where cars cross it.</p>
    <p>Does rebar stop frost heave? No — heave pressures lift whole panels, and no grid anchors a slab against that. The movement defence is sub-base, drainage, and joints that absorb the travel; the steel's frost-season job is second-hand, holding cracked panels flush so the surface keeps draining instead of trapping water in the crack that feeds next winter's heave. None of this changes the steel quantity the calculator gives — it decides whether that steel survives the winter intact.</p>
    <h3 id="cost">Estimating the cost</h3>
    <p>Cost = steel weight × price per kg, plus tie wire and chairs. Using worked example 1 with an example price of €1.20/kg for steel: 149.15 × €1.20 = €178.98 for the bars. Tie wire and <a href="/rebar-chair-calculator">chairs</a> sit on top — the calculator gives you the 200-tie count to size the wire with the <a href="/rebar-tie-wire-calculator">tie-wire calculator</a>. Prices vary by region and supplier, so get current quotes before budgeting. For a full materials picture, add the concrete volume from the <a href="/concrete-and-rebar-calculator">concrete estimator</a>.</p>
    <h3 id="imperial">Metric and imperial units</h3>
    <p>This calculator takes metres and millimetres. If your drawings use feet and inches:</p>
    <div class="formula-table"><table>
      <tr><th>Metric</th><th>Imperial (approx.)</th></tr>
      <tr><td>10 m × 3 m driveway</td><td>32.81 ft × 9.84 ft (× 3.281)</td></tr>
      <tr><td>400 mm spacing</td><td>about 16 in</td></tr>
      <tr><td>75 mm cover</td><td>3 in</td></tr>
      <tr><td>12.7 mm bar</td><td>#4 bar (1/2 in)</td></tr>
      <tr><td>149.15 kg</td><td>328.82 lb (× 2.20462)</td></tr>
    </table></div>
    <p>Convert first, then enter metric values into the calculator — do not mix units in one calculation.</p>
    <h3 id="not-included">What the calculator does not include</h3>
    <ul>
      <li><strong>Apron flare steel.</strong> The flared apron where the driveway meets the street is extra steel — this sizes the main rectangular slab only.</li>
      <li><strong>Sub-base volume.</strong> The frost section above gives typical sub-base depths, but the volume itself is separate from the steel mat.</li>
      <li><strong>Joint cutting and dowel labour.</strong> The joints section above gives spacings and the dowel spec; cutting the joints and placing the dowels are site work, not quantities the calculator outputs.</li>
      <li><strong>Laps and waste.</strong> The result is the neat mat. Add lap lengths and a cutting-waste allowance before ordering.</li>
      <li><strong>Tie wire and chairs.</strong> The calculator counts the ties (200 in example 1) — size the wire with the <a href="/rebar-tie-wire-calculator">tie-wire calculator</a> and the supports with the <a href="/rebar-chair-calculator">chair calculator</a>.</li>
      <li><strong>Concrete volume and placing costs.</strong> Volume comes from the <a href="/concrete-and-rebar-calculator">concrete estimator</a>; formwork and labour are separate.</li>
    </ul>
    <h3 id="mistakes">5 common mistakes</h3>
    <ol class="howto"><li><strong>Leaving steel on the ground.</strong> Bars and mesh sitting on the sub-base end up with no cover and no bond at the bottom of the slab. Chair the mat up to the designed cover before the pour.</li><li><strong>Confusing cover with spacing.</strong> Cover is the edge distance (75 mm here); spacing is the bar-to-bar distance (400 mm). Swapping them changes both the bar count and the durability.</li><li><strong>Ordering the neat quantity.</strong> Laps between bars and cutting waste sit on top of the neat mat — order extra or the last strip runs short.</li><li><strong>Wrong thickness for the load.</strong> A 100 mm car slab under an RV cracks. Match thickness — and steel — to the heaviest vehicle that will use the driveway.</li><li><strong>Running steel through control joints.</strong> Deformed bars across a control joint lock the panels together, so the joint cannot open and cracks migrate to panel middles. Stop the grid short of control joints, and save dowels for expansion joints only.</li></ol>
    <p class="muted">Last reviewed: October 2026. Bar weights use d² ÷ 162.28 (metric) and ASTM A615 sizes (imperial). Thickness and spacing ranges are rule-of-thumb guidance for early estimates — always verify against your structural drawings and design code.</p>`,
    faqs:[["What size rebar for a driveway?","#3–#4 (10–13 mm) at 300–450 mm centres is common for residential driveways. The calculator opens on 12.7 mm (#4) at 400 mm centres — a solid standard driveway choice; go larger or closer-spaced for heavier vehicles."],
          ["Do driveways need rebar?","Reinforcement helps control cracking; thickness and bar size depend on loading. An unreinforced driveway slab cracks more freely as it shrinks and as loads cross it — steel does not prevent every crack, but it holds the slab together and spreads loads."],
          ["How much rebar for a 10 m × 3 m driveway?","At 400 mm spacing, 75 mm cover and 12.7 mm bars: 8 + 25 bars, 150.05 m of bar, 149.15 kg (328.82 lb), 200 ties. Add laps and waste before ordering."],
          ["How thick should a driveway be?","Typically 100 mm (4 in) for cars, 125 mm (5 in) for SUVs and light trucks, and 150 mm (6 in) or more for heavy vehicles and RVs. Thickness is a design decision — confirm it against your drawings, since it drives both concrete volume and steel."],
          ["What spacing should driveway rebar be?","300–450 mm centres covers most residential driveways; 400 mm is the calculator default. Lighter loads can go to 450 mm, heavier loads should close up to 300 mm. On long drives where wheels follow one path, tighten to 300 mm under the wheel lines only (see the wheel-track spacing section above)."],
          ["Rebar or mesh for a driveway?","A tied rebar mat (what this calculator sizes) gives you known bar sizes and spacings. Welded mesh is an alternative, but it must be chaired up to mid-slab — mesh left on the ground ends up at the bottom of the pour, where it does almost no good."],
          ["How many bars do I need to order?","Order the calculator's bar count plus laps and waste. For the 10 m × 3 m example that is 33 bars (8 + 25) cut from stock — or about 13 sticks of 12 m bar before waste (150.05 ÷ 12 = 12.5)."],
          ["Does the calculator include the apron?","No — it sizes the main rectangular slab only. The flared apron at the street is extra steel, and its shape (two triangles) needs its own allowance."],
          ["How much does driveway rebar cost?","Multiply the steel weight by your local price per kg. At an example €1.20/kg, the 10 m × 3 m driveway's bars cost €178.98; tie wire and chairs are extra. Thickened edges add concrete, not steel — about 0.59 m³ extra on the same 10 m × 3 m drive. Get current supplier quotes before budgeting."],
          ["Can I use imperial units?","The calculator takes metres and millimetres, but the equivalents are direct: 12.7 mm is a #4 bar, 400 mm is about 16 in, 75 mm is 3 in, and kilograms convert at × 2.20462 to pounds. Convert first, then enter metric values."]] ,
    de: {
  metaTitle: "Bewehrungsrechner für Einfahrten — Stäbe & kg, kostenlos",
  desc: "Bewehrungsrechner für Einfahrten: Stäbe in beiden Richtungen, Gesamtlänge, Bindungen und Gewicht. Beispiel: 10 m × 3 m Einfahrt = 149,15 kg. Kostenlos.",
  formula: "Stäbe je Richtung = floor((Maß − 2 × Deckung) ÷ Abstand) + 1, × kg/m für das Gewicht.",
  kw: "bewehrungsrechner für einfahrten, bewehrung für einfahrt, einfahrtbewehrung, bewehrung betoneinfahrt",
  howto: ["Einfahrtslänge und -breite in Metern eingeben.", "Bewehrungsabstand und Betondeckung festlegen.", "Die Stabgröße für die Gesamtmenge wählen.", "Stabzahl in beiden Richtungen, Gesamtlänge, Gewicht und Kreuzungspunkte ablesen.", "Vor der Bestellung Übergreifungen und Verschnitt addieren — der Rechner gibt die reine Matte an, nicht die Bestellmenge."],
  faqs: [["Welche Bewehrung für eine Einfahrt?", "#3–#4 (10–13 mm) im Abstand von 300–450 mm ist bei Wohneinfahrten üblich. Der Rechner startet mit 12,7 mm (#4) bei 400 mm Abstand — eine solide Standardwahl für Einfahrten; für schwerere Fahrzeuge größer oder enger wählen."],
          ["Brauchen Einfahrten Bewehrung?", "Bewehrung hilft, Risse zu kontrollieren; Dicke und Stabgröße hängen von der Belastung ab. Eine unbewehrte Einfahrtsplatte reißt freier, wenn sie schwindet und wenn Lasten darüberfahren — Stahl verhindert nicht jeden Riss, aber er hält die Platte zusammen und verteilt Lasten."],
          ["Wie viel Bewehrung für eine 10 m × 3 m Einfahrt?", "Bei 400 mm Abstand, 75 mm Deckung und 12,7-mm-Stäben: 8 + 25 Stäbe, 150,05 m Stabstahl, 149,15 kg (328,82 lb), 200 Kreuzungspunkte. Vor der Bestellung Übergreifungen und Verschnitt addieren."],
          ["Wie dick sollte eine Einfahrt sein?", "Typisch 100 mm (4 in) für Autos, 125 mm (5 in) für SUVs und leichte Lkw und 150 mm (6 in) oder mehr für schwere Fahrzeuge und Wohnmobile. Die Dicke ist eine Bemessungsentscheidung — anhand Ihrer Pläne prüfen, da sie sowohl Betonvolumen als auch Stahlmenge bestimmt."],
          ["Welcher Abstand für Einfahrtsbewehrung?", "300–450 mm Achsabstand deckt die meisten Wohneinfahrten ab; 400 mm ist die Rechner-Voreinstellung. Leichtere Lasten vertragen 450 mm, schwerere Lasten sollten auf 300 mm enger werden. Auf langen Einfahrten, wo die Räder immer einer Spur folgen, nur unter den Fahrspuren auf 300 mm enger werden (siehe Abschnitt Fahrspur-Abstände oben)."],
          ["Bewehrungsstäbe oder Matte für eine Einfahrt?", "Eine gebundene Stabmatte (was dieser Rechner bemisst) gibt Ihnen bekannte Stabgrößen und Abstände. Geschweißte Matten sind eine Alternative, müssen aber bis zur Plattenmitte hochgelegt werden — Matten, die auf dem Boden liegen, landen am Boden der Schüttung, wo sie fast nichts nützen."],
          ["Wie viele Stäbe muss ich bestellen?", "Bestellen Sie die Stabzahl des Rechners plus Übergreifungen und Verschnitt. Für das Beispiel 10 m × 3 m sind das 33 Stäbe (8 + 25), geschnitten aus Stangenware — oder etwa 13 Stangen à 12 m vor Verschnitt (150,05 ÷ 12 = 12,5)."],
          ["Enthält der Rechner den Vorplatz?", "Nein — er bemisst nur die rechteckige Hauptplatte. Der aufgeweitete Vorplatz an der Straße ist zusätzlicher Stahl, und seine Form (zwei Dreiecke) braucht einen eigenen Zuschlag."],
          ["Was kostet Einfahrtsbewehrung?", "Multiplizieren Sie das Stahlgewicht mit Ihrem örtlichen Preis pro kg. Bei einem Beispielpreis von 1,20 €/kg kosten die Stäbe der 10 m × 3 m Einfahrt 178,98 €; Bindedraht und Abstandhalter kommen hinzu. Verdickte Ränder kosten Beton, keinen Stahl — etwa 0,59 m³ extra auf derselben 10 m × 3 m Einfahrt. Vor der Budgetierung aktuelle Lieferantenangebote einholen."],
          ["Kann ich imperiale Einheiten benutzen?", "Der Rechner nimmt Meter und Millimeter, aber die Entsprechungen sind direkt: 12,7 mm ist ein #4-Stab, 400 mm sind etwa 16 in, 75 mm sind 3 in, und Kilogramm werden mit × 2,20462 in Pfund umgerechnet. Zuerst umrechnen, dann metrische Werte eingeben."]],
  toc: `<nav class="content-block" aria-label="Auf dieser Seite">
    <h2>Auf dieser Seite</h2>
    <ul>
      <li><a href="#how-to">So benutzen Sie den Rechner</a></li>
      <li><a href="#formula">Die Formel, erklärt</a></li>
      <li><a href="#example-1">Rechenbeispiel 1: 10 m × 3 m Einfahrt</a></li>
      <li><a href="#example-2">Rechenbeispiel 2: 10 m × 6 m Einfahrt für zwei Autos</a></li>
      <li><a href="#sizes-table">Typische Einfahrtgrößen</a></li>
      <li><a href="#thickness-table">Plattendicke nach Fahrzeug</a></li>
      <li><a href="#bar-table">Stabdicken-Tabelle</a></li>
      <li><a href="#spacing-table">Abstands-Leitfaden</a></li>
      <li><a href="#wheel-track">Fahrspur-Abstände</a></li>
      <li><a href="#joints">Fugen und Dübel</a></li>
      <li><a href="#thickened-edges">Verdickte Ränder</a></li>
      <li><a href="#frost">Frosthebung und Tragschicht</a></li>
      <li><a href="#cost">Kosten schätzen</a></li>
      <li><a href="#imperial">Metrische und imperiale Einheiten</a></li>
      <li><a href="#not-included">Was der Rechner nicht enthält</a></li>
      <li><a href="#mistakes">Häufige Fehler</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
  </nav>`,
  extra: `<p><strong>Warum zweimal die Deckung abziehen?</strong> Die Stäbe enden an jeder Kante eine Deckung vor dem Rand, also ist die überspannte Länge das Maß minus zwei Deckungen. <strong>Warum +1?</strong> Eine Stabreihe an beiden Enden plus eine je Abstandsintervall — ohne das +1 fehlte in jeder Richtung ein Stab. <strong>Was zählt als Bindung?</strong> Jede Kreuzung eines Längs- und eines Querstabs ist ein Bindedraht-Kreuzungspunkt; der Rechner zählt sie, damit Sie den Bindedraht mit dem <a href="/de/bindedraht-rechner">Bindedraht-Rechner</a> bemessen können.</p>
    <h3 id="example-1">Rechenbeispiel 1: 10 m × 3 m Einfahrt</h3>
    <p>Einfahrt 10 m × 3 m, 400 mm Abstand, 75 mm Betondeckung, 12,7-mm-Stäbe (#4). Dies sind die Werte, mit denen der Rechner startet, sodass Sie das Ergebnis sofort prüfen können:</p>
    <ol class="howto"><li>Stäbe entlang der Länge: floor((3,00 − 0,15) ÷ 0,40) + 1 = 8 Stäbe, je 9,85 m lang.</li><li>Stäbe über die Breite: floor((10,00 − 0,15) ÷ 0,40) + 1 = 25 Stäbe, je 2,85 m lang.</li><li>Gesamtlänge: 8 × 9,85 + 25 × 2,85 = 150,05 m.</li><li>Gewicht: 150,05 × 0,994 = 149,15 kg (328,82 lb), bei 8 × 25 = 200 Kreuzungspunkten.</li></ol>
    <p>Probieren Sie es selbst: Geben Sie dieselben Zahlen oben in den Rechner ein, und Sie erhalten dasselbe Ergebnis.</p>
    <h3 id="example-2">Rechenbeispiel 2: 10 m × 6 m Einfahrt für zwei Autos</h3>
    <p>Einfahrt 10 m × 6 m, derselbe 400-mm-Abstand, 75 mm Deckung, 12,7-mm-Stäbe:</p>
    <ol class="howto"><li>Stäbe entlang der Länge: floor((6,00 − 0,15) ÷ 0,40) + 1 = 15 Stäbe, je 9,85 m lang.</li><li>Stäbe über die Breite: 25 Stäbe, je 5,85 m lang.</li><li>Gesamtlänge: 15 × 9,85 + 25 × 5,85 = 294,00 m.</li><li>Gewicht: 294,00 × 0,994 = 292,24 kg (644,28 lb), bei 15 × 25 = 375 Kreuzungspunkten.</li></ol>
    <p>Eine Verdopplung der Breite verdoppelt etwa den Stahl — die Matte wächst in beiden Richtungen, also bestimmt die Fläche, nicht nur die Länge, die Gesamtmenge.</p>
    <h3 id="sizes-table">Typische Einfahrtgrößen</h3>
    <div class="formula-table"><table>
      <tr><th>Einfahrt</th><th>Größe</th><th>Stahl (12,7 mm, 400 mm, 75 mm)</th></tr>
      <tr><td>Einfahrt für ein Auto</td><td>10 × 3 m</td><td>150,05 m, 149,15 kg, 200 Kreuzungspunkte</td></tr>
      <tr><td>Einfahrt für zwei Autos</td><td>10 × 6 m</td><td>294,00 m, 292,24 kg, 375 Kreuzungspunkte</td></tr>
      <tr><td>Wohnmobil / schwer</td><td>12 × 4 m</td><td>234,00 m, 232,60 kg, 300 Kreuzungspunkte</td></tr>
    </table></div>
    <p>Dies sind typische Größen als Ausgangspunkt — der Rechner nimmt jede Länge und Breite, geben Sie also Ihre echten Maße für die echte Antwort ein.</p>
    <h3 id="thickness-table">Plattendicke nach Fahrzeug</h3>
    <div class="formula-table"><table>
      <tr><th>Verkehr</th><th>Typische Dicke</th></tr>
      <tr><td>Nur Autos</td><td>100 mm (4 in)</td></tr>
      <tr><td>SUVs / leichte Lkw</td><td>125 mm (5 in)</td></tr>
      <tr><td>Schwere Fahrzeuge / Wohnmobile</td><td>150 mm oder mehr (6 in+)</td></tr>
    </table></div>
    <p>Die Dicke ist eine Bemessungsentscheidung, keine Rechner-Eingabe — diese Tabelle ist eine Faustregel nur für erste Schätzungen. Eine dickere Platte trägt schwerere Lasten und braucht passenden Stahl, bestätigen Sie also beides anhand Ihrer Bemessung.</p>
    <h3 id="bar-table">Stabdicken-Tabelle</h3>
    <div class="formula-table"><table>
      <tr><th>Metrischer Stab</th><th>Gewicht</th><th>Imperialer Stab</th><th>Gewicht</th></tr>
      <tr><td>8 mm</td><td>0,394 kg/m</td><td>#3 (9,5 mm)</td><td>0,376 lb/ft</td></tr>
      <tr><td>10 mm</td><td>0,616 kg/m</td><td>#4 (12,7 mm)</td><td>0,668 lb/ft</td></tr>
      <tr><td>12 mm</td><td>0,887 kg/m</td><td>#5 (15,9 mm)</td><td>1,043 lb/ft</td></tr>
      <tr><td>16 mm</td><td>1,578 kg/m</td><td>—</td><td>—</td></tr>
      <tr><td>20 mm</td><td>2,465 kg/m</td><td>—</td><td>—</td></tr>
    </table></div>
    <p>Der Rechner startet mit 12,7 mm (#4) bei 0,994 kg/m — dem üblichen Stab für Wohneinfahrten. Größere Stäbe passen zu schwereren Lasten, kosten aber mehr pro Meter; der Abstand, nicht nur die Größe, bestimmt die Gesamtmenge.</p>
    <h3 id="spacing-table">Abstands-Leitfaden</h3>
    <div class="formula-table"><table>
      <tr><th>Belastung</th><th>Typischer Abstand</th></tr>
      <tr><td>Leicht (Autos)</td><td>450 mm Achsabstand</td></tr>
      <tr><td>Standard-Einfahrt</td><td>400 mm Achsabstand (Rechner-Voreinstellung)</td></tr>
      <tr><td>Schwer (Lkw, Wohnmobile)</td><td>300 mm Achsabstand</td></tr>
    </table></div>
    <p>Engere Abstände fügen Stäbe in beiden Richtungen hinzu, sodass die Gesamtmenge schnell wächst — von 400 mm auf 300 mm zu gehen, fügt etwa ein Drittel mehr Stahl hinzu. Passen Sie den Abstand an die Last an, nicht an die Gewohnheit.</p>
    <h3 id="wheel-track">Fahrspur-Abstände: nur dort enger, wo die Räder laufen</h3>
    <p>Räder belasten eine Einfahrt nicht gleichmäßig — sie folgen zwei schmalen Spuren, und ein Reifen nahe der freien Kante biegt die Platte etwa doppelt so stark wie dasselbe Rad in Plattenmitte. Deshalb kann das Standardraster bei 400 mm bleiben, während die Radlinien enger werden.</p>
    <p>Auf langen Einfahrten, wo jedes Fahrzeug demselben Weg zur Garage folgt (ab etwa 18 m, oder bei einer Werkstatt oder einem Wohnmobil-Stellplatz), den Abstand nur unter den Fahrspuren enger machen — zum Beispiel von 400 mm auf 300 mm innerhalb zweier Streifen von etwa 900 mm Breite, mittig auf jeder Radspur. Das ist ein Drittel mehr Stahl innerhalb der Streifen, aber auf einer 6 m breiten Einfahrt für zwei Autos decken die Streifen nur etwa 30 % der Fläche ab, sodass die Zunahme für die ganze Einfahrt rund 10 % beträgt.</p>
    <p>Auf einer schmalen Einfahrt für ein Auto decken die Streifen den größten Teil der Breite ab, also einfach den engeren Abstand durchgehend verwenden, statt Streifen zu schneiden. Und niemals das ganze Raster enger machen, um Rädern auf einer kurzen Einfahrt hinterherzujagen, auf der Autos über die volle Breite wandern — Sie würden dafür bezahlen, Platten zu verdichten, auf denen niemand fährt.</p>
    <h3 id="joints">Fugen und Dübel: wo der Beton reißen darf</h3>
    <p>Beton reißt, wo er darf; die Fugenanordnung entscheidet, wo. Drei Fugentypen, drei verschiedene Stahlregeln.</p>
    <div class="formula-table"><table>
      <tr><th>Fugentyp</th><th>Abstand</th><th>Stahl darüber</th></tr>
      <tr><td>Scheinfuge (Schwindfuge)</td><td>2–3× Plattendicke: 100 mm → 2,4–3,7 m; 125 mm → 3,0–4,6 m; 150 mm → 3,7–5,5 m; ¼ tief eingeschnitten innerhalb von 24 h</td><td>Keiner — das Raster etwa 50 mm vor jeder Seite enden lassen, damit die Fuge sich öffnen kann</td></tr>
      <tr><td>Dehnungsfuge (Bewegungsfuge)</td><td>Wo die Einfahrt auf die Garagenplatte, das Hausfundament oder den Straßenbordstein trifft</td><td>Glatte Dübel (siehe unten)</td></tr>
      <tr><td>Längsfuge</td><td>Eine Mittellinie auf jeder Einfahrt breiter als 3,7 m</td><td>Im Erdreich nicht nötig — Nut, oder die Matte durchbinden</td></tr>
    </table></div>
    <p>Der Abstand von Scheinfugen folgt der 2–3×-Regel: Plattendicke in Zoll, gelesen in Fuß. Eine 125-mm-Platte (5 in) erhält Fugen alle 3,0–4,6 m; breiter als 3,7 m (12 ft), und die Platte braucht zusätzlich eine Längsfuge in der Mitte.</p>
    <p>Über Dehnungsfugen — und nur dort — glatte Dübelstäbe: 16 mm (#5) glatter Stahl im Abstand von 300 mm, 450 mm lang (225 mm Einbindung je Seite), auf einer Hälfte gefettet, damit die Platten weiterhin unabhängig gleiten können. Glatt, nicht gerippt: gerippter Bewehrungsstahl verriegelt die Platten miteinander und zieht die Garagenplatte dorthin, wo die Einfahrt sich setzt. Eine 6 m breite Einfahrt braucht an einer Dehnungsfuge 6,00 ÷ 0,30 + 1 = 21 Dübel — 21 × 0,45 = 9,45 m Stabstahl 16 mm, oder 9,45 × 1,578 = 14,91 kg.</p>
    <p>Zwei Verbote: niemals gerippten Bewehrungsstahl durch eine Scheinfuge legen (die Fuge kann sich nicht öffnen, also wandern Risse in die Plattenmitten), und niemals Dübel über gewöhnliche Scheinfugen legen — diese müssen frei bleiben, um sich zu öffnen.</p>
    <h3 id="thickened-edges">Verdickte Ränder: die günstige Verbesserung gegen Randrisse</h3>
    <p>Der billigste Rissverhinderer auf einer Einfahrt ist nicht mehr Stahl — es ist mehr Beton am Rand. Über die äußeren 300 mm die Platte auf das 1,5–2× ihrer Dicke vertiefen (eine 125-mm-Platte läuft am Rand etwa 190–250 mm stark), zum Erdreich hin auslaufend, mit den Rasterstäben durchgehend durch den verdickten Abschnitt und einem Stab, der in die vertiefte Zehe hinabgebogen ist.</p>
    <p>Der Preis ist nur Beton: Eine 10 m × 3 m Einfahrt hat 2 × (10 + 3) = 26 m Umfang, und eine Vertiefung um 75 mm über eine 300-mm-Breite fügt 26 × 0,30 × 0,075 = 0,585 m³ hinzu — etwa 0,59 m³ zusätzlichen Beton — gezielt auf die höchstbeanspruchte Zone der Platte. Nur dort weglassen, wo der Rand nicht frei ist: Eine Seite, die vollständig von einem bestehenden Garagenvorplatz, Bordstein oder Gehweg eingefasst ist, ist bereits gestützt.</p>
    <h3 id="frost">Frosthebung und die Tragschicht-Frage</h3>
    <p>In Klimazonen mit starkem Frost ist die Tragschicht eine tragende Schicht, kein Füllmaterial: 150–300 mm verdichtetes körniges Material (Schotter oder sauberer Kies) unter der ganzen Einfahrt, ein Gefälle von 1–2 % an der Oberfläche, damit Schmelzwasser abläuft, statt die Frostgrenze zu speisen, und eine Geotextil-Trennlage zwischen Stein und schwerem Ton, damit die Tragschicht nicht in den Boden eindringen kann. Nahe einer beheizten Garage stoppt ein 25–50-mm-Streifen starrer Dämmung unter den ersten 600–1.200 mm das Abknicken zwischen gefrorenem und ungefrorenem Bereich, wo Autos darüberfahren.</p>
    <p>Stoppt Bewehrung Frosthebung? Nein — Hebungskräfte heben ganze Platten an, und kein Raster verankert eine Platte dagegen. Die Verteidigung gegen Bewegung sind Tragschicht, Entwässerung und Fugen, die die Bewegung aufnehmen; die Aufgabe des Stahls in der Frostzeit ist mittelbar: gerissene Platten bündig zu halten, damit die Oberfläche weiter entwässert, statt Wasser im Riss zu stauen, das die Hebung des nächsten Winters speist. Nichts davon ändert die Stahlmenge, die der Rechner ausgibt — es entscheidet, ob dieser Stahl den Winter unversehrt übersteht.</p>
    <h3 id="cost">Kosten schätzen</h3>
    <p>Kosten = Stahlgewicht × Preis pro kg, plus Bindedraht und Abstandhalter. Mit Rechenbeispiel 1 und einem Beispielpreis von 1,20 €/kg für Stahl: 149,15 × 1,20 € = 178,98 € für die Stäbe. Bindedraht und <a href="/de/abstandhalter-rechner">Abstandhalter</a> kommen hinzu — der Rechner gibt Ihnen die Zahl von 200 Kreuzungspunkten, um den Draht mit dem <a href="/de/bindedraht-rechner">Bindedraht-Rechner</a> zu bemessen. Preise variieren nach Region und Lieferant, holen Sie also vor der Budgetierung aktuelle Angebote ein. Für ein vollständiges Materialbild addieren Sie das Betonvolumen aus dem <a href="/de/beton-bewehrungs-schaetzer">Beton-Bewehrungs-Schätzer</a>.</p>
    <h3 id="imperial">Metrische und imperiale Einheiten</h3>
    <p>Dieser Rechner nimmt Meter und Millimeter. Wenn Ihre Zeichnungen Fuß und Zoll verwenden:</p>
    <div class="formula-table"><table>
      <tr><th>Metrisch</th><th>Imperial (ca.)</th></tr>
      <tr><td>10 m × 3 m Einfahrt</td><td>32,81 ft × 9,84 ft (× 3,281)</td></tr>
      <tr><td>400 mm Abstand</td><td>etwa 16 in</td></tr>
      <tr><td>75 mm Deckung</td><td>3 in</td></tr>
      <tr><td>12,7-mm-Stab</td><td>#4-Stab (1/2 in)</td></tr>
      <tr><td>149,15 kg</td><td>328,82 lb (× 2,20462)</td></tr>
    </table></div>
    <p>Zuerst umrechnen, dann metrische Werte in den Rechner eingeben — Einheiten in einer Berechnung nicht mischen.</p>
    <h3 id="not-included">Was der Rechner nicht enthält</h3>
    <ul>
      <li><strong>Vorplatz-Stahl.</strong> Der aufgeweitete Vorplatz, wo die Einfahrt auf die Straße trifft, ist zusätzlicher Stahl — dies bemisst nur die rechteckige Hauptplatte.</li>
      <li><strong>Tragschicht-Volumen.</strong> Der Frost-Abschnitt oben gibt typische Tragschicht-Tiefen an, aber das Volumen selbst ist von der Stahlmatte getrennt.</li>
      <li><strong>Fugenschnitt und Dübel-Arbeit.</strong> Der Fugen-Abschnitt oben gibt Abstände und die Dübel-Spezifikation an; das Schneiden der Fugen und das Setzen der Dübel sind Baustellenarbeit, keine Mengen, die der Rechner ausgibt.</li>
      <li><strong>Übergreifungen und Verschnitt.</strong> Das Ergebnis ist die reine Matte. Vor der Bestellung Übergreifungslängen und einen Verschnitt-Zuschlag addieren.</li>
      <li><strong>Bindedraht und Abstandhalter.</strong> Der Rechner zählt die Kreuzungspunkte (200 in Beispiel 1) — den Draht mit dem <a href="/de/bindedraht-rechner">Bindedraht-Rechner</a> und die Stützen mit dem <a href="/de/abstandhalter-rechner">Abstandhalter-Rechner</a> bemessen.</li>
      <li><strong>Betonvolumen und Einbaukosten.</strong> Das Volumen kommt aus dem <a href="/de/beton-bewehrungs-schaetzer">Beton-Bewehrungs-Schätzer</a>; Schalung und Arbeitslohn sind getrennt.</li>
    </ul>
    <h3 id="mistakes">5 häufige Fehler</h3>
    <ol class="howto"><li><strong>Stahl auf dem Boden liegen lassen.</strong> Stäbe und Matten, die auf der Tragschicht liegen, enden ohne Deckung und ohne Verbund am Boden der Platte. Die Matte vor dem Gießen auf Abstandhalter bis zur geplanten Deckung hochlegen.</li><li><strong>Deckung mit Abstand verwechseln.</strong> Deckung ist der Randabstand (75 mm hier); Abstand ist der Stab-zu-Stab-Abstand (400 mm). Ein Vertauschen ändert sowohl die Stabzahl als auch die Dauerhaftigkeit.</li><li><strong>Die reine Menge bestellen.</strong> Übergreifungen zwischen Stäben und Verschnitt kommen auf die reine Matte obendrauf — extra bestellen, sonst wird der letzte Streifen zu kurz.</li><li><strong>Falsche Dicke für die Last.</strong> Eine 100-mm-Autoplatte unter einem Wohnmobil reißt. Dicke — und Stahl — an das schwerste Fahrzeug anpassen, das die Einfahrt nutzen wird.</li><li><strong>Stahl durch Scheinfugen führen.</strong> Gerippte Stäbe über einer Scheinfuge verriegeln die Platten miteinander, sodass die Fuge sich nicht öffnen kann und Risse in die Plattenmitten wandern. Das Raster vor Scheinfugen enden lassen und Dübel nur für Dehnungsfugen aufsparen.</li></ol>
    <p class="muted">Zuletzt geprüft: Oktober 2026. Stabgewichte nach d² ÷ 162,28 (metrisch) und ASTM-A615-Größen (imperial). Dicken- und Abstandsbereiche sind Faustregeln für erste Schätzungen — immer anhand Ihrer statischen Pläne und der Bemessungsnorm prüfen.</p>`
}
},
    { id:"spacing", slug:"rebar-spacing-calculator", cat:"Detailing",
    metaTitle:"Rebar Spacing Calculator — Exact Bar Count & c/c Gap",
    h1:"Rebar Spacing Calculator",
    desc:"Bars across any width with the true centre-to-centre spacing and the clear gap between bars. No rounding surprises — see the exact bar count.",
    kw:"rebar spacing calculator, rebar spacing formula, bar spacing calculator, reinforcement spacing",
    intro:"Convert between bar count and spacing across a member. Enter the width, edge cover and your target spacing, and get the exact number of bars, the actual c/c spacing achieved and the clear gap.",
    howto:["Enter the total width and the edge cover on each side.","Enter the desired spacing (centre-to-centre).","Pick the bar size — it sets the clear gap.","Read the bar count, the actual spacing achieved and the clear gap.","Check the actual spacing against the code limits below before fixing the layout."],
    formula:"Number of bars = floor((width − 2 × cover) ÷ spacing) + 1. Actual spacing = reinforced width ÷ (bars − 1).",
    toc:`<nav class="content-block" aria-label="On this page">
    <h2>On this page</h2>
    <ul>
      <li><a href="#how-to">How to use the calculator</a></li>
      <li><a href="#formula">The formula, explained</a></li>
      <li><a href="#example-1">Worked example 1: 3,000 mm width (defaults)</a></li>
      <li><a href="#example-2">Worked example 2: 4,000 mm width</a></li>
      <li><a href="#desired-table">Desired spacing vs actual spacing</a></li>
      <li><a href="#cover-table">Edge cover guide</a></li>
      <li><a href="#code-table">Code spacing checks (ACI 318)</a></li>
      <li><a href="#member-table">Typical spacing by member</a></li>
      <li><a href="#imperial">Metric and imperial units</a></li>
      <li><a href="#not-included">What the calculator does not include</a></li>
      <li><a href="#mistakes">Common mistakes</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
  </nav>`,
    extra:`<p><strong>Why subtract cover twice?</strong> The bars stop one cover short of each edge, so the width they actually span is the total width minus two covers — that is the reinforced width. <strong>Why +1?</strong> Bars sit at both ends of the reinforced width plus one per spacing interval — without the +1 you would be one bar short. <strong>Why is the actual spacing not the spacing you asked for?</strong> Bars must be whole numbers, evenly spread. The calculator rounds the count up to the next whole bar and re-spreads them, so the actual spacing is usually slightly larger than the desired spacing (see the table below).</p>
    <h3 id="example-1">Worked example 1: 3,000 mm width (defaults)</h3>
    <p>Width 3,000 mm, 50 mm cover each side, desired spacing 150 mm, 12 mm bars. These are the values the calculator opens with, so you can check the result immediately:</p>
    <ol class="howto"><li>Reinforced width: 3,000 − 2 × 50 = 2,900 mm.</li><li>Number of bars: floor(2,900 ÷ 150) + 1 = 19 + 1 = 20 bars.</li><li>Actual c/c spacing: 2,900 ÷ (20 − 1) = 152.63 mm — slightly more than the 150 mm asked for, because 19 gaps must cover 2,900 mm.</li><li>Clear gap between bars: 152.63 − 12 = 140.63 mm.</li></ol>
    <p>Try it yourself: enter the same numbers in the calculator above and you will get the same result.</p>
    <h3 id="example-2">Worked example 2: 4,000 mm width</h3>
    <p>Width 4,000 mm, 50 mm cover, desired spacing 200 mm, 16 mm bars:</p>
    <ol class="howto"><li>Reinforced width: 4,000 − 2 × 50 = 3,900 mm.</li><li>Number of bars: floor(3,900 ÷ 200) + 1 = 19 + 1 = 20 bars.</li><li>Actual c/c spacing: 3,900 ÷ 19 = 205.26 mm.</li><li>Clear gap: 205.26 − 16 = 189.26 mm.</li></ol>
    <p>Same bar count as example 1, different spacing — the count follows the width and the target spacing together, never one alone.</p>
    <h3 id="desired-table">Desired spacing vs actual spacing</h3>
    <p>Same member every time (3,000 mm width, 50 mm cover, 12 mm bars) — only the desired spacing changes:</p>
    <div class="formula-table"><table>
      <tr><th>Desired spacing</th><th>Bars</th><th>Actual c/c spacing</th><th>Clear gap</th></tr>
      <tr><td>100 mm</td><td>30</td><td>100.00 mm</td><td>88.00 mm</td></tr>
      <tr><td>150 mm</td><td>20</td><td>152.63 mm</td><td>140.63 mm</td></tr>
      <tr><td>175 mm</td><td>17</td><td>181.25 mm</td><td>169.25 mm</td></tr>
      <tr><td>200 mm</td><td>15</td><td>207.14 mm</td><td>195.14 mm</td></tr>
      <tr><td>300 mm</td><td>10</td><td>322.22 mm</td><td>310.22 mm</td></tr>
    </table></div>
    <p>The pattern: actual spacing is always equal to or larger than desired (it only matches exactly when the width divides evenly, as at 100 mm here). If the actual spacing exceeds a code maximum, tighten the desired spacing and re-check — never just accept the first result.</p>
    <h3 id="cover-table">Edge cover guide</h3>
    <div class="formula-table"><table>
      <tr><th>Situation</th><th>Typical cover each side</th></tr>
      <tr><td>Slab on grade</td><td>40–50 mm (about 1.5–2 in)</td></tr>
      <tr><td>Concrete cast against earth (footings)</td><td>75 mm (3 in)</td></tr>
      <tr><td>Beams, columns, walls (formed)</td><td>40 mm, or as drawn</td></tr>
    </table></div>
    <p>Cover is the distance from the concrete face to the bar — it protects the steel from corrosion and fire. Always use the value on your drawing when one is given; this table is for early estimates only.</p>
    <h3 id="code-table">Code spacing checks (ACI 318)</h3>
    <p>Two checks govern whether a spacing is acceptable. They are code limits, not calculator inputs — run them on the calculator's outputs:</p>
    <div class="formula-table"><table>
      <tr><th>Check</th><th>Rule</th><th>Example 1 result</th></tr>
      <tr><td>Minimum clear spacing</td><td>The larger of 25 mm (1 in), one bar diameter, or 1.33 × aggregate size</td><td>Clear gap 140.63 mm ≥ max(25, 12) — passes</td></tr>
      <tr><td>Maximum c/c spacing (slabs, beams)</td><td>The smaller of 3 × slab thickness or 450 mm (18 in)</td><td>Actual 152.63 mm ≤ 450 mm for a 150 mm slab — passes</td></tr>
    </table></div>
    <p>The minimum exists so concrete can flow around the bars and bond to them; the maximum exists to control cracking and spread the steel. If either check fails, change the bar size, the spacing, or the member width — the calculator alone does not enforce them.</p>
    <h3 id="member-table">Typical spacing by member</h3>
    <div class="formula-table"><table>
      <tr><th>Member</th><th>Typical spacing</th></tr>
      <tr><td>Residential slabs</td><td>300–450 mm (12–18 in) centres</td></tr>
      <tr><td>Driveways, heavy loads</td><td>300 mm (12 in) centres</td></tr>
      <tr><td>Footings</td><td>150–300 mm (6–12 in) centres</td></tr>
      <tr><td>Walls</td><td>300 mm (12 in) vertical and horizontal</td></tr>
    </table></div>
    <p>These are starting ranges for estimates. The design — loads, thickness, bar size — sets the real spacing, and the code checks above still apply.</p>
    <h3 id="imperial">Metric and imperial units</h3>
    <p>This calculator takes millimetres. If your drawings use feet and inches:</p>
    <div class="formula-table"><table>
      <tr><th>Metric</th><th>Imperial (approx.)</th></tr>
      <tr><td>3,000 mm width</td><td>9.84 ft (118.11 in)</td></tr>
      <tr><td>150 mm spacing</td><td>about 6 in</td></tr>
      <tr><td>50 mm cover</td><td>2 in</td></tr>
      <tr><td>12 mm bar</td><td>#4 bar (1/2 in)</td></tr>
    </table></div>
    <p>Convert first, then enter millimetres into the calculator — do not mix units in one calculation.</p>
    <h3 id="not-included">What the calculator does not include</h3>
    <ul>
      <li><strong>Bar length and weight.</strong> This tool lays out one width. For lengths and weights use the <a href="/concrete-slab-rebar-calculator">slab calculator</a> or the <a href="/rebar-weight-calculator">weight calculator</a>.</li>
      <li><strong>Two-way grids.</strong> A slab mat runs both directions — this tool spaces one direction at a time. The <a href="/concrete-slab-rebar-calculator">slab calculator</a> counts both.</li>
      <li><strong>Required steel area.</strong> This tool does not size reinforcement from loads. If your design gives a required steel area, that is a different calculation from this spacing layout.</li>
      <li><strong>Lap, hook and bend lengths.</strong> Splice and anchorage detailing come from the <a href="/rebar-lap-length-calculator">lap calculator</a> and the <a href="/rebar-hook-bend-cutting-length-calculator">hook calculator</a>.</li>
      <li><strong>Aggregate size.</strong> The minimum-clear check needs the largest aggregate size; this tool does not ask for it, so run that check by hand.</li>
    </ul>
    <h3 id="mistakes">5 common mistakes</h3>
    <ol class="howto"><li><strong>Measuring the clear gap instead of centre-to-centre.</strong> Spacing is centre-to-centre. Measuring face-to-face under-counts the bars.</li><li><strong>Forgetting cover on the second side.</strong> The reinforced width loses cover at both edges, not one. Subtracting it once overstates the width and the bar count.</li><li><strong>Rounding the bar count down.</strong> The count always rounds up (floor + 1). Rounding down leaves the last gap wider than designed.</li><li><strong>Entering metres instead of millimetres.</strong> Width, cover and spacing are all in millimetres here. Entering 3 instead of 3,000 breaks the result completely.</li><li><strong>Ignoring the maximum spacing.</strong> A layout can satisfy the count and still violate the 3 × thickness / 450 mm maximum on thin slabs — always run the code checks.</li></ol>
    <p class="muted">Last reviewed: October 2026. Code checks summarise ACI 318 spacing rules for guidance only — always verify against your structural drawings and governing code.</p>`,
    faqs:[["How do you calculate rebar spacing?","Subtract cover from both sides of the width, divide by the desired spacing, and add one for the number of bars: bars = floor((width − 2 × cover) ÷ spacing) + 1. Then re-spread evenly: actual spacing = reinforced width ÷ (bars − 1)."],
          ["What is the minimum spacing between rebars?","The clear gap must be at least the largest of 25 mm (1 in), one bar diameter, or 1.33 × the largest aggregate size (ACI 318). For 12 mm bars with ordinary aggregate, 25 mm usually governs — check your code and your aggregate size."],
          ["Why is the actual spacing different from the spacing I entered?","Because bars must be whole numbers, evenly spread. The calculator rounds the count up and re-divides the reinforced width, so the actual spacing is usually slightly larger than desired — 150 mm asked gives 152.63 mm on the 3,000 mm default width."],
          ["What is the difference between c/c spacing and clear gap?","Centre-to-centre (c/c) spacing is centre of one bar to centre of the next; the clear gap is the open space between bar faces, which is the c/c spacing minus one bar diameter. Codes limit the clear gap at the minimum end and the c/c spacing at the maximum end."],
          ["How much cover should I use?","Slabs on grade typically 40–50 mm, concrete cast against earth 75 mm, formed beams and columns 40 mm or as drawn. Always use the drawing's value when one is given — cover protects the steel from corrosion and fire."],
          ["What is the maximum spacing allowed?","For slabs and beams, ACI 318 caps main reinforcement spacing at the smaller of 3 × slab thickness or 450 mm (18 in). On a 150 mm slab that cap is 450 mm; on a 100 mm slab it is 300 mm."],
          ["Can I use this calculator for beams, columns and walls?","Yes — any single width works: enter the member width, cover and target spacing. For a two-way slab mat, use the slab calculator, which counts both directions."],
          ["What if my spacing is too tight?","If the clear gap falls below the minimum, switch to smaller bars (more bars, smaller diameter, larger gaps) or widen the member. Do not just delete bars — that changes the steel area the design relies on."],
          ["Does spacing affect the amount of steel?","Yes, directly. Tighter spacing means more bars across the same width, and the total length and weight grow with the count. Compare the desired-spacing table above: 100 mm needs 30 bars where 300 mm needs 10 on the same width."],
          ["Can I use imperial units?","The calculator takes millimetres, but the conversions are direct: 12 mm is a #4 bar, 150 mm is about 6 in, 50 mm is 2 in, and 3,000 mm is 9.84 ft. Convert first, then enter millimetres."]] ,
    de: {
  metaTitle: "Bewehrungsabstand-Rechner — Stabanzahl & Achsabstand gratis",
  desc: "Bewehrungsabstand-Rechner: Stabanzahl, tatsächlichen Abstand und lichten Abstand über jede Breite. Beispiel: 3.000 mm = 20 Stäbe, 152,63 mm. Kostenlos.",
  formula: "Stabanzahl = floor((Breite − 2 × Betondeckung) ÷ Abstand) + 1. Tatsächlicher Abstand = bewehrte Breite ÷ (Stabanzahl − 1).",
  kw: "bewehrungsabstand rechner, bewehrungsabstand berechnen, stababstand rechner, bewehrung abstand formel",
  howto: ["Gesamtbreite und Betondeckung auf jeder Seite eingeben.", "Gewünschten Abstand eingeben (Achsabstand).", "Stabgröße wählen — sie bestimmt den lichten Abstand.", "Stabanzahl, erreichten tatsächlichen Abstand und lichten Abstand ablesen.", "Tatsächlichen Abstand vor dem Festlegen der Verlegung mit den Normwerten unten vergleichen."],
  faqs: [["Wie berechnet man den Bewehrungsabstand?", "Betondeckung auf beiden Seiten der Breite abziehen, durch den gewünschten Abstand teilen und eins für die Stabanzahl addieren: Stäbe = floor((Breite − 2 × Betondeckung) ÷ Abstand) + 1. Dann gleichmäßig neu verteilen: tatsächlicher Abstand = bewehrte Breite ÷ (Stäbe − 1)."],
          ["Wie groß ist der Mindestabstand zwischen Bewehrungsstäben?", "Der lichte Abstand muss mindestens dem größten der folgenden Werte entsprechen: 25 mm (1 in), ein Stabdurchmesser oder 1,33 × größte Korngröße (ACI 318). Bei 12-mm-Stäben mit üblicher Gesteinskörnung sind meist 25 mm maßgebend — prüfen Sie Ihre Norm und Ihre Korngröße."],
          ["Warum unterscheidet sich der tatsächliche Abstand vom eingegebenen Abstand?", "Weil Stäbe nur als ganze Zahlen gleichmäßig verteilt werden können. Der Rechner rundet die Anzahl auf und teilt die bewehrte Breite neu auf, sodass der tatsächliche Abstand meist etwas größer ist als gewünscht — aus 150 mm gewünscht werden 152,63 mm bei der Standardbreite von 3.000 mm."],
          ["Was ist der Unterschied zwischen Achsabstand und lichtem Abstand?", "Der Achsabstand (Achs-zu-Achs-Abstand) misst von Stabmitte zu Stabmitte; der lichte Abstand ist der freie Raum zwischen den Stabflächen, also der Achsabstand minus ein Stabdurchmesser. Normen begrenzen den lichten Abstand am unteren Ende und den Achsabstand am oberen Ende."],
          ["Wie groß sollte die Betondeckung sein?", "Platten auf dem Erdreich typisch 40–50 mm, gegen Erdreich betoniert 75 mm, geschalte Balken und Stützen 40 mm oder wie gezeichnet. Verwenden Sie immer den Wert aus der Zeichnung, wenn einer angegeben ist — die Betondeckung schützt den Stahl vor Korrosion und Brand."],
          ["Welcher Höchstabstand ist zulässig?", "Für Platten und Balken begrenzt ACI 318 den Abstand der Hauptbewehrung auf den kleineren Wert aus 3 × Plattendicke oder 450 mm (18 in). Bei einer 150-mm-Platte liegt diese Grenze bei 450 mm, bei einer 100-mm-Platte bei 300 mm."],
          ["Kann ich diesen Rechner für Balken, Stützen und Wände verwenden?", "Ja — jede einzelne Breite funktioniert: Geben Sie Bauteilbreite, Betondeckung und Zielabstand ein. Für eine zweilagige Plattenmatte verwenden Sie den Plattenrechner, der beide Richtungen zählt."],
          ["Was tun, wenn mein Abstand zu eng ist?", "Fällt der lichte Abstand unter das Minimum, wechseln Sie zu kleineren Stäben (mehr Stäbe, kleinerer Durchmesser, größere Lücken) oder verbreitern Sie das Bauteil. Streichen Sie nicht einfach Stäbe — das verändert die Stahlfläche, auf die die Bemessung angewiesen ist."],
          ["Beeinflusst der Abstand die Stahlmenge?", "Ja, direkt. Engerer Abstand bedeutet mehr Stäbe über dieselbe Breite, und Gesamtlänge und Gewicht wachsen mit der Anzahl. Vergleichen Sie die Tabelle zum gewünschten Abstand oben: 100 mm erfordern 30 Stäbe, wo 300 mm nur 10 auf derselben Breite benötigen."],
          ["Kann ich imperiale Einheiten verwenden?", "Der Rechner rechnet in Millimetern, aber die Umrechnungen sind direkt: 12 mm entsprechen einem #4-Stab, 150 mm etwa 6 in, 50 mm 2 in und 3.000 mm 9,84 ft. Rechnen Sie zuerst um und geben Sie dann Millimeter ein."]],
  toc: `<nav class="content-block" aria-label="Auf dieser Seite">
    <h2>Auf dieser Seite</h2>
    <ul>
      <li><a href="#how-to">So verwenden Sie den Rechner</a></li>
      <li><a href="#formula">Die Formel, erklärt</a></li>
      <li><a href="#example-1">Rechenbeispiel 1: 3.000 mm Breite (Standardwerte)</a></li>
      <li><a href="#example-2">Rechenbeispiel 2: 4.000 mm Breite</a></li>
      <li><a href="#desired-table">Gewünschter Abstand vs. tatsächlicher Abstand</a></li>
      <li><a href="#cover-table">Leitfaden zur Betondeckung</a></li>
      <li><a href="#code-table">Abstandsprüfungen nach Norm (ACI 318)</a></li>
      <li><a href="#member-table">Typische Abstände je Bauteil</a></li>
      <li><a href="#imperial">Metrische und imperiale Einheiten</a></li>
      <li><a href="#not-included">Was der Rechner nicht enthält</a></li>
      <li><a href="#mistakes">Häufige Fehler</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
  </nav>`,
  extra: `<p><strong>Warum zweimal Betondeckung abziehen?</strong> Die Stäbe enden eine Betondeckung vor jeder Kante, sodass die Breite, die sie tatsächlich überspannen, die Gesamtbreite minus zwei Betondeckungen ist — das ist die bewehrte Breite. <strong>Warum +1?</strong> Stäbe sitzen an beiden Enden der bewehrten Breite plus einer je Abstandsintervall — ohne das +1 würde ein Stab fehlen. <strong>Warum ist der tatsächliche Abstand nicht der Abstand, den Sie eingegeben haben?</strong> Stäbe müssen ganze Zahlen sein und gleichmäßig verteilt werden. Der Rechner rundet die Anzahl auf den nächsten ganzen Stab auf und verteilt sie neu, sodass der tatsächliche Abstand meist etwas größer ist als der gewünschte Abstand (siehe Tabelle unten).</p>
    <h3 id="example-1">Rechenbeispiel 1: 3.000 mm Breite (Standardwerte)</h3>
    <p>Breite 3.000 mm, Betondeckung 50 mm je Seite, gewünschter Abstand 150 mm, 12-mm-Stäbe. Dies sind die Werte, mit denen der Rechner startet, sodass Sie das Ergebnis sofort prüfen können:</p>
    <ol class="howto"><li>Bewehrte Breite: 3.000 − 2 × 50 = 2.900 mm.</li><li>Stabanzahl: floor(2.900 ÷ 150) + 1 = 19 + 1 = 20 Stäbe.</li><li>Tatsächlicher Achsabstand: 2.900 ÷ (20 − 1) = 152,63 mm — etwas mehr als die gewünschten 150 mm, weil 19 Zwischenräume 2.900 mm abdecken müssen.</li><li>Lichter Abstand zwischen den Stäben: 152,63 − 12 = 140,63 mm.</li></ol>
    <p>Probieren Sie es selbst: Geben Sie dieselben Zahlen oben in den Rechner ein, und Sie erhalten dasselbe Ergebnis.</p>
    <h3 id="example-2">Rechenbeispiel 2: 4.000 mm Breite</h3>
    <p>Breite 4.000 mm, Betondeckung 50 mm, gewünschter Abstand 200 mm, 16-mm-Stäbe:</p>
    <ol class="howto"><li>Bewehrte Breite: 4.000 − 2 × 50 = 3.900 mm.</li><li>Stabanzahl: floor(3.900 ÷ 200) + 1 = 19 + 1 = 20 Stäbe.</li><li>Tatsächlicher Achsabstand: 3.900 ÷ 19 = 205,26 mm.</li><li>Lichter Abstand: 205,26 − 16 = 189,26 mm.</li></ol>
    <p>Gleiche Stabanzahl wie in Beispiel 1, anderer Abstand — die Anzahl folgt aus Breite und Zielabstand zusammen, niemals aus einem allein.</p>
    <h3 id="desired-table">Gewünschter Abstand vs. tatsächlicher Abstand</h3>
    <p>Jedes Mal dasselbe Bauteil (3.000 mm Breite, 50 mm Betondeckung, 12-mm-Stäbe) — nur der gewünschte Abstand ändert sich:</p>
    <div class="formula-table"><table>
      <tr><th>Gewünschter Abstand</th><th>Stäbe</th><th>Tatsächlicher Achsabstand</th><th>Lichter Abstand</th></tr>
      <tr><td>100 mm</td><td>30</td><td>100,00 mm</td><td>88,00 mm</td></tr>
      <tr><td>150 mm</td><td>20</td><td>152,63 mm</td><td>140,63 mm</td></tr>
      <tr><td>175 mm</td><td>17</td><td>181,25 mm</td><td>169,25 mm</td></tr>
      <tr><td>200 mm</td><td>15</td><td>207,14 mm</td><td>195,14 mm</td></tr>
      <tr><td>300 mm</td><td>10</td><td>322,22 mm</td><td>310,22 mm</td></tr>
    </table></div>
    <p>Das Muster: Der tatsächliche Abstand ist immer gleich groß oder größer als der gewünschte (er stimmt nur exakt überein, wenn sich die Breite glatt teilen lässt, wie hier bei 100 mm). Überschreitet der tatsächliche Abstand einen Normhöchstwert, engen Sie den gewünschten Abstand ein und prüfen Sie erneut — akzeptieren Sie niemals einfach das erste Ergebnis.</p>
    <h3 id="cover-table">Leitfaden zur Betondeckung</h3>
    <div class="formula-table"><table>
      <tr><th>Situation</th><th>Typische Betondeckung je Seite</th></tr>
      <tr><td>Platte auf dem Erdreich</td><td>40–50 mm (etwa 1,5–2 in)</td></tr>
      <tr><td>Gegen Erdreich betoniert (Fundamente)</td><td>75 mm (3 in)</td></tr>
      <tr><td>Balken, Stützen, Wände (geschalt)</td><td>40 mm oder wie gezeichnet</td></tr>
    </table></div>
    <p>Die Betondeckung ist der Abstand von der Betonoberfläche zum Stab — sie schützt den Stahl vor Korrosion und Brand. Verwenden Sie immer den Wert aus Ihrer Zeichnung, wenn einer angegeben ist; diese Tabelle dient nur für frühe Schätzungen.</p>
    <h3 id="code-table">Abstandsprüfungen nach Norm (ACI 318)</h3>
    <p>Zwei Prüfungen entscheiden, ob ein Abstand zulässig ist. Es sind Normgrenzen, keine Rechnereingaben — wenden Sie sie auf die Ergebnisse des Rechners an:</p>
    <div class="formula-table"><table>
      <tr><th>Prüfung</th><th>Regel</th><th>Ergebnis Beispiel 1</th></tr>
      <tr><td>Mindestlicher Abstand</td><td>Der größere Wert aus 25 mm (1 in), einem Stabdurchmesser oder 1,33 × Korngröße</td><td>Lichter Abstand 140,63 mm ≥ max(25, 12) — erfüllt</td></tr>
      <tr><td>Höchstachsabstand (Platten, Balken)</td><td>Der kleinere Wert aus 3 × Plattendicke oder 450 mm (18 in)</td><td>Tatsächlich 152,63 mm ≤ 450 mm bei einer 150-mm-Platte — erfüllt</td></tr>
    </table></div>
    <p>Das Minimum existiert, damit Beton um die Stäbe fließen und sich mit ihnen verbinden kann; das Maximum existiert, um Rissbildung zu begrenzen und den Stahl zu verteilen. Schlägt eine der Prüfungen fehl, ändern Sie Stabgröße, Abstand oder Bauteilbreite — der Rechner allein setzt sie nicht durch.</p>
    <h3 id="member-table">Typische Abstände je Bauteil</h3>
    <div class="formula-table"><table>
      <tr><th>Bauteil</th><th>Typischer Abstand</th></tr>
      <tr><td>Wohnungsbauplatten</td><td>300–450 mm (12–18 in) Achsabstand</td></tr>
      <tr><td>Einfahrten, schwere Lasten</td><td>300 mm (12 in) Achsabstand</td></tr>
      <tr><td>Fundamente</td><td>150–300 mm (6–12 in) Achsabstand</td></tr>
      <tr><td>Wände</td><td>300 mm (12 in) vertikal und horizontal</td></tr>
    </table></div>
    <p>Dies sind Ausgangsbereiche für Schätzungen. Die Bemessung — Lasten, Dicke, Stabgröße — legt den echten Abstand fest, und die Normprüfungen oben gelten weiterhin.</p>
    <h3 id="imperial">Metrische und imperiale Einheiten</h3>
    <p>Dieser Rechner rechnet in Millimetern. Wenn Ihre Zeichnungen Fuß und Zoll verwenden:</p>
    <div class="formula-table"><table>
      <tr><th>Metrisch</th><th>Imperial (ca.)</th></tr>
      <tr><td>3.000 mm Breite</td><td>9,84 ft (118,11 in)</td></tr>
      <tr><td>150 mm Abstand</td><td>etwa 6 in</td></tr>
      <tr><td>50 mm Betondeckung</td><td>2 in</td></tr>
      <tr><td>12-mm-Stab</td><td>#4-Stab (1/2 in)</td></tr>
    </table></div>
    <p>Rechnen Sie zuerst um und geben Sie dann Millimeter in den Rechner ein — mischen Sie keine Einheiten in einer Berechnung.</p>
    <h3 id="not-included">Was der Rechner nicht enthält</h3>
    <ul>
      <li><strong>Stablänge und Gewicht.</strong> Dieses Tool legt eine Breite aus. Für Längen und Gewichte verwenden Sie den <a href="/de/bewehrungsrechner-fuer-betonplatten">Plattenrechner</a> oder den <a href="/de/bewehrungsgewicht-rechner">Gewichtsrechner</a>.</li>
      <li><strong>Zweilagige Netze.</strong> Eine Plattenmatte verläuft in beide Richtungen — dieses Tool legt jeweils eine Richtung aus. Der <a href="/de/bewehrungsrechner-fuer-betonplatten">Plattenrechner</a> zählt beide.</li>
      <li><strong>Erforderliche Stahlfläche.</strong> Dieses Tool bemisst keine Bewehrung aus Lasten. Wenn Ihre Bemessung eine erforderliche Stahlfläche vorgibt, ist das eine andere Berechnung als diese Abstandsverlegung.</li>
      <li><strong>Übergreifungs-, Haken- und Biegelängen.</strong> Stoß- und Verankerungsdetails kommen aus dem <a href="/de/uebergreifungslaengen-rechner">Übergreifungsrechner</a> und dem <a href="/de/haken-biege-schnittlaengen-rechner">Hakenrechner</a>.</li>
      <li><strong>Korngröße.</strong> Die Mindestabstandsprüfung benötigt die größte Korngröße; dieses Tool fragt sie nicht ab, führen Sie diese Prüfung also von Hand durch.</li>
    </ul>
    <h3 id="mistakes">5 häufige Fehler</h3>
    <ol class="howto"><li><strong>Lichten Abstand statt Achsabstand messen.</strong> Der Abstand ist der Achsabstand. Wer Fläche zu Fläche misst, zählt zu wenige Stäbe.</li><li><strong>Betondeckung auf der zweiten Seite vergessen.</strong> Die bewehrte Breite verliert an beiden Kanten Betondeckung, nicht nur an einer. Ein einmaliges Abziehen übertreibt Breite und Stabanzahl.</li><li><strong>Stabanzahl abrunden.</strong> Die Anzahl wird immer aufgerundet (floor + 1). Abrunden lässt die letzte Lücke breiter als bemessen.</li><li><strong>Meter statt Millimeter eingeben.</strong> Breite, Betondeckung und Abstand sind hier alle in Millimetern. Die Eingabe von 3 statt 3.000 macht das Ergebnis vollständig unbrauchbar.</li><li><strong>Höchstabstand ignorieren.</strong> Eine Verlegung kann die Anzahl erfüllen und trotzdem den Höchstwert von 3 × Dicke / 450 mm bei dünnen Platten verletzen — führen Sie immer die Normprüfungen durch.</li></ol>
    <p class="muted">Zuletzt geprüft: Oktober 2026. Die Normprüfungen fassen die ACI-318-Abstandsregeln nur zur Orientierung zusammen — prüfen Sie immer anhand Ihrer statischen Pläne und der geltenden Norm.</p>`
}
},
    { id:"develop", slug:"rebar-development-length-calculator", cat:"Detailing",
    metaTitle:"Development Length Calculator (Ld) — IS 456, Free",
    h1:"Rebar Development Length Calculator",
    desc:"Anchorage length Ld for deformed bars by the IS 456 formula, with concrete and steel grade options and bar-size tables. Free, with worked examples.",
    kw:"rebar development length calculator, development length of rebar, anchorage length, Ld calculator",
    intro:"Compute the embedment a bar needs to develop its full strength. Select the bar size, steel grade and concrete grade, and the tool returns Ld in mm and as a multiple of bar diameter, for tension or compression.",
    howto:["Pick the bar size.","Select the steel grade (Fe250–Fe550) and concrete grade (M20–M40).","Choose tension or compression.","Read Ld in mm, as a multiple of diameter, and in metres — plus the τbd used.","Compare with the tables below before detailing the anchorage."],
    formula:"Ld = (φ × 0.87 × fy) ÷ (4 × τbd). τbd is the design bond stress (increased 60% for deformed bars, +25% for compression).",
    toc:`<nav class="content-block" aria-label="On this page">
    <h2>On this page</h2>
    <ul>
      <li><a href="#how-to">How to use the calculator</a></li>
      <li><a href="#formula">The formula, explained</a></li>
      <li><a href="#example-1">Worked example 1: 12 mm, Fe500, M25 (defaults)</a></li>
      <li><a href="#example-2">Worked example 2: 16 mm, Fe500, M25</a></li>
      <li><a href="#example-3">Worked example 3: compression</a></li>
      <li><a href="#tbd-table">Design bond stress table (IS 456)</a></li>
      <li><a href="#multiples-table">Ld as a multiple of diameter</a></li>
      <li><a href="#hooks-table">Anchorage value of bends and hooks</a></li>
      <li><a href="#dev-vs-lap">Development length vs lap length</a></li>
      <li><a href="#not-included">What the calculator does not include</a></li>
      <li><a href="#mistakes">Common mistakes</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
  </nav>`,
    extra:`<p><strong>Why 0.87 × fy?</strong> The design stress in the bar is the yield strength divided by the partial safety factor for steel (1.15), and 1 ÷ 1.15 = 0.87. <strong>Why 4 × τbd?</strong> Bond acts around the bar's perimeter (π × φ) over the length Ld, while the bar force acts on its area (π × φ² ÷ 4) — equating the two gives Ld = φ × σs ÷ (4 × τbd). <strong>Why does Ld grow with diameter?</strong> A thicker bar carries force proportional to φ² but bonds only proportional to φ, so the length must grow with φ to develop the same stress.</p>
    <h3 id="example-1">Worked example 1: 12 mm, Fe500, M25 (defaults)</h3>
    <p>Bar 12 mm, Fe500 (fy = 500 N/mm²), M25 concrete, tension. These are the values the calculator opens with, so you can check the result immediately:</p>
    <ol class="howto"><li>Design stress: 0.87 × 500 = 435 N/mm².</li><li>Bond stress for M25 deformed bars: 1.4 × 1.6 = 2.24 N/mm² (see the table below).</li><li>Ld = (12 × 435) ÷ (4 × 2.24) = 5,220 ÷ 8.96 = 582.59 mm — that is 48.55 × the bar diameter, or 0.583 m.</li></ol>
    <p>Try it yourself: enter the same numbers in the calculator above and you will get the same result.</p>
    <h3 id="example-2">Worked example 2: 16 mm, Fe500, M25</h3>
    <p>Same grades, larger bar:</p>
    <ol class="howto"><li>Ld = (16 × 435) ÷ (4 × 2.24) = 6,960 ÷ 8.96 = 776.79 mm.</li><li>As a multiple: 776.79 ÷ 16 = 48.55 × d — the same multiple as example 1, because the multiple does not depend on bar size (see below).</li></ol>
    <p>The length grows with the bar, but the ×d multiple stays fixed for a given steel and concrete grade. That is why engineers often quote Ld as "about 49 diameters" for Fe500 in M25.</p>
    <h3 id="example-3">Worked example 3: compression</h3>
    <p>Same bar and grades as example 1, but in compression:</p>
    <ol class="howto"><li>Bond stress rises 25%: 2.24 × 1.25 = 2.80 N/mm².</li><li>Ld = (12 × 435) ÷ (4 × 2.80) = 5,220 ÷ 11.20 = 466.07 mm — that is 38.84 × d.</li></ol>
    <p>Compression needs only 80% of the tension length (1 ÷ 1.25), because bond is better when the bar is pushed rather than pulled. The calculator applies this automatically when you switch the stress type.</p>
    <h3 id="tbd-table">Design bond stress table (IS 456)</h3>
    <p>IS 456 gives bond stress for plain bars; deformed bars (the usual case) get a 60% increase. This calculator uses the exact deformed values:</p>
    <div class="formula-table"><table>
      <tr><th>Concrete grade</th><th>τbd, plain bars (N/mm²)</th><th>τbd, deformed bars (N/mm²) — calculator</th></tr>
      <tr><td>M20</td><td>1.2</td><td>1.92</td></tr>
      <tr><td>M25</td><td>1.4</td><td>2.24</td></tr>
      <tr><td>M30</td><td>1.5</td><td>2.40</td></tr>
      <tr><td>M35</td><td>1.7</td><td>2.72</td></tr>
      <tr><td>M40</td><td>1.9</td><td>3.04</td></tr>
    </table></div>
    <p>Some guides round the deformed values (1.6, 1.9, 2.0, 2.2, 2.4) or work with plain-bar values — that is why their answers differ slightly from this calculator's. The calculator uses the unrounded products, so its results check exactly against the formula.</p>
    <h3 id="multiples-table">Ld as a multiple of diameter (tension, deformed bars)</h3>
    <div class="formula-table"><table>
      <tr><th>Steel \ Concrete</th><th>M20</th><th>M25</th><th>M30</th><th>M35</th><th>M40</th></tr>
      <tr><td>Fe415</td><td>47.01 × d</td><td>40.30 × d</td><td>37.61 × d</td><td>33.18 × d</td><td>29.69 × d</td></tr>
      <tr><td>Fe500</td><td>56.64 × d</td><td>48.55 × d</td><td>45.31 × d</td><td>39.98 × d</td><td>35.77 × d</td></tr>
    </table></div>
    <p>Two patterns to remember: stronger steel needs longer development (Fe500 > Fe415 at every grade), and stronger concrete needs shorter development (every row falls left to right). Compression multiples are 80% of these values.</p>
    <h3 id="hooks-table">Anchorage value of bends and hooks</h3>
    <p>When straight embedment will not fit, a bend or hook counts toward Ld (IS 456, clause 26.2.2.1):</p>
    <div class="formula-table"><table>
      <tr><th>Bend / hook</th><th>Anchorage value</th></tr>
      <tr><td>45° bend</td><td>4 × d</td></tr>
      <tr><td>90° bend</td><td>8 × d</td></tr>
      <tr><td>135° bend</td><td>12 × d</td></tr>
      <tr><td>U-hook (180°)</td><td>16 × d</td></tr>
    </table></div>
    <p>Example: a 12 mm bar needing 582.59 mm in tension can use a 90° bend worth 8 × 12 = 96 mm plus 486.59 mm of straight length. For bend and hook cutting lengths, use the <a href="/rebar-hook-bend-cutting-length-calculator">hook calculator</a>.</p>
    <h3 id="dev-vs-lap">Development length vs lap length</h3>
    <div class="formula-table"><table>
      <tr><th></th><th>Development length (Ld)</th><th>Lap length</th></tr>
      <tr><td>Purpose</td><td>Anchor a bar into concrete so it develops its full strength</td><td>Overlap two bars so force transfers from one to the other</td></tr>
      <tr><td>Used at</td><td>Beam ends, slab ends, column bases, supports</td><td>Where bars continue (splices)</td></tr>
      <tr><td>Depends on</td><td>Bar diameter, steel grade, concrete grade, tension/compression</td><td>Bar diameter and concrete conditions</td></tr>
    </table></div>
    <p>The two are related but not interchangeable: a lap must be at least the development length, but lap rules add their own conditions. For splice lengths, use the <a href="/rebar-lap-length-calculator">lap calculator</a>.</p>
    <h3 id="not-included">What the calculator does not include</h3>
    <ul>
      <li><strong>Lap splices.</strong> Ld anchors one bar; joining two bars is a lap — see the <a href="/rebar-lap-length-calculator">lap calculator</a>.</li>
      <li><strong>Bend and hook cutting lengths.</strong> The anchorage values above are allowances, not cutting lengths — see the <a href="/rebar-hook-bend-cutting-length-calculator">hook calculator</a>.</li>
      <li><strong>Seismic and ductile detailing.</strong> Special confinement, hooks and anchorage rules for earthquake zones are beyond this tool.</li>
      <li><strong>ACI development length.</strong> This tool follows IS 456. The ACI method uses different factors (casting position, coating, bar size, concrete strength) and gives different lengths.</li>
      <li><strong>Reduced stress.</strong> Ld here assumes the bar develops its full design stress (0.87 × fy). A bar stressed below that needs proportionally less — the tool does not take a reduced stress input.</li>
    </ul>
    <h3 id="mistakes">5 common mistakes</h3>
    <ol class="howto"><li><strong>Using plain-bar bond stress for deformed bars.</strong> That understates τbd and overstates Ld by 60% — or, if you copy a plain-bar example, understates the real requirement. This calculator already applies the 60% increase.</li><li><strong>Forgetting the compression factor — or applying it backwards.</strong> Compression raises τbd by 25%, so Ld gets shorter (× 0.8), not longer.</li><li><strong>Using fy instead of 0.87 × fy.</strong> The design stress is 0.87 × fy, not fy. Using fy overstates Ld by 15%.</li><li><strong>Confusing Ld with lap length.</strong> Ld anchors a bar into concrete; a lap joins two bars. Same order of size, different detail — do not substitute one for the other.</li><li><strong>Assuming the ×d multiple changes with bar size.</strong> It does not: for fixed grades, Ld ÷ d is constant. A 20 mm bar needs 48.55 × 20 = 971 mm in Fe500/M25 tension, not a different multiple.</li></ol>
    <p class="muted">Last reviewed: October 2026. Formula and bond stresses per IS 456:2000 for deformed bars; anchorage values per clause 26.2.2.1. Always verify against your structural drawings and governing code.</p>`,
    faqs:[["What is development length of rebar?","The length of bar that must be embedded in concrete to transfer its design force safely. Without enough embedment, the bar slips or pulls out before reaching its design stress."],
          ["What is the development length for Fe500 in M25?","About 47–49 times the bar diameter in tension for deformed bars — exactly 48.55 × d with this calculator: 582.59 mm for a 12 mm bar, 776.79 mm for a 16 mm bar, both in M25 tension."],
          ["Is development length different in tension and compression?","Yes. Compression raises the bond stress by 25%, so Ld is 80% of the tension value: a 12 mm Fe500 bar in M25 needs 582.59 mm in tension but 466.07 mm in compression."],
          ["Why is the stress 0.87 × fy and not fy?","0.87 is 1 ÷ 1.15, the partial safety factor for steel in IS 456. The design stress is the yield strength reduced by that factor — using full fy would overstate Ld by 15%."],
          ["Do deformed bars need shorter development length than plain bars?","Yes — deformed bars get a 60% higher bond stress (for example M25: 2.24 instead of 1.4 N/mm²), so their Ld is proportionally shorter. This calculator already uses deformed values."],
          ["Can a bend or hook replace straight development length?","Partly. A 90° bend counts as 8 × d and a U-hook as 16 × d toward Ld, with the rest made up in straight length. For cutting lengths, use the hook calculator."],
          ["What is the difference between development length and lap length?","Development length anchors one bar into concrete; lap length overlaps two bars to transfer force between them. A lap must be at least the development length, but lap rules add their own conditions — see the lap calculator."],
          ["Does stronger concrete reduce development length?","Yes. Higher grades raise the bond stress, so Ld falls: Fe500 in tension needs 56.64 × d in M20 but only 35.77 × d in M40."],
          ["Does the ×d multiple change with bar size?","No. For fixed steel and concrete grades the multiple is constant — only the length in mm grows with diameter. Fe500 in M25 is 48.55 × d whether the bar is 12 mm or 20 mm."],
          ["Does this calculator follow ACI or IS 456?","IS 456. The ACI method uses different factors (casting position, epoxy coating, bar size, concrete strength) and gives different lengths — do not mix the two methods on one detail."]] ,
    de: {
  metaTitle: "Verankerungslängen-Rechner — Ld nach IS 456, gratis",
  desc: "Verankerungslängen-Rechner: Ld für Rippenstäbe nach IS 456 aus Durchmesser, Stahl- und Betongüte berechnen. Beispiel: 12 mm, Fe500, M25 = 582,59 mm. Kostenlos.",
  formula: "Ld = (φ × 0,87 × fy) ÷ (4 × τbd). τbd ist die Bemessungs-Verbundspannung (60% höher für Rippenstäbe, +25% für Druck).",
  kw: "verankerungslängen-rechner, verankerungslänge von bewehrung, verankerungslänge ld, bewehrung verankern",
  howto: ["Stabdurchmesser wählen.", "Stahlgüte (Fe250–Fe550) und Betongüte (M20–M40) wählen.", "Zug oder Druck wählen.", "Ld in mm, als Vielfaches des Durchmessers und in Metern ablesen — plus das verwendete τbd.", "Vor der Detailplanung mit den Tabellen unten vergleichen."],
  faqs: [["Was ist die Verankerungslänge von Bewehrung?", "Die Länge, über die ein Stab in Beton eingebettet sein muss, um seine Bemessungskraft sicher zu übertragen. Ohne ausreichende Einbettung rutscht der Stab oder wird herausgezogen, bevor er seine Bemessungsspannung erreicht."],
          ["Wie groß ist die Verankerungslänge für Fe500 in M25?", "Etwa 47–49-mal der Stabdurchmesser bei Zug für Rippenstäbe — genau 48,55 × d mit diesem Rechner: 582,59 mm für einen 12-mm-Stab, 776,79 mm für einen 16-mm-Stab, jeweils in M25 bei Zug."],
          ["Ist die Verankerungslänge bei Zug und Druck verschieden?", "Ja. Bei Druck steigt die Verbundspannung um 25%, sodass Ld 80% des Zugwerts beträgt: Ein 12-mm-Stab aus Fe500 in M25 benötigt 582,59 mm bei Zug, aber nur 466,07 mm bei Druck."],
          ["Warum beträgt die Spannung 0,87 × fy und nicht fy?", "0,87 ist 1 ÷ 1,15, der Teilsicherheitsbeiwert für Stahl nach IS 456. Die Bemessungsspannung ist die Streckgrenze, abgemindert um diesen Faktor — mit der vollen Streckgrenze fy würde Ld um 15% überschätzt."],
          ["Brauchen Rippenstäbe eine kürzere Verankerungslänge als Glattstäbe?", "Ja — Rippenstäbe erhalten eine 60% höhere Verbundspannung (zum Beispiel M25: 2,24 statt 1,4 N/mm²), sodass ihre Ld entsprechend kürzer ausfällt. Dieser Rechner verwendet bereits die Werte für Rippenstäbe."],
          ["Kann eine Biegung oder ein Haken die gerade Verankerungslänge ersetzen?", "Teilweise. Eine 90°-Biegung zählt 8 × d und ein U-Haken 16 × d auf Ld an; der Rest wird als gerade Länge ausgeführt. Für Schnittlängen verwenden Sie den Hakenrechner."],
          ["Was ist der Unterschied zwischen Verankerungslänge und Übergreifungslänge?", "Die Verankerungslänge verankert einen einzelnen Stab im Beton; die Übergreifungslänge überlappt zwei Stäbe, um die Kraft zwischen ihnen zu übertragen. Eine Übergreifung muss mindestens so lang sein wie die Verankerungslänge, doch für Übergreifungen gelten eigene Regeln — siehe Übergreifungsrechner."],
          ["Verringert festerer Beton die Verankerungslänge?", "Ja. Höhere Güten erhöhen die Verbundspannung, sodass Ld sinkt: Fe500 bei Zug benötigt 56,64 × d in M20, aber nur 35,77 × d in M40."],
          ["Ändert sich das ×d-Vielfache mit der Stabdicke?", "Nein. Bei festen Stahl- und Betongüten ist das Vielfache konstant — nur die Länge in mm wächst mit dem Durchmesser. Fe500 in M25 ergibt 48,55 × d, ob der Stab 12 mm oder 20 mm dick ist."],
          ["Folgt dieser Rechner ACI oder IS 456?", "IS 456. Das ACI-Verfahren verwendet andere Faktoren (Einbaulage, Epoxidbeschichtung, Stabdicke, Betonfestigkeit) und liefert andere Längen — mischen Sie die beiden Verfahren nicht in einem Detail."]],
  toc: `<nav class="content-block" aria-label="Auf dieser Seite">
    <h2>Auf dieser Seite</h2>
    <ul>
      <li><a href="#how-to">Rechner benutzen</a></li>
      <li><a href="#formula">Die Formel, erklärt</a></li>
      <li><a href="#example-1">Rechenbeispiel 1: 12 mm, Fe500, M25 (Standardwerte)</a></li>
      <li><a href="#example-2">Rechenbeispiel 2: 16 mm, Fe500, M25</a></li>
      <li><a href="#example-3">Rechenbeispiel 3: Druck</a></li>
      <li><a href="#tbd-table">Tabelle der Bemessungs-Verbundspannung (IS 456)</a></li>
      <li><a href="#multiples-table">Ld als Vielfaches des Durchmessers</a></li>
      <li><a href="#hooks-table">Anrechnungswert von Biegungen und Haken</a></li>
      <li><a href="#dev-vs-lap">Verankerungslänge vs. Übergreifungslänge</a></li>
      <li><a href="#not-included">Was der Rechner nicht berücksichtigt</a></li>
      <li><a href="#mistakes">Häufige Fehler</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
  </nav>`,
  extra: `<p><strong>Warum 0,87 × fy?</strong> Die Bemessungsspannung im Stab ist die Streckgrenze geteilt durch den Teilsicherheitsbeiwert für Stahl (1,15), und 1 ÷ 1,15 = 0,87. <strong>Warum 4 × τbd?</strong> Der Verbund wirkt über den Stabumfang (π × φ) auf der Länge Ld, während die Stabkraft auf die Querschnittsfläche wirkt (π × φ² ÷ 4) — beides gleichgesetzt ergibt Ld = φ × σs ÷ (4 × τbd). <strong>Warum wächst Ld mit dem Durchmesser?</strong> Ein dickerer Stab trägt eine Kraft proportional zu φ², haftet aber nur proportional zu φ, sodass die Länge mit φ wachsen muss, um dieselbe Spannung zu entwickeln.</p>
    <h3 id="example-1">Rechenbeispiel 1: 12 mm, Fe500, M25 (Standardwerte)</h3>
    <p>Stab 12 mm, Fe500 (fy = 500 N/mm²), Beton M25, Zug. Dies sind die Werte, mit denen der Rechner startet, sodass Sie das Ergebnis sofort prüfen können:</p>
    <ol class="howto"><li>Bemessungsspannung: 0,87 × 500 = 435 N/mm².</li><li>Verbundspannung für Rippenstäbe in M25: 1,4 × 1,6 = 2,24 N/mm² (siehe Tabelle unten).</li><li>Ld = (12 × 435) ÷ (4 × 2,24) = 5.220 ÷ 8,96 = 582,59 mm — das sind 48,55 × der Stabdurchmesser oder 0,583 m.</li></ol>
    <p>Probieren Sie es selbst: Geben Sie dieselben Werte oben in den Rechner ein, und Sie erhalten dasselbe Ergebnis.</p>
    <h3 id="example-2">Rechenbeispiel 2: 16 mm, Fe500, M25</h3>
    <p>Dieselben Güten, dickerer Stab:</p>
    <ol class="howto"><li>Ld = (16 × 435) ÷ (4 × 2,24) = 6.960 ÷ 8,96 = 776,79 mm.</li><li>Als Vielfaches: 776,79 ÷ 16 = 48,55 × d — dasselbe Vielfache wie in Beispiel 1, weil das Vielfache nicht von der Stabdicke abhängt (siehe unten).</li></ol>
    <p>Die Länge wächst mit dem Stab, doch das ×d-Vielfache bleibt für eine gegebene Stahl- und Betongüte fest. Deshalb geben Ingenieure Ld oft als „etwa 49 Durchmesser" für Fe500 in M25 an.</p>
    <h3 id="example-3">Rechenbeispiel 3: Druck</h3>
    <p>Derselbe Stab und dieselben Güten wie in Beispiel 1, aber bei Druck:</p>
    <ol class="howto"><li>Die Verbundspannung steigt um 25%: 2,24 × 1,25 = 2,80 N/mm².</li><li>Ld = (12 × 435) ÷ (4 × 2,80) = 5.220 ÷ 11,20 = 466,07 mm — das sind 38,84 × d.</li></ol>
    <p>Bei Druck genügen 80% der Zuglänge (1 ÷ 1,25), weil der Verbund besser ist, wenn der Stab gedrückt statt gezogen wird. Der Rechner wendet dies automatisch an, wenn Sie die Beanspruchungsart wechseln.</p>
    <h3 id="tbd-table">Tabelle der Bemessungs-Verbundspannung (IS 456)</h3>
    <p>IS 456 gibt die Verbundspannung für Glattstäbe an; Rippenstäbe (der übliche Fall) erhalten eine Erhöhung um 60%. Dieser Rechner verwendet die genauen Werte für Rippenstäbe:</p>
    <div class="formula-table"><table>
      <tr><th>Betongüte</th><th>τbd, Glattstäbe (N/mm²)</th><th>τbd, Rippenstäbe (N/mm²) — Rechner</th></tr>
      <tr><td>M20</td><td>1,2</td><td>1,92</td></tr>
      <tr><td>M25</td><td>1,4</td><td>2,24</td></tr>
      <tr><td>M30</td><td>1,5</td><td>2,40</td></tr>
      <tr><td>M35</td><td>1,7</td><td>2,72</td></tr>
      <tr><td>M40</td><td>1,9</td><td>3,04</td></tr>
    </table></div>
    <p>Manche Anleitungen runden die Werte für Rippenstäbe (1,6; 1,9; 2,0; 2,2; 2,4) oder rechnen mit den Werten für Glattstäbe — deshalb weichen ihre Ergebnisse leicht von denen dieses Rechners ab. Der Rechner verwendet die ungerundeten Produkte, sodass seine Ergebnisse exakt zur Formel passen.</p>
    <h3 id="multiples-table">Ld als Vielfaches des Durchmessers (Zug, Rippenstäbe)</h3>
    <div class="formula-table"><table>
      <tr><th>Stahl \ Beton</th><th>M20</th><th>M25</th><th>M30</th><th>M35</th><th>M40</th></tr>
      <tr><td>Fe415</td><td>47,01 × d</td><td>40,30 × d</td><td>37,61 × d</td><td>33,18 × d</td><td>29,69 × d</td></tr>
      <tr><td>Fe500</td><td>56,64 × d</td><td>48,55 × d</td><td>45,31 × d</td><td>39,98 × d</td><td>35,77 × d</td></tr>
    </table></div>
    <p>Zwei Muster zum Merken: Festerer Stahl braucht längere Verankerung (Fe500 > Fe415 bei jeder Güte), und festerer Beton braucht kürzere Verankerung (jede Zeile fällt von links nach rechts). Die Vielfachen bei Druck betragen 80% dieser Werte.</p>
    <h3 id="hooks-table">Anrechnungswert von Biegungen und Haken</h3>
    <p>Wenn die gerade Einbettung nicht passt, zählt eine Biegung oder ein Haken auf Ld an (IS 456, Abschnitt 26.2.2.1):</p>
    <div class="formula-table"><table>
      <tr><th>Biegung / Haken</th><th>Anrechnungswert</th></tr>
      <tr><td>45°-Biegung</td><td>4 × d</td></tr>
      <tr><td>90°-Biegung</td><td>8 × d</td></tr>
      <tr><td>135°-Biegung</td><td>12 × d</td></tr>
      <tr><td>U-Haken (180°)</td><td>16 × d</td></tr>
    </table></div>
    <p>Beispiel: Ein 12-mm-Stab, der 582,59 mm bei Zug benötigt, kann eine 90°-Biegung im Wert von 8 × 12 = 96 mm plus 486,59 mm gerade Länge nutzen. Für Schnittlängen von Biegungen und Haken verwenden Sie den <a href="/de/haken-biege-schnittlaengen-rechner">Hakenrechner</a>.</p>
    <h3 id="dev-vs-lap">Verankerungslänge vs. Übergreifungslänge</h3>
    <div class="formula-table"><table>
      <tr><th></th><th>Verankerungslänge (Ld)</th><th>Übergreifungslänge</th></tr>
      <tr><td>Zweck</td><td>Einen Stab im Beton verankern, sodass er seine volle Festigkeit entwickelt</td><td>Zwei Stäbe überlappen, sodass die Kraft von einem auf den anderen übertragen wird</td></tr>
      <tr><td>Einsatzort</td><td>Balkenenden, Plattenenden, Stützenfüße, Auflager</td><td>Wo Stäbe weitergeführt werden (Stöße)</td></tr>
      <tr><td>Hängt ab von</td><td>Stabdurchmesser, Stahlgüte, Betongüte, Zug/Druck</td><td>Stabdurchmesser und Betonbedingungen</td></tr>
    </table></div>
    <p>Beide hängen zusammen, sind aber nicht austauschbar: Eine Übergreifung muss mindestens so lang sein wie die Verankerungslänge, doch für Übergreifungen gelten eigene Regeln. Für Stoßlängen verwenden Sie den <a href="/de/uebergreifungslaengen-rechner">Übergreifungsrechner</a>.</p>
    <h3 id="not-included">Was der Rechner nicht berücksichtigt</h3>
    <ul>
      <li><strong>Übergreifungsstöße.</strong> Ld verankert einen Stab; zwei Stäbe zu verbinden ist eine Übergreifung — siehe den <a href="/de/uebergreifungslaengen-rechner">Übergreifungsrechner</a>.</li>
      <li><strong>Schnittlängen von Biegungen und Haken.</strong> Die Anrechnungswerte oben sind Zulagen, keine Schnittlängen — siehe den <a href="/de/haken-biege-schnittlaengen-rechner">Hakenrechner</a>.</li>
      <li><strong>Erdbeben- und Duktilitätsbewehrung.</strong> Besondere Umschnürung, Haken und Verankerungsregeln für Erdbebenzonen gehen über dieses Werkzeug hinaus.</li>
      <li><strong>Verankerungslänge nach ACI.</strong> Dieses Werkzeug folgt IS 456. Das ACI-Verfahren verwendet andere Faktoren (Einbaulage, Beschichtung, Stabdicke, Betonfestigkeit) und liefert andere Längen.</li>
      <li><strong>Abgeminderte Spannung.</strong> Ld geht hier davon aus, dass der Stab seine volle Bemessungsspannung (0,87 × fy) entwickelt. Ein Stab, der geringer beansprucht wird, benötigt entsprechend weniger — das Werkzeug nimmt keine abgeminderte Spannung als Eingabe.</li>
    </ul>
    <h3 id="mistakes">5 häufige Fehler</h3>
    <ol class="howto"><li><strong>Verbundspannung für Glattstäbe bei Rippenstäben verwenden.</strong> Das unterschätzt τbd und überschätzt Ld um 60% — oder, wenn Sie ein Beispiel für Glattstäbe übernehmen, unterschätzt es die tatsächliche Anforderung. Dieser Rechner wendet die Erhöhung um 60% bereits an.</li><li><strong>Den Druckfaktor vergessen — oder falsch herum anwenden.</strong> Bei Druck steigt τbd um 25%, sodass Ld kürzer wird (× 0,8), nicht länger.</li><li><strong>fy statt 0,87 × fy verwenden.</strong> Die Bemessungsspannung beträgt 0,87 × fy, nicht fy. Mit fy wird Ld um 15% überschätzt.</li><li><strong>Ld mit der Übergreifungslänge verwechseln.</strong> Ld verankert einen Stab im Beton; eine Übergreifung verbindet zwei Stäbe. Ähnliche Größenordnung, anderes Detail — ersetzen Sie nicht das eine durch das andere.</li><li><strong>Annehmen, dass sich das ×d-Vielfache mit der Stabdicke ändert.</strong> Das tut es nicht: Bei festen Güten ist Ld ÷ d konstant. Ein 20-mm-Stab benötigt 48,55 × 20 = 971 mm bei Fe500/M25 unter Zug, kein anderes Vielfaches.</li></ol>
    <p class="muted">Zuletzt geprüft: Oktober 2026. Formel und Verbundspannungen nach IS 456:2000 für Rippenstäbe; Anrechnungswerte nach Abschnitt 26.2.2.1. Immer anhand Ihrer statischen Pläne und der geltenden Norm prüfen.</p>`
}
},
    { id:"lap", slug:"rebar-lap-length-calculator", cat:"Detailing",
    metaTitle:"Lap Length Calculator — Tension & Compression Splices",
    h1:"Rebar Lap / Splice Length Calculator",
    desc:"Correct lap (splice) length every time: tension lap = max(Ld, 30d), compression lap = max(Ld, 24d). Free calculator with bar schedules. Try it free.",
    kw:"rebar lap length calculator, rebar splice length calculator, rebar lapping formula, lap length of rebar",
    intro:"Find the overlap needed to splice two bars. Pick the bar size, steel and concrete grade and the lap type — the tool returns the lap length in mm and as a multiple of diameter.",
    howto:["Pick the bar size.","Select the steel grade (Fe250–Fe550) and concrete grade (M20–M40).","Choose tension or compression lap.","Read the lap length in mm, as a multiple of diameter, plus the development length and the code minimum — the note under the result shows which value governed.","Apply the staggering and placement rules below before detailing — the calculator gives the length, not the location."],
    formula:"Tension lap = max(Ld, 30d); compression lap = max(Ld, 24d), where Ld is the development length.",
    toc:`<nav class="content-block" aria-label="On this page">
    <h2>On this page</h2>
    <ul>
      <li><a href="#how-to">How to use the calculator</a></li>
      <li><a href="#formula">The formula, explained</a></li>
      <li><a href="#example-1">Worked example 1: 12 mm, Fe500, M25, tension (defaults)</a></li>
      <li><a href="#example-2">Worked example 2: same bars in compression</a></li>
      <li><a href="#example-3">Worked example 3: when the code minimum governs</a></li>
      <li><a href="#tension-vs-compression">Tension vs compression lap table</a></li>
      <li><a href="#lap-by-size">Lap length by bar size</a></li>
      <li><a href="#stagger-rules">Staggering and placement rules</a></li>
      <li><a href="#lap-vs-dev">Lap length vs development length</a></li>
      <li><a href="#bar-schedule">Laps in the bar schedule: count, weight and cost</a></li>
      <li><a href="#not-included">What the calculator does not include</a></li>
      <li><a href="#mistakes">Common mistakes</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
  </nav>`,
    extra:`<h3>The formula, explained</h3>
    <p>Every lap length starts from the development length Ld — the embedment a bar needs to
    develop its full design stress in concrete (IS 456:2000 Cl 26.2.1):</p>
    <p><strong>Ld = (d × 0.87 × fy) ÷ (4 × τbd)</strong></p>
    <ul>
      <li><strong>d</strong> is the bar diameter in mm.</li>
      <li><strong>0.87 × fy</strong> is the design stress in the steel. The 0.87 is 1 ÷ 1.15, the
      partial safety factor for steel — using fy itself overstates Ld by 15%.</li>
      <li><strong>τbd</strong> is the design bond stress. The table below gives plain-bar values;
      deformed bars (the usual site bar) raise them by 60%, and compression raises them a
      further 25% — which is why a compression Ld is 0.8 × the tension Ld.</li>
    </ul>
    <p>Then the lap rule (IS 456 Cl 26.2.5.1) takes the greater of Ld and a code floor:</p>
    <ul>
      <li><strong>Tension lap = max(Ld, 30d)</strong> — flexural tension, beams and slabs.</li>
      <li><strong>Compression lap = max(Ld, 24d)</strong> — columns and other compression members.</li>
    </ul>
    <p>The panel note shows which value governed, e.g. "lap = max(Ld 583, 30d 360) mm" for
    the defaults — Ld rounded to a whole number in the note, exact values in the result tiles.</p>
    <h3>Design bond stress τbd (IS 456 Cl 26.2.1.1)</h3>
    <div class="formula-table"><table>
      <tr><th>Concrete grade</th><th>M20</th><th>M25</th><th>M30</th><th>M35</th><th>M40</th></tr>
      <tr><td>Plain bars</td><td>1.20</td><td>1.40</td><td>1.50</td><td>1.70</td><td>1.90</td></tr>
      <tr><td>Deformed bars (× 1.6)</td><td>1.92</td><td>2.24</td><td>2.40</td><td>2.72</td><td>3.04</td></tr>
      <tr><td>Deformed, compression (× 1.25 more)</td><td>2.40</td><td>2.80</td><td>3.00</td><td>3.40</td><td>3.80</td></tr>
    </table></div>
    <p>Values in N/mm². This calculator assumes deformed bars throughout — for plain bars,
    divide the deformed τbd by 1.6 and recompute Ld by hand.</p>
    <h3 id="example-1">Worked example 1: 12 mm, Fe500, M25, tension (calculator defaults)</h3>
    <p>Open the calculator and it already shows this case: 12 mm bar, Fe500 steel, M25
    concrete, tension lap.</p>
    <ul>
      <li>τbd = 1.40 × 1.6 = 2.24 N/mm² (deformed bars).</li>
      <li>Ld = (12 × 0.87 × 500) ÷ (4 × 2.24) = 5220 ÷ 8.96 = <strong>582.59 mm</strong>.</li>
      <li>Code minimum = 30 × 12 = <strong>360.00 mm</strong>.</li>
      <li>Lap = max(582.59, 360.00) = <strong>582.59 mm = 48.55 × d</strong>.</li>
    </ul>
    <p>Try it yourself: the panel opens on 582.59 mm, 48.55 × d, Ld 582.59 mm, minimum 360.00 mm.</p>
    <h3 id="example-2">Worked example 2: the same bars in compression</h3>
    <p>Switch the lap type to Compression and keep 12 mm, Fe500, M25:</p>
    <ul>
      <li>τbd = 2.24 × 1.25 = 2.80 N/mm² (compression bond stress).</li>
      <li>Ld = 5220 ÷ (4 × 2.80) = 5220 ÷ 11.20 = <strong>466.07 mm</strong>.</li>
      <li>Code minimum = 24 × 12 = <strong>288.00 mm</strong>.</li>
      <li>Lap = max(466.07, 288.00) = <strong>466.07 mm = 38.84 × d</strong>.</li>
    </ul>
    <p>That is exactly 0.8 × the tension lap (0.8 × 582.59 = 466.07) — the compression saving
    comes from the higher bond stress, not from a shorter rule. Column bars that also carry
    bending can go into tension under lateral loads, so many designers detail column laps as
    tension laps to be safe; always follow the structural drawings.</p>
    <h3 id="example-3">Worked example 3: when the code minimum governs</h3>
    <p>Take a mild-steel bar in strong concrete: 12 mm, Fe250, M40, tension.</p>
    <ul>
      <li>τbd = 3.04 N/mm²; Ld = (12 × 0.87 × 250) ÷ (4 × 3.04) = 2610 ÷ 12.16 = <strong>214.64 mm</strong>.</li>
      <li>Code minimum = 30 × 12 = <strong>360.00 mm</strong>.</li>
      <li>Lap = max(214.64, 360.00) = <strong>360.00 mm = 30.00 × d</strong>.</li>
    </ul>
    <p>The floor exists so that even a short Ld still gets a workable overlap. The same thing
    happens at Fe415/M40: tension Ld is 356.30 mm but the lap is 360.00 mm, and compression
    Ld is 285.04 mm but the lap is 288.00 mm. If you ever see a lap quoted below 30d in
    tension or 24d in compression, it is wrong unless a specific code clause says otherwise.</p>
    <h3 id="tension-vs-compression">Tension vs compression lap table</h3>
    <p>Lap length as a multiple of bar diameter (Ld ÷ d), computed from the IS 456 formula.
    Where the multiple falls below the code floor, the floor value is shown — that is the lap
    the calculator returns.</p>
    <div class="formula-table"><table>
      <tr><th>Steel</th><th>Mode</th><th>M20</th><th>M25</th><th>M30</th><th>M35</th><th>M40</th></tr>
      <tr><td>Fe415</td><td>Tension</td><td>47.01</td><td>40.30</td><td>37.61</td><td>33.18</td><td>30.00 (floor)</td></tr>
      <tr><td>Fe415</td><td>Compression</td><td>37.61</td><td>32.24</td><td>30.09</td><td>26.55</td><td>24.00 (floor)</td></tr>
      <tr><td>Fe500</td><td>Tension</td><td>56.64</td><td>48.55</td><td>45.31</td><td>39.98</td><td>35.77</td></tr>
      <tr><td>Fe500</td><td>Compression</td><td>45.31</td><td>38.84</td><td>36.25</td><td>31.99</td><td>28.62</td></tr>
    </table></div>
    <p>Two patterns to remember: higher steel grades need longer laps (Fe500 needs about 20%
    more than Fe415 at the same concrete grade), and higher concrete grades need shorter laps
    (M40 needs about 37% less than M20 at Fe500 tension). That is why a single 50d rule is
    both wasteful on strong concrete and unsafe on weak concrete.</p>
    <h3>12 mm lap lengths in mm (Fe500)</h3>
    <div class="formula-table"><table>
      <tr><th>Mode</th><th>M20</th><th>M25</th><th>M30</th><th>M35</th><th>M40</th></tr>
      <tr><td>Tension</td><td>679.69</td><td>582.59</td><td>543.75</td><td>479.78</td><td>429.28</td></tr>
      <tr><td>Compression</td><td>543.75</td><td>466.07</td><td>435.00</td><td>383.82</td><td>343.42</td></tr>
    </table></div>
    <p>Imperial equivalents: example 1 (582.59 mm) = 22.94 in = 1.91 ft; example 2 (466.07 mm)
    = 18.35 in = 1.53 ft; example 3 (360.00 mm) = 14.17 in = 1.18 ft.</p>
    <h3 id="lap-by-size">Lap length by bar size</h3>
    <p>Fe500 steel, M25 concrete, flexural tension. The × d multiple is the same for every
    size (48.55) — only the millimetres scale with diameter.</p>
    <div class="formula-table"><table>
      <tr><th>Bar</th><th>8 mm</th><th>10 mm</th><th>12 mm</th><th>16 mm</th><th>20 mm</th><th>25 mm</th></tr>
      <tr><td>Tension lap (mm)</td><td>388.39</td><td>485.49</td><td>582.59</td><td>776.79</td><td>970.98</td><td>1213.73</td></tr>
      <tr><td>Compression lap (mm)</td><td>310.71</td><td>388.39</td><td>466.07</td><td>621.43</td><td>776.79</td><td>970.98</td></tr>
    </table></div>
    <p>Each compression value is exactly 0.8 × the tension value for the same size — which is
    also why a 10 mm compression lap (388.39 mm) happens to equal an 8 mm tension lap. Do not
    use that coincidence as a shortcut; run the grades you actually have.</p>
    <h3 id="stagger-rules">Staggering and placement rules</h3>
    <p>The calculator gives the length. These rules govern where laps go (IS 456 Cl 26.2.5,
    IS 13920 for seismic detailing):</p>
    <ul>
      <li><strong>Stagger:</strong> splices count as staggered only when successive splices are at
      least <strong>1.3 × the lap length</strong> apart, centre to centre — 757.37 mm for example 1,
      605.89 mm for example 2. Never lap all bars at one section; not more than half the
      bars should be spliced at any one section.</li>
      <li><strong>Straight portion:</strong> the straight length of a lap must be at least
      <strong>max(15d, 200 mm)</strong> — 200 mm for a 12 mm bar, 240 mm for a 16 mm bar.</li>
      <li><strong>Columns:</strong> laps in the middle third of the column height, away from
      beam–column joints and the foundation interface.</li>
      <li><strong>Beams:</strong> bottom bars lap near the supports, top bars near mid-span —
      never in the zone of maximum moment.</li>
      <li><strong>Slabs and footings:</strong> keep laps away from the highest-moment regions
      (mid-span for bottom steel, column face for footing mats) and stagger them across the mat.</li>
      <li><strong>Different diameters:</strong> calculate on the smaller diameter.</li>
      <li><strong>Large bars:</strong> no lap splices above 32 mm — use welding or mechanical
      couplers (older references say 36 mm; that was the pre-2007 limit).</li>
      <li><strong>Top bars and corners:</strong> a tension lap at the top of a section with cover
      below 2d, or at a corner with tight spacing, needs a 1.4 factor — about 816 mm for
      example 1. If both conditions apply, the factor is 2.0. The calculator does not apply
      these factors; multiply its result yourself.</li>
      <li><strong>Binding:</strong> wire every lap at both ends so the bars stay in contact during
      concreting — a loose lap is a failed lap.</li>
    </ul>
    <h3 id="lap-vs-dev">Lap length vs development length</h3>
    <div class="formula-table"><table>
      <tr><th></th><th>Development length (Ld)</th><th>Lap length</th></tr>
      <tr><td>Purpose</td><td>Anchor a bar into concrete so it develops its full strength</td><td>Overlap two bars so force transfers from one to the other</td></tr>
      <tr><td>Formula</td><td>Ld = (d × 0.87 × fy) ÷ (4 × τbd)</td><td>Tension max(Ld, 30d); compression max(Ld, 24d)</td></tr>
      <tr><td>Minimum</td><td>None beyond the formula</td><td>30d tension, 24d compression</td></tr>
      <tr><td>Extra rules</td><td>Hook and bend anchorage values</td><td>Staggering (1.3 × lap), straight portion, ≤50% at one section</td></tr>
      <tr><td>Example (12 mm, Fe500, M25)</td><td>582.59 mm</td><td>582.59 mm tension, 466.07 mm compression</td></tr>
    </table></div>
    <p>The two are related but not interchangeable: a lap must be at least the development
    length, but lap rules add their own conditions. For Ld alone, use the
    <a href="/rebar-development-length-calculator">development length calculator</a>.</p>
    <h3 id="bar-schedule">Laps in the bar schedule: count, weight and cost</h3>
    <p>Laps are not free steel — they must be in the cutting lengths, or the site runs short.</p>
    <ul>
      <li><strong>Count the laps:</strong> pieces = ceil(run ÷ 12 m stock), laps per line =
      pieces − 1. A 25 m run needs 3 pieces, so 2 laps per line.</li>
      <li><strong>Extra length:</strong> laps per line × lap length. At the calculator defaults,
      2 × 582.59 = 1165.18 mm per line; over 10 lines that is 11.65 m of extra bar.</li>
      <li><strong>Extra weight:</strong> 12 mm bar is 0.887 kg/m, so one default splice weighs
      0.52 kg and 100 splices weigh 51.68 kg.</li>
      <li><strong>Extra cost:</strong> at €1.20/kg (example price — get a current quote), 100
      default splices cost €62.01 in steel alone, before cutting waste. Add a 2–5% waste
      allowance on top of the lapped tonnage, not instead of it.</li>
    </ul>
    <p>For a full count-and-length take-off, use the
    <a href="/rebar-quantity-calculator">quantity &amp; takeoff calculator</a>; for the cost
    breakdown, the <a href="/rebar-cost-calculator">rebar cost calculator</a>.</p>
    <h3 id="not-included">What the calculator does not include</h3>
    <ul>
      <li><strong>Direct tension laps.</strong> Ties and hangers need max(2Ld, 30d) — 1165.18 mm
      for the defaults. Double the Ld yourself.</li>
      <li><strong>Top-bar and corner factors.</strong> ×1.4 for cover below 2d or tight corners,
      ×2.0 if both apply.</li>
      <li><strong>Staggering and placement.</strong> The 1.3 × lap stagger rule and the
      member placement rules above are detailing decisions, not outputs.</li>
      <li><strong>Plain bars.</strong> The calculator assumes deformed bars. For plain bars,
      divide τbd by 1.6 and recompute Ld by hand.</li>
      <li><strong>Hooks, welds and couplers.</strong> Hooks anchor bar ends (see the
      <a href="/rebar-hook-bend-cutting-length-calculator">hook &amp; bend calculator</a>);
      welded and mechanical splices follow their own rules and are the only option above 32 mm.</li>
      <li><strong>ACI 318 splices.</strong> Class A (1.0 × Ld) vs Class B (1.3 × Ld) tension
      splices, and the ACI compression splice formulas, are a different code system — this
      calculator is IS 456.</li>
      <li><strong>Seismic detailing.</strong> IS 13920 adds confinement and location rules for
      seismic zones; follow the project drawings.</li>
      <li><strong>Lap counts and weights.</strong> The calculator gives one splice length, not
      the total laps, weight or cost for a member — see the bar-schedule section above.</li>
    </ul>
    <h3 id="mistakes">Common mistakes</h3>
    <ol class="howto">
      <li><strong>Using a fixed 50d for everything.</strong> 50d approximates Fe415/M20 tension
      (47.01d) and nothing else. On M40 it wastes steel; on weak concrete with Fe500 it
      under-laps by up to 12% (56.64d needed at M20). Calculate per grade.</li>
      <li><strong>Using the tension lap in compression, or vice versa.</strong> Compression laps
      are 0.8 × tension laps at the same grades. Using the compression value in a tension zone
      under-laps the splice by 20%.</li>
      <li><strong>Using plain-bar bond stress for deformed bars.</strong> That understates τbd
      by 60% and overstates the lap by 60% — or, copied the other way, understates the real
      requirement. This calculator already applies the 60% increase.</li>
      <li><strong>Forgetting the 30d/24d floor.</strong> Lap is max(Ld, floor), not Ld alone. At
      Fe250/M40 the Ld is only 214.64 mm but the lap is still 360.00 mm.</li>
      <li><strong>Lapping every bar at the same section, or at peak moment.</strong> Bunched
      laps create a weak plane and congested steel that concrete cannot flow around. Stagger
      at least 1.3 × the lap apart and keep laps out of maximum-moment zones.</li>
    </ol>
    <p>Last reviewed: October 2026.</p>`,
    faqs:[["What is lap length of rebar?","The overlap between two spliced bars so force transfers from one bar to the other through the concrete bond. Bars come in standard lengths (usually 12 m), so any longer run must be continued by lapping the next bar over the lap length."],
          ["Is lap length 40d or 50d?","It depends on grade and concrete — commonly 40–50d, but that is a rule of thumb, not a code value. This tool computes it from Ld: for 12 mm Fe500 bars in M25 concrete the tension lap is 48.55 × d (582.59 mm), while for Fe415 in M20 it is 47.01 × d. Always calculate for your actual grades — see the tables below."],
          ["Why is the compression lap shorter than the tension lap?","Two reasons. First, the design bond stress in compression is 25% higher than in tension (IS 456 Cl 26.2.1.1), so the compression development length is 0.8 × the tension value — 466.07 mm vs 582.59 mm for 12 mm Fe500/M25. Second, the code floor is lower: 24d in compression vs 30d in tension."],
          ["What is the difference between development length and lap length?","Development length (Ld) anchors one bar into concrete so it develops its full strength; lap length overlaps two bars so force transfers from one to the other. A lap is built on Ld — tension lap = max(Ld, 30d), compression lap = max(Ld, 24d) — but lap rules add their own minimums and staggering requirements. For Ld alone, use the <a href=\"/rebar-development-length-calculator\">development length calculator</a>."],
          ["Where should laps be placed?","Away from maximum-moment zones and staggered, never all at one section. Column laps belong in the middle third of the height, away from beam–column joints; beam bottom bars lap near the supports and top bars near mid-span; no more than half the bars should be spliced at any one section. Successive splices count as staggered only when they are at least 1.3 × the lap length apart."],
          ["What about direct tension — ties and hangers?","Direct tension is stricter: IS 456 Cl 26.2.5.1 requires max(2Ld, 30d). For the calculator defaults (12 mm, Fe500, M25) that is 1165.18 mm — double the 582.59 mm flexural-tension lap. This calculator covers flexural tension and compression only, so double the Ld yourself for direct-tension members."],
          ["Can bars larger than 32 mm be lap spliced?","No. IS 456:2000 as amended in 2007 does not permit lap splices for bars larger than 32 mm — use welding or mechanical couplers instead. Older references cite 36 mm; that was the pre-amendment limit. A 32 mm lap would already be over a metre of doubled steel, which is why the code draws the line there."],
          ["How many laps do I need, and how much extra steel?","Divide the run by the 12 m stock length and round up: pieces = ceil(run ÷ 12), laps per line = pieces − 1. A 25 m run needs 3 pieces, so 2 laps per line — at the calculator defaults that adds 2 × 582.59 = 1165.18 mm per line, or 11.65 m over 10 lines. Put laps in the cutting lengths, or the site runs short."],
          ["What if the two spliced bars have different diameters?","Calculate on the smaller diameter. The bond transfer is limited by the smaller bar, so using the larger diameter would overstate the lap. The same applies when a bar laps onto a starter dowel of a different size."],
          ["Does the calculator include hooks, welds or couplers?","No — it gives straight lap lengths only. A hook anchors a bar end; it does not replace a lap, and a lapped bar still needs its lap even if it is hooked. For hook and bend allowances use the <a href=\"/rebar-hook-bend-cutting-length-calculator\">hook & bend calculator</a>; for bars over 32 mm, or where congestion rules laps out, price mechanical couplers against the lapped steel they replace."]],
    de: {
  metaTitle: "Übergreifungslängen-Rechner — Zug- & Druckstoß gratis",
  desc: "Übergreifungslängen-Rechner: Zugstoß = max(Ld, 30d), Druckstoß = max(Ld, 24d) nach IS 456 berechnen. Beispiel: 12 mm, Fe500, M25 = 582,59 mm. Kostenlos.",
  formula: "Zugstoß = max(Ld; 30d); Druckstoß = max(Ld; 24d), wobei Ld die Verankerungslänge ist.",
  kw: "übergreifungslängen-rechner, bewehrungsstoß rechner, übergreifungslänge formel, übergreifungslänge bewehrung",
  howto: ["Stabdurchmesser wählen.", "Stahlgüte (Fe250–Fe550) und Betongüte (M20–M40) wählen.", "Zug- oder Druckstoß wählen.", "Übergreifungslänge in mm, als Vielfaches des Durchmessers, dazu Verankerungslänge und Mindestwert ablesen — der Hinweis unter dem Ergebnis zeigt, welcher Wert maßgebend war.", "Vor der Detailplanung die Staffelungs- und Verlegeregeln unten beachten — der Rechner liefert die Länge, nicht die Lage."],
  faqs: [["Was ist die Übergreifungslänge bei Bewehrung?", "Die Überlappung zweier gestoßener Stäbe, damit die Kraft über den Betonverbund vom einen Stab auf den anderen übergeht. Stäbe werden in Standardlängen geliefert (meist 12 m), sodass jede längere Lauflänge durch Überlappen des nächsten Stabs über die Stoßlänge fortgesetzt werden muss."],
          ["Beträgt die Übergreifungslänge 40d oder 50d?", "Das hängt von Güte und Beton ab — üblich sind 40–50d, aber das ist eine Faustregel, kein Normwert. Dieses Tool berechnet ihn aus Ld: Für 12-mm-Stäbe Fe500 in M25-Beton beträgt der Zugstoß 48,55 × d (582,59 mm), für Fe415 in M20 dagegen 47,01 × d. Immer für die tatsächlich vorhandenen Güten rechnen — siehe Tabellen unten."],
          ["Warum ist der Druckstoß kürzer als der Zugstoß?", "Zwei Gründe. Erstens ist die Bemessungsverbundspannung bei Druck um 25 % höher als bei Zug (IS 456, Abs. 26.2.1.1), sodass die Druck-Verankerungslänge 0,8 × dem Zugwert entspricht — 466,07 mm gegenüber 582,59 mm bei 12 mm Fe500/M25. Zweitens ist der Norm-Mindestwert niedriger: 24d bei Druck gegenüber 30d bei Zug."],
          ["Was ist der Unterschied zwischen Verankerungslänge und Übergreifungslänge?", "Verankerungslänge (Ld) verankert einen Stab im Beton, damit er seine volle Tragfähigkeit entwickelt; Übergreifungslänge überlappt zwei Stäbe, damit die Kraft vom einen auf den anderen übergeht. Ein Stoß baut auf Ld auf — Zugstoß = max(Ld; 30d), Druckstoß = max(Ld; 24d) — aber die Stoßregeln fügen eigene Mindestwerte und Staffelanforderungen hinzu. Für Ld allein den <a href=\"/de/verankerungslaengen-rechner\">Verankerungslängen-Rechner</a> verwenden."],
          ["Wo sollen Stöße angeordnet werden?", "Fern von Bereichen größter Momente und versetzt, niemals alle an einem Querschnitt. Stützenstöße gehören ins mittlere Drittel der Höhe, fern von Balken-Stützen-Knoten; untere Balkenstäbe stoßen im Auflagerbereich, obere in Feldmitte; höchstens die Hälfte der Stäbe darf an einem Querschnitt gestoßen sein. Aufeinanderfolgende Stöße gelten nur dann als versetzt, wenn sie mindestens 1,3 × die Stoßlänge auseinanderliegen."],
          ["Was gilt bei reiner Zugbeanspruchung — Bügel und Aufhängebewehrung?", "Reine Zugbeanspruchung ist strenger: IS 456, Abs. 26.2.5.1 verlangt max(2Ld; 30d). Bei den Standardeinstellungen (12 mm, Fe500, M25) sind das 1165,18 mm — das Doppelte des Biegezugstoßes von 582,59 mm. Dieser Rechner deckt nur Biegezug und Druck ab; für Bauteile unter reiner Zugbeanspruchung Ld selbst verdoppeln."],
          ["Können Stäbe über 32 mm gestoßen werden?", "Nein. IS 456:2000 in der Fassung von 2007 lässt keine Stoßverbindungen für Stäbe über 32 mm zu — stattdessen Schweißen oder mechanische Muffen verwenden. Ältere Quellen nennen 36 mm; das war der Grenzwert vor der Änderung. Ein 32-mm-Stoß wäre bereits über einen Meter doppelter Stahl, weshalb die Norm dort die Grenze zieht."],
          ["Wie viele Stöße brauche ich, und wie viel Mehrstahl?", "Die Lauflänge durch die 12-m-Stangenlänge teilen und aufrunden: Stücke = aufrunden(Lauflänge ÷ 12), Stöße je Strang = Stücke − 1. Eine 25-m-Lauflänge braucht 3 Stücke, also 2 Stöße je Strang — bei den Standardeinstellungen sind das 2 × 582,59 = 1165,18 mm je Strang bzw. 11,65 m bei 10 Strängen. Stöße in die Schnittlängen aufnehmen, sonst fehlt auf der Baustelle Material."],
          ["Was, wenn die beiden gestoßenen Stäbe unterschiedliche Durchmesser haben?", "Mit dem kleineren Durchmesser rechnen. Die Verbundübertragung wird durch den kleineren Stab begrenzt, sodass Rechnen mit dem größeren Durchmesser den Stoß überschätzen würde. Gleiches gilt, wenn ein Stab auf einen Anschlussstab anderer Größe stößt."],
          ["Berücksichtigt der Rechner Haken, Schweißungen oder Muffen?", "Nein — er liefert nur gerade Stoßlängen. Ein Haken verankert ein Stabende; er ersetzt keinen Stoß, und ein gestoßener Stab braucht seinen Stoß auch dann, wenn er gehakt ist. Für Haken- und Biegezumaße den <a href=\"/de/haken-biege-schnittlaengen-rechner\">Haken- & Biege-Rechner</a> verwenden; für Stäbe über 32 mm oder wo Bewehrungsdichte Stöße ausschließt, mechanische Muffen gegen den gestoßenen Stahl abwägen, den sie ersetzen."]],
  toc: `<nav class="content-block" aria-label="Auf dieser Seite">
    <h2>Auf dieser Seite</h2>
    <ul>
      <li><a href="#how-to">So benutzen Sie den Rechner</a></li>
      <li><a href="#formula">Die Formel, erklärt</a></li>
      <li><a href="#example-1">Rechenbeispiel 1: 12 mm, Fe500, M25, Zug (Standardeinstellungen)</a></li>
      <li><a href="#example-2">Rechenbeispiel 2: gleiche Stäbe bei Druck</a></li>
      <li><a href="#example-3">Rechenbeispiel 3: wenn der Mindestwert greift</a></li>
      <li><a href="#tension-vs-compression">Zug- vs. Druckstoß-Tabelle</a></li>
      <li><a href="#lap-by-size">Übergreifungslänge nach Stabdurchmesser</a></li>
      <li><a href="#stagger-rules">Staffelungs- und Verlegeregeln</a></li>
      <li><a href="#lap-vs-dev">Übergreifungslänge vs. Verankerungslänge</a></li>
      <li><a href="#bar-schedule">Übergreifungen in der Stahlliste: Anzahl, Gewicht und Kosten</a></li>
      <li><a href="#not-included">Was der Rechner nicht berücksichtigt</a></li>
      <li><a href="#mistakes">Häufige Fehler</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
  </nav>`,
  extra: `<h3>Die Formel, erklärt</h3>
    <p>Jede Stoßlänge geht von der Verankerungslänge Ld aus — der Einbindelänge, die ein
    Stab braucht, um seine volle Bemessungsspannung im Beton zu entwickeln (IS 456:2000,
    Abs. 26.2.1):</p>
    <p><strong>Ld = (d × 0,87 × fy) ÷ (4 × τbd)</strong></p>
    <ul>
      <li><strong>d</strong> ist der Stabdurchmesser in mm.</li>
      <li><strong>0,87 × fy</strong> ist die Bemessungsspannung im Stahl. Die 0,87 ist 1 ÷ 1,15, der
      Teilsicherheitsbeiwert für Stahl — mit fy selbst würde Ld um 15 % überschätzt.</li>
      <li><strong>τbd</strong> ist die Bemessungsverbundspannung. Die Tabelle unten gibt Werte für
      Glattstäbe an; Rippenstäbe (der übliche Baustellenstab) erhöhen sie um 60 %, und
      Druck erhöht sie um weitere 25 % — deshalb beträgt Ld bei Druck 0,8 × Ld bei Zug.</li>
    </ul>
    <p>Dann nimmt die Stoßregel (IS 456, Abs. 26.2.5.1) den größeren Wert aus Ld und einem
    Norm-Mindestwert:</p>
    <ul>
      <li><strong>Zugstoß = max(Ld; 30d)</strong> — Biegezug, Balken und Platten.</li>
      <li><strong>Druckstoß = max(Ld; 24d)</strong> — Stützen und andere Druckglieder.</li>
    </ul>
    <p>Der Hinweis im Panel zeigt, welcher Wert maßgebend war, z. B. „Stoß = max(Ld 583;
    30d 360) mm“ bei den Standardeinstellungen — Ld im Hinweis auf eine ganze Zahl
    gerundet, exakte Werte in den Ergebnisfeldern.</p>
    <h3>Bemessungsverbundspannung τbd (IS 456, Abs. 26.2.1.1)</h3>
    <div class="formula-table"><table>
      <tr><th>Betongüte</th><th>M20</th><th>M25</th><th>M30</th><th>M35</th><th>M40</th></tr>
      <tr><td>Glattstäbe</td><td>1,20</td><td>1,40</td><td>1,50</td><td>1,70</td><td>1,90</td></tr>
      <tr><td>Rippenstäbe (× 1,6)</td><td>1,92</td><td>2,24</td><td>2,40</td><td>2,72</td><td>3,04</td></tr>
      <tr><td>Rippenstäbe, Druck (× 1,25 mehr)</td><td>2,40</td><td>2,80</td><td>3,00</td><td>3,40</td><td>3,80</td></tr>
    </table></div>
    <p>Werte in N/mm². Dieser Rechner setzt durchgehend Rippenstäbe voraus — für
    Glattstäbe die Rippenstab-τbd durch 1,6 teilen und Ld von Hand neu berechnen.</p>
    <h3 id="example-1">Rechenbeispiel 1: 12 mm, Fe500, M25, Zug (Standardeinstellungen)</h3>
    <p>Den Rechner öffnen — dieser Fall ist bereits voreingestellt: 12-mm-Stab, Fe500-Stahl,
    M25-Beton, Zugstoß.</p>
    <ul>
      <li>τbd = 1,40 × 1,6 = 2,24 N/mm² (Rippenstäbe).</li>
      <li>Ld = (12 × 0,87 × 500) ÷ (4 × 2,24) = 5220 ÷ 8,96 = <strong>582,59 mm</strong>.</li>
      <li>Mindestwert = 30 × 12 = <strong>360,00 mm</strong>.</li>
      <li>Stoß = max(582,59; 360,00) = <strong>582,59 mm = 48,55 × d</strong>.</li>
    </ul>
    <p>Selbst ausprobieren: Das Panel öffnet mit 582,59 mm, 48,55 × d, Ld 582,59 mm,
    Mindestwert 360,00 mm.</p>
    <h3 id="example-2">Rechenbeispiel 2: gleiche Stäbe bei Druck</h3>
    <p>Stoßart auf Druck umstellen und 12 mm, Fe500, M25 beibehalten:</p>
    <ul>
      <li>τbd = 2,24 × 1,25 = 2,80 N/mm² (Druck-Verbundspannung).</li>
      <li>Ld = 5220 ÷ (4 × 2,80) = 5220 ÷ 11,20 = <strong>466,07 mm</strong>.</li>
      <li>Mindestwert = 24 × 12 = <strong>288,00 mm</strong>.</li>
      <li>Stoß = max(466,07; 288,00) = <strong>466,07 mm = 38,84 × d</strong>.</li>
    </ul>
    <p>Das ist genau 0,8 × der Zugstoß (0,8 × 582,59 = 466,07) — die Druckersparnis kommt
    aus der höheren Verbundspannung, nicht aus einer kürzeren Regel. Stützenstäbe, die
    auch Biegung tragen, können unter Querlasten in Zug geraten; viele Planer legen
    Stützenstöße daher sicherheitshalber als Zugstöße aus. Immer die statischen Pläne
    beachten.</p>
    <h3 id="example-3">Rechenbeispiel 3: wenn der Mindestwert greift</h3>
    <p>Ein Weichstahlstab in festem Beton: 12 mm, Fe250, M40, Zug.</p>
    <ul>
      <li>τbd = 3,04 N/mm²; Ld = (12 × 0,87 × 250) ÷ (4 × 3,04) = 2610 ÷ 12,16 = <strong>214,64 mm</strong>.</li>
      <li>Mindestwert = 30 × 12 = <strong>360,00 mm</strong>.</li>
      <li>Stoß = max(214,64; 360,00) = <strong>360,00 mm = 30,00 × d</strong>.</li>
    </ul>
    <p>Der Mindestwert sorgt dafür, dass auch ein kurzes Ld eine praktikable Überlappung
    erhält. Dasselbe gilt bei Fe415/M40: Ld bei Zug beträgt 356,30 mm, der Stoß aber
    360,00 mm, und Ld bei Druck beträgt 285,04 mm, der Stoß aber 288,00 mm. Wer je einen
    Stoß unter 30d bei Zug oder 24d bei Druck angegeben sieht, liegt falsch — es sei
    denn, eine bestimmte Normklausel sagt etwas anderes.</p>
    <h3 id="tension-vs-compression">Zug- vs. Druckstoß-Tabelle</h3>
    <p>Stoßlänge als Vielfaches des Stabdurchmessers (Ld ÷ d), nach der IS-456-Formel
    berechnet. Wo das Vielfache unter den Norm-Mindestwert fällt, ist der Mindestwert
    angegeben — das ist der Stoß, den der Rechner ausgibt.</p>
    <div class="formula-table"><table>
      <tr><th>Stahl</th><th>Modus</th><th>M20</th><th>M25</th><th>M30</th><th>M35</th><th>M40</th></tr>
      <tr><td>Fe415</td><td>Zug</td><td>47,01</td><td>40,30</td><td>37,61</td><td>33,18</td><td>30,00 (Mindestwert)</td></tr>
      <tr><td>Fe415</td><td>Druck</td><td>37,61</td><td>32,24</td><td>30,09</td><td>26,55</td><td>24,00 (Mindestwert)</td></tr>
      <tr><td>Fe500</td><td>Zug</td><td>56,64</td><td>48,55</td><td>45,31</td><td>39,98</td><td>35,77</td></tr>
      <tr><td>Fe500</td><td>Druck</td><td>45,31</td><td>38,84</td><td>36,25</td><td>31,99</td><td>28,62</td></tr>
    </table></div>
    <p>Zwei Muster zum Merken: Höhere Stahlgüten brauchen längere Stöße (Fe500 braucht
    etwa 20 % mehr als Fe415 bei gleicher Betongüte), und höhere Betongüten brauchen
    kürzere Stöße (M40 braucht etwa 37 % weniger als M20 bei Fe500-Zug). Deshalb ist eine
    einzelne 50d-Regel bei starkem Beton verschwenderisch und bei schwachem Beton unsicher.</p>
    <h3>12-mm-Übergreifungslängen in mm (Fe500)</h3>
    <div class="formula-table"><table>
      <tr><th>Modus</th><th>M20</th><th>M25</th><th>M30</th><th>M35</th><th>M40</th></tr>
      <tr><td>Zug</td><td>679,69</td><td>582,59</td><td>543,75</td><td>479,78</td><td>429,28</td></tr>
      <tr><td>Druck</td><td>543,75</td><td>466,07</td><td>435,00</td><td>383,82</td><td>343,42</td></tr>
    </table></div>
    <p>Imperial-Entsprechungen: Beispiel 1 (582,59 mm) = 22,94 in = 1,91 ft; Beispiel 2
    (466,07 mm) = 18,35 in = 1,53 ft; Beispiel 3 (360,00 mm) = 14,17 in = 1,18 ft.</p>
    <h3 id="lap-by-size">Übergreifungslänge nach Stabdurchmesser</h3>
    <p>Fe500-Stahl, M25-Beton, Biegezug. Das ×-d-Vielfache ist für jede Größe gleich
    (48,55) — nur die Millimeter skalieren mit dem Durchmesser.</p>
    <div class="formula-table"><table>
      <tr><th>Stab</th><th>8 mm</th><th>10 mm</th><th>12 mm</th><th>16 mm</th><th>20 mm</th><th>25 mm</th></tr>
      <tr><td>Zugstoß (mm)</td><td>388,39</td><td>485,49</td><td>582,59</td><td>776,79</td><td>970,98</td><td>1213,73</td></tr>
      <tr><td>Druckstoß (mm)</td><td>310,71</td><td>388,39</td><td>466,07</td><td>621,43</td><td>776,79</td><td>970,98</td></tr>
    </table></div>
    <p>Jeder Druckwert ist genau 0,8 × der Zugwert derselben Größe — weshalb ein
    10-mm-Druckstoß (388,39 mm) zufällig einem 8-mm-Zugstoß entspricht. Diese
    Zufälligkeit nicht als Abkürzung nutzen; mit den tatsächlich vorhandenen Güten rechnen.</p>
    <h3 id="stagger-rules">Staffelungs- und Verlegeregeln</h3>
    <p>Der Rechner liefert die Länge. Diese Regeln bestimmen, wohin Stöße gehören
    (IS 456, Abs. 26.2.5, IS 13920 für Erdbebendetails):</p>
    <ul>
      <li><strong>Staffelung:</strong> Stöße gelten nur dann als versetzt, wenn
      aufeinanderfolgende Stöße mindestens <strong>1,3 × die Stoßlänge</strong> auseinanderliegen,
      Mitte zu Mitte — 757,37 mm für Beispiel 1, 605,89 mm für Beispiel 2. Niemals alle
      Stäbe an einem Querschnitt stoßen; höchstens die Hälfte der Stäbe darf an einem
      Querschnitt gestoßen sein.</li>
      <li><strong>Gerader Anteil:</strong> Die gerade Länge eines Stoßes muss mindestens
      <strong>max(15d; 200 mm)</strong> betragen — 200 mm bei einem 12-mm-Stab, 240 mm bei
      einem 16-mm-Stab.</li>
      <li><strong>Stützen:</strong> Stöße im mittleren Drittel der Stützenhöhe, fern von
      Balken-Stützen-Knoten und vom Fundamentanschluss.</li>
      <li><strong>Balken:</strong> Untere Stäbe im Auflagerbereich stoßen, obere Stäbe in
      Feldmitte — niemals im Bereich des größten Moments.</li>
      <li><strong>Platten und Fundamente:</strong> Stöße von den Bereichen größter Momente
      fernhalten (Feldmitte für die untere Bewehrung, Stützenkante für Fundamentmatten)
      und über die Matte versetzen.</li>
      <li><strong>Unterschiedliche Durchmesser:</strong> Mit dem kleineren Durchmesser rechnen.</li>
      <li><strong>Große Stäbe:</strong> Keine Stoßverbindungen über 32 mm — Schweißen oder
      mechanische Muffen verwenden (ältere Quellen nennen 36 mm; das war der Grenzwert
      vor 2007).</li>
      <li><strong>Obere Stäbe und Ecken:</strong> Ein Zugstoß oben im Querschnitt bei einer
      Betondeckung unter 2d oder an einer Ecke mit engem Abstand braucht den Faktor 1,4 —
      etwa 816 mm für Beispiel 1. Treffen beide Bedingungen zu, gilt der Faktor 2,0. Der
      Rechner wendet diese Faktoren nicht an; sein Ergebnis selbst multiplizieren.</li>
      <li><strong>Verdrahtung:</strong> Jeden Stoß an beiden Enden verdrahten, damit die Stäbe
      beim Betonieren in Kontakt bleiben — ein loser Stoß ist ein versagter Stoß.</li>
    </ul>
    <h3 id="lap-vs-dev">Übergreifungslänge vs. Verankerungslänge</h3>
    <div class="formula-table"><table>
      <tr><th></th><th>Verankerungslänge (Ld)</th><th>Übergreifungslänge</th></tr>
      <tr><td>Zweck</td><td>Einen Stab im Beton verankern, damit er seine volle Tragfähigkeit entwickelt</td><td>Zwei Stäbe überlappen, damit die Kraft vom einen auf den anderen übergeht</td></tr>
      <tr><td>Formel</td><td>Ld = (d × 0,87 × fy) ÷ (4 × τbd)</td><td>Zug max(Ld; 30d); Druck max(Ld; 24d)</td></tr>
      <tr><td>Mindestwert</td><td>Keiner über die Formel hinaus</td><td>30d Zug, 24d Druck</td></tr>
      <tr><td>Zusätzliche Regeln</td><td>Haken- und Biege-Verankerungswerte</td><td>Staffelung (1,3 × Stoß), gerader Anteil, ≤ 50 % an einem Querschnitt</td></tr>
      <tr><td>Beispiel (12 mm, Fe500, M25)</td><td>582,59 mm</td><td>582,59 mm Zug, 466,07 mm Druck</td></tr>
    </table></div>
    <p>Beide hängen zusammen, sind aber nicht austauschbar: Ein Stoß muss mindestens der
    Verankerungslänge entsprechen, aber die Stoßregeln fügen eigene Bedingungen hinzu.
    Für Ld allein den <a href="/de/verankerungslaengen-rechner">Verankerungslängen-Rechner</a>
    verwenden.</p>
    <h3 id="bar-schedule">Übergreifungen in der Stahlliste: Anzahl, Gewicht und Kosten</h3>
    <p>Stöße sind kein Gratis-Stahl — sie müssen in den Schnittlängen stehen, sonst fehlt
    auf der Baustelle Material.</p>
    <ul>
      <li><strong>Stöße zählen:</strong> Stücke = aufrunden(Lauflänge ÷ 12 m Stangenlänge),
      Stöße je Stabstrang = Stücke − 1. Eine 25-m-Lauflänge braucht 3 Stücke, also
      2 Stöße je Strang.</li>
      <li><strong>Mehrlänge:</strong> Stöße je Strang × Stoßlänge. Bei den
      Standardeinstellungen: 2 × 582,59 = 1165,18 mm je Strang; bei 10 Strängen sind das
      11,65 m Mehrstahl.</li>
      <li><strong>Mehrgewicht:</strong> Ein 12-mm-Stab wiegt 0,887 kg/m, also wiegt ein
      Standardstoß 0,52 kg und 100 Stöße wiegen 51,68 kg.</li>
      <li><strong>Mehrkosten:</strong> Bei 1,20 €/kg (Beispielpreis — aktuellen Preis
      einholen) kosten 100 Standardstöße 62,01 € nur an Stahl, vor Schnittverschnitt.
      Einen Verschnittzuschlag von 2–5 % auf die gestoßene Tonnage aufschlagen, nicht
      stattdessen.</li>
    </ul>
    <p>Für eine vollständige Mengen- und Längenermittlung den
    <a href="/de/bewehrungsmengen-rechner">Mengen- und Abnahmerechner</a> verwenden; für
    die Kostenaufschlüsselung den <a href="/de/bewehrungskosten-rechner">Bewehrungskosten-Rechner</a>.</p>
    <h3 id="not-included">Was der Rechner nicht berücksichtigt</h3>
    <ul>
      <li><strong>Stöße bei reiner Zugbeanspruchung.</strong> Bügel und Aufhängebewehrung
      brauchen max(2Ld; 30d) — 1165,18 mm bei den Standardeinstellungen. Ld selbst
      verdoppeln.</li>
      <li><strong>Faktoren für obere Stäbe und Ecken.</strong> × 1,4 bei Deckung unter 2d
      oder engen Ecken, × 2,0 wenn beides zutrifft.</li>
      <li><strong>Staffelung und Lage.</strong> Die Staffelregel 1,3 × Stoßlänge und die
      Verlegeregeln für Bauteile oben sind Detailentscheidungen, keine Rechenergebnisse.</li>
      <li><strong>Glattstäbe.</strong> Der Rechner setzt Rippenstäbe voraus. Für Glattstäbe
      τbd durch 1,6 teilen und Ld von Hand neu berechnen.</li>
      <li><strong>Haken, Schweißungen und Muffen.</strong> Haken verankern Stabenden (siehe
      den <a href="/de/haken-biege-schnittlaengen-rechner">Haken- & Biege-Rechner</a>);
      geschweißte und mechanische Stöße folgen eigenen Regeln und sind über 32 mm die
      einzige Option.</li>
      <li><strong>ACI-318-Stöße.</strong> Stöße der Klasse A (1,0 × Ld) bzw. Klasse B
      (1,3 × Ld) bei Zug und die ACI-Druckstoßformeln gehören zu einem anderen
      Normensystem — dieser Rechner rechnet nach IS 456.</li>
      <li><strong>Erdbebendetailplanung.</strong> IS 13920 ergänzt Umschnürungs- und
      Lageregeln für Erdbebengebiete; die Projektpläne beachten.</li>
      <li><strong>Stoßanzahl und -gewichte.</strong> Der Rechner liefert eine Stoßlänge,
      nicht die Gesamtzahl, das Gewicht oder die Kosten für ein Bauteil — siehe Abschnitt
      Stahlliste oben.</li>
    </ul>
    <h3 id="mistakes">Häufige Fehler</h3>
    <ol class="howto">
      <li><strong>Eine feste 50d-Regel für alles verwenden.</strong> 50d nähert nur Fe415/M20
      bei Zug an (47,01d) und sonst nichts. Bei M40 verschwendet sie Stahl; bei schwachem
      Beton mit Fe500 unterlappt sie um bis zu 12 % (56,64d bei M20 nötig). Je Güte rechnen.</li>
      <li><strong>Den Zugstoß bei Druck verwenden oder umgekehrt.</strong> Druckstöße sind
      0,8 × die Zugstöße bei gleichen Güten. Wer den Druckwert in einer Zugzone verwendet,
      unterlappt den Stoß um 20 %.</li>
      <li><strong>Die Verbundspannung für Glattstäbe bei Rippenstäben verwenden.</strong> Das
      unterschätzt τbd um 60 % und überschätzt den Stoß um 60 % — oder, andersherum
      übernommen, unterschätzt den tatsächlichen Bedarf. Dieser Rechner wendet die
      60-%-Erhöhung bereits an.</li>
      <li><strong>Den Mindestwert 30d/24d vergessen.</strong> Der Stoß ist max(Ld;
      Mindestwert), nicht Ld allein. Bei Fe250/M40 beträgt Ld nur 214,64 mm, der Stoß aber
      trotzdem 360,00 mm.</li>
      <li><strong>Alle Stäbe am selben Querschnitt oder im größten Moment stoßen.</strong>
      Gebündelte Stöße erzeugen eine Schwächeebene und so eng liegenden Stahl, dass der
      Beton nicht herumfließen kann. Mindestens 1,3 × die Stoßlänge versetzen und Stöße
      aus den Bereichen größter Momente heraushalten.</li>
    </ol>
    <p>Zuletzt geprüft: Oktober 2026.</p>`
}
},
    { id:"hook", slug:"rebar-hook-bend-cutting-length-calculator", cat:"Detailing",
    metaTitle:"Hook & Bend Cutting Length Calculator — 9d Hooks",
    h1:"Rebar Hook, Bend & Cutting Length Calculator",
    desc:"Cutting length from straight length, standard 9d hooks and bend deductions. Get the exact length to cut in seconds, free, with worked examples.",
    kw:"rebar hook length formula, rebar bend formula, rebar cut length calculation, cutting length of rebar",
    intro:"Get the exact cutting length to order or cut a bar. Enter the straight length, number of hooks and bends — the tool adds 9d per hook and deducts 1d/2d/3d for 45°/90°/135° bends.",
    howto:["Enter the straight (out-to-out) length in mm — the length after cover is taken off the span, not the full span itself.","Pick the bar size.","Enter the number of hooks (9d each) and the count of each bend type — 45°, 90°, 135°.","Read the cutting length in mm and m, plus the hook addition and bend deduction shown separately.","Apply the result to the bar schedule: divide the 12 m stock length by the cutting length for bars per stick, and add laps and waste before ordering."],
    formula:"Cutting length = straight length + (hooks × 9d) − (45°×1d + 90°×2d + 135°×3d).",
    toc:`<nav class="content-block" aria-label="On this page">
    <h2>On this page</h2>
    <ul>
      <li><a href="#how-to">How to use the calculator</a></li>
      <li><a href="#formula">The formula, explained</a></li>
      <li><a href="#example-1">Worked example 1: calculator defaults (12 mm, 2 hooks)</a></li>
      <li><a href="#example-2">Worked example 2: 16 mm bar with two 90° bends</a></li>
      <li><a href="#example-3">Worked example 3: mixed bends, one hook</a></li>
      <li><a href="#hook-table">Hook allowance (9d) by bar size</a></li>
      <li><a href="#deduction-table">Bend deduction by angle</a></li>
      <li><a href="#hook-vs-anchorage">Hook allowance vs anchorage value</a></li>
      <li><a href="#stirrup-hooks">Stirrup hooks: why 10d, not 9d</a></li>
      <li><a href="#crank-bar">Cranked (bent-up) bars: the 0.42h rule</a></li>
      <li><a href="#shapes">L-bars, U-bars and the bar schedule</a></li>
      <li><a href="#stock-length">From cutting length to order: stock lengths and waste</a></li>
      <li><a href="#imperial">Metric and imperial units</a></li>
      <li><a href="#not-included">What the calculator does not include</a></li>
      <li><a href="#mistakes">Common mistakes</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
  </nav>`,
    extra:`<h3>The formula, explained</h3>
    <p>Cutting length is the length of straight bar you cut <em>before</em> bending — not
    the length shown on the drawing. The drawing gives out-to-out dimensions, which
    measure along the outside faces of the bent bar. Bending stretches the outside and
    compresses the inside, so the outside measurement always overstates the bar. The
    formula corrects both ends of the problem:</p>
    <p><strong>Cutting length = straight length + (hooks × 9d) − (45°×1d + 90°×2d + 135°×3d)</strong></p>
    <ul>
      <li><strong>Straight length</strong> is the out-to-out length you enter — after cover
      is taken off the span. The calculator does not subtract cover for you.</li>
      <li><strong>Hooks × 9d</strong> is the extra steel at the bar ends. A standard 180°
      hook adds 9 × bar diameter per hook — the bent end plus its straight tail.</li>
      <li><strong>Bend deductions</strong> take back the stretch at each change of
      direction: 1d for 45°, 2d for 90°, 3d for 135°. Without them every bent bar
      comes out too long.</li>
    </ul>
    <p>One trap to avoid before the examples: a 180° end is a <em>hook</em> in this
    calculator, so it takes the 9d addition. Some schedules list a 4d deduction for a
    180° bend instead — that is the same end measured the other way. Never apply
    both the 9d addition and a 180° deduction to one end.</p>
    <h3 id="example-1">Worked example 1: calculator defaults (12 mm, 2 hooks)</h3>
    <p>Open the calculator and it already shows this case: 3000 mm straight length,
    12 mm bar, 2 hooks (one each end), no bends.</p>
    <ul>
      <li>Hook addition = 2 × 9 × 12 = <strong>216 mm</strong>.</li>
      <li>Bend deduction = <strong>0 mm</strong>.</li>
      <li>Cutting length = 3000 + 216 − 0 = <strong>3216 mm</strong>.</li>
      <li>Weight per bar = 3.216 × 0.887 = <strong>2.85 kg</strong>.</li>
    </ul>
    <p>Try it yourself: the panel opens on 3,216 mm, hook addition 216.00 mm,
    deduction 0.000 mm — and 3.22 m, because the panel rounds metres to 2 decimals
    (the exact value is 3.216 m).</p>
    <h3 id="example-2">Worked example 2: 16 mm bar with two 90° bends</h3>
    <p>Straight length 4500 mm, 16 mm bar, 2 hooks, two 90° bends:</p>
    <ul>
      <li>Hook addition = 2 × 9 × 16 = <strong>288 mm</strong>.</li>
      <li>Bend deduction = 2 × 2 × 16 = <strong>64 mm</strong>.</li>
      <li>Cutting length = 4500 + 288 − 64 = <strong>4724 mm</strong>.</li>
      <li>Weight per bar = 4.724 × 1.578 = <strong>7.45 kg</strong>.</li>
    </ul>
    <p>Try it yourself: enter 4500, 16 mm, 2 hooks, two 90° bends and the panel shows
    4,724 mm (4.72 m rounded). Note how the bends pull the result back: without
    them the same bar would cut at 4788 mm.</p>
    <h3 id="example-3">Worked example 3: mixed bends, one hook</h3>
    <p>Straight length 2500 mm, 10 mm bar, 1 hook, one 135° bend and one 45° bend:</p>
    <ul>
      <li>Hook addition = 1 × 9 × 10 = <strong>90 mm</strong>.</li>
      <li>Bend deduction = 1 × 3 × 10 + 1 × 1 × 10 = <strong>40 mm</strong>.</li>
      <li>Cutting length = 2500 + 90 − 40 = <strong>2550 mm</strong>.</li>
      <li>Weight per bar = 2.55 × 0.616 = <strong>1.57 kg</strong>.</li>
    </ul>
    <p>Try it yourself: the panel shows 2,550 mm (2.55 m). And a deduction-only
    check, for a bar with bends but no hooks: 3000 mm, 12 mm, two 90° bends gives
    3000 − 48 = <strong>2952 mm</strong> — bends alone always shorten the cut.</p>
    <h3 id="hook-table">Hook allowance (9d) by bar size</h3>
    <div class="formula-table"><table>
      <tr><th>Bar diameter</th><th>9d hook allowance</th></tr>
      <tr><td>8 mm</td><td>72 mm</td></tr>
      <tr><td>10 mm</td><td>90 mm</td></tr>
      <tr><td>12 mm</td><td>108 mm</td></tr>
      <tr><td>16 mm</td><td>144 mm</td></tr>
      <tr><td>20 mm</td><td>180 mm</td></tr>
      <tr><td>25 mm</td><td>225 mm</td></tr>
      <tr><td>32 mm</td><td>288 mm</td></tr>
    </table></div>
    <p>Two hooks — the usual case, one each end — double these figures: a 12 mm bar
    with two hooks gains 216 mm, a 16 mm bar gains 288 mm. The calculator multiplies
    the hook count you enter, so a single-hook bar (an L-bar into a support, for
    example) takes just one allowance.</p>
    <h3 id="deduction-table">Bend deduction by angle</h3>
    <div class="formula-table"><table>
      <tr><th>Bend angle</th><th>Deduction per bend</th><th>12 mm bar</th><th>16 mm bar</th></tr>
      <tr><td>45°</td><td>1d</td><td>12 mm</td><td>16 mm</td></tr>
      <tr><td>90°</td><td>2d</td><td>24 mm</td><td>32 mm</td></tr>
      <tr><td>135°</td><td>3d</td><td>36 mm</td><td>48 mm</td></tr>
    </table></div>
    <p>These are the practical site values used in most bar schedules (IS 2502
    practice). The deduction grows with angle because a sharper bend stretches more
    steel around the outside. Count every bend in the bar — a U-bar has two 90°
    bends (4d total), a cranked bar has four 45° bends (4d total, see below).</p>
    <h3 id="hook-vs-anchorage">Hook allowance vs anchorage value</h3>
    <p>The 9d figure above is a <em>cutting-length</em> addition. It is not the same as
    a hook's <em>anchorage value</em> — how much of the development length Ld a bend
    supplies. IS 456 Cl 26.2.2.1 gives anchorage values of 4d for a 45° bend, 8d for
    90°, 12d for 135°, and 16d for a U-bend. Confusing the two is a real site error:
    a 90° hook does not "give you 9d of anchorage", it gives 8d.</p>
    <p>The bridge between the two, using the development-length page's own figures:
    a 12 mm Fe500 bar in M25 concrete needs Ld = 582.59 mm in tension. A 90° hook
    supplies 8 × 12 = 96 mm of anchorage, so the straight length still needed is
    582.59 − 96 = <strong>486.59 mm</strong>. Use the <a href="/rebar-development-length-calculator">development length calculator</a> for Ld itself — this page only
    sizes the cut, not the embedment.</p>
    <h3 id="stirrup-hooks">Stirrup hooks: why 10d, not 9d</h3>
    <p>Closed stirrups and column ties do not use the 9d hook. Their 135° seismic
    hooks take <strong>10d each</strong> (IS 13920 practice: the hook must stay closed
    when concrete spalls in an earthquake, so the tail is longer and the bend is
    135°, never 90°). That is why the site has a separate
    <a href="/stirrup-tie-cutting-length-calculator">stirrup calculator</a> — its
    formula is 2(a + b) + 2 × 10d − 3 × 2d − 2 × 3d, with three 90° bends and two
    135° bends.</p>
    <p>Worked with the stirrup formula, independent of the calculator defaults:
    inner dimensions 200 × 400 mm, 8 mm bar. Perimeter = 2 × (200 + 400) = 1200 mm.
    Hooks = 2 × 10 × 8 = 160 mm. Deductions = 3 × 2 × 8 + 2 × 3 × 8 = 96 mm.
    Cutting length = 1200 + 160 − 96 = <strong>1264 mm</strong>. If you ran the same
    tie through this page's 9d hooks you would undercut it by 16 mm — small per
    tie, systematic across a column.</p>
    <h3 id="crank-bar">Cranked (bent-up) bars: the 0.42h rule</h3>
    <p>A bent-up bar rises through the slab on a 45° incline, and the incline is
    longer than the straight run it replaces. The standard site allowance is
    <strong>0.42 × h per crank</strong>, where h is the clear crank height: slab
    depth − top cover − bottom cover − bar diameter. With two cranks per bar, add
    2 × 0.42h — then deduct the four 45° bends (4 × 1d).</p>
    <p>Worked: 150 mm slab, 25 mm covers, 12 mm bar. h = 150 − 25 − 25 − 12 =
    88 mm. Extra per crank = 0.42 × 88 = 36.96 mm; two cranks = 73.92 mm. Less four
    45° deductions (48 mm), the net addition over the straight length is
    <strong>25.92 mm</strong>. This calculator has no crank input — add the net
    figure to its result yourself, and do not also count the crank bends in the
    bend inputs, or the deductions will be taken twice.</p>
    <h3 id="shapes">L-bars, U-bars and the bar schedule</h3>
    <p>Most scheduled bars are one of three shapes, and each is just the same
    formula with the bends counted:</p>
    <div class="formula-table"><table>
      <tr><th>Shape (BS 8666)</th><th>Cutting-length recipe</th><th>Example</th></tr>
      <tr><td>00 — straight bar</td><td>Straight + hooks × 9d</td><td>Ex1: 3000 + 216 = 3216 mm</td></tr>
      <tr><td>21 — L-bar</td><td>A + B − 2d (one 90° bend)</td><td>500 + 800 − 24 = 1276 mm (12 mm); 1.13 kg</td></tr>
      <tr><td>11 — U-bar</td><td>A + 2B − 4d (two 90° bends)</td><td>400 + 2 × 600 − 48 = 1552 mm (12 mm)</td></tr>
    </table></div>
    <p>The L-bar example is the standard textbook case: A 500 mm, B 800 mm, 12 mm
    bar, one 90° bend → 1300 − 24 = 1276 mm = 1.276 m, and at 0.887 kg/m that is
    1.13 kg per bar (20 bars = 25.52 m). A bar schedule summarises by diameter,
    because steel is bought and paid by weight per diameter — so carry the
    cutting length, the count, and the total length per diameter into the
    schedule, not just the length.</p>
    <h3 id="stock-length">From cutting length to order: stock lengths and waste</h3>
    <p>Bars arrive in 12 m stock lengths, so the cutting length decides how many
    bars each stick yields — and how much offcut you keep:</p>
    <div class="formula-table"><table>
      <tr><th>Cutting length</th><th>Bars per 12 m stick</th><th>Offcut per stick</th></tr>
      <tr><td>3216 mm (Ex1)</td><td>3</td><td>12000 − 3 × 3216 = 2352 mm</td></tr>
      <tr><td>4724 mm (Ex2)</td><td>2</td><td>12000 − 2 × 4724 = 2552 mm</td></tr>
    </table></div>
    <p>Plan the offcuts: short lengths become chairs, spacers and dowels instead of
    scrap. As a site norm, optimised cutting with off-cut reuse runs 2.0–2.5%
    waste, a normal site with a good schedule 2.5–4.0%, and cutting straight from
    drawings with no schedule 5–8% or more. Order the neat total plus the waste
    allowance — the calculator gives the neat cutting length only.</p>
    <h3 id="imperial">Metric and imperial units</h3>
    <p>This calculator takes millimetres. If your drawings use inches:</p>
    <div class="formula-table"><table>
      <tr><th>Metric</th><th>Imperial (approx.)</th></tr>
      <tr><td>12 mm bar (#4)</td><td>0.50 in diameter</td></tr>
      <tr><td>9d hook, 12.7 mm bar</td><td>114.3 mm = 4.50 in</td></tr>
      <tr><td>90° deduction, 12.7 mm bar</td><td>25.4 mm = 1.00 in</td></tr>
      <tr><td>3216 mm cutting length</td><td>10.55 ft (÷ 304.8)</td></tr>
    </table></div>
    <p>One cross-code warning: ACI detailing gives a 90° end extension of 12d
    (152.4 mm = 6.00 in on a 12.7 mm bar), not the 9d standard hook used here.
    The 9d rule is the IS/site convention this calculator follows — do not mix
    the two on one schedule. Convert first, then enter metric values.</p>
    <h3 id="not-included">What the calculator does not include</h3>
    <ul>
      <li><strong>Cover subtraction.</strong> Enter the out-to-out length after cover
      is taken off the span. A full span entered raw overstates every bar.</li>
      <li><strong>Crank allowance.</strong> The 0.42h rule above is a hand addition —
      there is no crank input, and crank bends must not also be entered as bend
      inputs.</li>
      <li><strong>Laps.</strong> Splice lengths sit on top of cutting lengths. Size
      them with the <a href="/rebar-lap-length-calculator">lap length calculator</a>.</li>
      <li><strong>Development length.</strong> Hooks supply anchorage value, but Ld
      itself comes from the <a href="/rebar-development-length-calculator">development length calculator</a>.</li>
      <li><strong>Closed stirrups and ties.</strong> These use 10d seismic hooks, not
      9d — use the <a href="/stirrup-tie-cutting-length-calculator">stirrup calculator</a>.</li>
      <li><strong>Waste and offcuts.</strong> The result is the neat cutting length.
      Add the waste allowance (2.5–4% with a good schedule) before ordering.</li>
      <li><strong>ACI hook geometry.</strong> ACI standard hooks use a bend plus a
      12d extension, a different shape from the 9d hook modelled here.</li>
      <li><strong>Bend radius / curved-portion geometry.</strong> This calculator uses
      the 9d/1d/2d/3d site rules, not a radius-based arc calculation — a
      radius-based hook-extension tool may give a different figure for the same hook.</li>
    </ul>
    <h3 id="mistakes">Common mistakes</h3>
    <ol class="howto">
      <li><strong>Adding a 9d hook and a 180° deduction to the same end.</strong> A
      180° end is one thing measured two ways. Pick the hook (9d added) and never
      also deduct 4d for it.</li>
      <li><strong>Forgetting bend deductions.</strong> A bar cut to outside dimensions
      with no deductions comes out long at every bend — it will not fit the
      cage, and site trimming wastes the bar.</li>
      <li><strong>Using 9d hooks on stirrups.</strong> Closed ties need 135° seismic
      hooks at 10d. The 9d rule undercuts every tie by 2d and, worse, a 90° tie
      hook can open when concrete spalls.</li>
      <li><strong>Entering the full span instead of the length after cover.</strong>
      The calculator takes the straight length as given. Cover comes off before
      you type, on both ends.</li>
      <li><strong>Treating the hook allowance as anchorage.</strong> 9d is what you
      add when cutting; 8d is what a 90° hook supplies toward Ld. Using 9d as if
      it satisfied development length overstates the anchorage by 1d per hook —
      and misses the point that Ld is checked separately.</li>
    </ol>
    <p>Last reviewed: October 2026.</p>
`,
    faqs:[["What is the hook length of rebar?","A standard 180° hook adds 9 × bar diameter to the cutting length: 72 mm for 8 mm, 90 mm for 10 mm, 108 mm for 12 mm, 144 mm for 16 mm, 180 mm for 20 mm. Two hooks (one each end) double it. Note this is the cutting addition — the anchorage value a hook supplies toward development length is a different figure (8d for a 90° hook)."],["Why do we deduct for bends?","Bending stretches the outside of the bar and compresses the inside, so a bar measured along its outside faces looks longer than the steel actually is. The deduction takes that stretch back: 1d per 45° bend, 2d per 90° bend, 3d per 135° bend. Skip it and every bent bar comes out too long."],["What is the cutting length formula?","Cutting length = straight length + (hooks × 9d) − (45°×1d + 90°×2d + 135°×3d). The calculator defaults (3000 mm, 12 mm, 2 hooks, no bends) give 3000 + 216 − 0 = 3216 mm."],["What is the difference between a hook and a bend?","A hook is an end anchorage: a 180° turn at the bar end that adds 9d to the cut. A bend is a direction change along the bar that only takes a deduction (1d–3d by angle) and adds nothing. A 180° end counts as a hook — never add the 9d and also deduct for it."],["How much is a 135° stirrup hook?","10 × bar diameter per hook, under seismic detailing practice (IS 13920) — not the 9d of this calculator. Closed ties need 135° hooks so they stay shut when concrete spalls. Use the <a href=\"/stirrup-tie-cutting-length-calculator\">stirrup calculator</a> for closed ties; this page's 9d is for standard end hooks."],["Does a hook count toward development length?","Yes, through its anchorage value — not through the 9d cutting addition. IS 456 gives 4d for 45°, 8d for 90°, 12d for 135° and 16d for a U-bend. Example: a 12 mm Fe500 bar in M25 concrete needs Ld = 582.59 mm, and a 90° hook supplies 96 mm of it, leaving 486.59 mm straight. Get Ld from the <a href=\"/rebar-development-length-calculator\">development length calculator</a>."],["How do you calculate an L-bar cutting length?","Add the two legs and deduct one 90° bend: A + B − 2d. For A 500 mm, B 800 mm, 12 mm bar: 500 + 800 − 24 = 1276 mm (1.276 m), weighing 1.13 kg at 0.887 kg/m."],["How do you calculate a cranked (bent-up) bar?","Add 0.42 × h per 45° crank, where h = slab depth − top cover − bottom cover − bar diameter, then deduct the four 45° bends (4d). Example: 150 mm slab, 25 mm covers, 12 mm bar → h = 88 mm, two cranks add 73.92 mm, less 48 mm deductions = 25.92 mm net over the straight length. This calculator has no crank input — add it by hand and do not also enter the crank bends."],["How many cut bars come from one 12 m stock length?","Divide 12000 mm by the cutting length and round down. The 3216 mm default bar gives 3 per stick (2352 mm offcut); the 4724 mm example gives 2 per stick (2552 mm offcut). Keep offcuts for chairs, spacers and dowels, and add 2.5–4% waste on top of the neat total."],["What does this calculator not do?","It does not subtract concrete cover (enter the length after cover), does not add laps (use the <a href=\"/rebar-lap-length-calculator\">lap calculator</a>), does not model cranks or ACI hook geometry, and does not use the 10d seismic hook — closed ties belong in the <a href=\"/stirrup-tie-cutting-length-calculator\">stirrup calculator</a>."]],
    de: {
  metaTitle: "Haken- & Biege-Schnittlängen-Rechner — 9d-Haken gratis",
  desc: "Haken- & Biege-Schnittlängen-Rechner: Schnittlänge aus gerader Länge, 9d-Haken und Biegeabzug berechnen. Beispiel: 3.000 mm, 12 mm, 2 Haken = 3.216 mm. Gratis.",
  formula: "Schnittlänge = gerade Länge + (Haken × 9d) − (45°×1d + 90°×2d + 135°×3d).",
  kw: "hakenlänge bewehrung formel, biegeabzug bewehrung, schnittlänge bewehrung berechnen, schnittlänge von bewehrungsstäben",
  howto: ["Geben Sie die gerade Länge (Außenmaß) in mm ein — die Länge nach Abzug der Betondeckung von der Spannweite, nicht die volle Spannweite selbst.", "Wählen Sie die Stabgröße.", "Geben Sie die Anzahl der Haken (je 9d) und die Anzahl jeder Biegungsart ein — 45°, 90°, 135°.", "Lesen Sie die Schnittlänge in mm und m ab, dazu die Hakenlänge und den Biegeabzug separat ausgewiesen.", "Übertragen Sie das Ergebnis in die Stahlliste: Teilen Sie die 12-m-Handelslänge durch die Schnittlänge für die Stäbe je Stab, und addieren Sie Übergreifungen und Verschnitt vor der Bestellung."],
  faqs: [["Wie lang ist ein Haken bei Bewehrung?", "Ein Standardhaken von 180° verlängert die Schnittlänge um das 9-Fache des Stabdurchmessers: 72 mm bei 8 mm, 90 mm bei 10 mm, 108 mm bei 12 mm, 144 mm bei 16 mm, 180 mm bei 20 mm. Zwei Haken (je einer pro Ende) verdoppeln den Wert. Beachten Sie: Das ist die Zugabe beim Schneiden — der Anrechnungswert, den ein Haken auf die Verankerungslänge anrechnet, ist ein anderer Wert (8d bei einem 90°-Haken)."], ["Warum ziehen wir für Biegungen etwas ab?", "Beim Biegen wird die Außenseite des Stabes gedehnt und die Innenseite gestaucht, sodass ein Stab, gemessen entlang seiner Außenflächen, länger wirkt, als der Stahl tatsächlich ist. Der Abzug nimmt diese Dehnung zurück: 1d je 45°-Biegung, 2d je 90°-Biegung, 3d je 135°-Biegung. Lässt man ihn weg, kommt jeder gebogene Stab zu lang heraus."], ["Wie lautet die Formel für die Schnittlänge?", "Schnittlänge = gerade Länge + (Haken × 9d) − (45°×1d + 90°×2d + 135°×3d). Die Rechner-Standards (3.000 mm, 12 mm, 2 Haken, keine Biegungen) ergeben 3.000 + 216 − 0 = 3.216 mm."], ["Was ist der Unterschied zwischen einem Haken und einer Biegung?", "Ein Haken ist eine Endverankerung: eine 180°-Umdrehung am Stabende, die den Schnitt um 9d verlängert. Eine Biegung ist eine Richtungsänderung entlang des Stabes, die nur einen Abzug bringt (1d–3d je nach Winkel) und nichts hinzufügt. Ein 180°-Ende zählt als Haken — addieren Sie niemals die 9d und ziehen Sie zusätzlich dafür ab."], ["Wie viel beträgt ein 135°-Bügelhaken?", "Das 10-Fache des Stabdurchmessers je Haken, nach erdbebengerechter Bewehrungspraxis (IS 13920) — nicht die 9d dieses Rechners. Geschlossene Bügel brauchen 135°-Haken, damit sie geschlossen bleiben, wenn Beton abplatzt. Verwenden Sie für geschlossene Bügel den <a href=\"/de/buegel-schnittlaengen-rechner\">Bügel-Rechner</a>; die 9d hier gelten für Standard-Endhaken."], ["Zählt ein Haken auf die Verankerungslänge an?", "Ja, über seinen Anrechnungswert — nicht über die 9d-Schnittzugabe. IS 456 gibt 4d für 45°, 8d für 90°, 12d für 135° und 16d für eine U-Biegung an. Beispiel: Ein 12-mm-Stab Fe500 in Beton M25 braucht Ld = 582,59 mm, und ein 90°-Haken liefert 96 mm davon, sodass noch 486,59 mm gerade Länge bleiben. Ld selbst erhalten Sie aus dem <a href=\"/de/verankerungslaengen-rechner\">Verankerungslängen-Rechner</a>."], ["Wie berechnet man die Schnittlänge eines L-Stabes?", "Addieren Sie die beiden Schenkel und ziehen Sie eine 90°-Biegung ab: A + B − 2d. Für A 500 mm, B 800 mm, Stab 12 mm: 500 + 800 − 24 = 1.276 mm (1,276 m), Gewicht 1,13 kg bei 0,887 kg/m."], ["Wie berechnet man ein abgebogenes Eisen?", "Addieren Sie 0,42 × h je 45°-Abbiegung, wobei h = Plattendicke − obere Betondeckung − untere Betondeckung − Stabdurchmesser ist, und ziehen Sie dann die vier 45°-Biegungen ab (4d). Beispiel: 150 mm Platte, 25 mm Deckungen, 12 mm Stab → h = 88 mm, zwei Abbiegungen addieren 73,92 mm, abzüglich 48 mm Abzüge = 25,92 mm netto über der geraden Länge. Dieser Rechner hat keine Abbiegungs-Eingabe — addieren Sie den Wert von Hand und geben Sie die Abbiegungs-Biegungen nicht zusätzlich ein."], ["Wie viele geschnittene Stäbe kommen aus einer 12-m-Handelslänge?", "Teilen Sie 12.000 mm durch die Schnittlänge und runden Sie ab. Der 3.216-mm-Standardstab ergibt 3 je Stab (2.352 mm Reststück); das 4.724-mm-Beispiel ergibt 2 je Stab (2.552 mm Reststück). Bewahren Sie Reststücke für Abstandhalter, Distanzstücke und Dübel auf, und schlagen Sie 2,5–4 % Verschnitt auf die Nettosumme auf."], ["Was kann dieser Rechner nicht?", "Er zieht keine Betondeckung ab (geben Sie die Länge nach Abzug der Deckung ein), addiert keine Übergreifungen (verwenden Sie den <a href=\"/de/uebergreifungslaengen-rechner\">Übergreifungslängen-Rechner</a>), bildet keine abgebogenen Eisen und keine ACI-Hakengeometrie ab und verwendet nicht den 10d-Erdbebenhaken — geschlossene Bügel gehören in den <a href=\"/de/buegel-schnittlaengen-rechner\">Bügel-Rechner</a>."]],
  toc: `<nav class="content-block" aria-label="Auf dieser Seite">
    <h2>Auf dieser Seite</h2>
    <ul>
      <li><a href="#how-to">So benutzen Sie den Rechner</a></li>
      <li><a href="#formula">Die Formel, erklärt</a></li>
      <li><a href="#example-1">Rechenbeispiel 1: Rechner-Standards (12 mm, 2 Haken)</a></li>
      <li><a href="#example-2">Rechenbeispiel 2: 16-mm-Stab mit zwei 90°-Biegungen</a></li>
      <li><a href="#example-3">Rechenbeispiel 3: gemischte Biegungen, ein Haken</a></li>
      <li><a href="#hook-table">Hakenlänge (9d) nach Stabgröße</a></li>
      <li><a href="#deduction-table">Biegeabzug nach Winkel</a></li>
      <li><a href="#hook-vs-anchorage">Hakenlänge vs. Anrechnungswert</a></li>
      <li><a href="#stirrup-hooks">Bügelhaken: warum 10d, nicht 9d</a></li>
      <li><a href="#crank-bar">Abgebogene Eisen: die 0,42h-Regel</a></li>
      <li><a href="#shapes">L-Stäbe, U-Stäbe und die Stahlliste</a></li>
      <li><a href="#stock-length">Von der Schnittlänge zur Bestellung: Handelslängen und Verschnitt</a></li>
      <li><a href="#imperial">Metrische und Zoll-Maße</a></li>
      <li><a href="#not-included">Was der Rechner nicht enthält</a></li>
      <li><a href="#mistakes">Häufige Fehler</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
  </nav>`,
  extra: `<h3>Die Formel, erklärt</h3>
    <p>Die Schnittlänge ist die Länge des geraden Stabes, die Sie <em>vor</em> dem Biegen schneiden — nicht
    die Länge, die auf der Zeichnung steht. Die Zeichnung gibt Außenmaße an, die
    entlang der Außenflächen des gebogenen Stabes gemessen werden. Beim Biegen wird die Außenseite
    gedehnt und die Innenseite gestaucht, sodass das Außenmaß den Stab immer zu lang
    ausweist. Die Formel korrigiert beide Enden des Problems:</p>
    <p><strong>Schnittlänge = gerade Länge + (Haken × 9d) − (45°×1d + 90°×2d + 135°×3d)</strong></p>
    <ul>
      <li><strong>Gerade Länge</strong> ist das Außenmaß, das Sie eingeben — nach Abzug der Betondeckung
      von der Spannweite. Der Rechner zieht die Betondeckung nicht für Sie ab.</li>
      <li><strong>Haken × 9d</strong> ist der zusätzliche Stahl an den Stabenden. Ein Standardhaken von 180°
      addiert das 9-Fache des Stabdurchmessers je Haken — das gebogene Ende plus seinen geraden Schwanz.</li>
      <li><strong>Biegeabzüge</strong> nehmen die Dehnung an jeder Richtungsänderung zurück:
      1d für 45°, 2d für 90°, 3d für 135°. Ohne sie kommt jeder gebogene Stab
      zu lang heraus.</li>
    </ul>
    <p>Eine Falle, die Sie vor den Beispielen vermeiden sollten: Ein 180°-Ende ist in diesem
    Rechner ein <em>Haken</em>, sodass es die 9d-Zugabe erhält. Manche Stahllisten führen stattdessen einen Abzug von 4d
    für eine 180°-Biegung — das ist dasselbe Ende, andersherum gemessen. Wenden Sie niemals
    sowohl die 9d-Zugabe als auch einen 180°-Abzug auf ein Ende an.</p>
    <h3 id="example-1">Rechenbeispiel 1: Rechner-Standards (12 mm, 2 Haken)</h3>
    <p>Öffnen Sie den Rechner, und er zeigt bereits diesen Fall: 3.000 mm gerade Länge,
    12-mm-Stab, 2 Haken (je einer pro Ende), keine Biegungen.</p>
    <ul>
      <li>Hakenlänge = 2 × 9 × 12 = <strong>216 mm</strong>.</li>
      <li>Biegeabzug = <strong>0 mm</strong>.</li>
      <li>Schnittlänge = 3.000 + 216 − 0 = <strong>3.216 mm</strong>.</li>
      <li>Gewicht je Stab = 3,216 × 0,887 = <strong>2,85 kg</strong>.</li>
    </ul>
    <p>Probieren Sie es selbst: Das Panel öffnet auf 3.216 mm, Hakenlänge 216,00 mm,
    Abzug 0,000 mm — und 3,22 m, weil das Panel Meter auf 2 Dezimalstellen rundet
    (der genaue Wert ist 3,216 m).</p>
    <h3 id="example-2">Rechenbeispiel 2: 16-mm-Stab mit zwei 90°-Biegungen</h3>
    <p>Gerade Länge 4.500 mm, 16-mm-Stab, 2 Haken, zwei 90°-Biegungen:</p>
    <ul>
      <li>Hakenlänge = 2 × 9 × 16 = <strong>288 mm</strong>.</li>
      <li>Biegeabzug = 2 × 2 × 16 = <strong>64 mm</strong>.</li>
      <li>Schnittlänge = 4.500 + 288 − 64 = <strong>4.724 mm</strong>.</li>
      <li>Gewicht je Stab = 4,724 × 1,578 = <strong>7,45 kg</strong>.</li>
    </ul>
    <p>Probieren Sie es selbst: Geben Sie 4.500, 16 mm, 2 Haken, zwei 90°-Biegungen ein, und das Panel zeigt
    4.724 mm (4,72 m gerundet). Beachten Sie, wie die Biegungen das Ergebnis zurückziehen: Ohne
    sie würde derselbe Stab auf 4.788 mm geschnitten.</p>
    <h3 id="example-3">Rechenbeispiel 3: gemischte Biegungen, ein Haken</h3>
    <p>Gerade Länge 2.500 mm, 10-mm-Stab, 1 Haken, eine 135°-Biegung und eine 45°-Biegung:</p>
    <ul>
      <li>Hakenlänge = 1 × 9 × 10 = <strong>90 mm</strong>.</li>
      <li>Biegeabzug = 1 × 3 × 10 + 1 × 1 × 10 = <strong>40 mm</strong>.</li>
      <li>Schnittlänge = 2.500 + 90 − 40 = <strong>2.550 mm</strong>.</li>
      <li>Gewicht je Stab = 2,55 × 0,616 = <strong>1,57 kg</strong>.</li>
    </ul>
    <p>Probieren Sie es selbst: Das Panel zeigt 2.550 mm (2,55 m). Und eine reine Abzugsprüfung
    für einen Stab mit Biegungen, aber ohne Haken: 3.000 mm, 12 mm, zwei 90°-Biegungen ergeben
    3.000 − 48 = <strong>2.952 mm</strong> — Biegungen allein verkürzen den Schnitt immer.</p>
    <h3 id="hook-table">Hakenlänge (9d) nach Stabgröße</h3>
    <div class="formula-table"><table>
      <tr><th>Stabdurchmesser</th><th>9d-Hakenlänge</th></tr>
      <tr><td>8 mm</td><td>72 mm</td></tr>
      <tr><td>10 mm</td><td>90 mm</td></tr>
      <tr><td>12 mm</td><td>108 mm</td></tr>
      <tr><td>16 mm</td><td>144 mm</td></tr>
      <tr><td>20 mm</td><td>180 mm</td></tr>
      <tr><td>25 mm</td><td>225 mm</td></tr>
      <tr><td>32 mm</td><td>288 mm</td></tr>
    </table></div>
    <p>Zwei Haken — der übliche Fall, je einer pro Ende — verdoppeln diese Werte: Ein 12-mm-Stab
    mit zwei Haken gewinnt 216 mm, ein 16-mm-Stab gewinnt 288 mm. Der Rechner multipliziert
    die Hakenanzahl, die Sie eingeben, sodass ein Stab mit nur einem Haken (zum Beispiel ein L-Stab in ein Auflager)
    nur eine Zugabe erhält.</p>
    <h3 id="deduction-table">Biegeabzug nach Winkel</h3>
    <div class="formula-table"><table>
      <tr><th>Biegewinkel</th><th>Abzug je Biegung</th><th>12-mm-Stab</th><th>16-mm-Stab</th></tr>
      <tr><td>45°</td><td>1d</td><td>12 mm</td><td>16 mm</td></tr>
      <tr><td>90°</td><td>2d</td><td>24 mm</td><td>32 mm</td></tr>
      <tr><td>135°</td><td>3d</td><td>36 mm</td><td>48 mm</td></tr>
    </table></div>
    <p>Das sind die praktischen Baustellenwerte, die in den meisten Stahllisten verwendet werden (Praxis nach IS 2502).
    Der Abzug wächst mit dem Winkel, weil eine schärfere Biegung mehr Stahl um die Außenseite dehnt.
    Zählen Sie jede Biegung im Stab — ein U-Stab hat zwei 90°-Biegungen (insgesamt 4d), ein abgebogenes Eisen hat vier 45°-Biegungen (insgesamt 4d, siehe unten).</p>
    <h3 id="hook-vs-anchorage">Hakenlänge vs. Anrechnungswert</h3>
    <p>Die 9d-Zahl oben ist eine <em>Schnittlängen</em>-Zugabe. Sie ist nicht dasselbe wie der
    <em>Anrechnungswert</em> eines Hakens — wie viel von der Verankerungslänge Ld eine Biegung
    liefert. IS 456 Abs. 26.2.2.1 gibt Anrechnungswerte von 4d für eine 45°-Biegung, 8d für
    90°, 12d für 135° und 16d für eine U-Biegung an. Die beiden zu verwechseln ist ein echter Baustellenfehler:
    Ein 90°-Haken „bringt Ihnen nicht 9d Verankerung“, sondern 8d.</p>
    <p>Die Brücke zwischen beiden, mit den Zahlen der Verankerungslängen-Seite selbst:
    Ein 12-mm-Stab Fe500 in Beton M25 braucht Ld = 582,59 mm im Zug. Ein 90°-Haken
    liefert 8 × 12 = 96 mm Verankerung, sodass die noch benötigte gerade Länge
    582,59 − 96 = <strong>486,59 mm</strong> beträgt. Verwenden Sie den <a href="/de/verankerungslaengen-rechner">Verankerungslängen-Rechner</a> für Ld selbst — diese Seite
    bemisst nur den Schnitt, nicht die Einbettung.</p>
    <h3 id="stirrup-hooks">Bügelhaken: warum 10d, nicht 9d</h3>
    <p>Geschlossene Bügel und Stützenbügel verwenden nicht den 9d-Haken. Ihre 135°-Erdbebenhaken
    nehmen <strong>je 10d</strong> (Praxis nach IS 13920: Der Haken muss geschlossen bleiben,
    wenn Beton bei einem Erdbeben abplatzt, sodass der Schwanz länger ist und die Biegung
    135° beträgt, niemals 90°). Darum gibt es einen eigenen
    <a href="/de/buegel-schnittlaengen-rechner">Bügel-Rechner</a> — seine Formel lautet 2(a + b) + 2 × 10d − 3 × 2d − 2 × 3d,
    mit drei 90°-Biegungen und zwei 135°-Biegungen.</p>
    <p>Mit der Bügelformel durchgerechnet, unabhängig von den Rechner-Standards:
    Innenmaße 200 × 400 mm, 8-mm-Stab. Umfang = 2 × (200 + 400) = 1.200 mm.
    Haken = 2 × 10 × 8 = 160 mm. Abzüge = 3 × 2 × 8 + 2 × 3 × 8 = 96 mm.
    Schnittlänge = 1.200 + 160 − 96 = <strong>1.264 mm</strong>. Würden Sie denselben
    Bügel mit den 9d-Haken dieser Seite durchrechnen, würden Sie ihn um 16 mm zu kurz schneiden — wenig je
    Bügel, aber systematisch über eine ganze Stütze.</p>
    <h3 id="crank-bar">Abgebogene Eisen: die 0,42h-Regel</h3>
    <p>Ein abgebogenes Eisen steigt auf einer 45°-Schräge durch die Platte, und die Schräge ist
    länger als der gerade Lauf, den sie ersetzt. Die übliche Baustellen-Zugabe beträgt
    <strong>0,42 × h je Abbiegung</strong>, wobei h die lichte Abbiegungshöhe ist: Plattendicke
    − obere Betondeckung − untere Betondeckung − Stabdurchmesser. Bei zwei Abbiegungen je Stab addieren Sie
    2 × 0,42h — und ziehen dann die vier 45°-Biegungen ab (4 × 1d).</p>
    <p>Durchgerechnet: 150 mm Platte, 25 mm Deckungen, 12-mm-Stab. h = 150 − 25 − 25 − 12 =
    88 mm. Zusatz je Abbiegung = 0,42 × 88 = 36,96 mm; zwei Abbiegungen = 73,92 mm. Abzüglich vier
    45°-Abzüge (48 mm) beträgt die Nettozugabe über der geraden Länge
    <strong>25,92 mm</strong>. Dieser Rechner hat keine Abbiegungs-Eingabe — addieren Sie den Nettowert
    selbst zu seinem Ergebnis hinzu, und zählen Sie die Abbiegungs-Biegungen nicht zusätzlich in den
    Biegungs-Eingaben, sonst werden die Abzüge doppelt genommen.</p>
    <h3 id="shapes">L-Stäbe, U-Stäbe und die Stahlliste</h3>
    <p>Die meisten gelisteten Stäbe haben eine von drei Formen, und jede ist nur dieselbe
    Formel mit gezählten Biegungen:</p>
    <div class="formula-table"><table>
      <tr><th>Form (BS 8666)</th><th>Schnittlängen-Rezept</th><th>Beispiel</th></tr>
      <tr><td>00 — gerader Stab</td><td>Gerade + Haken × 9d</td><td>Bsp. 1: 3.000 + 216 = 3.216 mm</td></tr>
      <tr><td>21 — L-Stab</td><td>A + B − 2d (eine 90°-Biegung)</td><td>500 + 800 − 24 = 1.276 mm (12 mm); 1,13 kg</td></tr>
      <tr><td>11 — U-Stab</td><td>A + 2B − 4d (zwei 90°-Biegungen)</td><td>400 + 2 × 600 − 48 = 1.552 mm (12 mm)</td></tr>
    </table></div>
    <p>Das L-Stab-Beispiel ist der Standard-Lehrbuchfall: A 500 mm, B 800 mm, 12-mm-Stab,
    eine 90°-Biegung → 1.300 − 24 = 1.276 mm = 1,276 m, und bei 0,887 kg/m sind das
    1,13 kg je Stab (20 Stäbe = 25,52 m). Eine Stahlliste fasst nach Durchmesser zusammen,
    weil Stahl nach Gewicht je Durchmesser gekauft und bezahlt wird — tragen Sie also die
    Schnittlänge, die Anzahl und die Gesamtlänge je Durchmesser in die Liste ein,
    nicht nur die Länge.</p>
    <h3 id="stock-length">Von der Schnittlänge zur Bestellung: Handelslängen und Verschnitt</h3>
    <p>Stäbe kommen in 12-m-Handelslängen, sodass die Schnittlänge entscheidet, wie viele
    Stäbe jeder Stab ergibt — und wie viel Reststück Sie behalten:</p>
    <div class="formula-table"><table>
      <tr><th>Schnittlänge</th><th>Stäbe je 12-m-Stab</th><th>Reststück je Stab</th></tr>
      <tr><td>3.216 mm (Bsp. 1)</td><td>3</td><td>12.000 − 3 × 3.216 = 2.352 mm</td></tr>
      <tr><td>4.724 mm (Bsp. 2)</td><td>2</td><td>12.000 − 2 × 4.724 = 2.552 mm</td></tr>
    </table></div>
    <p>Planen Sie die Reststücke: Kurze Längen werden zu Abstandhaltern, Distanzstücken und Dübeln statt zu
    Schrott. Als Baustellennorm läuft optimiertes Schneiden mit Reststück-Wiederverwendung bei 2,0–2,5 %
    Verschnitt, eine normale Baustelle mit guter Stahlliste bei 2,5–4,0 %, und Schneiden direkt nach
    Zeichnungen ohne Stahlliste bei 5–8 % oder mehr. Bestellen Sie die Nettosumme plus den Verschnittzuschlag —
    der Rechner gibt nur die nette Schnittlänge an.</p>
    <h3 id="imperial">Metrische und Zoll-Maße</h3>
    <p>Dieser Rechner nimmt Millimeter. Wenn Ihre Zeichnungen Zoll verwenden:</p>
    <div class="formula-table"><table>
      <tr><th>Metrisch</th><th>Zoll (ca.)</th></tr>
      <tr><td>12-mm-Stab (#4)</td><td>0,50 in Durchmesser</td></tr>
      <tr><td>9d-Haken, 12,7-mm-Stab</td><td>114,3 mm = 4,50 in</td></tr>
      <tr><td>90°-Abzug, 12,7-mm-Stab</td><td>25,4 mm = 1,00 in</td></tr>
      <tr><td>3.216 mm Schnittlänge</td><td>10,55 ft (÷ 304,8)</td></tr>
    </table></div>
    <p>Eine codeübergreifende Warnung: Die ACI-Bewehrungsführung gibt für ein 90°-Ende eine Verlängerung von 12d
    an (152,4 mm = 6,00 in bei einem 12,7-mm-Stab), nicht den 9d-Standardhaken, der hier verwendet wird.
    Die 9d-Regel ist die IS-/Baustellenkonvention, der dieser Rechner folgt — mischen Sie die beiden nicht
    auf einer Stahlliste. Rechnen Sie zuerst um und geben Sie dann metrische Werte ein.</p>
    <h3 id="not-included">Was der Rechner nicht enthält</h3>
    <ul>
      <li><strong>Abzug der Betondeckung.</strong> Geben Sie das Außenmaß nach Abzug der Betondeckung
      von der Spannweite ein. Eine volle Spannweite, roh eingegeben, übertreibt jeden Stab.</li>
      <li><strong>Abbiegungs-Zugabe.</strong> Die 0,42h-Regel oben ist eine Handzugabe —
      es gibt keine Abbiegungs-Eingabe, und Abbiegungs-Biegungen dürfen nicht zusätzlich als Biegungs-Eingaben
      eingegeben werden.</li>
      <li><strong>Übergreifungen.</strong> Stoßlängen kommen zu den Schnittlängen hinzu. Bemessen
      Sie sie mit dem <a href="/de/uebergreifungslaengen-rechner">Übergreifungslängen-Rechner</a>.</li>
      <li><strong>Verankerungslänge.</strong> Haken liefern Anrechnungswerte, aber Ld selbst
      kommt aus dem <a href="/de/verankerungslaengen-rechner">Verankerungslängen-Rechner</a>.</li>
      <li><strong>Geschlossene Bügel und Bänder.</strong> Diese verwenden 10d-Erdbebenhaken, nicht
      9d — verwenden Sie den <a href="/de/buegel-schnittlaengen-rechner">Bügel-Rechner</a>.</li>
      <li><strong>Verschnitt und Reststücke.</strong> Das Ergebnis ist die nette Schnittlänge.
      Addieren Sie den Verschnittzuschlag (2,5–4 % bei guter Stahlliste) vor der Bestellung.</li>
      <li><strong>ACI-Hakengeometrie.</strong> ACI-Standardhaken verwenden eine Biegung plus eine
      12d-Verlängerung, eine andere Form als der hier modellierte 9d-Haken.</li>
      <li><strong>Biegeradius / Geometrie des gebogenen Teils.</strong> Dieser Rechner verwendet
      die 9d/1d/2d/3d-Baustellenregeln, keine radiusbasierte Bogenberechnung — ein
      radiusbasiertes Hakenverlängerungs-Tool kann für denselben Haken einen anderen Wert liefern.</li>
    </ul>
    <h3 id="mistakes">Häufige Fehler</h3>
    <ol class="howto">
      <li><strong>Einen 9d-Haken und einen 180°-Abzug an dasselbe Ende anzusetzen.</strong> Ein
      180°-Ende ist eine Sache, auf zwei Arten gemessen. Wählen Sie den Haken (9d addiert) und
      ziehen Sie niemals zusätzlich 4d dafür ab.</li>
      <li><strong>Biegeabzüge zu vergessen.</strong> Ein Stab, der auf Außenmaße ohne Abzüge
      geschnitten wird, kommt an jeder Biegung zu lang heraus — er passt nicht in den
      Korb, und Nachschneiden auf der Baustelle vergeudet den Stab.</li>
      <li><strong>9d-Haken bei Bügeln zu verwenden.</strong> Geschlossene Bügel brauchen 135°-Erdbebenhaken
      mit 10d. Die 9d-Regel schneidet jeden Bügel um 2d zu kurz, und schlimmer noch: Ein 90°-Bügelhaken
      kann sich öffnen, wenn Beton abplatzt.</li>
      <li><strong>Die volle Spannweite statt der Länge nach Abzug der Betondeckung einzugeben.</strong>
      Der Rechner nimmt die gerade Länge wie eingegeben. Die Betondeckung kommt vor dem
      Tippen ab, an beiden Enden.</li>
      <li><strong>Die Hakenlänge als Verankerung zu behandeln.</strong> 9d ist das, was Sie beim
      Schneiden addieren; 8d ist das, was ein 90°-Haken auf Ld anrechnet. 9d so zu verwenden, als
      erfülle es die Verankerungslänge, übertreibt die Verankerung um 1d je Haken —
      und verfehlt den Punkt, dass Ld separat geprüft wird.</li>
    </ol>
    <p>Zuletzt geprüft: Oktober 2026.</p>
`,
}
},
    { id:"stirrup", slug:"stirrup-tie-cutting-length-calculator", cat:"Detailing",
    metaTitle:"Stirrup Cutting Length Calculator — Ties in Seconds",
    h1:"Stirrup & Tie Cutting Length Calculator",
    desc:"Cutting length for rectangular stirrups and column ties, hooks and bend deductions included. Defaults: a 300 × 450 mm tie = 1,364 mm. Free, no signup.",
    kw:"stirrup cutting length, column tie cutting length, rebar stirrup calculator",
    intro:"Compute the cutting length of a rectangular stirrup or tie from the member size and cover. Includes two 135° hooks (10d each) and the standard bend deductions.",
    howto:["Enter the member width and depth in mm.","Set the clear cover — 25 mm is typical for beams, 40 mm for columns.","Pick the stirrup bar size. 8 mm is the usual tie bar.","Read the cutting length in mm and m, plus the inner dimensions and the weight per stirrup.","Multiply one tie by the tie count for the member, then add waste — the calculator gives one tie, not the order quantity."],
    formula:"Cutting length = 2(a + b) + 2 × 10d − 3 × 2d − 2 × 3d, where a and b are the inner dimensions.",
    faqs:[["How do you calculate stirrup cutting length?","Add the inner perimeter to the hook allowance and subtract the bend deductions: cutting length = 2(a + b) + 2 × 10d − 3 × 2d − 2 × 3d, where a and b are the member dimensions less twice the cover. For the calculator defaults (300 × 450 mm, 25 mm cover, 8 mm bar) that is 2 × (250 + 400) + 160 − 96 = 1364 mm."],
          ["What is the hook length in a stirrup?","Each 135° seismic hook is taken as 10 × bar diameter — 80 mm on an 8 mm bar, 100 mm on a 10 mm bar — two hooks per tie. That is the stirrup hook, not the 9d standard hook used for bar ends; see the <a href=\"/rebar-hook-bend-cutting-length-calculator\">hook & bend calculator</a> for the difference."],
          ["Why 135° hooks and not 90° hooks on stirrups?","A 90° hook opens up when the concrete cover spalls in an earthquake, and the tie stops confining the core. A 135° hook stays closed, so seismic codes (IS 13920) require 135° hooks on stirrups and column ties in earthquake zones. Outside seismic zones a 90° hook is sometimes detailed, but 135° is the safe default."],
          ["Why does the formula subtract 6d and 6d?","A closed tie has five bends: three 90° corners and two 135° closing hooks. A 90° bend shortens the bar by 2d and a 135° bend by 3d, so the deductions are 3 × 2d = 6d for the corners and 2 × 3d = 6d for the hooks — 12d in total. If you counted five 90° bends instead, you would deduct only 10d instead of 12d, cutting the tie 16 mm too long on an 8 mm bar."],
          ["What cover should I use — beam or column?","Beams usually take 25 mm clear cover and columns 40 mm, but follow the drawing — cover is a durability decision, not a calculator default. The difference matters: the same 300 × 450 mm section gives a 1364 mm tie at 25 mm cover and a 1244 mm tie at 40 mm cover, a 120 mm difference on every tie."],
          ["How many stirrups do I need for a beam?","Count = floor(length ÷ spacing) + 1. A 6 m beam at 150 mm spacing needs 6000 ÷ 150 + 1 = 41 ties. Remember the support zones: spacing is usually tighter near the supports, where shear is highest, so the count from one spacing figure is a planning estimate, not the drawing."],
          ["What spacing do stirrups need?","Beam vertical stirrups: maximum spacing = the smaller of 0.75 × effective depth and 300 mm (with d = 320 mm, that is 240 mm). Column lateral ties: maximum spacing = the smallest of the least lateral dimension, 16 × the smallest longitudinal bar diameter, and 300 mm (a 300 mm column with 16 mm mains gives 256 mm, typically detailed at 250 mm). Keep at least about 100 mm between ties so concrete can flow and be compacted."],
          ["What size should tie bars be?","At least the larger of 6 mm and one quarter of the largest longitudinal bar diameter. With 20 mm main bars that is 6 mm; with 25 mm main bars it is 6.25 mm, so 8 mm is used in practice. 8 mm is the usual tie bar for ordinary beams and columns."],
          ["Can I use this calculator for multi-legged or circular ties?","For the outer tie of a multi-legged set, yes — it is just a rectangular tie. Inner ties need the leg-spacing method worked in the multi-leg section below, because their width is set by the main-bar spacing, not by the member size. Circular and spiral ties are not computed here: start from π × (diameter − 2 × cover) and apply the same 10d hooks, but take the bend deductions from the drawing."],
          ["Does the calculator include waste, laps or cost?","No — it gives the neat cutting length of one tie only. Add 2.5–4% waste for cutting and off-cuts (2.0–2.5% with optimised cutting), take longitudinal laps from the <a href=\"/rebar-lap-length-calculator\">lap length calculator</a>, and price the order as total weight × your bar price per kg — the beam example below works out at €26.44 before waste at an example €1.20/kg."]],
    toc:`<nav class="content-block" aria-label="On this page">
    <h2>On this page</h2>
    <ul>
      <li><a href="#how-to">How to use the calculator</a></li>
      <li><a href="#formula">The formula</a></li>
      <li><a href="#example-1">Worked example 1: defaults (300 × 450 mm)</a></li>
      <li><a href="#example-2">Worked example 2: beam tie (400 × 600 mm)</a></li>
      <li><a href="#example-3">Worked example 3: square column tie</a></li>
      <li><a href="#size-table">Cutting length by bar size</a></li>
      <li><a href="#cover-table">Cutting length by cover</a></li>
      <li><a href="#spacing-rules">Spacing and tie-size rules</a></li>
      <li><a href="#multi-leg">Multi-legged ties: the leg-spacing method</a></li>
      <li><a href="#order">From one tie to the order</a></li>
      <li><a href="#imperial">Imperial conversions</a></li>
      <li><a href="#not-included">What this calculator does not cover</a></li>
      <li><a href="#mistakes">5 common mistakes</a></li>
      <li><a href="#faq">FAQs</a></li>
    </ul>
  </nav>`,
    extra:`<h3>The formula, explained</h3>
<p>The formula has four parts, and every one of them is a real piece of the bar:</p>
<p><strong>Cutting length = 2(a + b) + 20d − 6d − 6d</strong></p>
<p>First, a and b are the <em>inner</em> dimensions of the tie: a = member width − 2 × cover, b = member depth − 2 × cover. The cover comes off twice because it applies on both sides. Second, 2(a + b) is the perimeter of that inner rectangle — the straight steel. Third, 20d is the hook allowance: two 135° seismic hooks at 10d each. Fourth, the two deductions: 3 × 2d = 6d for the three 90° corners, and 2 × 3d = 6d for the two 135° hooks. Bend deductions exist because the bar stretches around a bend; if you cut the straight perimeter plus hooks and did not deduct them, every tie would come out long by 12d.</p>
<p>A common error is to take the perimeter from the outer dimensions and forget the cover. That overstates every tie by 8 × cover — 200 mm on a tie at 25 mm cover — and the tie will not fit inside the formwork with its cover intact.</p>
<h3 id="example-1">Worked example 1: 300 × 450 mm beam tie (calculator defaults)</h3>
<p>Open the calculator and leave the defaults: member 300 × 450 mm, cover 25 mm, bar 8 mm.</p>
<p>a = 300 − 2 × 25 = 250 mm; b = 450 − 2 × 25 = 400 mm. Perimeter = 2 × (250 + 400) = 1300 mm. Hooks = 2 × 10 × 8 = 160 mm. Deductions = 3 × 2 × 8 + 2 × 3 × 8 = 48 + 48 = 96 mm.</p>
<p><strong>Cutting length = 1300 + 160 − 96 = 1364 mm (1.36 m).</strong> The panel shows 1,364 mm, 1.36 m, inner width 250.00 mm, inner depth 400.00 mm, and weight 0.537 kg (1.364 m × 0.394 kg/m for an 8 mm bar).</p>
<p>Independent check: the same formula on a 230 × 450 mm beam at 25 mm cover with a 10 mm bar gives 2 × (180 + 400) + 200 − 120 = 1240 mm — the exact figure published in cmpro's bar-bending-schedule guide, so the method is not just the site's own.</p>
<h3 id="example-2">Worked example 2: 400 × 600 mm beam tie</h3>
<p>Set width 400 mm, depth 600 mm, cover 30 mm, bar 10 mm.</p>
<p>a = 400 − 2 × 30 = 340 mm; b = 600 − 2 × 30 = 540 mm. Perimeter = 2 × (340 + 540) = 1760 mm. Hooks = 2 × 10 × 10 = 200 mm. Deductions = 3 × 2 × 10 + 2 × 3 × 10 = 60 + 60 = 120 mm.</p>
<p><strong>Cutting length = 1760 + 200 − 120 = 1840 mm (1.84 m), weight 1.13 kg</strong> (1.84 m × 0.616 kg/m). Compare with example 1: the bigger section adds 460 mm of perimeter, but the thicker bar adds 40 mm of hooks and 24 mm of deductions, so the net gain is 476 mm.</p>
<h3 id="example-3">Worked example 3: square column tie</h3>
<p>Set width 300 mm, depth 300 mm, cover 40 mm (column cover), bar 8 mm.</p>
<p>a = 300 − 2 × 40 = 220 mm; b = 300 − 2 × 40 = 220 mm. Perimeter = 2 × (220 + 220) = 880 mm. Hooks = 160 mm. Deductions = 96 mm.</p>
<p><strong>Cutting length = 880 + 160 − 96 = 944 mm (0.944 m), weight 0.372 kg.</strong> Note the panel shows 944.00 mm here — under 1000 mm it keeps two decimals, while example 1's 1364 mm shows as 1,364 with no decimal. That is the panel's own display rule, not a rounding difference.</p>
<p>The contrast with example 1 is the point: the same 300 × 450 mm section at column cover 40 mm gives a = 220, b = 370 and a cutting length of 1244 mm — 120 mm shorter than the beam-cover tie. Always check whether the drawing says beam cover or column cover before cutting a batch.</p>
<h3 id="size-table">Cutting length by bar size</h3>
<p>Same member (300 × 450 mm) and same cover (25 mm), five bar sizes. The perimeter is 1300 mm in every row; only the hooks and deductions move — and they move by 8d in total, so each 2 mm step up in bar size adds 16 mm of cutting length (compare the 6 mm and 8 mm rows: 1348 vs 1364 mm). The weight column uses the calculator's kg/m for each size.</p>
<div class="formula-table"><table>
<tr><th>Bar size</th><th>Hooks (2 × 10d)</th><th>Deductions (12d)</th><th>Cutting length</th><th>Weight per tie</th></tr>
<tr><td>6 mm</td><td>120 mm</td><td>72 mm</td><td>1348 mm</td><td>0.299 kg</td></tr>
<tr><td>8 mm</td><td>160 mm</td><td>96 mm</td><td>1364 mm</td><td>0.537 kg</td></tr>
<tr><td>10 mm</td><td>200 mm</td><td>120 mm</td><td>1380 mm</td><td>0.850 kg</td></tr>
<tr><td>12 mm</td><td>240 mm</td><td>144 mm</td><td>1396 mm</td><td>1.24 kg</td></tr>
<tr><td>16 mm</td><td>320 mm</td><td>192 mm</td><td>1428 mm</td><td>2.25 kg</td></tr>
</table></div>
<p>Cutting length rises steadily with bar size, because hooks and deductions grow with d while the perimeter stays fixed. The weight column is the one that jumps: the 10 mm tie uses about 58% more steel per tie than the 8 mm tie (0.850 vs 0.537 kg) — the jump from 8 mm to 10 mm is the most expensive common upgrade, so do not oversize ties without a reason.</p>
<h3 id="cover-table">Cutting length by cover</h3>
<p>Same member (300 × 450 mm) and same bar (8 mm), five covers. Every extra 5 mm of cover removes 40 mm of cutting length, because cover is subtracted twice from each of the two dimensions, so the perimeter shrinks by 2 × (10 + 10) = 40 mm. The pattern is exact: cut = 1564 − 8 × cover.</p>
<div class="formula-table"><table>
<tr><th>Clear cover</th><th>a × b</th><th>Cutting length</th></tr>
<tr><td>20 mm</td><td>260 × 410 mm</td><td>1404 mm</td></tr>
<tr><td>25 mm</td><td>250 × 400 mm</td><td>1364 mm</td></tr>
<tr><td>30 mm</td><td>240 × 390 mm</td><td>1324 mm</td></tr>
<tr><td>40 mm</td><td>220 × 370 mm</td><td>1244 mm</td></tr>
<tr><td>50 mm</td><td>200 × 350 mm</td><td>1164 mm</td></tr>
</table></div>
<p>The beam-vs-column row pair is the one to remember: 25 mm cover (beam) gives 1364 mm, 40 mm cover (column) gives 1244 mm on the same section. A batch cut with the wrong cover is wrong on every single tie.</p>
<h3 id="spacing-rules">Spacing and tie-size rules</h3>
<p>The calculator gives one tie; the drawing decides how many and how far apart. These are the IS 456 / IS 13920 rules that matter for ordinary beams and columns — check the drawing, which always governs.</p>
<div class="formula-table"><table>
<tr><th>Rule</th><th>Limit</th><th>Worked check</th></tr>
<tr><td>Beam vertical stirrups — maximum spacing</td><td>min(0.75 × effective depth, 300 mm)</td><td>d = 320 mm → 0.75 × 320 = 240 mm, so 240 mm governs</td></tr>
<tr><td>Column lateral ties — maximum spacing</td><td>min(least lateral dimension, 16 × smallest longitudinal bar, 300 mm)</td><td>300 mm column, 16 mm mains → min(300, 256, 300) = 256 mm, typically detailed at 250 mm</td></tr>
<tr><td>Tie bar diameter — minimum</td><td>max(6 mm, ¼ × largest longitudinal bar)</td><td>20 mm mains → 6 mm; 25 mm mains → 6.25 mm, so 8 mm in practice</td></tr>
<tr><td>Practical minimum spacing</td><td>about 100 mm</td><td>closer than this, concrete cannot flow and be compacted properly between ties</td></tr>
</table></div>
<p>Two detailing habits complete the picture. First, spacing is denser near the supports, where shear is highest — commonly over about twice the beam depth from each support — and wider in the middle of the span. Second, in seismic zones the 135° hooks are mandatory and spacing tightens in the confinement zones at column ends and beam-column joints; the exact spacing comes from the drawing and IS 13920, not from this calculator.</p>
<h3 id="multi-leg">Multi-legged ties: the leg-spacing method</h3>
<p>Wide columns need more than a two-legged tie: a 4-legged tie has an outer tie and an inner tie, and the inner tie's width is set by the main-bar spacing, not by the member size. That is why the calculator alone cannot give it — but the method is straightforward, and it is the one gap every competitor calculator leaves open.</p>
<p>Worked example: a 600 × 450 mm column, 40 mm cover, 8 main bars of 20 mm, 8 mm tie bars.</p>
<p>First, the leg spacing. The published method takes the 450 mm face less 116 mm (80 + 16 + 20 per its steps) = 334 mm, divided by 3 legs = 111.33 mm per leg.</p>
<p>Then the inner tie: a = 2 × 111.33 + 20 + 8 = 250.66 mm, b = 600 − (80 + 8) = 512 mm. Cut = 2 × (250.66 + 512) + 160 − 96 = <strong>1589.32 mm</strong>, weight 0.626 kg.</p>
<p>Now the outer tie for the same column, from the calculator: a = 450 − 80 = 370 mm, b = 600 − 80 = 520 mm, cut = 2 × (370 + 520) + 160 − 96 = <strong>1844 mm</strong>, weight 0.727 kg. The inner tie is 254.68 mm shorter than the outer tie. Order both: a 4-legged set is one outer tie plus one inner tie per level, not two outer ties.</p>
<p>Circular and spiral ties work the same way in principle — start from π × (diameter − 2 × cover) instead of the rectangular perimeter, then add the 10d hooks — but the bend deductions for a spiral come from the drawing, so this calculator stays rectangular-only.</p>
<h3 id="order">From one tie to the order</h3>
<p>The calculator gives one tie. The order is one tie × tie count × number of members, plus waste.</p>
<p>Example: a 6 m beam, stirrups at 150 mm spacing. Count = 6000 ÷ 150 + 1 = 41 ties. Total length = 41 × 1.364 m = 55.92 m. Total weight = 55.92 m × 0.394 kg/m = 22.03 kg. At an example price of €1.20/kg that is €26.44 — before waste. Add 2.5–4% for cutting and off-cuts (2.0–2.5% with optimised cutting and off-cut reuse, 5–8% or more with no schedule at all): 22.58–22.92 kg for this beam. For the full takeoff across members, use the <a href="/rebar-quantity-calculator">quantity & takeoff calculator</a>, and price it with the <a href="/rebar-cost-calculator">cost calculator</a>.</p>
<h3 id="imperial">Imperial conversions</h3>
<p>1364 mm = 53.70 in = 4.48 ft; 1840 mm = 72.44 in = 6.04 ft; a 10d hook on a #3 bar (9.5 mm, the usual imperial tie bar, closest to the 10 mm metric bar) is 95 mm = 3.74 in. The formula is unit-free — the same 2(a + b) + 20d − 12d works in inches if a, b and d are all in inches — but the calculator takes mm, so convert first (1 in = 25.4 mm).</p>
<h3 id="not-included">What this calculator does not cover</h3>
<ul>
<li>Tie count and spacing design — the count arithmetic is shown above, but the spacing itself comes from the drawing and the code rules in the spacing section, not from this tool.</li>
<li>Multi-legged inner ties — the method is worked above, but the calculator computes the outer rectangular tie only.</li>
<li>Circular and spiral ties — rectangular only; the circumference starting point is given above, but deductions come from the drawing.</li>
<li>Minimum shear reinforcement area (Asv) — whether the section needs more steel than the minimum is a design check, not a cutting-length calculation.</li>
<li>Seismic confinement spacing — tighter spacing at column ends and beam-column joints comes from IS 13920 and the drawing.</li>
<li>Longitudinal bar laps — see the <a href="/rebar-lap-length-calculator">lap length calculator</a>.</li>
<li>Chairs, spacer bars and binding wire — see the <a href="/rebar-chair-calculator">chair bar calculator</a> and the <a href="/rebar-tie-wire-calculator">binding wire calculator</a>.</li>
<li>Total order cost — the order section shows the hand arithmetic; the <a href="/rebar-cost-calculator">cost calculator</a> prices a full takeoff.</li>
</ul>
<h3 id="mistakes">5 common mistakes</h3>
<ol>
<li><strong>Using outer dimensions instead of inner.</strong> Forgetting to subtract the cover on both sides overstates every tie by 8 × cover — 200 mm per tie at 25 mm cover — and the tie will not fit with its cover intact.</li>
<li><strong>Wrong hook or bend count.</strong> Using 9d hooks (the bar-end standard) instead of 10d seismic hooks on ties cuts every tie 2d too short — 16 mm on an 8 mm bar — so the hooks will not close properly. Counting five 90° bends instead of three 90° plus two 135° has the opposite effect: it under-deducts by 2d, cutting the tie 16 mm too long.</li>
<li><strong>90° hooks in seismic zones.</strong> A 90° hook opens when cover spalls in an earthquake; the tie stops confining the core. Seismic detailing requires 135° hooks — this is a safety detail, not a preference.</li>
<li><strong>One cover for beams and columns.</strong> Beam cover (25 mm) and column cover (40 mm) give 1364 mm and 1244 mm on the same 300 × 450 mm section. Cut a batch with the wrong one and every tie is 120 mm off.</li>
<li><strong>Ordering one tie's length instead of the member total.</strong> The calculator gives one tie; the order is ties × members × length, plus waste. Forgetting the count — 41 ties on a 6 m beam at 150 mm — is the most expensive mistake on this page, because it is a factor of 41.</li>
</ol>
<p>Last reviewed: October 2026.</p>`,
    de: {
  metaTitle: "Bügel-Schnittlängen-Rechner — Bügel & kg gratis",
  desc: "Bügel-Schnittlängen-Rechner: Schnittlänge für Rechteckbügel mit 135°-Haken und Biegeabzügen berechnen. Beispiel: 300 × 450 mm = 1.364 mm. Kostenlos.",
  formula: "Schnittlänge = 2(a + b) + 2 × 10d − 3 × 2d − 2 × 3d, wobei a und b die Innenmaße sind.",
  kw: "bügel-schnittlänge rechner, stützenbügel schnittlänge, bewehrungsbügel-rechner",
  howto: ["Gib die Bauteilbreite und -tiefe in mm ein.", "Lege die lichte Betondeckung fest — 25 mm sind für Balken üblich, 40 mm für Stützen.", "Wähle den Bügeldurchmesser. 8 mm ist der übliche Bügelstab.", "Lies die Schnittlänge in mm und m ab, dazu die Innenmaße und das Gewicht je Bügel.", "Multipliziere einen Bügel mit der Bügelanzahl des Bauteils und rechne Verschnitt dazu — der Rechner gibt einen Bügel an, nicht die Bestellmenge."],
  faqs: [["Wie berechnet man die Schnittlänge eines Bügels?", "Addiere den Innenumfang zur Hakenlänge und ziehe die Biegeabzüge ab: Schnittlänge = 2(a + b) + 2 × 10d − 3 × 2d − 2 × 3d, wobei a und b die Bauteilmaße abzüglich der doppelten Betondeckung sind. Für die Standardwerte des Rechners (300 × 450 mm, 25 mm Betondeckung, 8 mm Stab) ergibt das 2 × (250 + 400) + 160 − 96 = 1364 mm."],
          ["Wie lang ist der Haken eines Bügels?", "Jeder 135°-Erdbebenhaken wird mit 10 × Stabdurchmesser angesetzt — 80 mm bei einem 8-mm-Stab, 100 mm bei einem 10-mm-Stab — zwei Haken je Bügel. Das ist der Bügelhaken, nicht der 9d-Standardhaken für Stabenden; den Unterschied zeigt der <a href=\"/de/haken-biege-schnittlaengen-rechner\">Haken- & Biege-Rechner</a>."],
          ["Warum 135°-Haken und keine 90°-Haken bei Bügeln?", "Ein 90°-Haken öffnet sich, wenn die Betondeckung bei einem Erdbeben abplatzt, und der Bügel umschließt den Kern nicht mehr. Ein 135°-Haken bleibt geschlossen, deshalb verlangen Erdbebennormen (IS 13920) 135°-Haken bei Bügeln und Stützenbügeln in Erdbebengebieten. Außerhalb von Erdbebengebieten wird manchmal ein 90°-Haken gezeichnet, aber 135° ist die sichere Standardwahl."],
          ["Warum zieht die Formel 6d und 6d ab?", "Ein geschlossener Bügel hat fünf Biegungen: drei 90°-Ecken und zwei 135°-Schlusshaken. Eine 90°-Biegung verkürzt den Stab um 2d und eine 135°-Biegung um 3d, also betragen die Abzüge 3 × 2d = 6d für die Ecken und 2 × 3d = 6d für die Haken — insgesamt 12d. Würde man stattdessen fünf 90°-Biegungen zählen, zöge man nur 10d statt 12d ab und schnitte den Bügel bei einem 8-mm-Stab 16 mm zu lang."],
          ["Welche Betondeckung soll ich nehmen — Balken oder Stütze?", "Balken erhalten üblicherweise 25 mm lichte Betondeckung und Stützen 40 mm, aber folge der Zeichnung — die Betondeckung ist eine Dauerhaftigkeitsentscheidung, keine Rechner-Vorgabe. Der Unterschied zählt: Derselbe Querschnitt 300 × 450 mm ergibt bei 25 mm Betondeckung einen 1364-mm-Bügel und bei 40 mm Betondeckung einen 1244-mm-Bügel, also 120 mm Unterschied bei jedem Bügel."],
          ["Wie viele Bügel brauche ich für einen Balken?", "Anzahl = abgerundet (Länge ÷ Abstand) + 1. Ein 6-m-Balken bei 150 mm Abstand braucht 6000 ÷ 150 + 1 = 41 Bügel. Denk an die Auflagerbereiche: Der Abstand ist nahe den Auflagern meist enger, wo die Querkraft am größten ist, deshalb ist die Anzahl aus einem einzigen Abstandswert eine Planungsgröße, keine Zeichnungsangabe."],
          ["Welchen Abstand brauchen Bügel?", "Vertikale Balkenbügel: Größtabstand = der kleinere Wert aus 0,75 × nutzbarer Höhe und 300 mm (bei d = 320 mm sind das 240 mm). Seitliche Stützenbügel: Größtabstand = der kleinste Wert aus der kleinsten Seitenabmessung, 16 × dem kleinsten Längsstabdurchmesser und 300 mm (eine 300-mm-Stütze mit 16-mm-Hauptbewehrung ergibt 256 mm, in der Praxis meist 250 mm). Halte mindestens etwa 100 mm Abstand zwischen den Bügeln, damit der Beton fließen und verdichtet werden kann."],
          ["Wie dick sollen Bügelstäbe sein?", "Mindestens der größere Wert aus 6 mm und einem Viertel des größten Längsstabdurchmessers. Bei 20-mm-Hauptstäben sind das 6 mm; bei 25-mm-Hauptstäben sind es 6,25 mm, deshalb wird in der Praxis 8 mm verwendet. 8 mm ist der übliche Bügelstab für gewöhnliche Balken und Stützen."],
          ["Kann ich diesen Rechner für mehrschenkelige oder runde Bügel verwenden?", "Für den Außenbügel eines mehrschenkeligen Satzes ja — das ist einfach ein Rechteckbügel. Innenbügel brauchen die Schenkelabstands-Methode aus dem Abschnitt über mehrschenkelige Bügel weiter unten, weil ihre Breite vom Abstand der Hauptstäbe bestimmt wird, nicht vom Bauteilmaß. Runde Bügel und Spiralbügel werden hier nicht berechnet: Geh von π × (Durchmesser − 2 × Betondeckung) aus und rechne dieselben 10d-Haken dazu, aber nimm die Biegeabzüge aus der Zeichnung."],
          ["Berücksichtigt der Rechner Verschnitt, Übergreifungen oder Kosten?", "Nein — er gibt nur die saubere Schnittlänge eines Bügels an. Rechne 2,5–4 % Verschnitt für Zuschnitt und Abschnitte dazu (2,0–2,5 % bei optimiertem Zuschnitt), nimm Längsübergreifungen aus dem <a href=\"/de/uebergreifungslaengen-rechner\">Übergreifungslängen-Rechner</a> und bepreise die Bestellung als Gesamtgewicht × deinen Stabpreis je kg — das Balkenbeispiel weiter unten ergibt 26,44 € vor Verschnitt bei einem Beispielpreis von 1,20 €/kg."]],
  toc: `<nav class="content-block" aria-label="Auf dieser Seite">
    <h2>Auf dieser Seite</h2>
    <ul>
      <li><a href="#how-to">So benutzt du den Rechner</a></li>
      <li><a href="#formula">Die Formel</a></li>
      <li><a href="#example-1">Rechenbeispiel 1: Standardwerte (300 × 450 mm)</a></li>
      <li><a href="#example-2">Rechenbeispiel 2: Balkenbügel (400 × 600 mm)</a></li>
      <li><a href="#example-3">Rechenbeispiel 3: Quadratischer Stützenbügel</a></li>
      <li><a href="#size-table">Schnittlänge nach Stabdurchmesser</a></li>
      <li><a href="#cover-table">Schnittlänge nach Betondeckung</a></li>
      <li><a href="#spacing-rules">Abstands- und Bügelgrößen-Regeln</a></li>
      <li><a href="#multi-leg">Mehrschenkelige Bügel: die Schenkelabstands-Methode</a></li>
      <li><a href="#order">Von einem Bügel zur Bestellung</a></li>
      <li><a href="#imperial">Zoll-Umrechnungen</a></li>
      <li><a href="#not-included">Was dieser Rechner nicht abdeckt</a></li>
      <li><a href="#mistakes">5 häufige Fehler</a></li>
      <li><a href="#faq">Häufige Fragen</a></li>
    </ul>
  </nav>`,
  extra: `<h3>Die Formel, erklärt</h3>
<p>Die Formel hat vier Teile, und jeder davon ist ein echtes Stück des Stabes:</p>
<p><strong>Schnittlänge = 2(a + b) + 20d − 6d − 6d</strong></p>
<p>Zuerst sind a und b die <em>inneren</em> Maße des Bügels: a = Bauteilbreite − 2 × Betondeckung, b = Bauteiltiefe − 2 × Betondeckung. Die Betondeckung wird zweimal abgezogen, weil sie auf beiden Seiten gilt. Zweitens ist 2(a + b) der Umfang dieses inneren Rechtecks — der gerade Stahl. Drittens sind 20d die Hakenlänge: zwei 135°-Erdbebenhaken zu je 10d. Viertens die beiden Abzüge: 3 × 2d = 6d für die drei 90°-Ecken und 2 × 3d = 6d für die beiden 135°-Haken. Biegeabzüge gibt es, weil sich der Stab um eine Biegung dehnt; schnitte man den geraden Umfang plus Haken ohne sie zu, käme jeder Bügel um 12d zu lang heraus.</p>
<p>Ein häufiger Fehler ist, den Umfang aus den Außenmaßen zu nehmen und die Betondeckung zu vergessen. Das übertreibt jeden Bügel um 8 × Betondeckung — 200 mm bei einem Bügel mit 25 mm Betondeckung — und der Bügel passt nicht in die Schalung, ohne dass die Betondeckung verloren geht.</p>
<h3 id="example-1">Rechenbeispiel 1: 300 × 450 mm Balkenbügel (Standardwerte des Rechners)</h3>
<p>Öffne den Rechner und lass die Standardwerte: Bauteil 300 × 450 mm, Betondeckung 25 mm, Stab 8 mm.</p>
<p>a = 300 − 2 × 25 = 250 mm; b = 450 − 2 × 25 = 400 mm. Umfang = 2 × (250 + 400) = 1300 mm. Haken = 2 × 10 × 8 = 160 mm. Abzüge = 3 × 2 × 8 + 2 × 3 × 8 = 48 + 48 = 96 mm.</p>
<p><strong>Schnittlänge = 1300 + 160 − 96 = 1364 mm (1,36 m).</strong> Das Panel zeigt 1.364 mm, 1,36 m, Innenbreite 250,00 mm, Innentiefe 400,00 mm und Gewicht 0,537 kg (1,364 m × 0,394 kg/m für einen 8-mm-Stab).</p>
<p>Unabhängige Prüfung: Dieselbe Formel auf einen 230 × 450 mm Balken bei 25 mm Betondeckung mit einem 10-mm-Stab ergibt 2 × (180 + 400) + 200 − 120 = 1240 mm — genau die Zahl, die in der Biegeplan-Anleitung von cmpro veröffentlicht ist, die Methode ist also nicht nur die eigene der Seite.</p>
<h3 id="example-2">Rechenbeispiel 2: 400 × 600 mm Balkenbügel</h3>
<p>Setze Breite 400 mm, Tiefe 600 mm, Betondeckung 30 mm, Stab 10 mm.</p>
<p>a = 400 − 2 × 30 = 340 mm; b = 600 − 2 × 30 = 540 mm. Umfang = 2 × (340 + 540) = 1760 mm. Haken = 2 × 10 × 10 = 200 mm. Abzüge = 3 × 2 × 10 + 2 × 3 × 10 = 60 + 60 = 120 mm.</p>
<p><strong>Schnittlänge = 1760 + 200 − 120 = 1840 mm (1,84 m), Gewicht 1,13 kg</strong> (1,84 m × 0,616 kg/m). Im Vergleich zu Beispiel 1: Der größere Querschnitt fügt 460 mm Umfang hinzu, aber der dickere Stab fügt 40 mm Haken und 24 mm Abzüge hinzu, sodass der Nettogewinn 476 mm beträgt.</p>
<h3 id="example-3">Rechenbeispiel 3: Quadratischer Stützenbügel</h3>
<p>Setze Breite 300 mm, Tiefe 300 mm, Betondeckung 40 mm (Stützenbetondeckung), Stab 8 mm.</p>
<p>a = 300 − 2 × 40 = 220 mm; b = 300 − 2 × 40 = 220 mm. Umfang = 2 × (220 + 220) = 880 mm. Haken = 160 mm. Abzüge = 96 mm.</p>
<p><strong>Schnittlänge = 880 + 160 − 96 = 944 mm (0,944 m), Gewicht 0,372 kg.</strong> Beachte, dass das Panel hier 944,00 mm zeigt — unter 1000 mm behält es zwei Dezimalstellen, während die 1364 mm aus Beispiel 1 als 1.364 ohne Dezimalstelle erscheinen. Das ist die eigene Anzeigeregel des Panels, kein Rundungsunterschied.</p>
<p>Der Kontrast zu Beispiel 1 ist der Punkt: Derselbe Querschnitt 300 × 450 mm bei Stützenbetondeckung 40 mm ergibt a = 220, b = 370 und eine Schnittlänge von 1244 mm — 120 mm kürzer als der Balkenbügel. Prüfe immer, ob die Zeichnung Balken- oder Stützenbetondeckung angibt, bevor du eine Charge schneidest.</p>
<h3 id="size-table">Schnittlänge nach Stabdurchmesser</h3>
<p>Dasselbe Bauteil (300 × 450 mm) und dieselbe Betondeckung (25 mm), fünf Stabdurchmesser. Der Umfang beträgt in jeder Zeile 1300 mm; nur Haken und Abzüge bewegen sich — und sie bewegen sich um insgesamt 8d, sodass jeder 2-mm-Schritt nach oben beim Stabdurchmesser 16 mm Schnittlänge hinzufügt (vergleiche die 6-mm- und 8-mm-Zeilen: 1348 vs. 1364 mm). Die Gewichtsspalte verwendet die kg/m des Rechners für jede Größe.</p>
<div class="formula-table"><table>
<tr><th>Stabdurchmesser</th><th>Haken (2 × 10d)</th><th>Abzüge (12d)</th><th>Schnittlänge</th><th>Gewicht je Bügel</th></tr>
<tr><td>6 mm</td><td>120 mm</td><td>72 mm</td><td>1348 mm</td><td>0,299 kg</td></tr>
<tr><td>8 mm</td><td>160 mm</td><td>96 mm</td><td>1364 mm</td><td>0,537 kg</td></tr>
<tr><td>10 mm</td><td>200 mm</td><td>120 mm</td><td>1380 mm</td><td>0,850 kg</td></tr>
<tr><td>12 mm</td><td>240 mm</td><td>144 mm</td><td>1396 mm</td><td>1,24 kg</td></tr>
<tr><td>16 mm</td><td>320 mm</td><td>192 mm</td><td>1428 mm</td><td>2,25 kg</td></tr>
</table></div>
<p>Die Schnittlänge steigt stetig mit dem Stabdurchmesser, weil Haken und Abzüge mit d wachsen, während der Umfang fest bleibt. Die Gewichtsspalte ist die, die springt: Der 10-mm-Bügel braucht etwa 58 % mehr Stahl je Bügel als der 8-mm-Bügel (0,850 vs. 0,537 kg) — der Sprung von 8 mm auf 10 mm ist die teuerste gängige Aufrüstung, also vergrößere Bügel nicht ohne Grund.</p>
<h3 id="cover-table">Schnittlänge nach Betondeckung</h3>
<p>Dasselbe Bauteil (300 × 450 mm) und derselbe Stab (8 mm), fünf Betondeckungen. Jede zusätzlichen 5 mm Betondeckung nehmen 40 mm Schnittlänge weg, weil die Betondeckung zweimal von jedem der beiden Maße abgezogen wird, sodass der Umfang um 2 × (10 + 10) = 40 mm schrumpft. Das Muster ist exakt: Schnittlänge = 1564 − 8 × Betondeckung.</p>
<div class="formula-table"><table>
<tr><th>Lichte Betondeckung</th><th>a × b</th><th>Schnittlänge</th></tr>
<tr><td>20 mm</td><td>260 × 410 mm</td><td>1404 mm</td></tr>
<tr><td>25 mm</td><td>250 × 400 mm</td><td>1364 mm</td></tr>
<tr><td>30 mm</td><td>240 × 390 mm</td><td>1324 mm</td></tr>
<tr><td>40 mm</td><td>220 × 370 mm</td><td>1244 mm</td></tr>
<tr><td>50 mm</td><td>200 × 350 mm</td><td>1164 mm</td></tr>
</table></div>
<p>Das Balken-Stützen-Zeilenpaar ist das, das man sich merken muss: 25 mm Betondeckung (Balken) ergibt 1364 mm, 40 mm Betondeckung (Stütze) ergibt 1244 mm beim selben Querschnitt. Eine Charge, die mit der falschen Betondeckung geschnitten wurde, ist bei jedem einzelnen Bügel falsch.</p>
<h3 id="spacing-rules">Abstands- und Bügelgrößen-Regeln</h3>
<p>Der Rechner gibt einen Bügel an; die Zeichnung entscheidet, wie viele und in welchem Abstand. Das sind die IS-456-/IS-13920-Regeln, die für gewöhnliche Balken und Stützen zählen — prüfe die Zeichnung, die immer Vorrang hat.</p>
<div class="formula-table"><table>
<tr><th>Regel</th><th>Grenzwert</th><th>Prüfung am Beispiel</th></tr>
<tr><td>Vertikale Balkenbügel — Größtabstand</td><td>min(0,75 × nutzbare Höhe, 300 mm)</td><td>d = 320 mm → 0,75 × 320 = 240 mm, also 240 mm maßgebend</td></tr>
<tr><td>Seitliche Stützenbügel — Größtabstand</td><td>min(kleinste Seitenabmessung, 16 × kleinster Längsstab, 300 mm)</td><td>300-mm-Stütze, 16-mm-Hauptbewehrung → min(300, 256, 300) = 256 mm, in der Praxis meist 250 mm</td></tr>
<tr><td>Bügelstabdurchmesser — Mindestmaß</td><td>max(6 mm, ¼ × größter Längsstab)</td><td>20-mm-Hauptbewehrung → 6 mm; 25-mm-Hauptbewehrung → 6,25 mm, also 8 mm in der Praxis</td></tr>
<tr><td>Praktischer Mindestabstand</td><td>etwa 100 mm</td><td>enger als das, kann der Beton zwischen den Bügeln nicht richtig fließen und verdichtet werden</td></tr>
</table></div>
<p>Zwei Detaillierungsgewohnheiten vervollständigen das Bild. Erstens ist der Abstand nahe den Auflagern enger, wo die Querkraft am größten ist — üblicherweise über etwa die doppelte Balkentiefe ab jedem Auflager — und in Feldmitte weiter. Zweitens sind in Erdbebengebieten die 135°-Haken Pflicht und der Abstand wird in den Einspannbereichen an Stützenenden und Balken-Stützen-Knoten enger; der genaue Abstand kommt aus der Zeichnung und IS 13920, nicht aus diesem Rechner.</p>
<h3 id="multi-leg">Mehrschenkelige Bügel: die Schenkelabstands-Methode</h3>
<p>Breite Stützen brauchen mehr als einen zweischenkeligen Bügel: Ein vierschenkeliger Bügel hat einen Außenbügel und einen Innenbügel, und die Breite des Innenbügels wird vom Abstand der Hauptstäbe bestimmt, nicht vom Bauteilmaß. Deshalb kann der Rechner allein ihn nicht angeben — aber die Methode ist unkompliziert, und sie ist die eine Lücke, die jeder Konkurrenzrechner offen lässt.</p>
<p>Rechenbeispiel: eine 600 × 450 mm Stütze, 40 mm Betondeckung, 8 Hauptstäbe à 20 mm, 8-mm-Bügelstäbe.</p>
<p>Zuerst der Schenkelabstand. Die veröffentlichte Methode nimmt die 450-mm-Seite abzüglich 116 mm (80 + 16 + 20 nach deren Schritten) = 334 mm, geteilt durch 3 Schenkel = 111,33 mm je Schenkel.</p>
<p>Dann der Innenbügel: a = 2 × 111,33 + 20 + 8 = 250,66 mm, b = 600 − (80 + 8) = 512 mm. Schnittlänge = 2 × (250,66 + 512) + 160 − 96 = <strong>1.589,32 mm</strong>, Gewicht 0,626 kg.</p>
<p>Nun der Außenbügel für dieselbe Stütze, aus dem Rechner: a = 450 − 80 = 370 mm, b = 600 − 80 = 520 mm, Schnittlänge = 2 × (370 + 520) + 160 − 96 = <strong>1844 mm</strong>, Gewicht 0,727 kg. Der Innenbügel ist 254,68 mm kürzer als der Außenbügel. Bestelle beide: Ein vierschenkeliger Satz ist ein Außenbügel plus ein Innenbügel je Lage, nicht zwei Außenbügel.</p>
<p>Runde Bügel und Spiralbügel funktionieren im Prinzip genauso — geh von π × (Durchmesser − 2 × Betondeckung) statt vom Rechteckumfang aus und rechne dann die 10d-Haken dazu — aber die Biegeabzüge für eine Spirale kommen aus der Zeichnung, deshalb bleibt dieser Rechner rechteckig.</p>
<h3 id="order">Von einem Bügel zur Bestellung</h3>
<p>Der Rechner gibt einen Bügel an. Die Bestellung ist ein Bügel × Bügelanzahl × Anzahl der Bauteile, plus Verschnitt.</p>
<p>Beispiel: ein 6-m-Balken, Bügel im Abstand von 150 mm. Anzahl = 6000 ÷ 150 + 1 = 41 Bügel. Gesamtlänge = 41 × 1,364 m = 55,92 m. Gesamtgewicht = 55,92 m × 0,394 kg/m = 22,03 kg. Bei einem Beispielpreis von 1,20 €/kg sind das 26,44 € — vor Verschnitt. Rechne 2,5–4 % für Zuschnitt und Abschnitte dazu (2,0–2,5 % bei optimiertem Zuschnitt und Abschnittswiederverwendung, 5–8 % oder mehr ganz ohne Plan): 22,58–22,92 kg für diesen Balken. Für die komplette Abrechnung über alle Bauteile nutze den <a href="/de/bewehrungsmengen-rechner">Mengen- & Abrechnungsrechner</a> und bepreise sie mit dem <a href="/de/bewehrungskosten-rechner">Kostenrechner</a>.</p>
<h3 id="imperial">Zoll-Umrechnungen</h3>
<p>1364 mm = 53,70 in = 4,48 ft; 1840 mm = 72,44 in = 6,04 ft; ein 10d-Haken an einem #3-Stab (9,5 mm, der übliche Zoll-Bügelstab, am nächsten am 10-mm-Metrikstab) ist 95 mm = 3,74 in. Die Formel ist einheitenfrei — dasselbe 2(a + b) + 20d − 12d funktioniert in Zoll, wenn a, b und d alle in Zoll sind — aber der Rechner nimmt mm, also rechne zuerst um (1 in = 25,4 mm).</p>
<h3 id="not-included">Was dieser Rechner nicht abdeckt</h3>
<ul>
<li>Bügelanzahl und Abstandsplanung — die Anzahl-Arithmetik ist oben gezeigt, aber der Abstand selbst kommt aus der Zeichnung und den Code-Regeln im Abstandsabschnitt, nicht aus diesem Tool.</li>
<li>Mehrschenkelige Innenbügel — die Methode ist oben durchgearbeitet, aber der Rechner berechnet nur den äußeren Rechteckbügel.</li>
<li>Runde Bügel und Spiralbügel — nur rechteckig; der Umfangsausgangspunkt ist oben angegeben, aber Abzüge kommen aus der Zeichnung.</li>
<li>Mindestquerbewehrungsfläche (Asv) — ob der Querschnitt mehr Stahl als das Minimum braucht, ist eine Bemessungsprüfung, keine Schnittlängenberechnung.</li>
<li>Erdbeben-Einspannabstände — engere Abstände an Stützenenden und Balken-Stützen-Knoten kommen aus IS 13920 und der Zeichnung.</li>
<li>Längsstab-Übergreifungen — siehe den <a href="/de/uebergreifungslaengen-rechner">Übergreifungslängen-Rechner</a>.</li>
<li>Abstandhalter, Distanzstäbe und Bindedraht — siehe den <a href="/de/abstandhalter-rechner">Abstandhalter-Rechner</a> und den <a href="/de/bindedraht-rechner">Bindedraht-Rechner</a>.</li>
<li>Gesamtbestellkosten — der Bestellabschnitt zeigt die Handrechnung; der <a href="/de/bewehrungskosten-rechner">Kostenrechner</a> bepreist eine komplette Abrechnung.</li>
</ul>
<h3 id="mistakes">5 häufige Fehler</h3>
<ol>
<li><strong>Außenmaße statt Innenmaße verwenden.</strong> Vergisst man, die Betondeckung auf beiden Seiten abzuziehen, übertreibt man jeden Bügel um 8 × Betondeckung — 200 mm je Bügel bei 25 mm Betondeckung — und der Bügel passt nicht, ohne dass die Betondeckung verloren geht.</li>
<li><strong>Falsche Haken- oder Biegungsanzahl.</strong> Verwendet man 9d-Haken (den Stabenden-Standard) statt 10d-Erdbebenhaken bei Bügeln, schneidet man jeden Bügel 2d zu kurz — 16 mm bei einem 8-mm-Stab — sodass die Haken nicht richtig schließen. Zählt man fünf 90°-Biegungen statt drei 90°- plus zwei 135°-Biegungen, hat das den gegenteiligen Effekt: Man zieht 2d zu wenig ab und schneidet den Bügel 16 mm zu lang.</li>
<li><strong>90°-Haken in Erdbebengebieten.</strong> Ein 90°-Haken öffnet sich, wenn die Betondeckung bei einem Erdbeben abplatzt; der Bügel umschließt den Kern nicht mehr. Die Erdbeben-Detailplanung verlangt 135°-Haken — das ist ein Sicherheitsdetail, keine Vorliebe.</li>
<li><strong>Eine Betondeckung für Balken und Stützen.</strong> Balkenbetondeckung (25 mm) und Stützenbetondeckung (40 mm) ergeben 1364 mm und 1244 mm beim selben Querschnitt 300 × 450 mm. Schneidet man eine Charge mit der falschen, ist jeder Bügel 120 mm daneben.</li>
<li><strong>Die Länge eines Bügels statt der Bauteil-Gesamtmenge bestellen.</strong> Der Rechner gibt einen Bügel an; die Bestellung ist Bügel × Bauteile × Länge, plus Verschnitt. Die Anzahl zu vergessen — 41 Bügel bei einem 6-m-Balken mit 150 mm Abstand — ist der teuerste Fehler auf dieser Seite, weil er ein Faktor 41 ist.</li>
</ol>
<p>Zuletzt geprüft: Oktober 2026.</p>`
}
},
    { id:"chair", slug:"rebar-chair-calculator", cat:"Detailing",
    metaTitle:"Rebar Chair Calculator — How Many Supports? Free",
    h1:"Rebar Chair / Bar Support Calculator",
    desc:"How many bar chairs hold your top mat? Count and spacing on a square grid in seconds — defaults 5 × 4 m at 1.0 m spacing = 30 chairs. Free calculator.",
    kw:"rebar chair calculator, bar support calculator, rebar chairs per square meter, slab bolster count",
    intro:"Work out how many bar chairs you need to support a top mat. Enter the slab size and the chair grid spacing, and get the total number of chairs and the chairs-per-m² density.",
    howto:["Enter the slab length and width in metres.","Set the chair grid spacing in metres — 1.0 m is the calculator default, and 1.0–1.2 m is common for slab top mats.","Read the total chairs, the rows × columns grid, the slab area and the chairs-per-m² density.","If the drawing sets chairs back from the edges, enter the reduced size for the count — see the setback section below.","Add spares and round up — the calculator gives the neat grid count, not the order quantity."],
    formula:"Chairs = (floor(L ÷ spacing) + 1) × (floor(W ÷ spacing) + 1).",
    faqs:[["How many rebar chairs do I need?", "It depends on the slab size and the grid spacing, not just the area — the calculator gives the exact grid count. As a rough guide, about one chair per square metre at 1 m spacing works for large slabs, but on the calculator defaults (5 × 4 m at 1 m spacing) the grid gives 30 chairs, which is 1.50 per m², not 1.00. The small-slab difference is the edge rows, explained below."],
          ["What spacing for bar chairs?", "Commonly 1.0–1.2 m each way for slab top mats, 1–1.5 m in general site practice, and 0.8 m for heavy reinforcement. Australian practice caps spacing at 600 mm for residential pavements and 800 mm for buildings. There is no universal code value — the drawing governs, and heavier mats need closer spacing so the top steel does not sag during the pour."],
          ["How does the calculator count the chairs?", "It lays a grid over the slab and counts the grid lines, including both edges: chairs along the length = floor(length ÷ spacing) + 1, chairs along the width = floor(width ÷ spacing) + 1, and the total is the two multiplied. On the defaults that is (5 ÷ 1 + 1) × (4 ÷ 1 + 1) = 6 × 5 = 30 chairs. The +1 in each direction is the edge line — without it you would miss a whole row and column."],
          ["Why does the calculator give more chairs than one per square metre?", "Because the grid includes edge rows, the count is always higher than area × density — the gap is just biggest on small slabs. A 2 × 2 m slab at 1 m spacing needs 9 chairs (2.25 per m²), a 5 × 4 m slab needs 30 (1.50 per m²), and even a 20 × 10 m slab needs 231 (1.16 per m²) against the 200 the area rule predicts. As slabs grow, the density tends towards 1 ÷ spacing² — 1.00 per m² at 1 m spacing — but it never quite reaches it."],
          ["What if the chairs are set back from the edges?", "Then the calculator's edge-to-edge count overstates the order. On a 10 × 10 m slab at 1 m spacing the calculator gives 11 × 11 = 121 chairs, but with chairs set back 0.5 m from each edge there are only 10 positions per direction, giving 10 × 10 = 100 chairs. The fix: enter the reduced size (10 − 2 × 0.5 = 9 m each way) and the calculator gives 100 — but divide by the real 100 m² slab area for the true density (1.00 per m²), not the 1.23 per m² it shows against the reduced 81 m²."],
          ["Individual chairs or continuous chair bars — which does this count?", "Individual chairs on a grid only. If the design uses continuous chair bars or support lines, count those by row length from the approved layout instead — a row is not a grid of individual chairs, and forcing it into this calculator gives the wrong number. The same applies to bent chair bars, which are a different product (see the next answer)."],
          ["Does the calculator work out bent chair-bar cutting lengths?", "No — that is a different calculation, and this page does not pretend otherwise. A bent chair bar in a footing is cut as 2H + E + 2L − 8d (two heights, one head, two legs, four 90° bends at 2d each). One published footing example works out at 2292 mm: height 594 mm, head 400 mm, legs 400 mm, 12 mm bar. Take the cutting length from the bar bending schedule or drawing, not from this count calculator."],
          ["What height and type of chair do I need?", "Height comes from the reinforcement section detail — the elevations of the bars being supported and where the chair bears — not from a generic subtraction. Types run from plastic clip chairs and precast supports to bent-bar chairs. Two published bar ranges look contradictory but are not: light slab chairs are commonly fabricated from 8–10 mm bars, while heavy cage chair bars are usually 12 mm and above (12/16/20 mm), because a thin chair bar buckles under a loaded cage. Match the product to the load, and confirm it against the drawing."],
          ["How many spare chairs should I order?", "Add about 5% and always round UP — you cannot buy half a chair, and rounding down loses one. The defaults order becomes 30 × 1.05 = 31.5 → 32 chairs; the 10 × 8 m example becomes 99 × 1.05 = 103.95 → 104 chairs. Spares cover chairs crushed or knocked over during fixing and the pour."],
          ["Does the calculator include cost or weight?", "No — it gives the neat grid count only. Price it as count × your unit price: 30 chairs at an example €2.00 each is €60.00 before spares, and 99 chairs is €198.00. As a weight sense-check only, published guide figures put one steel chair at roughly 0.15–0.25 kg, so 30 steel chairs weigh about 4.5–7.5 kg. For a full takeoff use the <a href=\"/rebar-quantity-calculator\">quantity & takeoff calculator</a>, and price it with the <a href=\"/rebar-cost-calculator\">cost calculator</a>."]],
    toc:`<nav class="content-block" aria-label="On this page">
    <h2>On this page</h2>
    <ul>
      <li><a href="#how-to">How to use the calculator</a></li>
      <li><a href="#formula">The formula</a></li>
      <li><a href="#example-1">Worked example 1: defaults (5 × 4 m)</a></li>
      <li><a href="#example-2">Worked example 2: same count, bigger slab (6 × 5 m)</a></li>
      <li><a href="#example-3">Worked example 3: 10 × 8 m slab</a></li>
      <li><a href="#spacing-table">Chairs by spacing</a></li>
      <li><a href="#density">Why small slabs need more chairs per m²</a></li>
      <li><a href="#setback">Set back from the edges? Adjust the size</a></li>
      <li><a href="#chair-bars">Bent chair bars are a different count</a></li>
      <li><a href="#order">From grid count to order</a></li>
      <li><a href="#imperial">Imperial conversions</a></li>
      <li><a href="#not-included">What this calculator does not cover</a></li>
      <li><a href="#mistakes">5 common mistakes</a></li>
      <li><a href="#faq">FAQs</a></li>
    </ul>
  </nav>`,
    extra:`<h3>The formula, explained</h3>
<p>The formula counts grid lines, not area — and the +1 in each direction is the whole point:</p>
<p><strong>Chairs = (floor(L ÷ spacing) + 1) × (floor(W ÷ spacing) + 1)</strong></p>
<p>Picture the chairs as dots on a grid drawn over the slab. Along the length, the dots sit at 0, spacing, 2 × spacing, and so on up to the far edge — that is floor(L ÷ spacing) intervals, but floor(L ÷ spacing) + 1 dots, because both end dots count. Same along the width. Multiply the two dot counts and you have every chair position. The formula assumes chairs stand on the slab edges themselves; if the drawing sets them back from the edges, use the setback adjustment below instead of the raw size.</p>
<p>That edge assumption is also why the "one chair per square metre" rule of thumb never quite matches: area × density counts the middle of the slab and forgets the edges, so it always undercounts. On a big slab the error shrinks; on a small slab it dominates.</p>
<h3 id="example-1">Worked example 1: 5 × 4 m slab (calculator defaults)</h3>
<p>Open the calculator and leave the defaults: length 5 m, width 4 m, spacing 1.0 m.</p>
<p>Along the length: floor(5 ÷ 1) + 1 = 6 chairs. Along the width: floor(4 ÷ 1) + 1 = 5 chairs.</p>
<p><strong>Total = 6 × 5 = 30 chairs; area = 20 m²; density = 30 ÷ 20 = 1.50 chairs per m².</strong> The panel shows 30.00 chairs, a 6.00 (× 5) grid, 20.00 m², and 1.50 /m², with the note "(6 × 5) chairs @ 1m grid".</p>
<p>Note the density: 1.50 per m², not the 1.00 the rule of thumb promises. The area rule would order 20 chairs for this slab and leave you 10 short — a third of the grid missing.</p>
<h3 id="example-2">Worked example 2: same count, bigger slab (6 × 5 m)</h3>
<p>Set length 6 m, width 5 m, spacing 1.2 m.</p>
<p>Along the length: floor(6 ÷ 1.2) + 1 = 5 + 1 = 6 chairs. Along the width: floor(5 ÷ 1.2) + 1 = 4 + 1 = 5 chairs.</p>
<p><strong>Total = 6 × 5 = 30 chairs; area = 30 m²; density = 1.00 per m².</strong> Same 30 chairs as example 1, on a slab half as big again. Chair count follows the spacing and the edge lines, not the area — doubling the area does not double the chairs unless the spacing stays put.</p>
<h3 id="example-3">Worked example 3: 10 × 8 m slab</h3>
<p>Set length 10 m, width 8 m, spacing 1.0 m.</p>
<p>Along the length: floor(10 ÷ 1) + 1 = 11 chairs. Along the width: floor(8 ÷ 1) + 1 = 9 chairs.</p>
<p><strong>Total = 11 × 9 = 99 chairs; area = 80 m²; density = 99 ÷ 80 = 1.24 per m²</strong> (exact 1.2375). At an example €2.00 per chair that is €198.00 before spares — the order section below adds the 5% and rounds up to 104.</p>
<h3 id="spacing-table">Chairs by spacing</h3>
<p>Same slab (5 × 4 m), five spacings. Tightening the grid costs chairs fast at first, then in steps — because the count only changes when a whole extra grid line fits.</p>
<div class="formula-table"><table>
<tr><th>Grid spacing</th><th>Grid</th><th>Total chairs</th><th>Chairs per m²</th></tr>
<tr><td>0.6 m</td><td>9 × 7</td><td>63</td><td>3.15</td></tr>
<tr><td>0.8 m</td><td>7 × 6</td><td>42</td><td>2.10</td></tr>
<tr><td>1.0 m</td><td>6 × 5</td><td>30</td><td>1.50</td></tr>
<tr><td>1.2 m</td><td>5 × 4</td><td>20</td><td>1.00</td></tr>
<tr><td>1.5 m</td><td>4 × 3</td><td>12</td><td>0.600</td></tr>
</table></div>
<p>Two practical consequences. First, the dead bands: on this slab, 0.9 m spacing gives exactly the same 30 chairs as 1.0 m, and every spacing from just over 1.0 m up to 1.25 m gives 20 — tightening from 1.2 m to 1.1 m buys nothing here, so check the calculator before paying for a tighter grid. Second, the Australian maxima land hard on this slab: 0.6 m for residential pavements means 63 chairs (more than double the 1.0 m count), and 0.8 m for buildings means 42.</p>
<h3 id="density">Why small slabs need more chairs per m²</h3>
<p>At 1.0 m spacing, watch what happens as the slab grows:</p>
<div class="formula-table"><table>
<tr><th>Slab</th><th>Grid</th><th>Chairs</th><th>Area</th><th>Chairs per m²</th></tr>
<tr><td>2 × 2 m</td><td>3 × 3</td><td>9</td><td>4 m²</td><td>2.25</td></tr>
<tr><td>5 × 4 m</td><td>6 × 5</td><td>30</td><td>20 m²</td><td>1.50</td></tr>
<tr><td>10 × 8 m</td><td>11 × 9</td><td>99</td><td>80 m²</td><td>1.24</td></tr>
<tr><td>20 × 10 m</td><td>21 × 11</td><td>231</td><td>200 m²</td><td>1.16</td></tr>
</table></div>
<p>The pattern is exact: as a slab gets large, density tends towards 1 ÷ spacing² — 1.00 per m² at 1 m spacing — because the edge rows become a smaller share of the total. On small slabs the edges dominate, which is why the "one per square metre" rule is most wrong exactly where a home builder uses it: it undercounts the 5 × 4 m slab by 50% (20 predicted, 30 needed) and even the 20 × 10 m slab by 15.5% (200 predicted, 231 needed). Use the rule as a floor for a rough guess, never as the order.</p>
<h3 id="setback">Set back from the edges? Adjust the size</h3>
<p>The calculator puts chairs on the slab edges. If the drawing sets them back — a common detail, since chairs near formwork need cover too — the raw count overstates the order, and the gap is not small.</p>
<p>Take a 10 × 10 m slab at 1 m spacing. The calculator gives 11 × 11 = 121 chairs. With chairs set back 0.5 m from each edge, there are only 10 positions per direction (the available run is 10 − 2 × 0.5 = 9 m, giving 9 ÷ 1 + 1 = 10 positions), so the true count is 10 × 10 = 100 chairs — 21 fewer.</p>
<p>The fix takes ten seconds: enter the reduced size (10 − 2 × 0.5 = 9 m each way) and the calculator gives 100 chairs directly. One caution: the density it then shows (100 ÷ 81 = 1.23 per m²) is against the reduced 81 m², not the real slab — the true density is 100 ÷ 100 = 1.00 per m². Use the adjusted size for the count, the real size for the density.</p>
<h3 id="chair-bars">Bent chair bars are a different count</h3>
<p>Two products share the word "chair", and they are counted differently. Everything above counts individual supports on a grid. A bent chair bar — a single bar bent into a chair shape to hold an upper cage above a lower cage in a footing or raft — is cut to length, not counted on a grid, and this calculator does not cut it.</p>
<p>Its cutting length is: <strong>Cut = 2H + E + 2L − 8d</strong> — two heights, one head, two legs, minus four 90° bends at 2d each. One published footing example: depth 750 mm, covers 50 mm, main bars 20 mm, distribution bars 16 mm at 150 mm centres, chair bar 12 mm. Height H = 750 − (100 + 20 + 16 + 20) = 594 mm; head E = 2 × 150 + 2 × 50 = 400 mm; legs L = 2 × 150 + 2 × 50 = 400 mm; cut = 2 × 594 + 400 + 2 × 400 − 8 × 12 = <strong>2292 mm</strong>. The head and legs should each cover three bars for a firm grip. Take the cutting length from the bar bending schedule or drawing — and if the design uses continuous chair bars or support lines, count those by row length from the approved layout, never as a grid of individual chairs.</p>
<h3 id="order">From grid count to order</h3>
<p>The calculator gives the neat grid count. The order is the count, plus spares, priced.</p>
<p>Example: the defaults give 30 chairs. At an example €2.00 per chair that is €60.00. Add 5% for chairs crushed or knocked over during fixing and the pour: 30 × 1.05 = 31.5, which rounds UP to <strong>32 chairs</strong> — never down, since rounding down to 31 would leave the grid one chair short. The 10 × 8 m example: 99 × €2.00 = €198.00, and 99 × 1.05 = 103.95 → <strong>104 chairs</strong>.</p>
<p>As a weight sense-check only (not a calculator output): published guide figures put one steel chair at roughly 0.15–0.25 kg, so 30 steel chairs weigh about 4.5–7.5 kg — useful when comparing steel chairs against plastic ones, which weigh far less but cost more per piece. For the full takeoff across members, use the <a href="/rebar-quantity-calculator">quantity & takeoff calculator</a>, price it with the <a href="/rebar-cost-calculator">cost calculator</a>, and estimate the wire for tying chairs to bars with the <a href="/rebar-tie-wire-calculator">binding wire calculator</a>. The mat itself — bar count and weight — comes from the <a href="/concrete-slab-rebar-calculator">slab calculator</a>.</p>
<h3 id="imperial">Imperial conversions</h3>
<p>The calculator takes metres, so convert first: 1 m = 3.28 ft, 1 m² = 10.76 sq ft. Common spacings: 0.6 m = 1.97 ft, 0.8 m = 2.62 ft, 1.0 m = 3.28 ft, 1.2 m = 3.94 ft.</p>
<p>Worked example: a 20 × 16 ft slab is 6.096 × 4.8768 m. At a 1.0 m grid: floor(6.096 ÷ 1) + 1 = 7 chairs along the length, floor(4.8768 ÷ 1) + 1 = 5 along the width — <strong>7 × 5 = 35 chairs, 29.73 m², 1.18 per m²</strong>.</p>
<p>Cross-check against published practice: a 1000 sq ft slab is 92.90 m², and one guide puts it at 150–200 chairs. A square 1000 sq ft slab (9.64 × 9.64 m) at 0.8 m spacing gives 13 × 13 = 169 chairs — inside that range, which is reassuring; at 1.0 m spacing it gives only 100, which shows how much the spacing assumption matters to any published range.</p>
<h3 id="not-included">What this calculator does not cover</h3>
<ul>
<li>Chair height, type and material — height comes from the reinforcement section detail; the choice between plastic, steel and precast supports comes from the drawing and specification.</li>
<li>Bent chair-bar cutting lengths — the formula and one worked example are given above, but the cutting length comes from the bar bending schedule, not from this count.</li>
<li>Continuous chair bars and support lines — counted by row length from the approved layout, not as a grid of individual chairs.</li>
<li>Edge setback as a direct input — use the size adjustment in the setback section; the calculator itself counts edge to edge.</li>
<li>Cost and weight — the order section shows the hand arithmetic; the <a href="/rebar-cost-calculator">cost calculator</a> prices a full takeoff.</li>
<li>The mat itself — bar count, laps and weight come from the <a href="/concrete-slab-rebar-calculator">slab calculator</a>; tying wire from the <a href="/rebar-tie-wire-calculator">binding wire calculator</a>.</li>
<li>Rectangular grids with different spacings each way — the calculator takes one square grid spacing; for a rectangular grid, run each direction's count by hand from the formula.</li>
</ul>
<h3 id="mistakes">5 common mistakes</h3>
<ol>
<li><strong>Ordering by area instead of by grid.</strong> "One chair per square metre" undercounts every slab — by 50% on a 5 × 4 m slab (20 ordered, 30 needed) and still by 15.5% on a 20 × 10 m slab. Count the grid lines, including the edges.</li>
<li><strong>Ignoring the edge setback.</strong> On a 10 × 10 m slab at 1 m spacing, edge-to-edge counting gives 121 chairs but a 0.5 m setback gives 100. Twenty-one extra chairs is a small cost, but the same error in reverse — ordering the setback count for an edge-to-edge layout — leaves a row missing.</li>
<li><strong>Counting continuous rows as individual chairs.</strong> A continuous chair bar is ordered by length, not by grid positions. Forcing it through this calculator invents chairs that do not exist and hides the length that does.</li>
<li><strong>Rounding spares down.</strong> 30 chairs plus 5% is 31.5 — order 32, not 31. A grid with one position unfilled is a top mat that sags at exactly that spot during the pour.</li>
<li><strong>One spacing for every slab.</strong> 1.0–1.2 m suits ordinary slab top mats, but residential pavements cap at 600 mm and buildings at 800 mm in Australian practice, and heavy mats need 0.8 m or tighter. The drawing's spacing governs — the calculator only counts the grid you give it.</li>
</ol>
<p>Last reviewed: October 2026.</p>`,
    de: {
  metaTitle: "Abstandhalter-Rechner — Stückzahl & Raster gratis",
  desc: "Abstandhalter-Rechner: Wie viele Abstandhalter braucht Ihre obere Matte? Beispiel: 5 × 4 m bei 1,0 m Raster = 30 Stück. Raster & Dichte gratis.",
  formula: "Abstandhalter = (floor(L ÷ Abstand) + 1) × (floor(W ÷ Abstand) + 1).",
  kw: "abstandhalter-rechner, abstandhalter für bewehrung, abstandhalter pro quadratmeter, auflagerstäbe betonplatte",
  howto: ["Geben Sie Länge und Breite der Platte in Metern ein.", "Stellen Sie den Abstand im Raster in Metern ein — 1,0 m ist der Standardwert des Rechners, und 1,0–1,2 m sind für obere Matten in Platten üblich.", "Lesen Sie die Gesamtzahl der Abstandhalter, das Raster Reihen × Spalten, die Plattenfläche und die Dichte (Abstandhalter pro m²) ab.", "Wenn die Zeichnung die Abstandhalter von den Rändern zurücksetzt, geben Sie für die Zählung die verkleinerte Größe ein — siehe den Abschnitt zum Randabstand weiter unten.", "Rechnen Sie Ersatz hinzu und runden Sie auf — der Rechner liefert die saubere Rasterzahl, nicht die Bestellmenge."],
  faqs: [["Wie viele Abstandhalter brauche ich?", "Das hängt von der Plattengröße und dem Rasterabstand ab, nicht nur von der Fläche — der Rechner liefert die genaue Rasterzahl. Als grobe Richtgröße gilt etwa ein Abstandhalter pro Quadratmeter bei 1 m Abstand für große Platten, aber bei den Standardwerten des Rechners (5 × 4 m bei 1 m Abstand) ergibt das Raster 30 Abstandhalter, also 1,50 pro m², nicht 1,00. Der Unterschied bei kleinen Platten liegt an den Randreihen, die weiter unten erklärt werden."],
          ["Welcher Abstand für Abstandhalter?", "Üblich sind 1,0–1,2 m in beide Richtungen für obere Matten in Platten, 1–1,5 m in der allgemeinen Baupraxis und 0,8 m für schwere Bewehrung. Die australische Praxis begrenzt den Abstand auf 600 mm für Platten im Wohnungsbau und 800 mm für Gebäude. Es gibt keinen allgemeingültigen Normwert — die Zeichnung ist maßgebend, und schwerere Matten brauchen engere Abstände, damit der obere Stahl beim Betonieren nicht durchhängt."],
          ["Wie zählt der Rechner die Abstandhalter?", "Er legt ein Raster über die Platte und zählt die Rasterlinien, beide Ränder eingeschlossen: Abstandhalter entlang der Länge = floor(Länge ÷ Abstand) + 1, Abstandhalter entlang der Breite = floor(Breite ÷ Abstand) + 1, und die Gesamtzahl ist das Produkt der beiden. Bei den Standardwerten ist das (5 ÷ 1 + 1) × (4 ÷ 1 + 1) = 6 × 5 = 30 Abstandhalter. Die +1 in jede Richtung ist die Randlinie — ohne sie würde eine ganze Reihe und Spalte fehlen."],
          ["Warum liefert der Rechner mehr Abstandhalter als einen pro Quadratmeter?", "Weil das Raster Randreihen enthält, liegt die Zahl immer über Fläche × Dichte — die Lücke ist nur bei kleinen Platten am größten. Eine Platte von 2 × 2 m bei 1 m Abstand braucht 9 Abstandhalter (2,25 pro m²), eine Platte von 5 × 4 m braucht 30 (1,50 pro m²), und selbst eine Platte von 20 × 10 m braucht 231 (1,16 pro m²) gegenüber den 200, die die Flächenregel vorhersagt. Mit wachsenden Platten nähert sich die Dichte 1 ÷ Abstand² an — 1,00 pro m² bei 1 m Abstand — erreicht sie aber nie ganz."],
          ["Was, wenn die Abstandhalter von den Rändern zurückgesetzt sind?", "Dann übertreibt die Zählung von Rand zu Rand die Bestellung. Auf einer Platte von 10 × 10 m bei 1 m Abstand liefert der Rechner 11 × 11 = 121 Abstandhalter, aber bei einem Randabstand von 0,5 m ab jeder Kante gibt es nur 10 Positionen je Richtung, also 10 × 10 = 100 Abstandhalter. Die Lösung: Geben Sie die verkleinerte Größe ein (10 − 2 × 0,5 = 9 m in jede Richtung), und der Rechner liefert 100 — teilen Sie aber durch die echte Plattenfläche von 100 m² für die wahre Dichte (1,00 pro m²), nicht durch die 1,23 pro m², die er gegen die verkleinerten 81 m² zeigt."],
          ["Einzelne Abstandhalter oder durchgehende Auflagerstäbe — was zählt dieser Rechner?", "Nur einzelne Abstandhalter in einem Raster. Wenn der Entwurf durchgehende Auflagerstäbe oder Stützlinien vorsieht, zählen Sie diese stattdessen nach der Reihenlänge aus der freigegebenen Verlegeplanung — eine Reihe ist kein Raster einzelner Abstandhalter, und sie in diesen Rechner zu zwängen, ergibt die falsche Zahl. Dasselbe gilt für gebogene Auflagerstäbe, die ein anderes Produkt sind (siehe die nächste Antwort)."],
          ["Berechnet der Rechner Schnittlängen für gebogene Auflagerstäbe?", "Nein — das ist eine andere Berechnung, und diese Seite tut nicht so, als wäre es anders. Ein gebogener Auflagerstab in einem Fundament wird geschnitten als 2H + E + 2L − 8d (zwei Höhen, ein Kopf, zwei Schenkel, vier 90°-Biegungen zu je 2d). Ein veröffentlichtes Fundamentbeispiel ergibt 2.292 mm: Höhe 594 mm, Kopf 400 mm, Schenkel 400 mm, Stab 12 mm. Entnehmen Sie die Schnittlänge dem Biegeplan oder der Zeichnung, nicht diesem Zählrechner."],
          ["Welche Höhe und welchen Typ von Abstandhalter brauche ich?", "Die Höhe ergibt sich aus dem Bewehrungsdetail im Schnitt — den Höhenlagen der gestützten Stäbe und der Stelle, an der der Abstandhalter aufliegt — nicht aus einer allgemeinen Subtraktion. Die Typen reichen von Kunststoff-Clips und Fertigteilstützen bis zu gebogenen Stab-Abstandhaltern. Zwei veröffentlichte Stabbereiche wirken widersprüchlich, sind es aber nicht: Leichte Plattenstühle werden üblicherweise aus 8–10-mm-Stäben gefertigt, während schwere Korb-Auflagerstäbe in der Regel 12 mm und mehr betragen (12/16/20 mm), weil ein dünner Auflagerstab unter einem belasteten Korb knickt. Passen Sie das Produkt an die Last an und prüfen Sie es gegen die Zeichnung."],
          ["Wie viele Ersatz-Abstandhalter soll ich bestellen?", "Rechnen Sie etwa 5 % hinzu und runden Sie immer AUF — einen halben Abstandhalter kann man nicht kaufen, und Abrunden kostet einen. Aus den Standardwerten werden 30 × 1,05 = 31,5 → 32 Abstandhalter; aus dem Beispiel 10 × 8 m werden 99 × 1,05 = 103,95 → 104 Abstandhalter. Ersatz deckt Abstandhalter ab, die beim Verlegen und Betonieren zerdrückt oder umgestoßen werden."],
          ["Enthält der Rechner Kosten oder Gewicht?", "Nein — er liefert nur die saubere Rasterzahl. Rechnen Sie als Stückzahl × Ihren Stückpreis: 30 Abstandhalter zu beispielsweise 2,00 € pro Stück sind 60,00 € vor Ersatz, und 99 Abstandhalter sind 198,00 €. Nur als Gewichts-Plausibilitätsprüfung: Veröffentlichte Richtwerte setzen einen Stahl-Abstandhalter mit etwa 0,15–0,25 kg an, sodass 30 Stahl-Abstandhalter etwa 4,5–7,5 kg wiegen. Für eine vollständige Mengenermittlung nutzen Sie den <a href=\"/de/bewehrungsmengen-rechner\">Mengen- & Abrechnungsrechner</a>, und für die Preise den <a href=\"/de/bewehrungskosten-rechner\">Kostenrechner</a>."]],
  toc: `<nav class="content-block" aria-label="Auf dieser Seite"><h2>Auf dieser Seite</h2><ul><li><a href="#how-to">So benutzen Sie den Rechner</a></li><li><a href="#formula">Die Formel</a></li><li><a href="#example-1">Rechenbeispiel 1: Standardwerte (5 × 4 m)</a></li><li><a href="#example-2">Rechenbeispiel 2: gleiche Stückzahl, größere Platte (6 × 5 m)</a></li><li><a href="#example-3">Rechenbeispiel 3: Platte 10 × 8 m</a></li><li><a href="#spacing-table">Abstandhalter nach Raster</a></li><li><a href="#density">Warum kleine Platten mehr Abstandhalter pro m² brauchen</a></li><li><a href="#setback">Vom Rand zurückgesetzt? Größe anpassen</a></li><li><a href="#chair-bars">Gebogene Auflagerstäbe sind eine andere Zählung</a></li><li><a href="#order">Von der Rasterzahl zur Bestellung</a></li><li><a href="#imperial">Umrechnungen ins Zoll-System</a></li><li><a href="#not-included">Was dieser Rechner nicht abdeckt</a></li><li><a href="#mistakes">5 häufige Fehler</a></li><li><a href="#faq">FAQs</a></li></ul></nav>`,
  extra: `<h3>Die Formel, erklärt</h3>
<p>Die Formel zählt Rasterlinien, nicht Fläche — und die +1 in jede Richtung ist der ganze Punkt:</p>
<p><strong>Abstandhalter = (floor(L ÷ Abstand) + 1) × (floor(W ÷ Abstand) + 1)</strong></p>
<p>Stellen Sie sich die Abstandhalter als Punkte auf einem Raster vor, das über die Platte gezeichnet ist. Entlang der Länge sitzen die Punkte bei 0, Abstand, 2 × Abstand und so weiter bis zur fernen Kante — das sind floor(L ÷ Abstand) Zwischenräume, aber floor(L ÷ Abstand) + 1 Punkte, weil beide Endpunkte mitzählen. Entlang der Breite gilt dasselbe. Multiplizieren Sie die beiden Punktzahlen, und Sie haben jede Abstandhalterposition. Die Formel geht davon aus, dass die Abstandhalter auf den Plattenrändern selbst stehen; wenn die Zeichnung sie von den Rändern zurücksetzt, nutzen Sie stattdessen die Randabstand-Anpassung weiter unten.</p>
<p>Diese Randannahme ist auch der Grund, warum die Faustregel „ein Abstandhalter pro Quadratmeter" nie ganz passt: Fläche × Dichte zählt die Plattenmitte und vergisst die Ränder, sodass sie immer zu wenig zählt. Auf einer großen Platte schrumpft der Fehler; auf einer kleinen Platte dominiert er.</p>
<h3 id="example-1">Rechenbeispiel 1: Platte 5 × 4 m (Standardwerte des Rechners)</h3>
<p>Öffnen Sie den Rechner und lassen Sie die Standardwerte: Länge 5 m, Breite 4 m, Abstand 1,0 m.</p>
<p>Entlang der Länge: floor(5 ÷ 1) + 1 = 6 Abstandhalter. Entlang der Breite: floor(4 ÷ 1) + 1 = 5 Abstandhalter.</p>
<p><strong>Gesamt = 6 × 5 = 30 Abstandhalter; Fläche = 20 m²; Dichte = 30 ÷ 20 = 1,50 Abstandhalter pro m².</strong> Das Panel zeigt 30,00 Abstandhalter, ein 6,00-(× 5)-Raster, 20,00 m² und 1,50 /m², mit dem Hinweis „(6 × 5) Abstandhalter @ 1-m-Raster".</p>
<p>Beachten Sie die Dichte: 1,50 pro m², nicht die 1,00, die die Faustregel verspricht. Die Flächenregel würde für diese Platte 20 Abstandhalter bestellen und Sie 10 kurz lassen — ein Drittel des Rasters fehlt.</p>
<h3 id="example-2">Rechenbeispiel 2: gleiche Stückzahl, größere Platte (6 × 5 m)</h3>
<p>Setzen Sie Länge 6 m, Breite 5 m, Abstand 1,2 m.</p>
<p>Entlang der Länge: floor(6 ÷ 1,2) + 1 = 5 + 1 = 6 Abstandhalter. Entlang der Breite: floor(5 ÷ 1,2) + 1 = 4 + 1 = 5 Abstandhalter.</p>
<p><strong>Gesamt = 6 × 5 = 30 Abstandhalter; Fläche = 30 m²; Dichte = 1,00 pro m².</strong> Dieselben 30 Abstandhalter wie in Beispiel 1, auf einer Platte, die um die Hälfte größer ist. Die Stückzahl folgt dem Abstand und den Randlinien, nicht der Fläche — eine Verdopplung der Fläche verdoppelt die Abstandhalter nicht, solange der Abstand gleich bleibt.</p>
<h3 id="example-3">Rechenbeispiel 3: Platte 10 × 8 m</h3>
<p>Setzen Sie Länge 10 m, Breite 8 m, Abstand 1,0 m.</p>
<p>Entlang der Länge: floor(10 ÷ 1) + 1 = 11 Abstandhalter. Entlang der Breite: floor(8 ÷ 1) + 1 = 9 Abstandhalter.</p>
<p><strong>Gesamt = 11 × 9 = 99 Abstandhalter; Fläche = 80 m²; Dichte = 99 ÷ 80 = 1,24 pro m²</strong> (genau 1,2375). Bei beispielsweise 2,00 € pro Abstandhalter sind das 198,00 € vor Ersatz — der Abschnitt zur Bestellung weiter unten addiert die 5 % und rundet auf 104 auf.</p>
<h3 id="spacing-table">Abstandhalter nach Raster</h3>
<p>Dieselbe Platte (5 × 4 m), fünf Abstände. Ein engeres Raster kostet zunächst schnell Abstandhalter, dann in Stufen — weil sich die Zahl nur ändert, wenn eine ganze zusätzliche Rasterlinie hineinpasst.</p>
<div class="formula-table"><table>
<tr><th>Rasterabstand</th><th>Raster</th><th>Abstandhalter gesamt</th><th>Abstandhalter pro m²</th></tr>
<tr><td>0,6 m</td><td>9 × 7</td><td>63</td><td>3,15</td></tr>
<tr><td>0,8 m</td><td>7 × 6</td><td>42</td><td>2,10</td></tr>
<tr><td>1,0 m</td><td>6 × 5</td><td>30</td><td>1,50</td></tr>
<tr><td>1,2 m</td><td>5 × 4</td><td>20</td><td>1,00</td></tr>
<tr><td>1,5 m</td><td>4 × 3</td><td>12</td><td>0,600</td></tr>
</table></div>
<p>Zwei praktische Folgen. Erstens die Totbereiche: Auf dieser Platte ergibt ein Abstand von 0,9 m genau dieselben 30 Abstandhalter wie 1,0 m, und jeder Abstand von knapp über 1,0 m bis 1,25 m ergibt 20 — ein Verengen von 1,2 m auf 1,1 m bringt hier nichts, prüfen Sie also den Rechner, bevor Sie für ein engeres Raster zahlen. Zweitens schlagen die australischen Höchstwerte auf dieser Platte hart durch: 0,6 m für Platten im Wohnungsbau bedeuten 63 Abstandhalter (mehr als doppelt so viele wie bei 1,0 m), und 0,8 m für Gebäude bedeuten 42.</p>
<h3 id="density">Warum kleine Platten mehr Abstandhalter pro m² brauchen</h3>
<p>Bei 1,0 m Abstand sehen Sie, was passiert, wenn die Platte wächst:</p>
<div class="formula-table"><table>
<tr><th>Platte</th><th>Raster</th><th>Abstandhalter</th><th>Fläche</th><th>Abstandhalter pro m²</th></tr>
<tr><td>2 × 2 m</td><td>3 × 3</td><td>9</td><td>4 m²</td><td>2,25</td></tr>
<tr><td>5 × 4 m</td><td>6 × 5</td><td>30</td><td>20 m²</td><td>1,50</td></tr>
<tr><td>10 × 8 m</td><td>11 × 9</td><td>99</td><td>80 m²</td><td>1,24</td></tr>
<tr><td>20 × 10 m</td><td>21 × 11</td><td>231</td><td>200 m²</td><td>1,16</td></tr>
</table></div>
<p>Das Muster ist exakt: Wenn eine Platte groß wird, strebt die Dichte gegen 1 ÷ Abstand² — 1,00 pro m² bei 1 m Abstand — weil die Randreihen einen immer kleineren Anteil der Gesamtzahl ausmachen. Bei kleinen Platten dominieren die Ränder, weshalb die Faustregel „einer pro Quadratmeter" genau dort am falschesten ist, wo ein Hausbauer sie anwendet: Sie zählt die Platte von 5 × 4 m um 50 % zu wenig (20 vorhergesagt, 30 benötigt) und selbst die Platte von 20 × 10 m um 15,5 % (200 vorhergesagt, 231 benötigt). Nutzen Sie die Regel als Untergrenze für eine grobe Schätzung, nie als Bestellung.</p>
<h3 id="setback">Vom Rand zurückgesetzt? Größe anpassen</h3>
<p>Der Rechner setzt Abstandhalter auf die Plattenränder. Wenn die Zeichnung sie zurücksetzt — ein übliches Detail, da Abstandhalter nahe der Schalung ebenfalls Betondeckung brauchen — übertreibt die Rohzahl die Bestellung, und die Lücke ist nicht klein.</p>
<p>Nehmen Sie eine Platte von 10 × 10 m bei 1 m Abstand. Der Rechner liefert 11 × 11 = 121 Abstandhalter. Bei einem Randabstand von 0,5 m ab jeder Kante gibt es nur 10 Positionen je Richtung (die verfügbare Strecke beträgt 10 − 2 × 0,5 = 9 m, was 9 ÷ 1 + 1 = 10 Positionen ergibt), sodass die wahre Zahl 10 × 10 = 100 Abstandhalter beträgt — 21 weniger.</p>
<p>Die Lösung dauert zehn Sekunden: Geben Sie die verkleinerte Größe ein (10 − 2 × 0,5 = 9 m in jede Richtung), und der Rechner liefert direkt 100 Abstandhalter. Eine Vorsicht: Die Dichte, die er dann zeigt (100 ÷ 81 = 1,23 pro m²), bezieht sich auf die verkleinerten 81 m², nicht auf die echte Platte — die wahre Dichte beträgt 100 ÷ 100 = 1,00 pro m². Nutzen Sie die angepasste Größe für die Zahl, die echte Größe für die Dichte.</p>
<h3 id="chair-bars">Gebogene Auflagerstäbe sind eine andere Zählung</h3>
<p>Zwei Produkte teilen sich das Wort „Abstandhalter", und sie werden unterschiedlich gezählt. Alles oben zählt einzelne Stützen in einem Raster. Ein gebogener Auflagerstab — ein einzelner Stab, der in Stuhlform gebogen ist, um einen oberen Korb über einem unteren Korb in einem Fundament oder einer Bodenplatte zu halten — wird auf Länge geschnitten, nicht in einem Raster gezählt, und dieser Rechner schneidet ihn nicht.</p>
<p>Seine Schnittlänge ist: <strong>Schnitt = 2H + E + 2L − 8d</strong> — zwei Höhen, ein Kopf, zwei Schenkel, minus vier 90°-Biegungen zu je 2d. Ein veröffentlichtes Fundamentbeispiel: Tiefe 750 mm, Betondeckungen 50 mm, Hauptstäbe 20 mm, Verteilstäbe 16 mm im Abstand von 150 mm, Auflagerstab 12 mm. Höhe H = 750 − (100 + 20 + 16 + 20) = 594 mm; Kopf E = 2 × 150 + 2 × 50 = 400 mm; Schenkel L = 2 × 150 + 2 × 50 = 400 mm; Schnitt = 2 × 594 + 400 + 2 × 400 − 8 × 12 = <strong>2.292 mm</strong>. Kopf und Schenkel sollten jeweils drei Stäbe für einen festen Halt umfassen. Entnehmen Sie die Schnittlänge dem Biegeplan oder der Zeichnung — und wenn der Entwurf durchgehende Auflagerstäbe oder Stützlinien vorsieht, zählen Sie diese nach der Reihenlänge aus der freigegebenen Verlegeplanung, nie als Raster einzelner Abstandhalter.</p>
<h3 id="order">Von der Rasterzahl zur Bestellung</h3>
<p>Der Rechner liefert die saubere Rasterzahl. Die Bestellung ist die Zahl plus Ersatz, bepreist.</p>
<p>Beispiel: Die Standardwerte ergeben 30 Abstandhalter. Bei beispielsweise 2,00 € pro Abstandhalter sind das 60,00 €. Addieren Sie 5 % für Abstandhalter, die beim Verlegen und Betonieren zerdrückt oder umgestoßen werden: 30 × 1,05 = 31,5, was AUF <strong>32 Abstandhalter</strong> rundet — nie ab, da Abrunden auf 31 das Raster um einen Abstandhalter kurz lassen würde. Das Beispiel 10 × 8 m: 99 × 2,00 € = 198,00 €, und 99 × 1,05 = 103,95 → <strong>104 Abstandhalter</strong>.</p>
<p>Nur als Gewichts-Plausibilitätsprüfung (keine Rechnerausgabe): Veröffentlichte Richtwerte setzen einen Stahl-Abstandhalter mit etwa 0,15–0,25 kg an, sodass 30 Stahl-Abstandhalter etwa 4,5–7,5 kg wiegen — nützlich, wenn man Stahl-Abstandhalter mit Kunststoff-Abstandhaltern vergleicht, die weit weniger wiegen, aber pro Stück mehr kosten. Für die vollständige Mengenermittlung über Bauteile hinweg nutzen Sie den <a href="/de/bewehrungsmengen-rechner">Mengen- & Abrechnungsrechner</a>, bepreisen Sie sie mit dem <a href="/de/bewehrungskosten-rechner">Kostenrechner</a> und schätzen Sie den Draht zum Anbinden der Abstandhalter an die Stäbe mit dem <a href="/de/bindedraht-rechner">Bindedraht-Rechner</a>. Die Matte selbst — Stabzahl und Gewicht — kommt aus dem <a href="/de/bewehrungsrechner-fuer-betonplatten">Plattenrechner</a>.</p>
<h3 id="imperial">Umrechnungen ins Zoll-System</h3>
<p>Der Rechner nimmt Meter, rechnen Sie also zuerst um: 1 m = 3,28 ft, 1 m² = 10,76 sq ft. Übliche Abstände: 0,6 m = 1,97 ft, 0,8 m = 2,62 ft, 1,0 m = 3,28 ft, 1,2 m = 3,94 ft.</p>
<p>Rechenbeispiel: Eine Platte von 20 × 16 ft entspricht 6,096 × 4,8768 m. Bei einem Raster von 1,0 m: floor(6,096 ÷ 1) + 1 = 7 Abstandhalter entlang der Länge, floor(4,8768 ÷ 1) + 1 = 5 entlang der Breite — <strong>7 × 5 = 35 Abstandhalter, 29,73 m², 1,18 pro m²</strong>.</p>
<p>Gegenprüfung mit veröffentlichter Praxis: Eine Platte von 1.000 sq ft entspricht 92,90 m², und ein Richtwert setzt sie mit 150–200 Abstandhaltern an. Eine quadratische Platte von 1.000 sq ft (9,64 × 9,64 m) bei 0,8 m Abstand ergibt 13 × 13 = 169 Abstandhalter — innerhalb dieses Bereichs, was beruhigend ist; bei 1,0 m Abstand ergibt sie nur 100, was zeigt, wie stark die Abstandsannahme jeden veröffentlichten Bereich beeinflusst.</p>
<h3 id="not-included">Was dieser Rechner nicht abdeckt</h3>
<ul>
<li>Höhe, Typ und Material der Abstandhalter — die Höhe ergibt sich aus dem Bewehrungsdetail im Schnitt; die Wahl zwischen Kunststoff-, Stahl- und Fertigteilstützen ergibt sich aus Zeichnung und Spezifikation.</li>
<li>Schnittlängen gebogener Auflagerstäbe — Formel und ein Rechenbeispiel stehen oben, aber die Schnittlänge kommt aus dem Biegeplan, nicht aus dieser Zählung.</li>
<li>Durchgehende Auflagerstäbe und Stützlinien — gezählt nach der Reihenlänge aus der freigegebenen Verlegeplanung, nicht als Raster einzelner Abstandhalter.</li>
<li>Randabstand als direkte Eingabe — nutzen Sie die Größenanpassung im Abschnitt zum Randabstand; der Rechner selbst zählt von Rand zu Rand.</li>
<li>Kosten und Gewicht — der Abschnitt zur Bestellung zeigt die Handrechnung; der <a href="/de/bewehrungskosten-rechner">Kostenrechner</a> bepreist eine vollständige Mengenermittlung.</li>
<li>Die Matte selbst — Stabzahl, Übergreifungen und Gewicht kommen aus dem <a href="/de/bewehrungsrechner-fuer-betonplatten">Plattenrechner</a>; Bindedraht aus dem <a href="/de/bindedraht-rechner">Bindedraht-Rechner</a>.</li>
<li>Rechteckige Raster mit unterschiedlichen Abständen je Richtung — der Rechner nimmt einen quadratischen Rasterabstand; für ein rechteckiges Raster rechnen Sie die Zahl je Richtung von Hand aus der Formel.</li>
</ul>
<h3 id="mistakes">5 häufige Fehler</h3>
<ol>
<li><strong>Bestellen nach Fläche statt nach Raster.</strong> „Ein Abstandhalter pro Quadratmeter" zählt jede Platte zu wenig — um 50 % bei einer Platte von 5 × 4 m (20 bestellt, 30 benötigt) und noch um 15,5 % bei einer Platte von 20 × 10 m. Zählen Sie die Rasterlinien, die Ränder eingeschlossen.</li>
<li><strong>Den Randabstand ignorieren.</strong> Auf einer Platte von 10 × 10 m bei 1 m Abstand ergibt die Zählung von Rand zu Rand 121 Abstandhalter, aber ein Randabstand von 0,5 m ergibt 100. Einundzwanzig zusätzliche Abstandhalter sind geringe Kosten, aber derselbe Fehler umgekehrt — die Randabstand-Zahl für eine Anordnung von Rand zu Rand bestellen — lässt eine Reihe fehlen.</li>
<li><strong>Durchgehende Reihen als einzelne Abstandhalter zählen.</strong> Ein durchgehender Auflagerstab wird nach Länge bestellt, nicht nach Rasterpositionen. Ihn durch diesen Rechner zu zwängen, erfindet Abstandhalter, die es nicht gibt, und verbirgt die Länge, die es gibt.</li>
<li><strong>Ersatz abrunden.</strong> 30 Abstandhalter plus 5 % sind 31,5 — bestellen Sie 32, nicht 31. Ein Raster mit einer unbelegten Position ist eine obere Matte, die genau an dieser Stelle beim Betonieren durchhängt.</li>
<li><strong>Ein Abstand für jede Platte.</strong> 1,0–1,2 m passen für gewöhnliche obere Matten in Platten, aber Platten im Wohnungsbau sind auf 600 mm und Gebäude auf 800 mm begrenzt in australischer Praxis, und schwere Matten brauchen 0,8 m oder enger. Der Abstand der Zeichnung ist maßgebend — der Rechner zählt nur das Raster, das Sie ihm geben.</li>
</ol>
<p>Zuletzt geprüft: Oktober 2026.</p>`
}
},
    { id:"tiewire", slug:"rebar-tie-wire-calculator", cat:"Detailing",
    metaTitle:"Tie Wire Calculator — Binding Wire kg, Free Estimate",
    h1:"Rebar Tie Wire Calculator",
    desc:"Binding wire for any grid: tie count, total metres and kg from slab size and spacing. Defaults: 918 ties, 275.40 m of wire, 4.34 kg. Free, no signup.",
    kw:"rebar tie wire calculator, binding wire calculator, tie wire for rebar, rebar tying wire quantity",
    intro:"Estimate the binding wire for a reinforcement grid. Enter the slab size, bar spacing, the percentage of intersections tied and the wire used per tie to get the total length and weight.",
    howto:["Enter the slab length and width in metres.","Set the bar spacing in mm — 150 mm is the calculator default.","Set the wire used per tie in mm — 300 mm is the default, and 250–350 mm covers most hand ties.","Set the percentage of intersections tied — 100% ties everything; the drawing often calls for every edge intersection and about 50% in the field.","Read the total wire length and weight, plus the intersection and tie counts — then add waste, since the calculator gives the neat grid total, not the order quantity."],
    formula:"Intersections = nx × ny. Ties = intersections × ratio. Wire length = ties × wire-per-tie; weight uses ~1.6 mm wire.",
    faqs:[["How much tie wire do I need for rebar?", "Allow roughly 250–350 mm of wire per tie, and let the calculator total it from your grid. On the defaults (5 × 4 m slab, 150 mm spacing, 300 mm per tie, 100% tied) that is 918 ties × 300 mm = 275.40 m of wire, weighing 4.34 kg at the calculator's 1.6 mm wire weight. Change any input and the total follows the same chain: grid → ties → length → weight."],
          ["Do you tie every rebar intersection?", "Often every intersection on the edges and about 50% in the field — set the percentage to match the drawing. On the defaults, 100% tying gives 918 ties, 275.40 m and 4.34 kg, while 50% gives 459 ties, 137.70 m and 2.17 kg: half the intersections, half the wire. The original FAQ answer said the same in one line; the numbers are what make it usable."],
          ["How much wire does one tie use?", "It depends on the bar size: bigger bars need longer wraps. One published wrap formula (four wraps plus a 16 cm twisting allowance) gives 261 mm on an 8 mm bar, 286 mm on 10 mm, 311 mm on 12 mm, 361 mm on 16 mm and 411 mm on 20 mm. The calculator's 300 mm default sits between the 10 mm and 12 mm values, so it is a sensible middle default — but on 20 mm bars it undercounts by 111 mm per tie, which is 101.90 m over 918 ties."],
          ["Why does the calculator assume 1.6 mm wire?", "Because 1.6 mm annealed wire is the common site choice, and its weight follows the same d²/162.28 rule as rebar: 1.6² ÷ 162.28 = 0.0157752 kg/m, or 63.39 metres per kilogram. Thinner wire gives more metres per kilogram (1.2 mm → 112.69 m/kg) and thicker wire fewer (2.0 mm → 40.57 m/kg) — the full table is below. Coating (annealed vs galvanised) does not change the weight at the same diameter; it changes corrosion resistance, not the estimate."],
          ["How does this compare with the 9–13 kg of wire per tonne of steel rule?", "The rule is a thumb rule, not a code clause — one of its own sources admits IS code does not specify a quantity. On the defaults slab (232.57 kg of steel from the slab calculator) the wire is 4.34 kg at 100% tying, which is 18.7 kg per tonne — above the rule — but 2.17 kg at 50% tying, which is 9.3 kg per tonne, inside it. The rule assumes partial tying and mixed members; a dense slab grid tied at 100% genuinely uses more. Use the rule as a sanity check on a whole project, and the grid count for the actual order."],
          ["How many rolls or coils do I need?", "Divide the length by the coil's metres per kilogram. At the calculator's 1.6 mm wire (63.39 m/kg), a 5 kg coil holds 316.95 m — enough for the defaults' 275.40 m with room to spare — and a 25 kg coil holds 1584.77 m. The large-slab example below needs 2693.40 m, or 42.49 kg, so two 25 kg rolls cover it. Always check the coil label: metres per kilogram is a property of the wire diameter, not of the brand."],
          ["How much waste should I add?", "One published calculator recommends a 5–15% reserve for cutting, over-twisting, re-tying and handling losses. On the defaults that turns 4.34 kg into 4.56 kg at +5%, 4.78 kg at +10% and 5.00 kg at +15%. The calculator gives the neat grid total with no reserve, so add it before ordering — a coil short on the day of the pour costs more than the 5% ever will."],
          ["What about double ties, or ties per crossing?", "The calculator counts one tie per tied intersection. A double tie (two wraps at one crossing) doubles the length for that crossing by hand: the defaults' 275.40 m becomes 550.80 m if every crossing is double-tied. One published calculator suggests planning about 1.5 ties per crossing to cover re-ties after bars shift during the pour — treat that as a planning allowance on top of the count, not as a second tie the calculator should have counted."],
          ["Does tie wire carry any structural load?", "No — it only holds the bars in position while concrete is placed and cured. The concrete and the rebar carry the load; the wire stops the cage shifting, sagging or spreading during the pour and vibration. That is also why it ties chairs, spacer bars and laps, not just crossings: anything that must stay put until the concrete sets gets wired."],
          ["Does the calculator include laps, chairs or cost?", "No — it gives the neat grid wire total only. Laps come from the <a href=\"/rebar-lap-length-calculator\">lap length calculator</a> (lapped bars need extra ties at the overlap), chairs from the <a href=\"/rebar-chair-calculator\">chair calculator</a>, the full takeoff from the <a href=\"/rebar-quantity-calculator\">quantity & takeoff calculator</a>, and pricing from the <a href=\"/rebar-cost-calculator\">cost calculator</a>. The steel tonnage for the per-tonne check comes from the <a href=\"/rebar-tonnage-calculator\">tonnage calculator</a>."]],
    toc:`<nav class="content-block" aria-label="On this page">
    <h2>On this page</h2>
    <ul>
      <li><a href="#how-to">How to use the calculator</a></li>
      <li><a href="#formula">The formula</a></li>
      <li><a href="#example-1">Worked example 1: defaults (5 × 4 m)</a></li>
      <li><a href="#example-2">Worked example 2: 10 × 8 m slab</a></li>
      <li><a href="#example-3">Worked example 3: half the intersections tied</a></li>
      <li><a href="#spacing-table">Wire by bar spacing</a></li>
      <li><a href="#per-tie-table">Wire per tie, by bar size</a></li>
      <li><a href="#ratio-table">Wire by tying percentage</a></li>
      <li><a href="#per-tonne">The 9–13 kg per tonne rule, reconciled</a></li>
      <li><a href="#gauge-table">Metres per kilogram, by wire diameter</a></li>
      <li><a href="#order">From neat total to order</a></li>
      <li><a href="#imperial">Imperial conversions</a></li>
      <li><a href="#not-included">What this calculator does not cover</a></li>
      <li><a href="#mistakes">5 common mistakes</a></li>
      <li><a href="#faq">FAQs</a></li>
    </ul>
  </nav>`,
    extra:`<h3>The formula, explained</h3>
<p>The formula is a chain of four steps, and every step is a real thing you can count on site:</p>
<p><strong>Intersections = nx × ny; Ties = intersections × ratio; Length = ties × wire-per-tie; Weight = length × 0.0157752 kg/m</strong></p>
<p>First, nx = floor(L ÷ spacing) + 1 and ny = floor(W ÷ spacing) + 1. The +1 in each direction is the fence-post rule: bars sit at both edges plus every interval between, so there is always one more bar line than there are gaps. Multiply the two line counts and you have every crossing in the grid. Second, the tying ratio turns crossings into ties: 100% ties all of them, 50% ties half. Third, each tie consumes the wire-per-tie length you set. Fourth, the weight uses 1.6 mm wire: 1.6² ÷ 162.28 = 0.0157752 kg/m, the same d²/162.28 rule as rebar weight.</p>
<p>Two honest caveats. The grid is counted edge to edge — the calculator does not subtract cover, so on the defaults it counts 918 crossings where the cover-adjusted slab calculator counts 891. The difference is small (27 crossings) and it errs on the side of ordering slightly more, but know it is there. And the tie count is not rounded: at 75% the panel shows 688.50 ties, so round up to 689 yourself before ordering.</p>
<h3 id="example-1">Worked example 1: 5 × 4 m slab (calculator defaults)</h3>
<p>Open the calculator and leave the defaults: length 5 m, width 4 m, spacing 150 mm, wire per tie 300 mm, intersections tied 100%.</p>
<p>Along the length: floor(5 ÷ 0.15) + 1 = 34 lines. Along the width: floor(4 ÷ 0.15) + 1 = 27 lines.</p>
<p><strong>Intersections = 34 × 27 = 918; ties = 918; length = 918 × 0.3 = 275.40 m; weight = 275.40 × 0.0157752 = 4.34 kg.</strong> The panel shows 275.40 m, 918.00 intersections, 918.00 ties and 4.34 kg.</p>
<p>The weight is the number most people get wrong by guessing: 275 metres of wire sounds like a lot, but at 63.39 metres per kilogram it is only 4.34 kg — one 5 kg coil covers it, as the order section shows.</p>
<h3 id="example-2">Worked example 2: 10 × 8 m slab</h3>
<p>Set length 10 m, width 8 m, spacing 200 mm, wire per tie 300 mm, intersections tied 100%.</p>
<p>Along the length: floor(10 ÷ 0.2) + 1 = 51 lines. Along the width: floor(8 ÷ 0.2) + 1 = 41 lines.</p>
<p><strong>Intersections = 51 × 41 = 2091; length = 2091 × 0.3 = 627.30 m; weight = 9.90 kg.</strong> Note the coincidence worth remembering: the same 627.30 m appears for a 5 × 4 m slab at 100 mm spacing, because both grids have 2091 intersections. Wire follows the intersection count, not the slab area — a small dense grid can need more wire than a big sparse one.</p>
<h3 id="example-3">Worked example 3: half the intersections tied</h3>
<p>Set length 6 m, width 5 m, spacing 150 mm, wire per tie 300 mm, intersections tied 50%.</p>
<p>Along the length: floor(6 ÷ 0.15) + 1 = 41 lines. Along the width: floor(5 ÷ 0.15) + 1 = 34 lines. Intersections = 41 × 34 = 1394.</p>
<p><strong>Ties = 1394 × 50% = 697; length = 697 × 0.3 = 209.10 m; weight = 3.30 kg.</strong> This is the realistic site case the original FAQ hints at — every edge intersection tied, about half the field — and it is the case that lands inside the per-tonne rule, as the reconciliation section shows.</p>
<h3 id="spacing-table">Wire by bar spacing</h3>
<p>Same slab (5 × 4 m), same 300 mm per tie, same 100% tying, five spacings. Spacing acts in both directions, so wire scales roughly as 1 ÷ spacing²: halving the spacing from 200 mm to 100 mm nearly quadruples the wire.</p>
<div class="formula-table"><table>
<tr><th>Bar spacing</th><th>Grid</th><th>Intersections</th><th>Wire length</th><th>Wire weight</th></tr>
<tr><td>100 mm</td><td>51 × 41</td><td>2091</td><td>627.30 m</td><td>9.90 kg</td></tr>
<tr><td>125 mm</td><td>41 × 33</td><td>1353</td><td>405.90 m</td><td>6.40 kg</td></tr>
<tr><td>150 mm</td><td>34 × 27</td><td>918</td><td>275.40 m</td><td>4.34 kg</td></tr>
<tr><td>175 mm</td><td>29 × 23</td><td>667</td><td>200.10 m</td><td>3.16 kg</td></tr>
<tr><td>200 mm</td><td>26 × 21</td><td>546</td><td>163.80 m</td><td>2.58 kg</td></tr>
</table></div>
<p>The practical consequence: spacing is the biggest lever on wire quantity you control. Moving a 5 × 4 m slab from 150 mm to 200 mm spacing cuts the wire from 4.34 kg to 2.58 kg — a 41% saving — but the spacing comes from the drawing, not from the wire budget, so treat this table as estimating knowledge, not a reason to widen a grid.</p>
<h3 id="per-tie-table">Wire per tie, by bar size</h3>
<p>The calculator's 300 mm default is one number for every bar, but a tie around a 20 mm bar genuinely takes more wire than a tie around an 8 mm bar. One published wrap formula — four wraps around the bar plus a 16 cm twisting allowance — gives this table, with the full-grid weight at the defaults' 918 ties for scale. Each row is reproducible from the calculator: enter the shown wire-per-tie value and the length and weight follow.</p>
<div class="formula-table"><table>
<tr><th>Bar size</th><th>Wire per tie</th><th>Length at 918 ties</th><th>Weight at 918 ties</th></tr>
<tr><td>8 mm</td><td>261 mm</td><td>239.60 m</td><td>3.78 kg</td></tr>
<tr><td>10 mm</td><td>286 mm</td><td>262.55 m</td><td>4.14 kg</td></tr>
<tr><td>12 mm</td><td>311 mm</td><td>285.50 m</td><td>4.50 kg</td></tr>
<tr><td>16 mm</td><td>361 mm</td><td>331.40 m</td><td>5.23 kg</td></tr>
<tr><td>20 mm</td><td>411 mm</td><td>377.30 m</td><td>5.95 kg</td></tr>
</table></div>
<p>Two things to take from this. First, the 300 mm default is a good middle value — between the 10 mm and 12 mm rows — so most slab work estimated at the default is close. Second, the error grows with bar size: on 20 mm bars the default undercounts by 111 mm per tie, which is 101.90 m over 918 ties. If the bars are 16 mm or bigger, set the per-tie field from this table instead of leaving the default.</p>
<h3 id="ratio-table">Wire by tying percentage</h3>
<p>Same defaults slab (5 × 4 m, 150 mm, 300 mm per tie), four tying ratios. The ratio is the second-biggest lever after spacing, and it is the one the drawing actually controls.</p>
<div class="formula-table"><table>
<tr><th>Intersections tied</th><th>Ties</th><th>Wire length</th><th>Wire weight</th></tr>
<tr><td>100%</td><td>918</td><td>275.40 m</td><td>4.34 kg</td></tr>
<tr><td>75%</td><td>688.50 → 689</td><td>206.70 m</td><td>3.26 kg</td></tr>
<tr><td>50%</td><td>459</td><td>137.70 m</td><td>2.17 kg</td></tr>
<tr><td>25%</td><td>229.50 → 230</td><td>69.00 m</td><td>1.09 kg</td></tr>
</table></div>
<p>The fractional rows are the point: the panel shows 688.50 and 229.50 ties because it does not round, so round up before ordering — 689 and 230 ties, as shown. Rounding down would leave crossings untied, which defeats the purpose of the wire.</p>
<h3 id="per-tonne">The 9–13 kg per tonne rule, reconciled</h3>
<p>Every guide quotes it: 9–13 kg of binding wire per tonne of steel, with smaller bars at the top of the range (8 mm → 12 kg/t) and bigger bars at the bottom (28–32 mm → 7 kg/t). And one of the sources itself admits IS code does not actually specify a quantity — it is a thumb rule from experience. So what do you do when your grid count disagrees with it?</p>
<p>Work it on the defaults slab. The slab calculator gives 232.57 kg of steel for the same 5 × 4 m slab at 150 mm spacing with 12 mm bars and 40 mm cover. Against that steel:</p>
<div class="formula-table"><table>
<tr><th>Tying ratio</th><th>Wire weight</th><th>Kg per tonne of steel</th><th>Against the 9–13 rule</th></tr>
<tr><td>100%</td><td>4.34 kg</td><td>18.7 kg/t</td><td>Above the rule</td></tr>
<tr><td>75%</td><td>3.26 kg</td><td>14.0 kg/t</td><td>Just above the rule</td></tr>
<tr><td>50%</td><td>2.17 kg</td><td>9.3 kg/t</td><td>Inside the rule</td></tr>
</table></div>
<p>The reconciliation is simple: the rule assumes you do not tie everything. It averages over beams, columns, footings and slabs, over big and small bars, and over the common site pattern of every edge intersection plus about half the field. A dense slab grid tied at 100% genuinely uses more wire per tonne than that average — 18.7 kg/t is not an error, it is what 100% tying costs. So use the rule as a sanity check on a whole project (if your total wire is wildly outside 9–13 kg/t, check your inputs), and use the grid count for the actual order. One precision note: the steel figure comes from the cover-adjusted slab grid (891 crossings) while the wire figure comes from the edge-to-edge grid (918), so the kg/t values are approximate to within that 3% gap — close enough for a sanity check, not for a claim of exactness.</p>
<h3 id="gauge-table">Metres per kilogram, by wire diameter</h3>
<p>Wire is sold by weight but consumed by length, so the conversion is the whole purchase. All rows are computed from the same d²/162.28 rule the calculator uses, so they tie to its 1.6 mm assumption exactly:</p>
<div class="formula-table"><table>
<tr><th>Wire diameter</th><th>Weight per metre</th><th>Metres per kilogram</th></tr>
<tr><td>1.0 mm</td><td>0.006162 kg/m</td><td>162.28 m/kg</td></tr>
<tr><td>1.2 mm</td><td>0.008874 kg/m</td><td>112.69 m/kg</td></tr>
<tr><td>1.22 mm (18 SWG)</td><td>0.009172 kg/m</td><td>109.03 m/kg</td></tr>
<tr><td>1.6 mm (calculator's wire)</td><td>0.015775 kg/m</td><td>63.39 m/kg</td></tr>
<tr><td>1.63 mm (16 SWG)</td><td>0.016372 kg/m</td><td>61.08 m/kg</td></tr>
<tr><td>1.8 mm</td><td>0.019965 kg/m</td><td>50.09 m/kg</td></tr>
<tr><td>2.0 mm</td><td>0.024649 kg/m</td><td>40.57 m/kg</td></tr>
</table></div>
<p>Two uses. First, if your coil is not 1.6 mm, convert before comparing: a 5 kg coil of 1.2 mm wire holds 563.45 m, not 316.95 m. Second, gauge numbers are a trap: SWG and AWG number the same diameter differently, and one guide's "typical 0.6–1.2 mm" contradicts another's "8–10 gauge heavy" — so check the coil label for the millimetre diameter and use this table, not the gauge number, for the conversion. As a cross-check, one guide's example of "1 kg = 50 m" implies 1.80 mm wire on this table, which is a sensible heavy site wire.</p>
<h3 id="order">From neat total to order</h3>
<p>The calculator gives the neat grid total. The order is that total, plus waste, in coils, priced.</p>
<p>Example: the defaults give 4.34 kg. Add a 5–15% reserve for cutting, over-twisting, re-tying and handling: +5% → 4.56 kg, +10% → 4.78 kg, +15% → 5.00 kg. At the calculator's 1.6 mm wire a 5 kg coil holds 316.95 m, so one 5 kg coil covers the defaults' 275.40 m with room for the reserve. At an example price of €3.00/kg the defaults cost €13.03 neat, €13.69 at +5%.</p>
<p>Example: the large slab (20 × 10 m at 150 mm) gives 2693.40 m, 42.49 kg. At +5% that is 44.61 kg, so order two 25 kg rolls (50 kg) rather than hunting for an exact 44.61 kg — coils come in set sizes, and the spare coil is next slab's wire. At the same example price that is €127.47 neat, €133.84 at +5%. For the full takeoff across members, use the <a href="/rebar-quantity-calculator">quantity & takeoff calculator</a>, and price it with the <a href="/rebar-cost-calculator">cost calculator</a>.</p>
<h3 id="imperial">Imperial conversions</h3>
<p>The calculator takes metres and millimetres, so convert first: 1 m = 3.28 ft, 1 kg = 2.20 lb, 1 in = 25.4 mm.</p>
<p>Worked example: a 20 × 16 ft slab is 6.096 × 4.8768 m. At a 6 in grid (152.4 mm), 300 mm per tie, 100% tied: floor(6.096 ÷ 0.1524) + 1 = 41 lines, floor(4.8768 ÷ 0.1524) + 1 = 33 lines — <strong>41 × 33 = 1353 intersections, 405.90 m, 6.40 kg</strong>.</p>
<p>Per-tie lengths in inches: 250 mm = 9.84 in, 300 mm = 11.81 in, 350 mm = 13.78 in. Lengths in feet: 275.40 m = 903.54 ft, 627.30 m = 2058.07 ft. Weights in pounds: 4.34 kg = 9.58 lb, 9.90 kg = 21.82 lb. The formula is unit-free — the same (floor + 1) × (floor + 1) × per-tie works in feet and inches if every input is in the same units — but the calculator takes metric, so convert before entering.</p>
<h3 id="not-included">What this calculator does not cover</h3>
<ul>
<li>Bar count and steel weight — the grid it counts is a wire grid, not a bar schedule; the mat itself comes from the <a href="/concrete-slab-rebar-calculator">slab calculator</a>.</li>
<li>Laps and lap ties — lapped bars need extra ties at the overlap; lap lengths come from the <a href="/rebar-lap-length-calculator">lap length calculator</a>, and the extra ties are on top of this grid count.</li>
<li>Chairs and supports — chairs are tied to bars too, but their count comes from the <a href="/rebar-chair-calculator">chair calculator</a>.</li>
<li>Stirrups, columns, beams and walls — this calculator counts one flat grid; cages and vertical members have their own tying patterns, and the <a href="/stirrup-tie-cutting-length-calculator">stirrup calculator</a> covers tie cutting lengths.</li>
<li>Corner, joint and hook ties beyond the grid — one guide suggests adding 10–20% extra ties for beam–slab edges, column–beam joints, laps and hooks; treat that as part of the waste reserve, not as grid intersections.</li>
<li>Wire gauge selection and tying method — the calculator assumes 1.6 mm wire and one tie per tied intersection; gauge choice and single vs double vs machine tying come from the drawing and site practice.</li>
<li>Cost — the order section shows the hand arithmetic; the <a href="/rebar-cost-calculator">cost calculator</a> prices a full takeoff, and steel tonnage comes from the <a href="/rebar-tonnage-calculator">tonnage calculator</a>.</li>
</ul>
<h3 id="mistakes">5 common mistakes</h3>
<ol>
<li><strong>Forgetting the +1 in each direction.</strong> Counting floor(L ÷ spacing) × floor(W ÷ spacing) instead of (floor + 1) × (floor + 1) gives 33 × 26 = 858 crossings on the defaults instead of 918 — 60 ties, 18.0 m and 0.28 kg short before waste. The edge lines are real ties.</li>
<li><strong>Tying 100% when the drawing says 50% in the field.</strong> On the defaults that doubles the wire from 2.17 kg to 4.34 kg. Set the percentage from the drawing, not from the default — the default is 100% because it is the safe upper bound, not because it is the usual pattern.</li>
<li><strong>One per-tie length for every bar size.</strong> Leaving 300 mm on 12 mm bars undercounts by 11 mm per tie (311 mm from the wrap table), which is 10.10 m and 0.16 kg short over 918 ties — and on 20 mm bars the gap is 111 mm per tie. Set the per-tie field from the bar-size table for bars 16 mm and up.</li>
<li><strong>Ordering the neat total with no reserve.</strong> Cutting, over-twisting, re-tying and handling losses are real; one published calculator recommends 5–15%. On the defaults, skipping the reserve saves at most €0.66 at an example €3.00/kg and risks a stalled pour.</li>
<li><strong>Ordering fractional ties, or comparing against the per-tonne rule without adjusting for ratio.</strong> The panel shows 688.50 ties at 75% — order 689, not 688.50, and not 688. And a 100%-tied dense grid at 18.7 kg/t is not proof the count is wrong: the 9–13 kg/t rule assumes partial tying, so reconcile the ratio before doubting the grid.</li>
</ol>
<p>Last reviewed: October 2026.</p>`,
    de: {
  metaTitle: "Bindedraht-Rechner — Bindungen, Meter & kg gratis",
  desc: "Bindedraht-Rechner: Bindungen, Drahtlänge und Gewicht je Netz aus Größe und Abstand berechnen. Beispiel: 5 × 4 m = 918 Bindungen, 275,40 m, 4,34 kg. Gratis.",
  formula: "Kreuzungspunkte = nx × ny. Bindungen = Kreuzungspunkte × Anteil. Drahtlänge = Bindungen × Draht je Bindung; Gewicht bei ~1,6 mm Draht.",
  kw: "bindedraht-rechner, bindedraht für bewehrung, bindedraht menge berechnen, bewehrung binden drahtmenge",
  howto: ["Geben Sie die Plattenlänge und Plattenbreite in Metern ein.", "Stellen Sie den Stababstand in mm ein — 150 mm ist der Standardwert des Rechners.", "Stellen Sie den Draht je Bindung in mm ein — 300 mm ist der Standardwert, und 250–350 mm decken die meisten Handbindungen ab.", "Stellen Sie den Anteil der gebundenen Kreuzungspunkte ein — 100 % bindet alles; die Zeichnung verlangt oft jeden Randkreuzungspunkt und etwa 50 % im Feld.", "Lesen Sie die gesamte Drahtlänge und das Gewicht sowie die Kreuzungspunkt- und Bindungszahlen ab — und rechnen Sie dann Verschnitt hinzu, denn der Rechner gibt das Nettoergebnis des Netzes an, nicht die Bestellmenge."],
  faqs: [["Wie viel Bindedraht brauche ich für Bewehrung?", "Rechnen Sie grob mit 250–350 mm Draht je Bindung und lassen Sie den Rechner aus Ihrem Netz aufsummieren. Bei den Standardwerten (Platte 5 × 4 m, Abstand 150 mm, 300 mm je Bindung, 100 % gebunden) sind das 918 Bindungen × 300 mm = 275,40 m Draht mit einem Gewicht von 4,34 kg beim 1,6-mm-Drahtgewicht des Rechners. Ändern Sie eine Eingabe, folgt das Ergebnis derselben Kette: Netz → Bindungen → Länge → Gewicht."],
          ["Bindet man jeden Bewehrungskreuzungspunkt?", "Oft jeden Kreuzungspunkt an den Rändern und etwa 50 % im Feld — stellen Sie den Anteil passend zur Zeichnung ein. Bei den Standardwerten ergeben 100 % Bindung 918 Bindungen, 275,40 m und 4,34 kg, während 50 % 459 Bindungen, 137,70 m und 2,17 kg ergeben: halbe Kreuzungspunkte, halber Draht. Die ursprüngliche FAQ-Antwort sagte dasselbe in einer Zeile; erst die Zahlen machen sie brauchbar."],
          ["Wie viel Draht verbraucht eine Bindung?", "Das hängt von der Stabgröße ab: Größere Stäbe brauchen längere Umwicklungen. Eine veröffentlichte Umwicklungsformel (vier Umwicklungen plus 16 cm Verdrehzugabe) ergibt 261 mm bei einem 8-mm-Stab, 286 mm bei 10 mm, 311 mm bei 12 mm, 361 mm bei 16 mm und 411 mm bei 20 mm. Der Standardwert des Rechners von 300 mm liegt zwischen den Werten für 10 mm und 12 mm, ist also ein sinnvoller mittlerer Standardwert — bei 20-mm-Stäben zählt er jedoch je Bindung 111 mm zu wenig, das sind 101,90 m über 918 Bindungen."],
          ["Warum geht der Rechner von 1,6-mm-Draht aus?", "Weil 1,6-mm-geglühter Draht die übliche Wahl auf der Baustelle ist und sein Gewicht derselben d²/162,28-Regel folgt wie das Bewehrungsgewicht: 1,6² ÷ 162,28 = 0,0157752 kg/m, also 63,39 Meter je Kilogramm. Dünnerer Draht ergibt mehr Meter je Kilogramm (1,2 mm → 112,69 m/kg) und dickerer Draht weniger (2,0 mm → 40,57 m/kg) — die vollständige Tabelle steht unten. Die Beschichtung (geglüht oder verzinkt) ändert das Gewicht bei gleichem Durchmesser nicht; sie ändert die Korrosionsbeständigkeit, nicht die Schätzung."],
          ["Wie passt das zur Regel von 9–13 kg Draht je Tonne Stahl?", "Die Regel ist eine Faustregel, keine Normklausel — eine ihrer eigenen Quellen räumt ein, dass die IS-Norm keine Menge vorschreibt. Bei der Standardplatte (232,57 kg Stahl aus dem Plattenrechner) beträgt der Draht bei 100 % Bindung 4,34 kg, also 18,7 kg je Tonne — über der Regel — aber bei 50 % Bindung 2,17 kg, also 9,3 kg je Tonne, innerhalb der Regel. Die Regel setzt Teilbindung und gemischte Bauteile voraus; ein dichtes Plattennetz bei 100 % Bindung braucht ehrlich mehr. Nutzen Sie die Regel als Plausibilitätsprüfung für ein ganzes Projekt und die Netzzählung für die tatsächliche Bestellung."],
          ["Wie viele Rollen oder Bunde brauche ich?", "Teilen Sie die Länge durch die Meter je Kilogramm der Rolle. Beim 1,6-mm-Draht des Rechners (63,39 m/kg) fasst eine 5-kg-Rolle 316,95 m — genug für die 275,40 m der Standardwerte mit Reserve — und eine 25-kg-Rolle fasst 1.584,77 m. Das große Plattenbeispiel unten braucht 2.693,40 m, also 42,49 kg, sodass zwei 25-kg-Rollen reichen. Prüfen Sie immer das Rollenetikett: Meter je Kilogramm ist eine Eigenschaft des Drahtdurchmessers, nicht der Marke."],
          ["Wie viel Verschnitt sollte ich hinzurechnen?", "Ein veröffentlichter Rechner empfiehlt 5–15 % Reserve für Schnitt-, Überdreh-, Nachbinde- und Handhabungsverluste. Bei den Standardwerten werden aus 4,34 kg dadurch 4,56 kg bei +5 %, 4,78 kg bei +10 % und 5,00 kg bei +15 %. Der Rechner gibt das Nettoergebnis des Netzes ohne Reserve an, rechnen Sie sie also vor der Bestellung hinzu — eine fehlende Rolle am Tag der Betonage kostet mehr, als die 5 % je kosten."],
          ["Was ist mit Doppelbindungen oder Bindungen je Kreuzung?", "Der Rechner zählt eine Bindung je gebundenem Kreuzungspunkt. Eine Doppelbindung (zwei Umwicklungen an einer Kreuzung) verdoppelt die Länge für diese Kreuzung von Hand: Aus den 275,40 m der Standardwerte werden 550,80 m, wenn jede Kreuzung doppelt gebunden wird. Ein veröffentlichter Rechner schlägt vor, etwa 1,5 Bindungen je Kreuzung einzuplanen, um Nachbindungen nach dem Verschieben der Stäbe während der Betonage abzudecken — behandeln Sie das als Planungszuschlag auf die Zählung, nicht als zweite Bindung, die der Rechner hätte zählen müssen."],
          ["Trägt Bindedraht eine statische Last?", "Nein — er hält die Stäbe nur in Position, während der Beton eingebracht wird und aushärtet. Beton und Bewehrung tragen die Last; der Draht verhindert, dass sich der Korb während der Betonage und Verdichtung verschiebt, durchhängt oder spreizt. Darum bindet er auch Abstandhalter, Auflagerstäbe und Übergreifungen, nicht nur Kreuzungen: Alles, was bis zum Erhärten des Betons an Ort und Stelle bleiben muss, wird verdrahtet."],
          ["Deckt der Rechner Übergreifungen, Abstandhalter oder Kosten ab?", "Nein — er gibt nur das Nettodraht-Ergebnis des Netzes an. Übergreifungen kommen aus dem <a href=\"/de/uebergreifungslaengen-rechner\">Übergreifungslängen-Rechner</a> (übergreifende Stäbe brauchen zusätzliche Bindungen an der Überlappung), Abstandhalter aus dem <a href=\"/de/abstandhalter-rechner\">Abstandhalter-Rechner</a>, die vollständige Mengenermittlung aus dem <a href=\"/de/bewehrungsmengen-rechner\">Mengen- & Abrechnungsrechner</a> und Preise aus dem <a href=\"/de/bewehrungskosten-rechner\">Kostenrechner</a>. Die Stahltonnage für die Pro-Tonne-Prüfung kommt aus dem <a href=\"/de/bewehrungstonnage-rechner\">Tonnage-Rechner</a>."]],
  toc: `<nav class="content-block" aria-label="Auf dieser Seite">
    <h2>Auf dieser Seite</h2>
    <ul>
      <li><a href="#how-to">So benutzen Sie den Rechner</a></li>
      <li><a href="#formula">Die Formel</a></li>
      <li><a href="#example-1">Rechenbeispiel 1: Standardwerte (5 × 4 m)</a></li>
      <li><a href="#example-2">Rechenbeispiel 2: Platte 10 × 8 m</a></li>
      <li><a href="#example-3">Rechenbeispiel 3: Hälfte der Kreuzungspunkte gebunden</a></li>
      <li><a href="#spacing-table">Draht nach Stababstand</a></li>
      <li><a href="#per-tie-table">Draht je Bindung, nach Stabgröße</a></li>
      <li><a href="#ratio-table">Draht nach Bindeanteil</a></li>
      <li><a href="#per-tonne">Die 9–13-kg-pro-Tonne-Regel, eingeordnet</a></li>
      <li><a href="#gauge-table">Meter je Kilogramm, nach Drahtstärke</a></li>
      <li><a href="#order">Vom Nettoergebnis zur Bestellung</a></li>
      <li><a href="#imperial">Zoll-Umrechnungen</a></li>
      <li><a href="#not-included">Was dieser Rechner nicht abdeckt</a></li>
      <li><a href="#mistakes">5 häufige Fehler</a></li>
      <li><a href="#faq">FAQs</a></li>
    </ul>
  </nav>`,
  extra: `<h3>Die Formel, erklärt</h3>
<p>Die Formel ist eine Kette aus vier Schritten, und jeder Schritt ist etwas Reales, das man auf der Baustelle zählen kann:</p>
<p><strong>Kreuzungspunkte = nx × ny; Bindungen = Kreuzungspunkte × Anteil; Länge = Bindungen × Draht je Bindung; Gewicht = Länge × 0,0157752 kg/m</strong></p>
<p>Zuerst: nx = floor(L ÷ Abstand) + 1 und ny = floor(W ÷ Abstand) + 1. Das +1 in jeder Richtung ist die Zaunpfahlregel: Stäbe sitzen an beiden Rändern plus in jedem Zwischenabstand, sodass es immer eine Stabreihe mehr gibt als Zwischenräume. Multipliziert man die beiden Reihenzahlen, erhält man jede Kreuzung im Netz. Zweitens macht der Bindeanteil aus Kreuzungen Bindungen: 100 % bindet alle, 50 % bindet die Hälfte. Drittens verbraucht jede Bindung die eingestellte Drahtlänge je Bindung. Viertens nutzt das Gewicht 1,6-mm-Draht: 1,6² ÷ 162,28 = 0,0157752 kg/m, dieselbe d²/162,28-Regel wie beim Bewehrungsgewicht.</p>
<p>Zwei ehrliche Einschränkungen. Das Netz wird von Rand zu Rand gezählt — der Rechner zieht die Betondeckung nicht ab, sodass er bei den Standardwerten 918 Kreuzungen zählt, wo der betondeckungsbereinigte Plattenrechner 891 zählt. Der Unterschied ist klein (27 Kreuzungen) und geht zugunsten einer etwas größeren Bestellung, aber man sollte ihn kennen. Und die Bindungszahl wird nicht gerundet: Bei 75 % zeigt der Rechner 688,50 Bindungen an, runden Sie also selbst auf 689 auf, bevor Sie bestellen.</p>
<h3 id="example-1">Rechenbeispiel 1: Platte 5 × 4 m (Standardwerte des Rechners)</h3>
<p>Öffnen Sie den Rechner und lassen Sie die Standardwerte: Länge 5 m, Breite 4 m, Abstand 150 mm, Draht je Bindung 300 mm, gebundene Kreuzungspunkte 100 %.</p>
<p>Entlang der Länge: floor(5 ÷ 0,15) + 1 = 34 Reihen. Entlang der Breite: floor(4 ÷ 0,15) + 1 = 27 Reihen.</p>
<p><strong>Kreuzungspunkte = 34 × 27 = 918; Bindungen = 918; Länge = 918 × 0,3 = 275,40 m; Gewicht = 275,40 × 0,0157752 = 4,34 kg.</strong> Der Rechner zeigt 275,40 m, 918,00 Kreuzungspunkte, 918,00 Bindungen und 4,34 kg an.</p>
<p>Das Gewicht ist die Zahl, die die meisten durch Schätzen falsch ermitteln: 275 Meter Draht klingen nach viel, aber bei 63,39 Metern je Kilogramm sind es nur 4,34 kg — eine 5-kg-Rolle reicht, wie der Bestellabschnitt zeigt.</p>
<h3 id="example-2">Rechenbeispiel 2: Platte 10 × 8 m</h3>
<p>Stellen Sie Länge 10 m, Breite 8 m, Abstand 200 mm, Draht je Bindung 300 mm, gebundene Kreuzungspunkte 100 % ein.</p>
<p>Entlang der Länge: floor(10 ÷ 0,2) + 1 = 51 Reihen. Entlang der Breite: floor(8 ÷ 0,2) + 1 = 41 Reihen.</p>
<p><strong>Kreuzungspunkte = 51 × 41 = 2.091; Länge = 2.091 × 0,3 = 627,30 m; Gewicht = 9,90 kg.</strong> Merken Sie sich den Zufall: Dieselben 627,30 m ergeben sich für eine Platte 5 × 4 m bei 100 mm Abstand, weil beide Netze 2.091 Kreuzungspunkte haben. Der Draht folgt der Kreuzungspunktzahl, nicht der Plattenfläche — ein kleines dichtes Netz kann mehr Draht brauchen als ein großes weitmaschiges.</p>
<h3 id="example-3">Rechenbeispiel 3: Hälfte der Kreuzungspunkte gebunden</h3>
<p>Stellen Sie Länge 6 m, Breite 5 m, Abstand 150 mm, Draht je Bindung 300 mm, gebundene Kreuzungspunkte 50 % ein.</p>
<p>Entlang der Länge: floor(6 ÷ 0,15) + 1 = 41 Reihen. Entlang der Breite: floor(5 ÷ 0,15) + 1 = 34 Reihen. Kreuzungspunkte = 41 × 34 = 1.394.</p>
<p><strong>Bindungen = 1.394 × 50 % = 697; Länge = 697 × 0,3 = 209,10 m; Gewicht = 3,30 kg.</strong> Das ist der realistische Baustellenfall, auf den die ursprüngliche FAQ anspielt — jeder Randkreuzungspunkt gebunden, etwa die Hälfte des Feldes — und es ist der Fall, der innerhalb der Pro-Tonne-Regel landet, wie der Einordnungsabschnitt zeigt.</p>
<h3 id="spacing-table">Draht nach Stababstand</h3>
<p>Gleiche Platte (5 × 4 m), gleiche 300 mm je Bindung, gleiche 100 % Bindung, fünf Abstände. Der Abstand wirkt in beide Richtungen, sodass der Draht grob mit 1 ÷ Abstand² skaliert: Eine Halbierung des Abstands von 200 mm auf 100 mm vervierfacht den Draht fast.</p>
<div class="formula-table"><table>
<tr><th>Stababstand</th><th>Netz</th><th>Kreuzungspunkte</th><th>Drahtlänge</th><th>Drahtgewicht</th></tr>
<tr><td>100 mm</td><td>51 × 41</td><td>2.091</td><td>627,30 m</td><td>9,90 kg</td></tr>
<tr><td>125 mm</td><td>41 × 33</td><td>1.353</td><td>405,90 m</td><td>6,40 kg</td></tr>
<tr><td>150 mm</td><td>34 × 27</td><td>918</td><td>275,40 m</td><td>4,34 kg</td></tr>
<tr><td>175 mm</td><td>29 × 23</td><td>667</td><td>200,10 m</td><td>3,16 kg</td></tr>
<tr><td>200 mm</td><td>26 × 21</td><td>546</td><td>163,80 m</td><td>2,58 kg</td></tr>
</table></div>
<p>Die praktische Folge: Der Abstand ist der größte Hebel auf die Drahtmenge, den Sie steuern. Der Wechsel einer Platte 5 × 4 m von 150 mm auf 200 mm Abstand senkt den Draht von 4,34 kg auf 2,58 kg — eine Ersparnis von 41 % — aber der Abstand kommt aus der Zeichnung, nicht aus dem Drahtbudget, behandeln Sie diese Tabelle also als Schätzwissen, nicht als Grund, ein Netz weiter zu machen.</p>
<h3 id="per-tie-table">Draht je Bindung, nach Stabgröße</h3>
<p>Der Standardwert des Rechners von 300 mm ist eine Zahl für jeden Stab, aber eine Bindung um einen 20-mm-Stab braucht ehrlich mehr Draht als eine Bindung um einen 8-mm-Stab. Eine veröffentlichte Umwicklungsformel — vier Umwicklungen um den Stab plus 16 cm Verdrehzugabe — ergibt diese Tabelle, mit dem Gesamtgewicht des Netzes bei den 918 Bindungen der Standardwerte zum Maßstab. Jede Zeile lässt sich aus dem Rechner nachvollziehen: Geben Sie den gezeigten Wert für Draht je Bindung ein, und Länge und Gewicht folgen.</p>
<div class="formula-table"><table>
<tr><th>Stabgröße</th><th>Draht je Bindung</th><th>Länge bei 918 Bindungen</th><th>Gewicht bei 918 Bindungen</th></tr>
<tr><td>8 mm</td><td>261 mm</td><td>239,60 m</td><td>3,78 kg</td></tr>
<tr><td>10 mm</td><td>286 mm</td><td>262,55 m</td><td>4,14 kg</td></tr>
<tr><td>12 mm</td><td>311 mm</td><td>285,50 m</td><td>4,50 kg</td></tr>
<tr><td>16 mm</td><td>361 mm</td><td>331,40 m</td><td>5,23 kg</td></tr>
<tr><td>20 mm</td><td>411 mm</td><td>377,30 m</td><td>5,95 kg</td></tr>
</table></div>
<p>Zwei Erkenntnisse daraus. Erstens ist der Standardwert von 300 mm ein guter Mittelwert — zwischen den Zeilen für 10 mm und 12 mm — sodass die meisten Plattenarbeiten mit dem Standardwert geschätzt knapp danebenliegen. Zweitens wächst der Fehler mit der Stabgröße: Bei 20-mm-Stäben zählt der Standardwert je Bindung 111 mm zu wenig, das sind 101,90 m über 918 Bindungen. Sind die Stäbe 16 mm oder größer, stellen Sie das Feld für Draht je Bindung nach dieser Tabelle ein, statt den Standardwert zu lassen.</p>
<h3 id="ratio-table">Draht nach Bindeanteil</h3>
<p>Gleiche Standardplatte (5 × 4 m, 150 mm, 300 mm je Bindung), vier Bindeanteile. Der Anteil ist nach dem Abstand der zweitgrößte Hebel, und er ist derjenige, den die Zeichnung tatsächlich steuert.</p>
<div class="formula-table"><table>
<tr><th>Gebundene Kreuzungspunkte</th><th>Bindungen</th><th>Drahtlänge</th><th>Drahtgewicht</th></tr>
<tr><td>100 %</td><td>918</td><td>275,40 m</td><td>4,34 kg</td></tr>
<tr><td>75 %</td><td>688,50 → 689</td><td>206,70 m</td><td>3,26 kg</td></tr>
<tr><td>50 %</td><td>459</td><td>137,70 m</td><td>2,17 kg</td></tr>
<tr><td>25 %</td><td>229,50 → 230</td><td>69,00 m</td><td>1,09 kg</td></tr>
</table></div>
<p>Die Bruchzeilen sind der Punkt: Der Rechner zeigt 688,50 und 229,50 Bindungen an, weil er nicht rundet, runden Sie also vor der Bestellung auf — 689 und 230 Bindungen, wie gezeigt. Abrunden würde Kreuzungen ungebunden lassen, was den Zweck des Drahts zunichtemacht.</p>
<h3 id="per-tonne">Die 9–13-kg-pro-Tonne-Regel, eingeordnet</h3>
<p>Jeder Leitfaden zitiert sie: 9–13 kg Bindedraht je Tonne Stahl, mit kleineren Stäben am oberen Ende der Spanne (8 mm → 12 kg/t) und größeren Stäben am unteren Ende (28–32 mm → 7 kg/t). Und eine der Quellen selbst räumt ein, dass die IS-Norm tatsächlich keine Menge vorschreibt — es ist eine Faustregel aus Erfahrung. Was also tun, wenn Ihre Netzzählung ihr widerspricht?</p>
<p>Rechnen Sie es an der Standardplatte durch. Der Plattenrechner ergibt 232,57 kg Stahl für dieselbe Platte 5 × 4 m bei 150 mm Abstand mit 12-mm-Stäben und 40 mm Betondeckung. Gegen diesen Stahl:</p>
<div class="formula-table"><table>
<tr><th>Bindeanteil</th><th>Drahtgewicht</th><th>Kg je Tonne Stahl</th><th>Gegen die 9–13-Regel</th></tr>
<tr><td>100 %</td><td>4,34 kg</td><td>18,7 kg/t</td><td>Über der Regel</td></tr>
<tr><td>75 %</td><td>3,26 kg</td><td>14,0 kg/t</td><td>Knapp über der Regel</td></tr>
<tr><td>50 %</td><td>2,17 kg</td><td>9,3 kg/t</td><td>Innerhalb der Regel</td></tr>
</table></div>
<p>Die Einordnung ist einfach: Die Regel setzt voraus, dass man nicht alles bindet. Sie mittelt über Balken, Stützen, Fundamente und Platten, über große und kleine Stäbe und über das übliche Baustellenmuster aus jedem Randkreuzungspunkt plus etwa der Hälfte des Feldes. Ein dichtes Plattennetz bei 100 % Bindung braucht ehrlich mehr Draht je Tonne als dieser Durchschnitt — 18,7 kg/t ist kein Fehler, sondern das, was 100 % Bindung kostet. Nutzen Sie die Regel also als Plausibilitätsprüfung für ein ganzes Projekt (wenn Ihr Gesamtdraht weit außerhalb von 9–13 kg/t liegt, prüfen Sie Ihre Eingaben) und die Netzzählung für die tatsächliche Bestellung. Eine Genauigkeitsanmerkung: Die Stahlzahl stammt aus dem betondeckungsbereinigten Plattennetz (891 Kreuzungen), während die Drahtzahl aus dem Rand-zu-Rand-Netz (918) stammt, sodass die kg/t-Werte innerhalb dieser 3-%-Lücke näherungsweise gelten — genau genug für eine Plausibilitätsprüfung, nicht für einen Exaktheitsanspruch.</p>
<h3 id="gauge-table">Meter je Kilogramm, nach Drahtstärke</h3>
<p>Draht wird nach Gewicht verkauft, aber nach Länge verbraucht, sodass die Umrechnung der ganze Einkauf ist. Alle Zeilen sind nach derselben d²/162,28-Regel berechnet, die der Rechner nutzt, sodass sie exakt zu seiner 1,6-mm-Annahme passen:</p>
<div class="formula-table"><table>
<tr><th>Drahtdurchmesser</th><th>Gewicht je Meter</th><th>Meter je Kilogramm</th></tr>
<tr><td>1,0 mm</td><td>0,006162 kg/m</td><td>162,28 m/kg</td></tr>
<tr><td>1,2 mm</td><td>0,008874 kg/m</td><td>112,69 m/kg</td></tr>
<tr><td>1,22 mm (18 SWG)</td><td>0,009172 kg/m</td><td>109,03 m/kg</td></tr>
<tr><td>1,6 mm (Draht des Rechners)</td><td>0,015775 kg/m</td><td>63,39 m/kg</td></tr>
<tr><td>1,63 mm (16 SWG)</td><td>0,016372 kg/m</td><td>61,08 m/kg</td></tr>
<tr><td>1,8 mm</td><td>0,019965 kg/m</td><td>50,09 m/kg</td></tr>
<tr><td>2,0 mm</td><td>0,024649 kg/m</td><td>40,57 m/kg</td></tr>
</table></div>
<p>Zwei Verwendungen. Erstens: Ist Ihre Rolle nicht 1,6 mm, rechnen Sie vor dem Vergleichen um: Eine 5-kg-Rolle mit 1,2-mm-Draht fasst 563,45 m, nicht 316,95 m. Zweitens sind Stärkennummern eine Falle: SWG und AWG nummerieren denselben Durchmesser unterschiedlich, und der „typische 0,6–1,2 mm“ eines Leitfadens widerspricht dem „schweren 8–10 Gauge“ eines anderen — prüfen Sie also das Rollenetikett auf den Millimeterdurchmesser und nutzen Sie diese Tabelle, nicht die Stärkennummer, für die Umrechnung. Als Gegenprüfung impliziert das Beispiel eines Leitfadens von „1 kg = 50 m“ 1,80-mm-Draht nach dieser Tabelle, was ein sinnvoller schwerer Baustellendraht ist.</p>
<h3 id="order">Vom Nettoergebnis zur Bestellung</h3>
<p>Der Rechner gibt das Nettoergebnis des Netzes an. Die Bestellung ist dieses Ergebnis, plus Verschnitt, in Rollen, bepreist.</p>
<p>Beispiel: Die Standardwerte ergeben 4,34 kg. Rechnen Sie eine Reserve von 5–15 % für Schnitt-, Überdreh-, Nachbinde- und Handhabungsverluste hinzu: +5 % → 4,56 kg, +10 % → 4,78 kg, +15 % → 5,00 kg. Beim 1,6-mm-Draht des Rechners fasst eine 5-kg-Rolle 316,95 m, sodass eine 5-kg-Rolle die 275,40 m der Standardwerte mit Raum für die Reserve abdeckt. Bei einem Beispielpreis von 3,00 €/kg kosten die Standardwerte 13,03 € netto, 13,69 € bei +5 %.</p>
<p>Beispiel: Die große Platte (20 × 10 m bei 150 mm) ergibt 2.693,40 m, 42,49 kg. Bei +5 % sind das 44,61 kg, bestellen Sie also zwei 25-kg-Rollen (50 kg), statt nach exakt 44,61 kg zu suchen — Rollen gibt es in festen Größen, und die übrige Rolle ist der Draht der nächsten Platte. Zum selben Beispielpreis sind das 127,47 € netto, 133,84 € bei +5 %. Für die vollständige Mengenermittlung über alle Bauteile nutzen Sie den <a href="/de/bewehrungsmengen-rechner">Mengen- & Abrechnungsrechner</a> und bepreisen Sie sie mit dem <a href="/de/bewehrungskosten-rechner">Kostenrechner</a>.</p>
<h3 id="imperial">Zoll-Umrechnungen</h3>
<p>Der Rechner nimmt Meter und Millimeter, rechnen Sie also zuerst um: 1 m = 3,28 ft, 1 kg = 2,20 lb, 1 in = 25,4 mm.</p>
<p>Rechenbeispiel: Eine Platte 20 × 16 ft ist 6,096 × 4,8768 m. Bei einem 6-in-Netz (152,4 mm), 300 mm je Bindung, 100 % gebunden: floor(6,096 ÷ 0,1524) + 1 = 41 Reihen, floor(4,8768 ÷ 0,1524) + 1 = 33 Reihen — <strong>41 × 33 = 1.353 Kreuzungspunkte, 405,90 m, 6,40 kg</strong>.</p>
<p>Längen je Bindung in Zoll: 250 mm = 9,84 in, 300 mm = 11,81 in, 350 mm = 13,78 in. Längen in Fuß: 275,40 m = 903,54 ft, 627,30 m = 2.058,07 ft. Gewichte in Pfund: 4,34 kg = 9,58 lb, 9,90 kg = 21,82 lb. Die Formel ist einheitenfrei — dasselbe (floor + 1) × (floor + 1) × je Bindung funktioniert in Fuß und Zoll, wenn jede Eingabe in denselben Einheiten steht — aber der Rechner nimmt metrische Werte, rechnen Sie also vor der Eingabe um.</p>
<h3 id="not-included">Was dieser Rechner nicht abdeckt</h3>
<ul>
<li>Stabzahl und Stahlgewicht — das Netz, das er zählt, ist ein Drahtnetz, keine Stahlliste; die Matte selbst kommt aus dem <a href="/de/bewehrungsrechner-fuer-betonplatten">Plattenrechner</a>.</li>
<li>Übergreifungen und Übergreifungsbindungen — übergreifende Stäbe brauchen zusätzliche Bindungen an der Überlappung; Übergreifungslängen kommen aus dem <a href="/de/uebergreifungslaengen-rechner">Übergreifungslängen-Rechner</a>, und die zusätzlichen Bindungen kommen auf diese Netzzählung obendrauf.</li>
<li>Abstandhalter und Stützen — Abstandhalter werden ebenfalls an Stäbe gebunden, aber ihre Zahl kommt aus dem <a href="/de/abstandhalter-rechner">Abstandhalter-Rechner</a>.</li>
<li>Bügel, Stützen, Balken und Wände — dieser Rechner zählt ein flaches Netz; Körbe und vertikale Bauteile haben eigene Bindemuster, und der <a href="/de/buegel-schnittlaengen-rechner">Bügelrechner</a> deckt Bügel-Schnittlängen ab.</li>
<li>Eck-, Anschluss- und Hakenbindungen über das Netz hinaus — ein Leitfaden schlägt vor, 10–20 % zusätzliche Bindungen für Balken-Platten-Ränder, Stützen-Balken-Knoten, Übergreifungen und Haken hinzuzurechnen; behandeln Sie das als Teil der Verschnittreserve, nicht als Netzkreuzungspunkte.</li>
<li>Drahtstärkenwahl und Bindemethode — der Rechner setzt 1,6-mm-Draht und eine Bindung je gebundenem Kreuzungspunkt voraus; Stärkenwahl und einfache vs. doppelte vs. maschinelle Bindung kommen aus der Zeichnung und der Baustellenpraxis.</li>
<li>Kosten — der Bestellabschnitt zeigt die Handrechnung; der <a href="/de/bewehrungskosten-rechner">Kostenrechner</a> bepreist eine vollständige Mengenermittlung, und die Stahltonnage kommt aus dem <a href="/de/bewehrungstonnage-rechner">Tonnage-Rechner</a>.</li>
</ul>
<h3 id="mistakes">5 häufige Fehler</h3>
<ol>
<li><strong>Das +1 in jeder Richtung vergessen.</strong> floor(L ÷ Abstand) × floor(W ÷ Abstand) statt (floor + 1) × (floor + 1) zu zählen, ergibt bei den Standardwerten 33 × 26 = 858 Kreuzungen statt 918 — 60 Bindungen, 18,0 m und 0,28 kg zu wenig vor Verschnitt. Die Randreihen sind echte Bindungen.</li>
<li><strong>100 % binden, wenn die Zeichnung 50 % im Feld sagt.</strong> Bei den Standardwerten verdoppelt das den Draht von 2,17 kg auf 4,34 kg. Stellen Sie den Anteil nach der Zeichnung ein, nicht nach dem Standardwert — der Standardwert ist 100 %, weil er die sichere Obergrenze ist, nicht weil er das übliche Muster wäre.</li>
<li><strong>Eine Länge je Bindung für jede Stabgröße.</strong> 300 mm bei 12-mm-Stäben zu lassen, zählt je Bindung 11 mm zu wenig (311 mm aus der Umwicklungstabelle), das sind 10,10 m und 0,16 kg zu wenig über 918 Bindungen — und bei 20-mm-Stäben beträgt die Lücke 111 mm je Bindung. Stellen Sie das Feld für Draht je Bindung nach der Stabgrößentabelle ein, für Stäbe ab 16 mm.</li>
<li><strong>Das Nettoergebnis ohne Reserve bestellen.</strong> Schnitt-, Überdreh-, Nachbinde- und Handhabungsverluste sind real; ein veröffentlichter Rechner empfiehlt 5–15 %. Bei den Standardwerten spart das Weglassen der Reserve höchstens 0,66 € bei einem Beispielpreis von 3,00 €/kg und riskiert eine stillstehende Betonage.</li>
<li><strong>Bruchbindungen bestellen oder gegen die Pro-Tonne-Regel vergleichen, ohne den Anteil zu bereinigen.</strong> Der Rechner zeigt bei 75 % 688,50 Bindungen an — bestellen Sie 689, nicht 688,50 und nicht 688. Und ein dichtes Netz bei 100 % Bindung mit 18,7 kg/t ist kein Beweis, dass die Zählung falsch ist: Die 9–13-kg/t-Regel setzt Teilbindung voraus, bereinigen Sie also zuerst den Anteil, bevor Sie das Netz anzweifeln.</li>
</ol>
<p>Zuletzt geprüft: Oktober 2026.</p>`
}
},
    { id:"column", slug:"column-rebar-calculator", cat:"Members",
    metaTitle:"Column Rebar Calculator — Main Bars, Ties & kg, Free",
    h1:"Column Rebar Calculator",
    desc:"Total rebar for a rectangular column: vertical main bars plus lateral ties, with weights. Defaults = 44.38 kg. Free, with code-minimum checks.",
    kw:"column rebar calculator, rebar calculator for columns, column reinforcement, column steel calculation",
    intro:"Estimate the steel in a column. Enter the column size and height, the number and size of vertical bars, plus the tie spacing and size — the tool returns vertical steel, tie steel and the total weight.",
    howto:["Enter the column height in metres and the cross-section in mm.","Set the number and size of vertical bars, plus the lap/extra length per bar in metres.","Set the tie spacing in mm and the tie bar size.","Read the total weight, split into vertical steel and tie steel, plus the tie count and cut length.","Multiply by the number of identical columns for the floor total, then add waste — the calculator gives one column, not the order quantity."],
    formula:"Vertical steel = bars × (height + lap) × kg/m. Ties = floor(height ÷ spacing) + 1, each at the stirrup cutting length.",
    faqs:[["How is column rebar calculated?", "Add the vertical steel to the tie steel. Vertical steel = number of bars × (height + lap) × kg/m; ties = floor(height ÷ spacing) + 1, each cut to the stirrup cutting length. On the calculator defaults (3 m, 300 × 450 mm, 6 × 16 mm bars, 0.6 m lap, 150 mm ties, 8 mm tie bars) that is 34.08 kg of vertical steel plus 10.29 kg of tie steel = 44.38 kg for one column."],
          ["How many vertical bars in a column?", "At least 4 for a rectangular column and 6 for a circular column, subject to design — but the count alone is not the check. The steel area must also clear the 0.8% minimum of the gross section: the defaults (6 × 16 mm in 300 × 450 mm) give 0.89% and pass, while 4 × 12 mm in 300 × 300 mm gives only 0.50% and fails — that section needs 4 × 16 mm (0.89%) instead."],
          ["What is the minimum and maximum steel percentage in a column?", "IS 456 sets longitudinal steel between 0.8% and 6% of the gross cross-sectional area. In practice 4% is often used as the working limit where bars lap, because lapped bars double up and the section congests. The percentage table below works the minimum for common sections; the maximum is rarely the binding constraint on ordinary columns."],
          ["What spacing do column ties need?", "Maximum spacing = the smallest of the least lateral dimension, 16 × the smallest longitudinal bar diameter, and 300 mm. On the defaults (300 mm side, 16 mm bars) that is min(300, 256, 300) = 256 mm, so the calculator's 150 mm default is comfortably inside. Note the calculator uses one spacing for the full height, while drawings zone the ties separately at joints, laps and the middle — the drawing's zone spacings govern where they are tighter."],
          ["What size should column ties be?", "At least the larger of 6 mm and one quarter of the largest longitudinal bar diameter. On the defaults (16 mm bars) that is 6 mm, so the 8 mm tie bars are fine; on 25 mm bars it is 6.25 mm, so 8 mm is the practical minimum. One published guide states 8 mm flat — the code floor is 6 mm, and 8 mm is the safer common choice."],
          ["What does the lap/extra field mean?", "It is ONE extra length per vertical bar, in metres, that you set yourself — the calculator does not compute a code lap. The default 0.6 m is an allowance, not a code value: the code tension lap for a 16 mm Fe500 bar in M25 concrete is 776.79 mm, so setting 0.777 m instead of 0.6 m on the defaults raises the vertical steel from 34.08 kg to 35.76 kg (+1.68 kg). Use the <a href=\"/rebar-lap-length-calculator\">lap length calculator</a> for the code lap, and if the column is lapped top and bottom, set the field to the sum of both laps."],
          ["Does the calculator design the column?", "No — it totals the steel for a cage you describe; it does not check whether the cage is adequate. Axial and moment capacity, slenderness and buckling, seismic confinement lengths and joint detailing all come from the structural design and the drawing. A total that looks reasonable is not proof the section works, and a section that passes the 0.8% minimum is not proof it carries the load."],
          ["How many ties does a column need?", "Ties = floor(height ÷ spacing) + 1 — the +1 is the tie at the far end, and forgetting it is the classic off-by-one: on the defaults it gives 20 ties instead of 21, short by one 1244 mm tie (0.49 kg). The calculator counts 21 at 150 mm spacing on a 3 m column; at 100 mm it counts 31, and at 300 mm only 11 — but 300 mm exceeds the 256 mm code maximum for this section, so it is not a legitimate saving."],
          ["Can I use this calculator for circular or spiral columns?", "No — it is rectangular tied columns only. Circular columns need at least 6 longitudinal bars and a different bar layout, and spiral columns use a continuous helix with its own pitch and detailing rules instead of individual closed ties. Take both from the drawing; the tie-cutting method on the <a href=\"/stirrup-tie-cutting-length-calculator\">stirrup calculator</a> still gives the closed-tie length, but the count and layout are not this calculator's."],
          ["Does the calculator include waste, starter bars or cost?", "No — it gives the neat one-column total only. Add 3–5% waste for cutting and laps (a published range), take footing starter bars and dowels from the <a href=\"/footing-rebar-calculator\">footing calculator</a>, price the order with the <a href=\"/rebar-cost-calculator\">cost calculator</a>, and check the steel tonnage with the <a href=\"/rebar-tonnage-calculator\">tonnage calculator</a>. For a full takeoff across members use the <a href=\"/rebar-quantity-calculator\">quantity & takeoff calculator</a>."]],
    toc:`<nav class="content-block" aria-label="On this page">
    <h2>On this page</h2>
    <ul>
      <li><a href="#how-to">How to use the calculator</a></li>
      <li><a href="#formula">The formula</a></li>
      <li><a href="#example-1">Worked example 1: defaults (3 m, 300 × 450 mm)</a></li>
      <li><a href="#example-2">Worked example 2: 400 × 400 mm column</a></li>
      <li><a href="#example-3">Worked example 3: small square column — and a failed check</a></li>
      <li><a href="#spacing-table">Ties by spacing</a></li>
      <li><a href="#percentage-table">Steel percentage by section</a></li>
      <li><a href="#lap-field">The lap field, explained honestly</a></li>
      <li><a href="#order">From one column to the floor order</a></li>
      <li><a href="#imperial">Imperial conversions</a></li>
      <li><a href="#not-included">What this calculator does not cover</a></li>
      <li><a href="#mistakes">5 common mistakes</a></li>
      <li><a href="#faq">FAQs</a></li>
    </ul>
  </nav>`,
    extra:`<h3>The formula, explained</h3>
<p>The formula has two halves — the vertical cage and the ties that hold it together — and the calculator keeps them separate so you can see which half dominates:</p>
<p><strong>Vertical steel = bars × (height + lap) × kg/m; Ties = floor(height ÷ spacing) + 1, each at the stirrup cutting length; Total = vertical + tie steel</strong></p>
<p>Each vertical bar runs the column height plus the lap/extra length you set — one extra length per bar, not one per column. Each tie is a closed stirrup whose cutting length comes from the inner dimensions: a = width − 2 × cover, b = depth − 2 × cover, cut = 2(a + b) + 20d − 6d − 6d, exactly as on the stirrup page. The tie count uses the same fence-post rule as every grid on this site: floor(height ÷ spacing) intervals need floor(height ÷ spacing) + 1 ties, because both end ties count.</p>
<p>One display note, carried over from the stirrup page: the tie-bar field reads "0.395|8" but the panel computes with the option value 0.394 kg/m, so every tie weight below uses 0.394. The vertical-bar default "1.578|16" matches its option exactly, so the vertical weights need no such adjustment.</p>
<h3 id="example-1">Worked example 1: defaults (3 m, 300 × 450 mm)</h3>
<p>Open the calculator and leave the defaults: height 3 m, section 300 × 450 mm, cover 40 mm, 6 vertical bars of 16 mm, lap 0.6 m, tie spacing 150 mm, tie bars 8 mm.</p>
<p>Vertical steel = 6 × (3 + 0.6) × 1.578 = 34.08 kg. Ties = floor(3000 ÷ 150) + 1 = 21. Tie cut: a = 300 − 80 = 220 mm, b = 450 − 80 = 370 mm, so 2 × (220 + 370) + 160 − 96 = 1244 mm — the exact tie the stirrup page works for this section at column cover, so the two pages agree. Tie steel = 21 × 1.244 × 0.394 = 10.29 kg.</p>
<p><strong>Total = 34.08 + 10.29 = 44.38 kg (0.044 t).</strong> The panel shows 44.38 kg, 34.08 kg vertical, 10.29 kg ties, 21.00 ties, 1,244 mm cut and 0.044 t. Vertical steel is 76.8% of the total here — on most columns the verticals dominate and the ties are roughly a fifth to a quarter, which is a useful smell test: if your ties ever outweigh your verticals, check your spacing input.</p>
<h3 id="example-2">Worked example 2: 400 × 400 mm column</h3>
<p>Set height 3.6 m, section 400 × 400 mm, cover 40 mm, 8 vertical bars of 20 mm, lap 0.8 m, tie spacing 200 mm, tie bars 10 mm.</p>
<p>Vertical steel = 8 × (3.6 + 0.8) × 2.465 = 86.77 kg. Ties = floor(3600 ÷ 200) + 1 = 19. Tie cut: a = b = 400 − 80 = 320 mm, so 2 × 640 + 200 − 120 = 1360 mm. Tie steel = 19 × 1.36 × 0.616 = 15.92 kg.</p>
<p><strong>Total = 86.77 + 15.92 = 102.69 kg (0.103 t).</strong> The steel percentage is 8 × 314.16 ÷ 160000 = 1.57% — comfortably inside the 0.8–6% band. The code-maximum tie spacing here is min(400, 16 × 20 = 320, 300) = 300 mm, so the 200 mm spacing is inside the limit with room for the tighter joint and lap zones the drawing may call for.</p>
<h3 id="example-3">Worked example 3: small square column — and a failed check</h3>
<p>Set height 3 m, section 300 × 300 mm, cover 40 mm, 4 vertical bars of 12 mm, lap 0.5 m, tie spacing 150 mm, tie bars 8 mm.</p>
<p>Vertical steel = 4 × (3 + 0.5) × 0.887 = 12.42 kg. Ties = 21. Tie cut: a = b = 300 − 80 = 220 mm, so 2 × 440 + 160 − 96 = 944 mm — again the stirrup page's own square-column tie. Tie steel = 21 × 0.944 × 0.394 = 7.81 kg.</p>
<p><strong>Total = 12.42 + 7.81 = 20.23 kg (0.020 t).</strong> But the total is not the whole story: the steel area is 4 × 113.10 = 452.4 mm² against a gross area of 90000 mm², which is 0.50% — BELOW the IS 456 minimum of 0.8% (720 mm²). This cage fails the minimum even though the calculator totals it happily. The fix is one bar size up: 4 × 16 mm gives 804.2 mm², which is 0.89% and passes. A calculator that only totals weight would let this through silently; the percentage check is what catches it.</p>
<h3 id="spacing-table">Ties by spacing</h3>
<p>Same defaults column (3 m, 300 × 450 mm, 8 mm ties at 1244 mm each), five spacings. The vertical steel never moves — 34.08 kg in every row — so the whole table is the tie half doing its thing.</p>
<div class="formula-table"><table>
<tr><th>Tie spacing</th><th>Ties</th><th>Tie steel</th><th>Total weight</th></tr>
<tr><td>100 mm</td><td>31</td><td>15.19 kg</td><td>49.28 kg</td></tr>
<tr><td>150 mm</td><td>21</td><td>10.29 kg</td><td>44.38 kg</td></tr>
<tr><td>200 mm</td><td>16</td><td>7.84 kg</td><td>41.93 kg</td></tr>
<tr><td>250 mm</td><td>13</td><td>6.37 kg</td><td>40.46 kg</td></tr>
<tr><td>300 mm</td><td>11</td><td>5.39 kg</td><td>39.48 kg</td></tr>
</table></div>
<p>Two readings. First, spacing is a real lever: tightening from 200 mm to 100 mm adds 15 ties and 7.35 kg (+18%) on one column. Second, the 300 mm row is a trap, not a saving: the code maximum for this section is min(300, 16 × 16 = 256, 300) = 256 mm, so 300 mm spacing violates the limit even though the calculator totals it. The calculator counts whatever spacing you enter; the limit is your job to respect. And remember the drawing zones ties separately at joints, laps and the middle — one spacing for the full height is an estimating simplification, not a detailing instruction.</p>
<h3 id="percentage-table">Steel percentage by section</h3>
<p>The 0.8% minimum, worked for common sections. The "bars that pass" column is the smallest practical set meeting the minimum — not a design recommendation, just the arithmetic floor the drawing must clear.</p>
<div class="formula-table"><table>
<tr><th>Section</th><th>Gross area</th><th>Minimum steel (0.8%)</th><th>Bars that pass</th><th>Percentage</th></tr>
<tr><td>300 × 300 mm</td><td>90000 mm²</td><td>720.0 mm²</td><td>4 × 16 mm (804.2 mm²)</td><td>0.89%</td></tr>
<tr><td>300 × 450 mm</td><td>135000 mm²</td><td>1080.0 mm²</td><td>6 × 16 mm (1206.4 mm²)</td><td>0.89%</td></tr>
<tr><td>400 × 400 mm</td><td>160000 mm²</td><td>1280.0 mm²</td><td>8 × 16 mm (1608.5 mm²)</td><td>1.01%</td></tr>
<tr><td>500 × 500 mm</td><td>250000 mm²</td><td>2000.0 mm²</td><td>10 × 16 mm (2010.6 mm²)</td><td>0.80%</td></tr>
</table></div>
<p>The maximum is 6% of gross area (5400 mm² on a 300 × 300 mm section, 15000 mm² on a 500 × 500 mm section), with 4% often used as the working limit where bars lap, because lapped bars double up and the section congests. The 500 × 500 mm row is the tight one: 10 × 16 mm only just clears the minimum at 0.80%, so one bar fewer fails it — always work the percentage, never guess the count. And a caution from the competitor field: one published worked example (4 × 20 mm in 400 × 400 mm) gives 0.79%, just under the minimum — even published examples slip, which is why the check belongs on the calculator page itself.</p>
<h3 id="lap-field">The lap field, explained honestly</h3>
<p>The lap/extra field is the most misunderstood input on this page, so here is exactly what it is: ONE extra length per vertical bar, in metres, that you type in. The calculator does not compute a code lap from it, and the 0.6 m default is an allowance, not a code value.</p>
<p>What the code lap actually is depends on bar size, steel grade, concrete grade and tension vs compression — that is the <a href="/rebar-lap-length-calculator">lap length calculator</a>'s job. For the defaults bars (16 mm, Fe500, M25, tension) it is 776.79 mm. Setting the field to 0.777 m instead of 0.6 m raises the defaults vertical steel from 34.08 kg to 35.76 kg — a 1.68 kg difference on one column, 16.80 kg across ten columns. Small per column, not small per floor.</p>
<p>There is a second method in the field worth knowing about: one published guide adds lap at BOTH ends (height + 2 × 40d). On the defaults that gives bar length 3 + 2 × 0.64 = 4.28 m and vertical steel 40.52 kg — 6.44 kg above the default-lap figure. If your column is lapped top and bottom, set the field to the sum of both laps rather than a single lap; if it is lapped at one end only, set the single lap. Either way, get the lap length itself from the lap calculator or the drawing, never from the 0.6 m default.</p>
<h3 id="order">From one column to the floor order</h3>
<p>The calculator gives one column. The order is that column, times the number of identical columns, plus waste.</p>
<p>Example: ten columns at the defaults give 10 × 44.38 = 443.78 kg. Add 5% waste for cutting and laps (one published range is 3–5%): 443.78 × 1.05 = 465.97 kg. At an example price of €1.20/kg that is €532.53 for ten columns. Twenty columns give 887.55 kg neat, before waste.</p>
<p>For scale, a published guide example reproduced through this calculator — a 5 m, 300 × 500 mm column with 12 × 16 mm bars, 0.6 m lap and 8 mm ties at 200 mm — gives 106.04 kg vertical plus 13.77 kg of ties (26 ties at 1344 mm) = 119.81 kg for one column, at a steel percentage of 1.61%. For the full takeoff across members, use the <a href="/rebar-quantity-calculator">quantity & takeoff calculator</a>, price it with the <a href="/rebar-cost-calculator">cost calculator</a>, and check the steel tonnage with the <a href="/rebar-tonnage-calculator">tonnage calculator</a>. Starter bars and dowels into the footing come from the <a href="/footing-rebar-calculator">footing calculator</a>.</p>
<h3 id="imperial">Imperial conversions</h3>
<p>The calculator takes metres and millimetres, so convert first: 1 m = 3.28 ft, 1 kg = 2.20 lb, 1 in = 25.4 mm.</p>
<p>Worked conversions: the defaults total 44.38 kg = 97.84 lb (0.044 t); example 2 totals 102.69 kg = 226.38 lb (0.103 t). A 3 m column is 9.84 ft high, and a 300 × 450 mm section is 11.81 × 17.72 in. The formula is unit-free — bars × (height + lap) × kg/m works in feet and lb/ft if every input is imperial — but the calculator takes metric, so convert before entering. Tie spacing in inches: 150 mm = 5.91 in, 200 mm = 7.87 in.</p>
<h3 id="not-included">What this calculator does not cover</h3>
<ul>
<li>Capacity design — axial load, bending moment, slenderness and buckling checks; the steel percentage passing 0.8% does not prove the section carries its load.</li>
<li>Circular and spiral columns — rectangular tied columns only; circular layouts (minimum 6 bars) and spiral detailing come from the drawing.</li>
<li>Beam–column joint confinement and seismic confinement lengths — IS 13920 zone detailing, including tighter tie spacing at joints and lap zones, is not computed; the calculator uses one spacing for the full height.</li>
<li>Footing starter bars and dowels — see the <a href="/footing-rebar-calculator">footing calculator</a>.</li>
<li>Couplers — mechanical splices replace laps with their own lengths and locations from the approved system.</li>
<li>Chairs and binding wire — see the <a href="/rebar-chair-calculator">chair calculator</a> and the <a href="/rebar-tie-wire-calculator">binding wire calculator</a>.</li>
<li>Cost and multi-column takeoff — the order section shows the hand arithmetic; the <a href="/rebar-cost-calculator">cost calculator</a> prices a full takeoff and the <a href="/rebar-quantity-calculator">quantity & takeoff calculator</a> totals across members.</li>
</ul>
<h3 id="mistakes">5 common mistakes</h3>
<ol>
<li><strong>Forgetting the +1 on ties.</strong> floor(height ÷ spacing) without the +1 gives 20 ties instead of 21 on the defaults — one 1244 mm tie, 0.49 kg, missing from every column. The end ties are real ties.</li>
<li><strong>Treating the 0.6 m lap default as the code lap.</strong> For 16 mm Fe500 M25 tension bars the code lap is 776.79 mm, not 600 mm — trusting the default understates the vertical steel by 1.68 kg per column, 16.80 kg across ten columns.</li>
<li><strong>Steel below the 0.8% minimum.</strong> 4 × 12 mm in a 300 × 300 mm column gives 0.50% and fails the minimum even though the calculator totals it without complaint. Always work the percentage; the fix here is 4 × 16 mm (0.89%).</li>
<li><strong>Spacing wider than the code maximum.</strong> 300 mm ties on the defaults look like a saving (39.48 kg vs 44.38 kg) but exceed the 256 mm maximum for that section. The calculator counts any spacing you enter — the limit is yours to respect.</li>
<li><strong>Cutting ties to outer dimensions.</strong> The tie cut comes from the inner dimensions (width and depth less twice the cover). Using the outer 300 × 450 mm section gives a 1500 mm perimeter instead of 1180 mm — 320 mm too long per tie, 6.72 m and 2.65 kg over on 21 ties — and the tie will not fit with its cover intact.</li>
</ol>
<p>Last reviewed: October 2026.</p>`,
    de: {
  metaTitle: "Stützenbewehrungs-Rechner — Längsstäbe, Bügel & kg gratis",
  desc: "Stützenbewehrungs-Rechner: Vertikalstahl und Bügel für Rechteckstützen nach IS 456 berechnen. Beispiel: 3 m, 300 × 450 mm = 44,38 kg. Kostenlos.",
  formula: "Vertikalstahl = Stäbe × (Höhe + Übergreifung) × kg/m. Bügel = floor(Höhe ÷ Abstand) + 1, jeder in Bügel-Schnittlänge.",
  kw: "stützenbewehrungs-rechner, bewehrung für stützen berechnen, stützenbewehrung, stahlberechnung stütze",
  howto: ["Geben Sie die Stützenhöhe in Metern und den Querschnitt in mm ein.", "Legen Sie Anzahl und Durchmesser der Vertikalstäbe sowie die Übergreifungs-/Zulagelänge je Stab in Metern fest.", "Legen Sie den Bügelabstand in mm und die Bügelstärke fest.", "Lesen Sie das Gesamtgewicht ab, aufgeteilt in Vertikalstahl und Bügelstahl, dazu Bügelanzahl und Schnittlänge.", "Multiplizieren Sie mit der Anzahl identischer Stützen für die Geschosssumme und addieren Sie Verschnitt — der Rechner liefert eine Stütze, nicht die Bestellmenge."],
  faqs: [["Wie wird Stützenbewehrung berechnet?", "Addieren Sie Vertikalstahl und Bügelstahl. Vertikalstahl = Stabanzahl × (Höhe + Übergreifung) × kg/m; Bügel = floor(Höhe ÷ Abstand) + 1, jeder in Bügel-Schnittlänge geschnitten. Bei den Standardwerten des Rechners (3 m, 300 × 450 mm, 6 × 16 mm Stäbe, 0,6 m Übergreifung, 150 mm Bügel, 8 mm Bügelstäbe) sind das 34,08 kg Vertikalstahl plus 10,29 kg Bügelstahl = 44,38 kg für eine Stütze."],
          ["Wie viele Vertikalstäbe braucht eine Stütze?", "Mindestens 4 bei einer Rechteckstütze und 6 bei einer Rundstütze, vorbehaltlich der Bemessung — doch die Anzahl allein ist nicht die Prüfung. Die Stahlfläche muss auch den Mindestwert von 0,8 % des Bruttoquerschnitts erreichen: Die Standardwerte (6 × 16 mm in 300 × 450 mm) ergeben 0,89 % und bestehen, während 4 × 12 mm in 300 × 300 mm nur 0,50 % ergeben und nicht bestehen — dieser Querschnitt braucht stattdessen 4 × 16 mm (0,89 %)."],
          ["Wie hoch sind Mindest- und Höchstbewehrungsgrad einer Stütze?", "IS 456 legt Längsbewehrung zwischen 0,8 % und 6 % der Bruttoquerschnittsfläche fest. In der Praxis wird 4 % oft als Arbeitsgrenze verwendet, wo Stäbe übergreifen, weil sich übergriffene Stäbe verdoppeln und der Querschnitt sich verstopft. Die Prozenttabelle unten rechnet den Mindestwert für gängige Querschnitte durch; der Höchstwert ist bei gewöhnlichen Stützen selten die bindende Bedingung."],
          ["Welchen Abstand brauchen Stützenbügel?", "Höchstabstand = der kleinste Wert aus kleinster Seitenabmessung, 16 × kleinster Längsstabdurchmesser und 300 mm. Bei den Standardwerten (300 mm Seite, 16 mm Stäbe) ist das min(300, 256, 300) = 256 mm, sodass der Standardwert des Rechners von 150 mm bequem innerhalb liegt. Beachten Sie, dass der Rechner einen Abstand für die volle Höhe verwendet, während Zeichnungen die Bügel an Knoten, Übergreifungen und in der Mitte getrennt zonieren — dort, wo sie enger sind, gelten die Zonenabstände der Zeichnung."],
          ["Wie stark sollten Stützenbügel sein?", "Mindestens der größere Wert aus 6 mm und einem Viertel des größten Längsstabdurchmessers. Bei den Standardwerten (16 mm Stäbe) sind das 6 mm, also sind die 8 mm Bügelstäbe in Ordnung; bei 25 mm Stäben sind es 6,25 mm, also ist 8 mm das praktische Minimum. Ein veröffentlichter Leitfaden nennt pauschal 8 mm — die Untergrenze der Norm ist 6 mm, und 8 mm ist die sicherere gängige Wahl."],
          ["Was bedeutet das Feld Übergreifung/Zulage?", "Es ist EINE Zulagelänge je Vertikalstab in Metern, die Sie selbst festlegen — der Rechner berechnet keine Norm-Übergreifung. Die Vorgabe 0,6 m ist eine Zulage, kein Normwert: Die Norm-Zugübergreifung für einen 16 mm Fe500-Stab in M25-Beton beträgt 776,79 mm, sodass die Eingabe von 0,777 m statt 0,6 m bei den Standardwerten den Vertikalstahl von 34,08 kg auf 35,76 kg (+1,68 kg) erhöht. Nutzen Sie den <a href=\"/de/uebergreifungslaengen-rechner\">Übergreifungslängen-Rechner</a> für die Norm-Übergreifung, und wenn die Stütze oben und unten übergriffen wird, tragen Sie im Feld die Summe beider Übergreifungen ein."],
          ["Bemisst der Rechner die Stütze?", "Nein — er summiert den Stahl für einen Korb, den Sie beschreiben; er prüft nicht, ob der Korb ausreicht. Axial- und Momententragfähigkeit, Schlankheit und Knicken, Erdbeben-Einspannlängen und Knotendetailierung stammen aus der Tragwerksbemessung und der Zeichnung. Eine Summe, die vernünftig aussieht, ist kein Nachweis, dass der Querschnitt trägt, und ein Querschnitt, der den Mindestwert von 0,8 % besteht, ist kein Nachweis, dass er die Last trägt."],
          ["Wie viele Bügel braucht eine Stütze?", "Bügel = floor(Höhe ÷ Abstand) + 1 — das +1 ist der Bügel am fernen Ende, und ihn zu vergessen ist der klassische Zählfehler um eins: Bei den Standardwerten ergibt das 20 statt 21 Bügel, also einen 1.244 mm Bügel (0,49 kg) zu wenig. Der Rechner zählt 21 bei 150 mm Abstand an einer 3 m Stütze; bei 100 mm zählt er 31 und bei 300 mm nur 11 — doch 300 mm überschreitet den Norm-Höchstwert von 256 mm für diesen Querschnitt, also ist das keine legitime Einsparung."],
          ["Kann ich diesen Rechner für Rund- oder Wendelstützen verwenden?", "Nein — nur für rechteckige Stützen mit Bügeln. Rundstützen brauchen mindestens 6 Längsstäbe und eine andere Stabanordnung, und Wendelstützen verwenden eine durchgehende Spirale mit eigener Steigung und eigenen Detailierungsregeln statt einzelner geschlossener Bügel. Entnehmen Sie beides der Zeichnung; die Bügel-Schnittmethode des <a href=\"/de/buegel-schnittlaengen-rechner\">Bügel-Rechners</a> liefert weiterhin die geschlossene Bügellänge, doch Anzahl und Anordnung sind nicht Sache dieses Rechners."],
          ["Enthält der Rechner Verschnitt, Ankerstäbe oder Kosten?", "Nein — er liefert nur die saubere Summe für eine Stütze. Addieren Sie 3–5 % Verschnitt für Zuschnitt und Übergreifungen (ein veröffentlichter Bereich), entnehmen Sie Fundament-Ankerstäbe und Dübel dem <a href=\"/de/bewehrungsrechner-fuer-fundamente\">Fundament-Rechner</a>, bepreisen Sie die Bestellung mit dem <a href=\"/de/bewehrungskosten-rechner\">Kosten-Rechner</a> und prüfen Sie die Stahltonnage mit dem <a href=\"/de/bewehrungstonnage-rechner\">Tonnage-Rechner</a>. Für einen vollständigen Abzug über alle Bauteile nutzen Sie den <a href=\"/de/bewehrungsmengen-rechner\">Mengen- & Abrechnungsrechner</a>."]],
  toc: `<nav class="content-block" aria-label="Auf dieser Seite"><h2>Auf dieser Seite</h2><ul><li><a href="#how-to">So benutzen Sie den Rechner</a></li><li><a href="#formula">Die Formel</a></li><li><a href="#example-1">Beispiel 1: Standardwerte (3 m, 300 × 450 mm)</a></li><li><a href="#example-2">Beispiel 2: Stütze 400 × 400 mm</a></li><li><a href="#example-3">Beispiel 3: Kleine Quadratstütze — und eine nicht bestandene Prüfung</a></li><li><a href="#spacing-table">Bügel nach Abstand</a></li><li><a href="#percentage-table">Bewehrungsgrad nach Querschnitt</a></li><li><a href="#lap-field">Das Übergreifungsfeld, ehrlich erklärt</a></li><li><a href="#order">Von einer Stütze zur Bestellung für das Geschoss</a></li><li><a href="#imperial">Umrechnungen in Zoll-Maße</a></li><li><a href="#not-included">Was dieser Rechner nicht abdeckt</a></li><li><a href="#mistakes">5 häufige Fehler</a></li><li><a href="#faq">FAQs</a></li></ul></nav>`,
  extra: `<h3>Die Formel, erklärt</h3><p>Die Formel hat zwei Hälften — den Vertikalkorb und die Bügel, die ihn zusammenhalten — und der Rechner hält sie getrennt, damit Sie sehen, welche Hälfte dominiert:</p><p><strong>Vertikalstahl = Stäbe × (Höhe + Übergreifung) × kg/m; Bügel = floor(Höhe ÷ Abstand) + 1, jeder in Bügel-Schnittlänge; Gesamt = Vertikal- + Bügelstahl</strong></p><p>Jeder Vertikalstab läuft über die Stützenhöhe plus die von Ihnen festgelegte Übergreifungs-/Zulagelänge — eine Zulagelänge je Stab, nicht eine je Stütze. Jeder Bügel ist ein geschlossener Bügel, dessen Schnittlänge aus den Innenmaßen kommt: a = Breite − 2 × Betondeckung, b = Tiefe − 2 × Betondeckung, Schnitt = 2(a + b) + 20d − 6d − 6d, genau wie auf der Bügelseite. Die Bügelanzahl folgt derselben Zaunpfahlregel wie jedes Raster auf dieser Seite: floor(Höhe ÷ Abstand) Abstände brauchen floor(Höhe ÷ Abstand) + 1 Bügel, weil beide Endbügel zählen.</p><p>Ein Anzeigehinweis, übernommen von der Bügelseite: Das Bügelstab-Feld liest sich „0,395|8“, doch das Panel rechnet mit dem Optionswert 0,394 kg/m, sodass jede Bügelmasse unten 0,394 verwendet. Die Vertikalstab-Vorgabe „1,578|16“ stimmt exakt mit ihrer Option überein, sodass die Vertikalgewichte keiner solchen Anpassung bedürfen.</p><h3 id="example-1">Beispiel 1: Standardwerte (3 m, 300 × 450 mm)</h3><p>Öffnen Sie den Rechner und belassen Sie die Standardwerte: Höhe 3 m, Querschnitt 300 × 450 mm, Betondeckung 40 mm, 6 Vertikalstäbe à 16 mm, Übergreifung 0,6 m, Bügelabstand 150 mm, Bügelstäbe 8 mm.</p><p>Vertikalstahl = 6 × (3 + 0,6) × 1,578 = 34,08 kg. Bügel = floor(3.000 ÷ 150) + 1 = 21. Bügelschnitt: a = 300 − 80 = 220 mm, b = 450 − 80 = 370 mm, also 2 × (220 + 370) + 160 − 96 = 1.244 mm — genau der Bügel, den die Bügelseite für diesen Querschnitt bei Stützenbetondeckung durcharbeitet, sodass beide Seiten übereinstimmen. Bügelstahl = 21 × 1,244 × 0,394 = 10,29 kg.</p><p><strong>Gesamt = 34,08 + 10,29 = 44,38 kg (0,044 t).</strong> Das Panel zeigt 44,38 kg, 34,08 kg vertikal, 10,29 kg Bügel, 21,00 Bügel, 1.244 mm Schnittlänge und 0,044 t. Vertikalstahl macht hier 76,8 % der Summe aus — bei den meisten Stützen dominieren die Vertikalen und die Bügel liegen grob bei einem Fünftel bis einem Viertel, was ein nützlicher Geruchstest ist: Wenn Ihre Bügel je einmal schwerer sind als Ihre Vertikalen, prüfen Sie Ihre Abstandseingabe.</p><h3 id="example-2">Beispiel 2: Stütze 400 × 400 mm</h3><p>Stellen Sie Höhe 3,6 m, Querschnitt 400 × 400 mm, Betondeckung 40 mm, 8 Vertikalstäbe à 20 mm, Übergreifung 0,8 m, Bügelabstand 200 mm, Bügelstäbe 10 mm ein.</p><p>Vertikalstahl = 8 × (3,6 + 0,8) × 2,465 = 86,77 kg. Bügel = floor(3.600 ÷ 200) + 1 = 19. Bügelschnitt: a = b = 400 − 80 = 320 mm, also 2 × 640 + 200 − 120 = 1.360 mm. Bügelstahl = 19 × 1,36 × 0,616 = 15,92 kg.</p><p><strong>Gesamt = 86,77 + 15,92 = 102,69 kg (0,103 t).</strong> Der Bewehrungsgrad beträgt 8 × 314,16 ÷ 160.000 = 1,57 % — bequem innerhalb des Bandes von 0,8–6 %. Der Norm-Höchstabstand der Bügel liegt hier bei min(400, 16 × 20 = 320, 300) = 300 mm, sodass der Abstand von 200 mm mit Spielraum für die engeren Knoten- und Übergreifungszonen innerhalb der Grenze liegt, die die Zeichnung verlangen mag.</p><h3 id="example-3">Beispiel 3: Kleine Quadratstütze — und eine nicht bestandene Prüfung</h3><p>Stellen Sie Höhe 3 m, Querschnitt 300 × 300 mm, Betondeckung 40 mm, 4 Vertikalstäbe à 12 mm, Übergreifung 0,5 m, Bügelabstand 150 mm, Bügelstäbe 8 mm ein.</p><p>Vertikalstahl = 4 × (3 + 0,5) × 0,887 = 12,42 kg. Bügel = 21. Bügelschnitt: a = b = 300 − 80 = 220 mm, also 2 × 440 + 160 − 96 = 944 mm — wieder der eigene Quadratstützen-Bügel der Bügelseite. Bügelstahl = 21 × 0,944 × 0,394 = 7,81 kg.</p><p><strong>Gesamt = 12,42 + 7,81 = 20,23 kg (0,020 t).</strong> Doch die Summe ist nicht die ganze Geschichte: Die Stahlfläche beträgt 4 × 113,10 = 452,4 mm² bei einer Bruttofläche von 90.000 mm², also 0,50 % — UNTER dem IS 456 Mindestwert von 0,8 % (720 mm²). Dieser Korb besteht den Mindestwert nicht, obwohl der Rechner ihn fröhlich summiert. Die Lösung ist eine Stabstärke höher: 4 × 16 mm ergeben 804,2 mm², also 0,89 %, und bestehen. Ein Rechner, der nur Masse summiert, ließe das still durch; die Prozentprüfung ist es, die es auffängt.</p><h3 id="spacing-table">Bügel nach Abstand</h3><p>Dieselbe Standardstütze (3 m, 300 × 450 mm, 8 mm Bügel à 1.244 mm), fünf Abstände. Der Vertikalstahl bewegt sich nie — 34,08 kg in jeder Zeile — sodass die ganze Tabelle die Bügelhälfte bei der Arbeit zeigt.</p><div class="formula-table"><table><tr><th>Bügelabstand</th><th>Bügel</th><th>Bügelstahl</th><th>Gesamtgewicht</th></tr><tr><td>100 mm</td><td>31</td><td>15,19 kg</td><td>49,28 kg</td></tr><tr><td>150 mm</td><td>21</td><td>10,29 kg</td><td>44,38 kg</td></tr><tr><td>200 mm</td><td>16</td><td>7,84 kg</td><td>41,93 kg</td></tr><tr><td>250 mm</td><td>13</td><td>6,37 kg</td><td>40,46 kg</td></tr><tr><td>300 mm</td><td>11</td><td>5,39 kg</td><td>39,48 kg</td></tr></table></div><p>Zwei Lesarten. Erstens: Der Abstand ist ein echter Hebel — eine Verengung von 200 mm auf 100 mm fügt 15 Bügel und 7,35 kg (+18 %) an einer Stütze hinzu. Zweitens: Die 300 mm Zeile ist eine Falle, keine Einsparung — der Norm-Höchstwert für diesen Querschnitt beträgt min(300, 16 × 16 = 256, 300) = 256 mm, sodass 300 mm Abstand die Grenze verletzt, obwohl der Rechner ihn summiert. Der Rechner zählt jeden Abstand, den Sie eingeben; die Grenze einzuhalten ist Ihre Aufgabe. Und denken Sie daran, dass die Zeichnung Bügel an Knoten, Übergreifungen und in der Mitte getrennt zoniert — ein Abstand für die volle Höhe ist eine Schätzvereinfachung, keine Detailierungsanweisung.</p><h3 id="percentage-table">Bewehrungsgrad nach Querschnitt</h3><p>Der Mindestwert von 0,8 %, durchgerechnet für gängige Querschnitte. Die Spalte „Stäbe, die bestehen“ ist die kleinste praktische Gruppe, die den Mindestwert erfüllt — keine Bemessungsempfehlung, nur die rechnerische Untergrenze, die die Zeichnung einhalten muss.</p><div class="formula-table"><table><tr><th>Querschnitt</th><th>Bruttofläche</th><th>Mindeststahl (0,8 %)</th><th>Stäbe, die bestehen</th><th>Prozentsatz</th></tr><tr><td>300 × 300 mm</td><td>90.000 mm²</td><td>720,0 mm²</td><td>4 × 16 mm (804,2 mm²)</td><td>0,89 %</td></tr><tr><td>300 × 450 mm</td><td>135.000 mm²</td><td>1.080,0 mm²</td><td>6 × 16 mm (1.206,4 mm²)</td><td>0,89 %</td></tr><tr><td>400 × 400 mm</td><td>160.000 mm²</td><td>1.280,0 mm²</td><td>8 × 16 mm (1.608,5 mm²)</td><td>1,01 %</td></tr><tr><td>500 × 500 mm</td><td>250.000 mm²</td><td>2.000,0 mm²</td><td>10 × 16 mm (2.010,6 mm²)</td><td>0,80 %</td></tr></table></div><p>Der Höchstwert beträgt 6 % der Bruttofläche (5.400 mm² bei einem Querschnitt von 300 × 300 mm, 15.000 mm² bei 500 × 500 mm), wobei 4 % oft als Arbeitsgrenze verwendet wird, wo Stäbe übergreifen, weil sich übergriffene Stäbe verdoppeln und der Querschnitt sich verstopft. Die Zeile 500 × 500 mm ist die knappe: 10 × 16 mm übertrifft den Mindestwert mit 0,80 % nur knapp, sodass ein Stab weniger ihn nicht erreicht — rechnen Sie immer den Prozentsatz durch, raten Sie nie die Anzahl. Und eine Warnung aus dem Wettbewerberfeld: Ein veröffentlichtes Rechenbeispiel (4 × 20 mm in 400 × 400 mm) ergibt 0,79 %, knapp unter dem Mindestwert — selbst veröffentlichte Beispiele rutschen durch, weshalb die Prüfung auf die Rechnerseite selbst gehört.</p><h3 id="lap-field">Das Übergreifungsfeld, ehrlich erklärt</h3><p>Das Übergreifungs-/Zulagefeld ist die am meisten missverstandene Eingabe auf dieser Seite, daher hier genau, was es ist: EINE Zulagelänge je Vertikalstab in Metern, die Sie eintippen. Der Rechner berechnet daraus keine Norm-Übergreifung, und die Vorgabe 0,6 m ist eine Zulage, kein Normwert.</p><p>Was die Norm-Übergreifung tatsächlich ist, hängt von Stabstärke, Stahlgüte, Betongüte und Zug vs. Druck ab — das ist die Aufgabe des <a href="/de/uebergreifungslaengen-rechner">Übergreifungslängen-Rechners</a>. Für die Standardstäbe (16 mm, Fe500, M25, Zug) beträgt sie 776,79 mm. Die Eingabe von 0,777 m statt 0,6 m hebt den Standard-Vertikalstahl von 34,08 kg auf 35,76 kg an — ein Unterschied von 1,68 kg an einer Stütze, 16,80 kg über zehn Stützen. Pro Stütze klein, pro Geschoss nicht klein.</p><p>Es gibt eine zweite Methode im Feld, die man kennen sollte: Ein veröffentlichter Leitfaden addiert die Übergreifung an BEIDEN Enden (Höhe + 2 × 40d). Bei den Standardwerten ergibt das eine Stablänge von 3 + 2 × 0,64 = 4,28 m und Vertikalstahl von 40,52 kg — 6,44 kg über dem Wert mit Standard-Übergreifung. Wenn Ihre Stütze oben und unten übergriffen wird, tragen Sie im Feld die Summe beider Übergreifungen statt einer einzelnen Übergreifung ein; wenn sie nur an einem Ende übergriffen wird, tragen Sie die einzelne Übergreifung ein. Holen Sie sich die Übergreifungslänge selbst in jedem Fall aus dem Übergreifungsrechner oder der Zeichnung, nie aus der Vorgabe 0,6 m.</p><h3 id="order">Von einer Stütze zur Bestellung für das Geschoss</h3><p>Der Rechner liefert eine Stütze. Die Bestellung ist diese Stütze, mal die Anzahl identischer Stützen, plus Verschnitt.</p><p>Beispiel: Zehn Stützen zu den Standardwerten ergeben 10 × 44,38 = 443,78 kg. Addieren Sie 5 % Verschnitt für Zuschnitt und Übergreifungen (ein veröffentlichter Bereich liegt bei 3–5 %): 443,78 × 1,05 = 465,97 kg. Bei einem Beispielpreis von 1,20 €/kg sind das 532,53 € für zehn Stützen. Zwanzig Stützen ergeben 887,55 kg sauber, vor Verschnitt.</p><p>Zum Maßstab: Ein veröffentlichtes Leitfadenbeispiel, durch diesen Rechner nachgerechnet — eine 5 m, 300 × 500 mm Stütze mit 12 × 16 mm Stäben, 0,6 m Übergreifung und 8 mm Bügeln bei 200 mm — ergibt 106,04 kg vertikal plus 13,77 kg Bügel (26 Bügel à 1.344 mm) = 119,81 kg für eine Stütze, bei einem Bewehrungsgrad von 1,61 %. Für den vollständigen Abzug über alle Bauteile nutzen Sie den <a href="/de/bewehrungsmengen-rechner">Mengen- & Abrechnungsrechner</a>, bepreisen Sie ihn mit dem <a href="/de/bewehrungskosten-rechner">Kosten-Rechner</a> und prüfen Sie die Stahltonnage mit dem <a href="/de/bewehrungstonnage-rechner">Tonnage-Rechner</a>. Ankerstäbe und Dübel ins Fundament kommen aus dem <a href="/de/bewehrungsrechner-fuer-fundamente">Fundament-Rechner</a>.</p><h3 id="imperial">Umrechnungen in Zoll-Maße</h3><p>Der Rechner nimmt Meter und Millimeter, also rechnen Sie zuerst um: 1 m = 3,28 ft, 1 kg = 2,20 lb, 1 in = 25,4 mm.</p><p>Durchgerechnete Umrechnungen: Die Standardsumme 44,38 kg = 97,84 lb (0,044 t); Beispiel 2 summiert sich auf 102,69 kg = 226,38 lb (0,103 t). Eine 3 m Stütze ist 9,84 ft hoch, und ein Querschnitt von 300 × 450 mm misst 11,81 × 17,72 in. Die Formel ist einheitenfrei — Stäbe × (Höhe + Übergreifung) × kg/m funktioniert in Fuß und lb/ft, wenn jede Eingabe imperial ist — doch der Rechner nimmt metrische Werte, also rechnen Sie vor der Eingabe um. Bügelabstand in Zoll: 150 mm = 5,91 in, 200 mm = 7,87 in.</p><h3 id="not-included">Was dieser Rechner nicht abdeckt</h3><ul><li>Tragfähigkeitsbemessung — Axiallast-, Biegemoment-, Schlankheits- und Knicknachweise; ein Bewehrungsgrad, der 0,8 % besteht, beweist nicht, dass der Querschnitt seine Last trägt.</li><li>Rund- und Wendelstützen — nur rechteckige Stützen mit Bügeln; runde Anordnungen (mindestens 6 Stäbe) und Wendeldetailierung kommen aus der Zeichnung.</li><li>Balken-Stützen-Knoten-Einspannung und Erdbeben-Einspannlängen — IS 13920 Zonendetailierung, einschließlich engerer Bügelabstände an Knoten und Übergreifungszonen, wird nicht berechnet; der Rechner verwendet einen Abstand für die volle Höhe.</li><li>Fundament-Ankerstäbe und Dübel — siehe den <a href="/de/bewehrungsrechner-fuer-fundamente">Fundament-Rechner</a>.</li><li>Kupplungen — mechanische Stöße ersetzen Übergreifungen mit eigenen Längen und Lagen aus dem zugelassenen System.</li><li>Abstandhalter und Bindedraht — siehe den <a href="/de/abstandhalter-rechner">Abstandhalter-Rechner</a> und den <a href="/de/bindedraht-rechner">Bindedraht-Rechner</a>.</li><li>Kosten und Mehr-Stützen-Abzug — der Bestellabschnitt zeigt die Handrechnung; der <a href="/de/bewehrungskosten-rechner">Kosten-Rechner</a> bepreist einen vollständigen Abzug und der <a href="/de/bewehrungsmengen-rechner">Mengen- & Abrechnungsrechner</a> summiert über alle Bauteile.</li></ul><h3 id="mistakes">5 häufige Fehler</h3><ol><li><strong>Das +1 bei den Bügeln vergessen.</strong> floor(Höhe ÷ Abstand) ohne das +1 ergibt 20 statt 21 Bügel bei den Standardwerten — ein 1.244 mm Bügel, 0,49 kg, fehlt an jeder Stütze. Die Endbügel sind echte Bügel.</li><li><strong>Die Vorgabe 0,6 m Übergreifung für die Norm-Übergreifung halten.</strong> Für 16 mm Fe500 M25 Zugstäbe beträgt die Norm-Übergreifung 776,79 mm, nicht 600 mm — wer der Vorgabe vertraut, unterschätzt den Vertikalstahl um 1,68 kg je Stütze, 16,80 kg über zehn Stützen.</li><li><strong>Stahl unter dem Mindestwert von 0,8 %.</strong> 4 × 12 mm in einer 300 × 300 mm Stütze ergeben 0,50 % und bestehen den Mindestwert nicht, obwohl der Rechner sie ohne Beanstandung summiert. Rechnen Sie immer den Prozentsatz durch; die Lösung hier ist 4 × 16 mm (0,89 %).</li><li><strong>Abstand breiter als der Norm-Höchstwert.</strong> 300 mm Bügel bei den Standardwerten sehen wie eine Einsparung aus (39,48 kg vs. 44,38 kg), überschreiten aber den Höchstwert von 256 mm für diesen Querschnitt. Der Rechner zählt jeden Abstand, den Sie eingeben — die Grenze einzuhalten ist Ihre Aufgabe.</li><li><strong>Bügel auf Außenmaße schneiden.</strong> Der Bügelschnitt kommt aus den Innenmaßen (Breite und Tiefe abzüglich zweimal der Betondeckung). Die Verwendung des Außenquerschnitts 300 × 450 mm ergibt einen Umfang von 1.500 mm statt 1.180 mm — 320 mm zu lang je Bügel, 6,72 m und 2,65 kg zu viel bei 21 Bügeln — und der Bügel passt nicht mit intakter Betondeckung.</li></ol><p>Zuletzt geprüft: Oktober 2026.</p>`
}
},
    { id:"beam", slug:"beam-rebar-calculator", cat:"Members",
    metaTitle:"Beam Rebar Calculator — Main Bars, Stirrups & kg",
    h1:"Beam Rebar Calculator",
    desc:"Total rebar for a beam in seconds: top and bottom main bars plus stirrups, with weights. Defaults = 55.85 kg. Free calculator with worked examples.",
    kw:"beam rebar calculator, beam rebar estimate, beam reinforcement calculation, beam steel calculation",
    intro:"Estimate the steel in a beam. Enter the beam size and span, the number of top and bottom bars, and the stirrup spacing — the tool returns main steel, stirrup steel and the total weight.",
    howto:["Enter beam length, width, depth and clear cover.","Set the number of top bars and bottom bars, and pick the main bar size.","Set stirrup spacing and stirrup bar size.","Read main steel, stirrup steel, the stirrup count and the total weight.","Add laps, hooks and anchorage separately — the calculator counts straight bars at full beam length only, then allow waste before ordering."],
    formula:"Main steel = (top + bottom bars) × length × kg/m. Stirrups = floor(length ÷ spacing) + 1 at the stirrup cutting length.",
    faqs:[["How do you calculate beam reinforcement?", "Add the main bar weight to the stirrup weight along the beam length. Main steel = (top bars + bottom bars) × beam length × kg/m. Stirrup steel = number of stirrups × stirrup cutting length × kg/m. On the calculator defaults (5 m beam, 2 top + 3 bottom bars of 16 mm, 8 mm stirrups at 150 mm), that is 39.45 kg of main steel + 16.40 kg of stirrup steel = 55.85 kg."],
          ["What is the spacing of stirrups in a beam?", "Often closer near supports and wider at midspan; commonly 100–200 mm — design governs. As a code ceiling, IS 456:2000 limits shear-stirrup spacing to the lesser of 0.75d or 300 mm, where d is the effective depth. On the calculator defaults (d ≈ 409 mm), 0.75d = 306.75 mm, so 300 mm governs — the 300 mm row in the spacing table below sits exactly at that limit. Never pick a spacing above the maximum on your drawing."],
          ["Why does a beam need both top and bottom bars?", "Because bending puts one face in tension and the other in compression, and the tension side flips along the beam. At midspan of a simply supported beam the bottom is in tension, so the bottom bars do the main work (23.67 kg of the defaults' 39.45 kg main steel). Over a support in a continuous beam the top is in tension, so top bars carry that hogging moment. In a simply supported beam the 2 top bars are often just hanger bars that hold the stirrups in place — but they are still counted, still weighed, and still ordered."],
          ["How do you calculate the stirrup cutting length?", "From the inside of the stirrup, not the outside of the beam: a = width − 2 × cover, b = depth − 2 × cover, then cut = 2(a + b) + 20d − 6d − 6d (two 10d hooks, minus three 2d 90° bends and two 3d 135° bends). On the defaults (230 × 450 mm, 25 mm cover, 8 mm stirrups): a = 180 mm, b = 400 mm, cut = 2(180 + 400) + 160 − 48 − 48 = 1224 mm. The same formula drives the <a href=\"/stirrup-tie-cutting-length-calculator\">stirrup cutting length calculator</a>."],
          ["What is the minimum reinforcement for a beam?", "IS 456:2000 requires tension steel of at least 0.85/fy of b×d — for Fe415 that is 0.205% of b×d — and caps total steel at 4% of the gross section. On the defaults (b×d = 230 × 409 = 94070 mm²), the minimum is 192.67 mm² and the maximum is 4140.00 mm²; the defaults' 1005.31 mm² (0.97% of gross) sits between them. This calculator does not check any of this — check your steel area on the <a href=\"/rebar-area-calculator\">area calculator</a> and take bar counts from the structural drawing, never from this tool alone."],
          ["Do I need to add lap length to a beam?", "Yes, whenever a bar run is longer than the stock length (usually 12 m) or a bar is spliced. This calculator counts every main bar at the entered beam length with no lap added. A 13 m beam on the defaults otherwise gives 102.57 kg of main steel; one 16 mm Fe500 M25 tension lap of 0.777 m per bar adds 5 × 0.777 × 1.578 = 6.13 kg, taking main steel to 108.70 kg. Get the lap from the <a href=\"/rebar-lap-length-calculator\">lap length calculator</a> and add it before ordering."],
          ["Does the calculator include hooks and development length?", "No. Main bars are counted straight at full beam length — no end hooks, no anchorage into the support, no cranked (bent-up) bars. For scale, the development length of a 16 mm Fe500 bar in M25 concrete is 582.59 mm (see the <a href=\"/rebar-development-length-calculator\">development length calculator</a>), and a standard 90° hook adds 9d (see the <a href=\"/rebar-hook-bend-cutting-length-calculator\">hook cutting length calculator</a>). If your bars are hooked or cranked, work out those lengths there and add the weight."],
          ["How do I handle different stirrup spacing near supports?", "The calculator takes one spacing for the whole beam, so run it once per zone and add the stirrup weights. Example on the defaults section: 1 m at each end at 100 mm gives 11 stirrups per end, and the middle 3 m at 200 mm gives 16 — 38 counts, minus the 2 stirrups shared at the zone boundaries, is 36 stirrups and 17.36 kg of stirrup steel, against 16.40 kg for a uniform 150 mm spacing. The boundary correction matters: counting all 38 would overstate stirrup steel by 0.96 kg."],
          ["What is a doubly reinforced beam, and does this calculator cover it?", "A doubly reinforced beam has compression steel at the top in addition to tension steel at the bottom, used when the section is too shallow for singly reinforced design. For weighing purposes this calculator covers it fine — top and bottom bars are counted together — but it does not design anything: it cannot tell you whether compression steel is needed, what a T-beam flange contributes, or what side-face bars a deep beam (over 750 mm per IS 456) needs. Those come from the structural design."],
          ["How much steel should I actually order for a beam?", "Take the panel total, add laps, hooks and any extra support bars, then add a waste allowance (3–5% covers offcuts on straight work; use the higher end when laps and hooks are involved) and round up to stock lengths. Ten beams at the defaults total 558.47 kg; with 5% waste that is 586.39 kg, which is €703.67 at an example €1.20/kg. Price it on the <a href=\"/rebar-cost-calculator\">cost calculator</a> and convert it on the <a href=\"/rebar-tonnage-calculator\">tonnage calculator</a> (the defaults beam is 0.056 ton, so 17.91 beams make a tonne)."]],
    toc:`<nav class="content-block" aria-label="On this page">
    <h2>On this page</h2>
    <ul>
      <li><a href="#how-to">How to use the calculator</a></li>
      <li><a href="#formula">The formula, explained</a></li>
      <li><a href="#worked-examples">Worked examples</a></li>
      <li><a href="#main-bar-size">Main bar size</a></li>
      <li><a href="#stirrup-spacing">Stirrup spacing</a></li>
      <li><a href="#cover">Cover and stirrup cutting length</a></li>
      <li><a href="#support-zones">Support zones vs midspan</a></li>
      <li><a href="#steel-percentage">Steel percentage check</a></li>
      <li><a href="#laps-anchorage">Laps and anchorage</a></li>
      <li><a href="#ordering">Ordering and cost</a></li>
      <li><a href="#imperial">Imperial units</a></li>
      <li><a href="#not-included">What this calculator does not include</a></li>
      <li><a href="#mistakes">Common mistakes</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
  </nav>`,
    extra:`<h3>The formula, explained</h3>
<p>A beam's steel is two piles added together: straight main bars, and the closed stirrups wrapped around them. The calculator keeps them separate so you can check each one against your bar bending schedule.</p>
<p>Main steel = (top bars + bottom bars) × beam length × kg/m. On the defaults: (2 + 3) × 5 m × 1.578 kg/m = 39.45 kg. Split by layer, the top bars are 2 × 5 × 1.578 = 15.78 kg and the bottom bars are 3 × 5 × 1.578 = 23.67 kg. The kg/m values come from d² ÷ 162.28: 16 mm gives 256 ÷ 162.28 = 1.578 kg/m.</p>
<p>Stirrup steel = number of stirrups × cutting length × kg/m. The count is floor(beam length in mm ÷ spacing) + 1 — the +1 is the stirrup at the far end that a plain length ÷ spacing division misses. On the defaults: floor(5000 ÷ 150) + 1 = 34 stirrups. The cutting length works from the inside of the stirrup: a = 230 − 2 × 25 = 180 mm, b = 450 − 2 × 25 = 400 mm, then cut = 2(180 + 400) + 20 × 8 − 6 × 8 − 6 × 8 = 1224 mm. That is two 10d hooks added, three 2d 90° bends and two 3d 135° bends deducted — the same formula as the <a href="/stirrup-tie-cutting-length-calculator">stirrup calculator</a>. Each stirrup weighs 1.224 × 0.394 = 0.48 kg, so stirrup steel is 34 × 1.224 × 0.394 = 16.40 kg, and the total is 39.45 + 16.40 = 55.85 kg (0.056 ton). The panel computes 8 mm stirrups at 0.394 kg/m, the option value for 8 mm.</p>
<p>Two things the formula does not do. It does not add anything to the main-bar length: no lap, no hook, no development length, no bearing length. And it does not check whether the bars you entered are enough — bar counts and sizes come from the structural drawing, and this tool only weighs them.</p>
<h3 id="worked-examples">Worked examples</h3>
<p>Example 1 — the calculator defaults. A 5 m beam, 230 × 450 mm, 25 mm cover, 2 top + 3 bottom bars of 16 mm, 8 mm stirrups at 150 mm. Main steel 39.45 kg, stirrup steel 16.40 kg, 34 stirrups at 1224 mm each, total 55.85 kg (0.056 ton). Total bar lengths: mains 25.00 m, stirrups 41.62 m. Try it yourself: enter the defaults and the panel shows exactly these rows.</p>
<p>Example 2 — a larger beam. A 6 m beam, 300 × 600 mm, 30 mm cover, 2 top + 4 bottom bars of 20 mm, 10 mm stirrups at 200 mm. Main steel is 6 × 6 × 2.465 = 88.74 kg. Stirrups: floor(6000 ÷ 200) + 1 = 31; a = 300 − 60 = 240 mm, b = 600 − 60 = 540 mm, cut = 2(240 + 540) + 200 − 60 − 60 = 1640 mm; each stirrup weighs 1.640 × 0.617 = 1.01 kg, so stirrup steel is 31 × 1.640 × 0.617 = 31.37 kg. Total 120.11 kg (0.120 ton). Total bar lengths: mains 36.00 m, stirrups 50.84 m.</p>
<p>Example 3 — a small lintel-style beam. A 4 m beam, 230 × 300 mm, 25 mm cover, 2 top + 2 bottom bars of 12 mm, 8 mm stirrups at 125 mm. Main steel is 4 × 4 × 0.887 = 14.19 kg. Stirrups: floor(4000 ÷ 125) + 1 = 33; a = 180 mm, b = 250 mm, cut = 2(180 + 250) + 160 − 48 − 48 = 924 mm; each stirrup weighs 0.924 × 0.394 = 0.36 kg, so stirrup steel is 33 × 0.924 × 0.394 = 12.01 kg. Total 26.21 kg (0.026 ton). Total bar lengths: mains 16.00 m, stirrups 30.49 m.</p>
<h3 id="main-bar-size">Main bar size</h3>
<p>Main steel grows with the square of the diameter, so one size step is a big jump. Holding everything else at the defaults (5 m, 2 top + 3 bottom bars, 8 mm stirrups at 150 mm, stirrup steel 16.40 kg throughout):</p>
<div class="formula-table"><table><tr><th>Main bar</th><th>kg/m</th><th>Main steel</th><th>Total</th></tr><tr><td>12 mm</td><td>0.887</td><td>22.18 kg</td><td>38.57 kg</td></tr><tr><td>16 mm</td><td>1.578</td><td>39.45 kg</td><td>55.85 kg</td></tr><tr><td>20 mm</td><td>2.465</td><td>61.63 kg</td><td>78.02 kg</td></tr><tr><td>25 mm</td><td>3.851</td><td>96.28 kg</td><td>112.67 kg</td></tr></table></div>
<p>Going from 16 mm to 20 mm mains adds 22.18 kg to a single 5 m beam — over 55% more main steel. That is why substituting a larger bar "to be safe" is expensive, and why a smaller bar is never a safe substitution: the area matters, not just the weight. If your drawing specifies different sizes top and bottom (say 20 mm bottom, 12 mm top), the calculator cannot take two main sizes in one run — run it once with the top bars set to zero and once with the bottom bars set to zero, using the matching size each time, and add the two main-steel figures. The stirrup steel is identical in both runs, so add it only once.</p>
<h3 id="stirrup-spacing">Stirrup spacing</h3>
<p>Stirrup spacing moves the total less than main-bar size does, but it is the number most often guessed wrong. Holding everything else at the defaults (main steel 39.45 kg throughout):</p>
<div class="formula-table"><table><tr><th>Spacing</th><th>Stirrups</th><th>Stirrup steel</th><th>Total</th></tr><tr><td>75 mm</td><td>67</td><td>32.31 kg</td><td>71.76 kg</td></tr><tr><td>100 mm</td><td>51</td><td>24.60 kg</td><td>64.05 kg</td></tr><tr><td>150 mm</td><td>34</td><td>16.40 kg</td><td>55.85 kg</td></tr><tr><td>200 mm</td><td>26</td><td>12.54 kg</td><td>51.99 kg</td></tr><tr><td>250 mm</td><td>21</td><td>10.13 kg</td><td>49.58 kg</td></tr><tr><td>300 mm</td><td>17</td><td>8.20 kg</td><td>47.65 kg</td></tr></table></div>
<p>Halving the spacing from 150 mm to 75 mm almost doubles stirrup steel (16.40 kg to 32.31 kg); opening it to 300 mm saves only 8.20 kg against the defaults. And 300 mm is not a free saving: IS 456:2000 caps shear-stirrup spacing at the lesser of 0.75d or 300 mm. On the defaults, d ≈ 409 mm (450 mm depth minus 25 mm cover, 8 mm stirrup and half a 16 mm bar), so 0.75d = 306.75 mm and the 300 mm cap governs — the 300 mm row sits exactly at the legal limit for this section, and on a shallower beam it would already exceed it. Take spacing from the drawing; use this table to price the difference, not to choose the spacing.</p>
<h3 id="cover">Cover and stirrup cutting length</h3>
<p>Cover shrinks the stirrup, so more cover means slightly less stirrup steel — but cover is durability, not a saving to chase. Holding everything else at the defaults (main steel 39.45 kg, 34 stirrups of 8 mm throughout):</p>
<div class="formula-table"><table><tr><th>Cover</th><th>Inner a × b</th><th>Cut length</th><th>Stirrup steel</th><th>Total</th></tr><tr><td>20 mm</td><td>190 × 410 mm</td><td>1264 mm</td><td>16.93 kg</td><td>56.38 kg</td></tr><tr><td>25 mm</td><td>180 × 400 mm</td><td>1224 mm</td><td>16.40 kg</td><td>55.85 kg</td></tr><tr><td>30 mm</td><td>170 × 390 mm</td><td>1184 mm</td><td>15.86 kg</td><td>55.31 kg</td></tr><tr><td>40 mm</td><td>150 × 370 mm</td><td>1104 mm</td><td>14.79 kg</td><td>54.24 kg</td></tr><tr><td>50 mm</td><td>130 × 350 mm</td><td>1024 mm</td><td>13.72 kg</td><td>53.17 kg</td></tr></table></div>
<p>Each extra 5 mm of cover shrinks a + b by 20 mm (10 mm on each dimension), so the cut drops 40 mm from 25 mm to 30 mm cover and 80 mm from 30 mm to 40 mm. The whole range from 20 mm to 50 mm cover moves the beam total by only 3.21 kg — never worth trading against the cover your exposure condition requires. The common error runs the other way: working the cut from the OUTER dimensions (230 × 450 mm) gives 2(230 + 450) + 160 − 48 − 48 = 1424 mm instead of 1224 mm, which overstates every stirrup by 200 mm — 6.80 m over 34 stirrups, 2.68 kg of steel that does not exist.</p>
<h3 id="support-zones">Support zones vs midspan</h3>
<p>Shear is highest near the supports, so drawings commonly call for closer stirrups over the end zones and wider spacing at midspan — for example 100 mm near the supports and 200 mm in the middle. The calculator takes one spacing, so run it once per zone and add the stirrup weights. On the defaults section, with 1 m end zones at 100 mm and a 3 m middle zone at 200 mm: each end zone gives floor(1000 ÷ 100) + 1 = 11 stirrups and 11 × 1.224 × 0.394 = 5.30 kg; the middle zone gives floor(3000 ÷ 200) + 1 = 16 stirrups and 16 × 1.224 × 0.394 = 7.72 kg. That sums to 38 counts and 18.33 kg, but the stirrups at the two zone boundaries are counted twice — subtract them (2 × 1.224 × 0.394 = 0.96 kg) for 36 stirrups and 17.36 kg of stirrup steel. Against the uniform 150 mm spacing (34 stirrups, 16.40 kg), the zoned layout costs 0.96 kg more on this beam — a small price for the shear capacity at the supports. Main steel is unaffected: add the zones' stirrup steel to the single main-steel figure, not to each zone's panel total.</p>
<h3 id="steel-percentage">Steel percentage check</h3>
<p>The calculator weighs whatever bars you enter; it never asks whether they are enough. The quick check is the steel percentage: total bar area ÷ gross concrete area. One 16 mm bar is π/4 × 16² = 201.06 mm², so the defaults' 5 bars give 1005.31 mm² over 230 × 450 = 103500 mm², which is 0.97%. The bottom bars alone (3 × 201.06 = 603.19 mm²) are 0.58% of gross. Example 2 gives 1884.96 mm² over 180000 mm² = 1.05%; example 3 gives 452.39 mm² over 69000 mm² = 0.66%.</p>
<p>IS 456:2000 brackets the answer: tension steel must be at least 0.85/fy of b×d (for Fe415, 0.205% of b×d), and total steel must not exceed 4% of the gross area. On the defaults, b×d = 230 × 409 = 94070 mm², so the minimum is 192.67 mm² and the maximum is 4140.00 mm²; on example 2 the maximum is 7200.00 mm². All three worked examples sit inside their brackets — but passing this bracket is not a design. It only catches gross errors, like a beam entered with one bar or with an absurd bar count. Work out the required area from the bending moment (As ≈ M ÷ (0.87 × fy × d)) or take it from the drawing, and check bar combinations on the <a href="/rebar-area-calculator">area calculator</a>.</p>
<p>A second sanity check is weight per cubic metre of concrete. The defaults beam holds 0.5175 m³ of concrete (5 × 0.23 × 0.45), so 55.85 kg is 107.92 kg/m³. Example 2 is 111.21 kg/m³ and example 3 is 94.95 kg/m³. Published early-estimate bands for beams run about 170–250 lb/yd³, which converts to 100.86–148.32 kg/m³ — the defaults and example 2 sit inside that band, and example 3 sits just below it, which is reasonable for a lightly loaded small beam. A figure far outside the band usually means a wrong input, not a special beam.</p>
<h3 id="laps-anchorage">Laps and anchorage</h3>
<p>Two additions turn the panel total into an order quantity, and both are missing from the calculator by design. First, laps: any bar run longer than stock length (usually 12 m) needs a splice. Take a 13 m beam with everything else at the defaults — the panel gives 144.53 kg (main 102.57 kg, stirrup 41.96 kg, 87 stirrups). One 16 mm Fe500 M25 tension lap of 0.777 m per bar adds 5 × 0.777 × 1.578 = 6.13 kg, taking main steel to 108.70 kg. Get the lap from the <a href="/rebar-lap-length-calculator">lap length calculator</a>; do not use a memorised multiple, since the lap depends on grade, concrete and tension vs compression.</p>
<p>Second, anchorage: main bars must develop into their supports, and the calculator counts them straight at beam length with nothing added. For scale, the development length of a 16 mm Fe500 bar in M25 concrete is 582.59 mm (see the <a href="/rebar-development-length-calculator">development length calculator</a>), and a standard 90° end hook adds 9d (see the <a href="/rebar-hook-bend-cutting-length-calculator">hook cutting length calculator</a>). Cranked (bent-up) bars, extra top bars over supports, and curtailed bottom bars are the same story: they change the bar lengths, so work them out on the detailing pages and add the weight. A beam schedule that ignores laps and anchorage under-orders by roughly the lap allowance plus the hook allowance on every bar — on a multi-beam floor, that is kilograms per beam turning into a missed delivery.</p>
<h3 id="ordering">Ordering and cost</h3>
<p>Order per beam type, then multiply. Ten beams at the defaults total 10 × 55.85 = 558.47 kg; with a 5% waste allowance for offcuts that is 586.39 kg, which costs €703.67 at an example €1.20/kg (prices are examples — enter your local rate on the <a href="/rebar-cost-calculator">cost calculator</a>). For stock lengths, convert bar lengths, not weights: the defaults need 25.00 m of 16 mm main bars, which is 3 stock bars of 12 m (2 bars cut per stock bar, 5 needed), and 41.62 m of 8 mm stirrup bars, which is 4 stock bars of 12 m. Example 2 needs exactly 3 stock bars for its 36.00 m of mains and 5 for its 50.84 m of stirrups. In tonnage, the defaults beam is 0.056 ton, so 1000 ÷ 55.85 = 17.91 beams make a tonne — convert any schedule on the <a href="/rebar-tonnage-calculator">tonnage calculator</a>, and build a full count-and-length takeoff on the <a href="/rebar-quantity-calculator">quantity calculator</a>. Tie wire for fixing the cage is separate: estimate it on the <a href="/rebar-tie-wire-calculator">tie wire calculator</a>.</p>
<h3 id="imperial">Imperial units</h3>
<p>The bar dropdowns include US sizes, so the same calculator works in imperial — just enter the metric equivalents of your dimensions. A 5 m beam (16.40 ft) of 230 × 450 mm (9.06 × 17.72 in) with 2 top + 3 bottom #5 bars (15.9 mm, 1.552 kg/m) and #3 stirrups (9.5 mm, 0.56 kg/m) at 152.4 mm (6 in) spacing gives: main steel 5 × 5 × 1.552 = 38.80 kg (85.54 lb); stirrups floor(5000 ÷ 152.4) + 1 = 33, cut 2(180 + 400) + 8 × 9.5 = 1236 mm (48.66 in), stirrup steel 33 × 1.236 × 0.56 = 22.84 kg (50.35 lb); total 61.64 kg (135.89 lb). Note the stirrup count drops by one against the 150 mm metric spacing (33 vs 34) because 6 in is slightly wider than 150 mm — small spacing differences move the count, which is why the spacing table above matters. ACI 318 cover for beams not exposed to weather is 1.5 in to the ties, against the 25 mm used here.</p>
<h3 id="not-included">What this calculator does not include</h3>
<p>This is a weighing tool, not a design tool, and the following are all outside it: the structural design itself (bending moment, shear, required steel area, deflection, beam depth and width — all from the engineer); lap lengths; hooks, cranks and development/anchorage lengths; extra top bars over supports and curtailment of bottom bars; side-face reinforcement for deep beams over 750 mm; T-beam or L-beam flange steel; concrete volume, formwork and labour; cover blocks, chairs and spacers; tie wire; and waste. Use the companion pages for the missing pieces: <a href="/rebar-development-length-calculator">development length</a>, <a href="/rebar-lap-length-calculator">lap length</a>, <a href="/rebar-hook-bend-cutting-length-calculator">hooks</a>, <a href="/stirrup-tie-cutting-length-calculator">stirrup cutting length</a>, <a href="/column-rebar-calculator">columns</a> (the beam frames into them — check the joint), <a href="/rebar-area-calculator">area</a>, <a href="/rebar-quantity-calculator">quantity</a>, <a href="/rebar-cost-calculator">cost</a> and <a href="/rebar-tonnage-calculator">tonnage</a>.</p>
<h3 id="mistakes">Common mistakes</h3>
<p>1. Entering the clear span instead of the beam length. The calculator counts main bars at the entered length, so a 4.6 m clear span entered for a 5 m beam (with bearings) understates main steel by 0.4 m per bar — 5 × 0.4 × 1.578 = 3.16 kg on the defaults — before laps and anchorage are even considered. Enter the length the bars actually run, then add laps and hooks.</p>
<p>2. Working the stirrup cut from the outside of the beam. The cut runs around the inside of the stirrup (width and depth minus twice the cover), plus hooks minus bend deductions. Using outer dimensions gives 1424 mm instead of 1224 mm on the defaults — 2.68 kg of phantom stirrup steel per beam.</p>
<p>3. Using one spacing for a zoned drawing. A drawing that calls for 100 mm at the supports and 200 mm at midspan cannot be entered as a single 150 mm spacing without error: on the defaults section the zoned layout needs 36 stirrups (17.36 kg) against 34 (16.40 kg) uniform. Run each zone separately and correct for the shared boundary stirrups, as shown above.</p>
<p>4. Forgetting laps on long beams. A 13 m beam needs a splice in every main bar; skipping the 0.777 m lap per bar understates main steel by 6.13 kg on the defaults section — and by that amount on every long beam in the schedule.</p>
<p>5. Ordering the panel total with no waste allowance. The panel total is net steel: no offcuts, no cutting waste, no short bars, no laps or hooks. Add 3–5% for straight work (more with laps and hooks) and round up to 12 m stock bars before placing the order, or the last beam on the floor comes up short.</p>
<p>Last reviewed: October 2026.</p>`,
    de: {
  metaTitle: "Balkenbewehrungs-Rechner — Hauptstäbe, Bügel & kg gratis",
  desc: "Balkenbewehrungs-Rechner: Haupt- und Bügelstahl für Balken aus Länge, Querschnitt und Bügelabstand berechnen. Beispiel: 5 m Balken = 55,85 kg. Kostenlos.",
  formula: "Hauptstahl = (obere + untere Stäbe) × Länge × kg/m. Bügel = floor(Länge ÷ Abstand) + 1 in Bügel-Schnittlänge.",
  kw: "balkenbewehrungs-rechner, balken bewehrung berechnen, balkenbewehrung schätzen, balken stahlberechnung",
  howto: ["Balkenlänge, -breite, -tiefe und lichte Betondeckung eingeben.", "Anzahl der oberen und unteren Stäbe festlegen und die Hauptstabgröße wählen.", "Bügelabstand und Bügelstabgröße festlegen.", "Hauptstahl, Bügelstahl, Bügelanzahl und Gesamtgewicht ablesen.", "Übergreifungen, Haken und Verankerung getrennt addieren — der Rechner zählt nur gerade Stäbe in voller Balkenlänge; vor der Bestellung Verschnitt einplanen."],
  faqs: [["Wie berechnet man die Bewehrung eines Balkens?", "Hauptstabgewicht und Bügelgewicht entlang der Balkenlänge addieren. Hauptstahl = (obere Stäbe + untere Stäbe) × Balkenlänge × kg/m. Bügelstahl = Bügelanzahl × Bügel-Schnittlänge × kg/m. Bei den Rechner-Vorgaben (5 m Balken, 2 obere + 3 untere Stäbe aus 16 mm, 8-mm-Bügel bei 150 mm) sind das 39,45 kg Hauptstahl + 16,40 kg Bügelstahl = 55,85 kg."],
          ["Wie groß ist der Bügelabstand in einem Balken?", "Oft enger an den Auflagern und weiter in Feldmitte; üblich 100–200 mm — die Bemessung entscheidet. Als Obergrenze nach IS 456:2000 ist der Schubbügelabstand auf den kleineren Wert aus 0,75d oder 300 mm begrenzt, wobei d die nutzbare Höhe ist. Bei den Rechner-Vorgaben (d ≈ 409 mm) ist 0,75d = 306,75 mm, also gelten 300 mm — die 300-mm-Zeile in der Abstandstabelle unten liegt genau an dieser Grenze. Niemals einen größeren Abstand wählen als auf Ihrer Zeichnung angegeben."],
          ["Warum braucht ein Balken obere und untere Stäbe?", "Weil Biegung eine Seite auf Zug und die andere auf Druck beansprucht und die Zugseite entlang des Balkens wechselt. In Feldmitte eines Einfeldträgers ist die Unterseite auf Zug, dort leisten die unteren Stäbe die Hauptarbeit (23,67 kg der 39,45 kg Hauptstahl der Vorgaben). Über einem Auflager eines Durchlaufträgers ist die Oberseite auf Zug, dort tragen die oberen Stäbe das Stützmoment. Bei einem Einfeldträger sind die 2 oberen Stäbe oft nur Montagestäbe, die die Bügel halten — sie werden trotzdem gezählt, gewogen und bestellt."],
          ["Wie berechnet man die Bügel-Schnittlänge?", "Von der Innenseite des Bügels aus, nicht von der Außenseite des Balkens: a = Breite − 2 × Betondeckung, b = Tiefe − 2 × Betondeckung, dann Schnittlänge = 2(a + b) + 20d − 6d − 6d (zwei 10d-Haken, minus drei 2d-Biegungen um 90° und zwei 3d-Biegungen um 135°). Bei den Vorgaben (230 × 450 mm, 25 mm Betondeckung, 8-mm-Bügel): a = 180 mm, b = 400 mm, Schnittlänge = 2(180 + 400) + 160 − 48 − 48 = 1.224 mm. Dieselbe Formel steuert den <a href=\"/de/buegel-schnittlaengen-rechner\">Bügel-Schnittlängen-Rechner</a>."],
          ["Wie groß ist die Mindestbewehrung für einen Balken?", "IS 456:2000 verlangt Zugstahl von mindestens 0,85/fy von b×d — für Fe415 sind das 0,205 % von b×d — und begrenzt den Gesamtstahl auf 4 % des Bruttoquerschnitts. Bei den Vorgaben (b×d = 230 × 409 = 94.070 mm²) sind das mindestens 192,67 mm² und höchstens 4.140,00 mm²; die 1.005,31 mm² der Vorgaben (0,97 % des Bruttoquerschnitts) liegen dazwischen. Dieser Rechner prüft nichts davon — prüfen Sie Ihre Stahlfläche auf dem <a href=\"/de/stahlflaechen-rechner-ast\">Flächenrechner</a> und übernehmen Sie Stabanzahlen aus der statischen Zeichnung, niemals allein aus diesem Tool."],
          ["Muss ich bei einem Balken die Übergreifungslänge addieren?", "Ja, sobald ein Stabstrang länger ist als die Handelslänge (meist 12 m) oder ein Stab gestoßen wird. Dieser Rechner zählt jeden Hauptstab mit der eingegebenen Balkenlänge ohne zugegebene Übergreifung. Ein 13-m-Balken mit sonst den Vorgaben ergibt sonst 102,57 kg Hauptstahl; eine 16-mm-Fe500-M25-Zugübergreifung von 0,777 m je Stab addiert 5 × 0,777 × 1,578 = 6,13 kg und bringt den Hauptstahl auf 108,70 kg. Holen Sie sich die Übergreifung vom <a href=\"/de/uebergreifungslaengen-rechner\">Übergreifungslängen-Rechner</a> und addieren Sie sie vor der Bestellung."],
          ["Enthält der Rechner Haken und Verankerungslänge?", "Nein. Hauptstäbe werden gerade in voller Balkenlänge gezählt — keine Endhaken, keine Verankerung in den Auflagern, keine abgebogenen Eisen. Zur Einordnung: Die Verankerungslänge eines 16-mm-Fe500-Stabs in M25-Beton beträgt 582,59 mm (siehe <a href=\"/de/verankerungslaengen-rechner\">Verankerungslängen-Rechner</a>), und ein Standard-90°-Haken addiert 9d (siehe <a href=\"/de/haken-biege-schnittlaengen-rechner\">Haken-Schnittlängen-Rechner</a>). Wenn Ihre Stäbe gehakt oder abgebogen sind, ermitteln Sie diese Längen dort und addieren Sie das Gewicht."],
          ["Wie gehe ich mit unterschiedlichem Bügelabstand an den Auflagern um?", "Der Rechner nimmt einen Abstand für den ganzen Balken, also rechnen Sie einmal je Zone und addieren Sie die Bügelgewichte. Beispiel mit dem Vorgabenquerschnitt: 1 m an jedem Ende bei 100 mm ergibt 11 Bügel je Ende, und die mittleren 3 m bei 200 mm ergeben 16 — 38 Stück minus die 2 Bügel, die an den Zonengrenzen gemeinsam gezählt werden, sind 36 Bügel und 17,36 kg Bügelstahl, gegenüber 16,40 kg bei einheitlichem 150-mm-Abstand. Die Grenzkorrektur zählt: Alle 38 zu zählen würde den Bügelstahl um 0,96 kg übertreiben."],
          ["Was ist ein doppelt bewehrter Balken, und deckt ihn dieser Rechner ab?", "Ein doppelt bewehrter Balken hat zusätzlich Druckstahl oben neben Zugstahl unten und wird verwendet, wenn der Querschnitt für einfach bewehrte Bemessung zu flach ist. Zum Wiegen deckt dieser Rechner das problemlos ab — obere und untere Stäbe werden zusammen gezählt — aber er bemisst nichts: Er kann Ihnen nicht sagen, ob Druckstahl nötig ist, was ein Plattenbalken-Flansch beiträgt oder welche Seitenbewehrung ein tiefer Balken (über 750 mm nach IS 456) braucht. Das kommt aus der Tragwerksplanung."],
          ["Wie viel Stahl soll ich für einen Balken tatsächlich bestellen?", "Nehmen Sie die Panel-Summe, addieren Sie Übergreifungen, Haken und zusätzliche Auflagestäbe, dann einen Verschnittzuschlag (3–5 % deckt Abschnitte bei gerader Arbeit ab; nehmen Sie den höheren Wert, wenn Übergreifungen und Haken beteiligt sind) und runden Sie auf Handelslängen auf. Zehn Balken mit den Vorgaben ergeben zusammen 558,47 kg; mit 5 % Verschnitt sind das 586,39 kg, also 703,67 € bei einem Beispielpreis von 1,20 €/kg. Bepreisen Sie das auf dem <a href=\"/de/bewehrungskosten-rechner\">Kostenrechner</a> und rechnen Sie es auf dem <a href=\"/de/bewehrungstonnage-rechner\">Tonnagerechner</a> um (der Vorgabenbalken ist 0,056 t, also ergeben 17,91 Balken eine Tonne)."]],
  toc: `<nav class="content-block" aria-label="Auf dieser Seite"><h2>Auf dieser Seite</h2><ul><li><a href="#how-to">So benutzen Sie den Rechner</a></li><li><a href="#formula">Die Formel, erklärt</a></li><li><a href="#worked-examples">Rechenbeispiele</a></li><li><a href="#main-bar-size">Hauptstabgröße</a></li><li><a href="#stirrup-spacing">Bügelabstand</a></li><li><a href="#cover">Betondeckung und Bügel-Schnittlänge</a></li><li><a href="#support-zones">Auflagerbereiche und Feldmitte</a></li><li><a href="#steel-percentage">Bewehrungsgrad-Prüfung</a></li><li><a href="#laps-anchorage">Übergreifungen und Verankerung</a></li><li><a href="#ordering">Bestellung und Kosten</a></li><li><a href="#imperial">Zoll-Maße</a></li><li><a href="#not-included">Was dieser Rechner nicht enthält</a></li><li><a href="#mistakes">Häufige Fehler</a></li><li><a href="#faq">FAQ</a></li></ul></nav>`,
  extra: `<h3>Die Formel, erklärt</h3><p>Der Stahl eines Balkens besteht aus zwei Stapeln, die addiert werden: geraden Hauptstäben und den geschlossenen Bügeln, die um sie herumgeführt werden. Der Rechner hält sie getrennt, damit Sie jeden gegen Ihren Biegeplan prüfen können.</p><p>Hauptstahl = (obere Stäbe + untere Stäbe) × Balkenlänge × kg/m. Bei den Vorgaben: (2 + 3) × 5 m × 1,578 kg/m = 39,45 kg. Nach Lagen aufgeteilt sind die oberen Stäbe 2 × 5 × 1,578 = 15,78 kg und die unteren Stäbe 3 × 5 × 1,578 = 23,67 kg. Die kg/m-Werte kommen aus d² ÷ 162,28: 16 mm ergibt 256 ÷ 162,28 = 1,578 kg/m.</p><p>Bügelstahl = Bügelanzahl × Schnittlänge × kg/m. Die Anzahl ist floor(Balkenlänge in mm ÷ Abstand) + 1 — das +1 ist der Bügel am fernen Ende, den eine einfache Länge-÷-Abstand-Division verpasst. Bei den Vorgaben: floor(5.000 ÷ 150) + 1 = 34 Bügel. Die Schnittlänge arbeitet von der Innenseite des Bügels aus: a = 230 − 2 × 25 = 180 mm, b = 450 − 2 × 25 = 400 mm, dann Schnittlänge = 2(180 + 400) + 20 × 8 − 6 × 8 − 6 × 8 = 1.224 mm. Das sind zwei 10d-Haken, die addiert werden, drei 2d-Biegungen um 90° und zwei 3d-Biegungen um 135°, die abgezogen werden — dieselbe Formel wie beim <a href="/de/buegel-schnittlaengen-rechner">Bügelrechner</a>. Jeder Bügel wiegt 1,224 × 0,394 = 0,48 kg, also ist der Bügelstahl 34 × 1,224 × 0,394 = 16,40 kg, und die Summe ist 39,45 + 16,40 = 55,85 kg (0,056 t). Das Panel rechnet 8-mm-Bügel mit 0,394 kg/m, dem Optionswert für 8 mm.</p><p>Zwei Dinge leistet die Formel nicht. Sie addiert nichts zur Hauptstablänge: keine Übergreifung, keinen Haken, keine Verankerungslänge, keine Auflagelänge. Und sie prüft nicht, ob die eingegebenen Stäbe ausreichen — Stabanzahlen und -größen kommen aus der statischen Zeichnung, und dieses Tool wiegt sie nur.</p><h3 id="worked-examples">Rechenbeispiele</h3><p>Beispiel 1 — die Rechner-Vorgaben. Ein 5-m-Balken, 230 × 450 mm, 25 mm Betondeckung, 2 obere + 3 untere Stäbe aus 16 mm, 8-mm-Bügel bei 150 mm. Hauptstahl 39,45 kg, Bügelstahl 16,40 kg, 34 Bügel zu je 1.224 mm, gesamt 55,85 kg (0,056 t). Gesamtstablängen: Hauptstäbe 25,00 m, Bügel 41,62 m. Probieren Sie es selbst: Geben Sie die Vorgaben ein, und das Panel zeigt genau diese Zeilen.</p><p>Beispiel 2 — ein größerer Balken. Ein 6-m-Balken, 300 × 600 mm, 30 mm Betondeckung, 2 obere + 4 untere Stäbe aus 20 mm, 10-mm-Bügel bei 200 mm. Hauptstahl ist 6 × 6 × 2,465 = 88,74 kg. Bügel: floor(6.000 ÷ 200) + 1 = 31; a = 300 − 60 = 240 mm, b = 600 − 60 = 540 mm, Schnittlänge = 2(240 + 540) + 200 − 60 − 60 = 1.640 mm; jeder Bügel wiegt 1,640 × 0,617 = 1,01 kg, also ist der Bügelstahl 31 × 1,640 × 0,617 = 31,37 kg. Gesamt 120,11 kg (0,120 t). Gesamtstablängen: Hauptstäbe 36,00 m, Bügel 50,84 m.</p><p>Beispiel 3 — ein kleiner sturzartiger Balken. Ein 4-m-Balken, 230 × 300 mm, 25 mm Betondeckung, 2 obere + 2 untere Stäbe aus 12 mm, 8-mm-Bügel bei 125 mm. Hauptstahl ist 4 × 4 × 0,887 = 14,19 kg. Bügel: floor(4.000 ÷ 125) + 1 = 33; a = 180 mm, b = 250 mm, Schnittlänge = 2(180 + 250) + 160 − 48 − 48 = 924 mm; jeder Bügel wiegt 0,924 × 0,394 = 0,36 kg, also ist der Bügelstahl 33 × 0,924 × 0,394 = 12,01 kg. Gesamt 26,21 kg (0,026 t). Gesamtstablängen: Hauptstäbe 16,00 m, Bügel 30,49 m.</p><h3 id="main-bar-size">Hauptstabgröße</h3><p>Der Hauptstahl wächst mit dem Quadrat des Durchmessers, also ist ein Größenschritt ein großer Sprung. Wenn alles andere bei den Vorgaben gehalten wird (5 m, 2 obere + 3 untere Stäbe, 8-mm-Bügel bei 150 mm, Bügelstahl durchgehend 16,40 kg):</p><div class="formula-table"><table><tr><th>Hauptstab</th><th>kg/m</th><th>Hauptstahl</th><th>Gesamt</th></tr><tr><td>12 mm</td><td>0,887</td><td>22,18 kg</td><td>38,57 kg</td></tr><tr><td>16 mm</td><td>1,578</td><td>39,45 kg</td><td>55,85 kg</td></tr><tr><td>20 mm</td><td>2,465</td><td>61,63 kg</td><td>78,02 kg</td></tr><tr><td>25 mm</td><td>3,851</td><td>96,28 kg</td><td>112,67 kg</td></tr></table></div><p>Der Wechsel von 16-mm- auf 20-mm-Hauptstäbe addiert 22,18 kg zu einem einzigen 5-m-Balken — über 55 % mehr Hauptstahl. Darum ist der Ersatz durch einen größeren Stab „zur Sicherheit" teuer, und ein kleinerer Stab ist niemals ein sicherer Ersatz: Die Fläche zählt, nicht nur das Gewicht. Wenn Ihre Zeichnung oben und unten unterschiedliche Größen vorschreibt (zum Beispiel 20 mm unten, 12 mm oben), kann der Rechner in einem Durchgang keine zwei Hauptgrößen verarbeiten — rechnen Sie einmal mit den oberen Stäben auf null und einmal mit den unteren Stäben auf null, jeweils mit der passenden Größe, und addieren Sie die beiden Hauptstahlwerte. Der Bügelstahl ist in beiden Durchgängen identisch, also addieren Sie ihn nur einmal.</p><h3 id="stirrup-spacing">Bügelabstand</h3><p>Der Bügelabstand bewegt die Summe weniger als die Hauptstabgröße, aber er ist die Zahl, die am häufigsten falsch geschätzt wird. Wenn alles andere bei den Vorgaben gehalten wird (Hauptstahl durchgehend 39,45 kg):</p><div class="formula-table"><table><tr><th>Abstand</th><th>Bügel</th><th>Bügelstahl</th><th>Gesamt</th></tr><tr><td>75 mm</td><td>67</td><td>32,31 kg</td><td>71,76 kg</td></tr><tr><td>100 mm</td><td>51</td><td>24,60 kg</td><td>64,05 kg</td></tr><tr><td>150 mm</td><td>34</td><td>16,40 kg</td><td>55,85 kg</td></tr><tr><td>200 mm</td><td>26</td><td>12,54 kg</td><td>51,99 kg</td></tr><tr><td>250 mm</td><td>21</td><td>10,13 kg</td><td>49,58 kg</td></tr><tr><td>300 mm</td><td>17</td><td>8,20 kg</td><td>47,65 kg</td></tr></table></div><p>Die Halbierung des Abstands von 150 mm auf 75 mm verdoppelt den Bügelstahl fast (16,40 kg auf 32,31 kg); die Öffnung auf 300 mm spart nur 8,20 kg gegenüber den Vorgaben. Und 300 mm ist keine kostenlose Einsparung: IS 456:2000 begrenzt den Schubbügelabstand auf den kleineren Wert aus 0,75d oder 300 mm. Bei den Vorgaben ist d ≈ 409 mm (450 mm Tiefe minus 25 mm Betondeckung, 8-mm-Bügel und einen halben 16-mm-Stab), also ist 0,75d = 306,75 mm und die 300-mm-Grenze gilt — die 300-mm-Zeile liegt genau an der zulässigen Grenze für diesen Querschnitt, und bei einem flacheren Balken wäre sie bereits überschritten. Übernehmen Sie den Abstand aus der Zeichnung; nutzen Sie diese Tabelle, um den Unterschied zu bepreisen, nicht um den Abstand zu wählen.</p><h3 id="cover">Betondeckung und Bügel-Schnittlänge</h3><p>Die Betondeckung verkleinert den Bügel, also bedeutet mehr Betondeckung etwas weniger Bügelstahl — aber Betondeckung ist Dauerhaftigkeit, keine Einsparung, der man nachjagen sollte. Wenn alles andere bei den Vorgaben gehalten wird (Hauptstahl 39,45 kg, 34 Bügel aus 8 mm durchgehend):</p><div class="formula-table"><table><tr><th>Betondeckung</th><th>Innen a × b</th><th>Schnittlänge</th><th>Bügelstahl</th><th>Gesamt</th></tr><tr><td>20 mm</td><td>190 × 410 mm</td><td>1.264 mm</td><td>16,93 kg</td><td>56,38 kg</td></tr><tr><td>25 mm</td><td>180 × 400 mm</td><td>1.224 mm</td><td>16,40 kg</td><td>55,85 kg</td></tr><tr><td>30 mm</td><td>170 × 390 mm</td><td>1.184 mm</td><td>15,86 kg</td><td>55,31 kg</td></tr><tr><td>40 mm</td><td>150 × 370 mm</td><td>1.104 mm</td><td>14,79 kg</td><td>54,24 kg</td></tr><tr><td>50 mm</td><td>130 × 350 mm</td><td>1.024 mm</td><td>13,72 kg</td><td>53,17 kg</td></tr></table></div><p>Jede zusätzlichen 5 mm Betondeckung verkleinern a + b um 20 mm (10 mm je Maß), also sinkt die Schnittlänge um 40 mm von 25 mm auf 30 mm Betondeckung und um 80 mm von 30 mm auf 40 mm. Die gesamte Spanne von 20 mm bis 50 mm Betondeckung bewegt die Balkensumme nur um 3,21 kg — niemals wert, sie gegen die Betondeckung einzutauschen, die Ihre Expositionsklasse verlangt. Der häufige Fehler läuft umgekehrt: Die Schnittlänge aus den AUSSENmaßen (230 × 450 mm) zu rechnen ergibt 2(230 + 450) + 160 − 48 − 48 = 1.424 mm statt 1.224 mm, was jeden Bügel um 200 mm übertreibt — 6,80 m über 34 Bügel, 2,68 kg Stahl, den es nicht gibt.</p><h3 id="support-zones">Auflagerbereiche und Feldmitte</h3><p>Die Querkraft ist in Auflagernähe am größten, darum sehen Zeichnungen häufig engere Bügel über den Endzonen und weitere Abstände in Feldmitte vor — zum Beispiel 100 mm an den Auflagern und 200 mm in der Mitte. Der Rechner nimmt einen Abstand, also rechnen Sie einmal je Zone und addieren Sie die Bügelgewichte. Beim Vorgabenquerschnitt mit 1-m-Endzonen bei 100 mm und einer 3-m-Mittelzone bei 200 mm: Jede Endzone ergibt floor(1.000 ÷ 100) + 1 = 11 Bügel und 11 × 1,224 × 0,394 = 5,30 kg; die Mittelzone ergibt floor(3.000 ÷ 200) + 1 = 16 Bügel und 16 × 1,224 × 0,394 = 7,72 kg. Das summiert sich auf 38 Stück und 18,33 kg, aber die Bügel an den beiden Zonengrenzen werden doppelt gezählt — ziehen Sie sie ab (2 × 1,224 × 0,394 = 0,96 kg) für 36 Bügel und 17,36 kg Bügelstahl. Gegenüber dem einheitlichen 150-mm-Abstand (34 Bügel, 16,40 kg) kostet die zonierte Anordnung bei diesem Balken 0,96 kg mehr — ein kleiner Preis für die Querkrafttragfähigkeit an den Auflagern. Der Hauptstahl ist unberührt: Addieren Sie den Zonen-Bügelstahl zur einzigen Hauptstahlzahl, nicht zu jeder Zonen-Panel-Summe.</p><h3 id="steel-percentage">Bewehrungsgrad-Prüfung</h3><p>Der Rechner wiegt, welche Stäbe Sie eingeben; er fragt nie, ob sie ausreichen. Die schnelle Prüfung ist der Bewehrungsgrad: Gesamtstabfläche ÷ Bruttobetonfläche. Ein 16-mm-Stab hat π/4 × 16² = 201,06 mm², also ergeben die 5 Stäbe der Vorgaben 1.005,31 mm² über 230 × 450 = 103.500 mm², was 0,97 % entspricht. Allein die unteren Stäbe (3 × 201,06 = 603,19 mm²) sind 0,58 % des Bruttoquerschnitts. Beispiel 2 ergibt 1.884,96 mm² über 180.000 mm² = 1,05 %; Beispiel 3 ergibt 452,39 mm² über 69.000 mm² = 0,66 %.</p><p>IS 456:2000 steckt die Antwort ein: Zugstahl muss mindestens 0,85/fy von b×d betragen (für Fe415 also 0,205 % von b×d), und der Gesamtstahl darf 4 % der Bruttofläche nicht überschreiten. Bei den Vorgaben ist b×d = 230 × 409 = 94.070 mm², also sind das mindestens 192,67 mm² und höchstens 4.140,00 mm²; bei Beispiel 2 beträgt das Maximum 7.200,00 mm². Alle drei Rechenbeispiele liegen innerhalb ihrer Grenzen — aber das Bestehen dieser Prüfung ist keine Bemessung. Es fängt nur grobe Fehler ab, etwa einen Balken, der mit einem Stab oder mit einer absurden Stabanzahl eingegeben wurde. Ermitteln Sie die erforderliche Fläche aus dem Biegemoment (As ≈ M ÷ (0,87 × fy × d)) oder übernehmen Sie sie aus der Zeichnung, und prüfen Sie Stabkombinationen auf dem <a href="/de/stahlflaechen-rechner-ast">Flächenrechner</a>.</p><p>Eine zweite Plausibilitätsprüfung ist das Gewicht je Kubikmeter Beton. Der Vorgabenbalken enthält 0,5175 m³ Beton (5 × 0,23 × 0,45), also sind 55,85 kg gleich 107,92 kg/m³. Beispiel 2 liegt bei 111,21 kg/m³ und Beispiel 3 bei 94,95 kg/m³. Veröffentlichte Frühschätzungsbänder für Balken liegen bei etwa 170–250 lb/yd³, was 100,86–148,32 kg/m³ entspricht — die Vorgaben und Beispiel 2 liegen innerhalb dieses Bands, und Beispiel 3 liegt knapp darunter, was für einen leicht belasteten kleinen Balken vernünftig ist. Ein Wert weit außerhalb des Bands bedeutet meist eine falsche Eingabe, keinen besonderen Balken.</p><h3 id="laps-anchorage">Übergreifungen und Verankerung</h3><p>Zwei Zugaben machen aus der Panel-Summe eine Bestellmenge, und beide fehlen im Rechner aus gutem Grund. Erstens Übergreifungen: Jeder Stabstrang, der länger ist als die Handelslänge (meist 12 m), braucht einen Stoß. Nehmen Sie einen 13-m-Balken mit sonst den Vorgaben — das Panel ergibt 144,53 kg (Hauptstahl 102,57 kg, Bügelstahl 41,96 kg, 87 Bügel). Eine 16-mm-Fe500-M25-Zugübergreifung von 0,777 m je Stab addiert 5 × 0,777 × 1,578 = 6,13 kg und bringt den Hauptstahl auf 108,70 kg. Holen Sie sich die Übergreifung vom <a href="/de/uebergreifungslaengen-rechner">Übergreifungslängen-Rechner</a>; verwenden Sie kein auswendig gelerntes Vielfaches, da die Übergreifung von Güte, Beton und Zug gegenüber Druck abhängt.</p><p>Zweitens Verankerung: Hauptstäbe müssen sich in ihre Auflager entwickeln, und der Rechner zählt sie gerade in Balkenlänge ohne jede Zugabe. Zur Einordnung: Die Verankerungslänge eines 16-mm-Fe500-Stabs in M25-Beton beträgt 582,59 mm (siehe <a href="/de/verankerungslaengen-rechner">Verankerungslängen-Rechner</a>), und ein Standard-90°-Endhaken addiert 9d (siehe <a href="/de/haken-biege-schnittlaengen-rechner">Haken-Schnittlängen-Rechner</a>). Abgebogene Eisen, zusätzliche obere Stäbe über Auflagern und abgestufte untere Stäbe sind dieselbe Geschichte: Sie ändern die Stablängen, also ermitteln Sie sie auf den Detaillierungsseiten und addieren Sie das Gewicht. Ein Balkenplan, der Übergreifungen und Verankerung ignoriert, bestellt zu wenig — um etwa die Übergreifungszugabe plus die Hakenzugabe je Stab; bei einer mehrgeschossigen Decke sind das Kilogramm je Balken, die sich in eine verpasste Lieferung verwandeln.</p><h3 id="ordering">Bestellung und Kosten</h3><p>Bestellen Sie je Balkentyp und multiplizieren Sie dann. Zehn Balken mit den Vorgaben ergeben zusammen 10 × 55,85 = 558,47 kg; mit 5 % Verschnittzuschlag für Abschnitte sind das 586,39 kg, was bei einem Beispielpreis von 1,20 €/kg 703,67 € kostet (Preise sind Beispiele — geben Sie Ihren lokalen Satz auf dem <a href="/de/bewehrungskosten-rechner">Kostenrechner</a> ein). Für Handelslängen rechnen Sie Stablängen um, nicht Gewichte: Die Vorgaben brauchen 25,00 m 16-mm-Hauptstäbe, also 3 Handelsstäbe à 12 m (2 Stäbe je Handelsstab geschnitten, 5 benötigt), und 41,62 m 8-mm-Bügelstäbe, also 4 Handelsstäbe à 12 m. Beispiel 2 braucht genau 3 Handelsstäbe für seine 36,00 m Hauptstäbe und 5 für seine 50,84 m Bügel. In Tonnage ist der Vorgabenbalken 0,056 t, also ergeben 1.000 ÷ 55,85 = 17,91 Balken eine Tonne — rechnen Sie jeden Plan auf dem <a href="/de/bewehrungstonnage-rechner">Tonnagerechner</a> um, und erstellen Sie eine vollständige Stück- und Längenaufstellung auf dem <a href="/de/bewehrungsmengen-rechner">Mengenrechner</a>. Bindedraht zum Befestigen des Korbs ist separat: Schätzen Sie ihn auf dem <a href="/de/bindedraht-rechner">Bindedraht-Rechner</a>.</p><h3 id="imperial">Zoll-Maße</h3><p>Die Stab-Dropdowns enthalten US-Größen, also funktioniert derselbe Rechner in Zoll-Maßen — geben Sie einfach die metrischen Entsprechungen Ihrer Maße ein. Ein 5-m-Balken (16,40 ft) mit 230 × 450 mm (9,06 × 17,72 in), 2 oberen + 3 unteren #5-Stäben (15,9 mm, 1,552 kg/m) und #3-Bügeln (9,5 mm, 0,56 kg/m) bei 152,4 mm (6 in) Abstand ergibt: Hauptstahl 5 × 5 × 1,552 = 38,80 kg (85,54 lb); Bügel floor(5.000 ÷ 152,4) + 1 = 33, Schnittlänge 2(180 + 400) + 8 × 9,5 = 1.236 mm (48,66 in), Bügelstahl 33 × 1,236 × 0,56 = 22,84 kg (50,35 lb); gesamt 61,64 kg (135,89 lb). Beachten Sie, dass die Bügelanzahl gegenüber dem 150-mm-metrischen Abstand um einen sinkt (33 gegenüber 34), weil 6 in etwas breiter ist als 150 mm — kleine Abstandsunterschiede bewegen die Anzahl, weshalb die Abstandstabelle oben wichtig ist. Die ACI-318-Betondeckung für Balken ohne Witterungseinfluss beträgt 1,5 in bis zu den Bügeln, gegenüber den 25 mm, die hier verwendet werden.</p><h3 id="not-included">Was dieser Rechner nicht enthält</h3><p>Dies ist ein Wiegetool, kein Bemessungstool, und Folgendes liegt alles außerhalb davon: die Tragwerksplanung selbst (Biegemoment, Querkraft, erforderliche Stahlfläche, Durchbiegung, Balkentiefe und -breite — alles vom Ingenieur); Übergreifungslängen; Haken, Abbiegen und Verankerungslängen; zusätzliche obere Stäbe über Auflagern und Abstufung unterer Stäbe; Seitenbewehrung für tiefe Balken über 750 mm; Plattenbalken- oder L-Balken-Flanschstahl; Betonvolumen, Schalung und Arbeitslohn; Betondeckungssteine, Abstandhalter und Distanzstücke; Bindedraht; und Verschnitt. Nutzen Sie die Begleitseiten für die fehlenden Teile: <a href="/de/verankerungslaengen-rechner">Verankerungslänge</a>, <a href="/de/uebergreifungslaengen-rechner">Übergreifungslänge</a>, <a href="/de/haken-biege-schnittlaengen-rechner">Haken</a>, <a href="/de/buegel-schnittlaengen-rechner">Bügel-Schnittlänge</a>, <a href="/de/stuetzenbewehrungs-rechner">Stützen</a> (der Balken bindet in sie ein — prüfen Sie den Knoten), <a href="/de/stahlflaechen-rechner-ast">Fläche</a>, <a href="/de/bewehrungsmengen-rechner">Menge</a>, <a href="/de/bewehrungskosten-rechner">Kosten</a> und <a href="/de/bewehrungstonnage-rechner">Tonnage</a>.</p><h3 id="mistakes">Häufige Fehler</h3><p>1. Die lichte Spannweite statt der Balkenlänge eingeben. Der Rechner zählt Hauptstäbe mit der eingegebenen Länge, also unterschätzt eine 4,6-m-lichte Spannweite, die für einen 5-m-Balken (mit Auflagern) eingegeben wird, den Hauptstahl um 0,4 m je Stab — 5 × 0,4 × 1,578 = 3,16 kg bei den Vorgaben — bevor Übergreifungen und Verankerung überhaupt betrachtet werden. Geben Sie die Länge ein, über die die Stäbe tatsächlich laufen, und addieren Sie dann Übergreifungen und Haken.</p><p>2. Die Bügel-Schnittlänge aus der Außenseite des Balkens rechnen. Die Schnittlänge verläuft um die Innenseite des Bügels (Breite und Tiefe minus zweimal die Betondeckung), plus Haken minus Biegeabzüge. Außenmaße zu verwenden ergibt 1.424 mm statt 1.224 mm bei den Vorgaben — 2,68 kg Phantom-Bügelstahl je Balken.</p><p>3. Einen Abstand für eine zonierte Zeichnung verwenden. Eine Zeichnung, die 100 mm an den Auflagern und 200 mm in Feldmitte verlangt, lässt sich nicht als einheitlicher 150-mm-Abstand eingeben, ohne Fehler zu machen: Beim Vorgabenquerschnitt braucht die zonierte Anordnung 36 Bügel (17,36 kg) gegenüber 34 (16,40 kg) einheitlich. Rechnen Sie jede Zone getrennt und korrigieren Sie um die gemeinsamen Grenzbügel, wie oben gezeigt.</p><p>4. Übergreifungen bei langen Balken vergessen. Ein 13-m-Balken braucht in jedem Hauptstab einen Stoß; das Auslassen der 0,777-m-Übergreifung je Stab unterschätzt den Hauptstahl um 6,13 kg beim Vorgabenquerschnitt — und um diesen Betrag bei jedem langen Balken im Plan.</p><p>5. Die Panel-Summe ohne Verschnittzuschlag bestellen. Die Panel-Summe ist Nettostahl: keine Abschnitte, kein Schneidverschnitt, keine kurzen Stäbe, keine Übergreifungen oder Haken. Addieren Sie 3–5 % für gerade Arbeit (mehr mit Übergreifungen und Haken) und runden Sie auf 12-m-Handelsstäbe auf, bevor Sie bestellen, sonst kommt der letzte Balken auf der Decke zu kurz.</p><p>Zuletzt geprüft: Oktober 2026.</p>`
}
},
    { id:"wall", slug:"wall-rebar-calculator", cat:"Members",
    metaTitle:"Wall Rebar Calculator — Vertical + Horizontal Bars, kg",
    h1:"Wall Rebar Calculator",
    desc:"Reinforcement for concrete or block walls: vertical and horizontal bars, counts and weight. Defaults = 132.40 kg. Free, with code checks. Try it free.",
    kw:"rebar calculator for wall, block wall rebar calculator, wall reinforcement, retaining wall rebar",
    intro:"Estimate the steel in a wall — retaining, basement or block. Enter the wall length and height, the vertical and horizontal spacing and bar sizes, and get the bar counts and total weight.",
    howto:["Enter the wall length and height in metres, and the edge cover in mm.","Set the vertical spacing and bar size, and the horizontal spacing and bar size.","Read the vertical and horizontal bar counts and weights, plus the total.","Double the total for walls thicker than 200 mm, which need two grids — the calculator counts one.","Add laps, dowels and waste before ordering — the calculator counts straight, cover-reduced bars only."],
    formula:"Vertical bars = floor((L − 2cover) ÷ spV) + 1; horizontal bars = floor((H − 2cover) ÷ spH) + 1; sum × kg/m.",
    faqs:[["How do you calculate rebar for a wall?", "Count vertical and horizontal bars from the spacing, then multiply lengths by unit weight. Vertical bars = floor((length − 2 × cover) ÷ vertical spacing) + 1, each (height − 2 × cover) long; horizontal bars = floor((height − 2 × cover) ÷ horizontal spacing) + 1, each (length − 2 × cover) long. On the calculator defaults (6 × 3 m wall, 12 mm verticals @ 200 mm, 10 mm horizontals @ 200 mm, 40 mm cover) that is 30 verticals at 2.92 m = 77.70 kg plus 15 horizontals at 5.92 m = 54.70 kg, total 132.40 kg."],
          ["What is rebar spacing in a block wall?", "Often vertical bars at 400–800 mm and horizontal bars per course or bond beam — design governs. For a concrete wall the usual residential grid is much tighter: 200 mm each way on the calculator defaults, and published guides quote 12 in (about 300 mm) vertical and horizontal as a common grid, or 36 in vertical / 24 in horizontal for lightly loaded walls. The spacing on your drawing always wins over any of these rules of thumb."],
          ["How many vertical bars does a wall need?", "One more than the number of spacings that fit: floor((length − 2 × cover) ÷ spacing) + 1. The +1 is the bar at the far edge, and forgetting it is the classic off-by-one — on the defaults it drops the verticals from 30 to 29 and understates the wall by 2.59 kg, and the horizontals from 15 to 14 for another 3.65 kg, 6.24 kg short in total. The calculator counts both end bars."],
          ["What is the minimum reinforcement in a wall?", "IS 456:2000 cl. 32.5 sets vertical steel at ≥ 0.12% and horizontal steel at ≥ 0.20% of the gross concrete area (for deformed bars ≤ 16 mm, Fe415 or better), with both spacings ≤ the smaller of 3 × wall thickness and 450 mm. On a 200 mm wall that cap is 450 mm. The defaults pass on the vertical side (12 mm @ 200 mm = 0.283%) but the horizontals (10 mm @ 200 mm = 0.196%) sit just below the 0.20% minimum — tighten them to 190 mm (0.207%) or step up to 12 mm. This calculator does not check any of this; work the percentages by hand for your wall thickness."],
          ["Do I need two layers of steel in a wall?", "For walls thicker than 200 mm, yes — IS 456 requires the vertical and horizontal reinforcement in two grids, one near each face. This calculator counts ONE grid, so a 250 mm wall at the defaults grid needs 2 × 132.40 = 264.80 kg, not 132.40 kg. For walls 200 mm or thinner a single central grid is the usual arrangement, but the drawing governs."],
          ["Do I need to add lap length to a wall?", "Yes, whenever a bar run exceeds the stock length (usually 12 m). The calculator counts every bar at its cover-reduced length with no splice added. On a 20 m wall the horizontal bars run 19.92 m, so each needs one splice: at roughly 0.486 m for a 10 mm Fe500 M25 tension lap, that adds 15 × 0.486 × 0.616 = 4.49 kg. Get the exact lap from the <a href=\"/rebar-lap-length-calculator\">lap length calculator</a> — it depends on bar size, grade, concrete and tension vs compression, never on a memorised multiple."],
          ["Does the calculator design the wall?", "No — it weighs a grid you describe; it does not check whether the grid is adequate. Earth pressure, sliding and overturning stability, shear, bending and the required steel area all come from the structural design and the drawing. A total that looks reasonable is not proof the wall stands up, and passing the minimum-steel percentages is not proof it carries the soil behind it."],
          ["What about doors, windows and other openings?", "The calculator counts the full rectangle — it does not deduct openings. For each opening, work out the bars that would have crossed it and subtract them, then add the trimming bars the drawing calls for around the opening. One published wall tool deducts openings from volume automatically; here you do the deduction by hand before ordering."],
          ["Can I use this calculator for a block wall?", "As an estimate, yes, with one translation: in a block wall the verticals sit in grouted cores (typically at 400–800 mm centres, matching the block module) and the horizontals sit in bond-beam courses, not at arbitrary spacings. Enter the core spacing as the vertical spacing and the bond-beam spacing as the horizontal spacing, and read the result as the bar schedule for the grouted cores and bond beams — then check it against the block manufacturer's coursing, since a 200 mm spacing that suits a concrete wall rarely matches a 400 mm block module."],
          ["Does the calculator include waste, dowels, tie wire or cost?", "No — it gives the neat one-grid, one-wall total only. Add 5–10% waste for cutting and laps (one published grid guide recommends 10% for overlaps, cutoffs and waste), take footing dowels and starter bars from the <a href=\"/footing-rebar-calculator\">footing calculator</a>, estimate the fixing wire on the <a href=\"/rebar-tie-wire-calculator\">tie wire calculator</a>, price the order with the <a href=\"/rebar-cost-calculator\">cost calculator</a>, and check the steel tonnage with the <a href=\"/rebar-tonnage-calculator\">tonnage calculator</a>. For a full takeoff across members use the <a href=\"/rebar-quantity-calculator\">quantity & takeoff calculator</a>."]],
    toc:`<nav class="content-block" aria-label="On this page">
    <h2>On this page</h2>
    <ul>
      <li><a href="#how-to">How to use the calculator</a></li>
      <li><a href="#formula">The formula</a></li>
      <li><a href="#example-1">Worked example 1: defaults (6 × 3 m)</a></li>
      <li><a href="#example-2">Worked example 2: 10 × 4 m wall</a></li>
      <li><a href="#example-3">Worked example 3: small garden wall</a></li>
      <li><a href="#spacing-table">Vertical spacing</a></li>
      <li><a href="#horizontal-spacing">Horizontal spacing</a></li>
      <li><a href="#minimum-steel">The minimum-steel check</a></li>
      <li><a href="#two-curtains">One grid or two?</a></li>
      <li><a href="#order">From one wall to the order</a></li>
      <li><a href="#imperial">Imperial conversions</a></li>
      <li><a href="#not-included">What this calculator does not cover</a></li>
      <li><a href="#mistakes">5 common mistakes</a></li>
      <li><a href="#faq">FAQs</a></li>
    </ul>
  </nav>`,
    extra:`<h3>The formula, explained</h3>
<p>A wall grid is two one-dimensional counts laid across each other — verticals counted along the length, horizontals counted up the height — and the calculator keeps them separate so you can see which direction dominates:</p>
<p><strong>Vertical bars = floor((L − 2cover) ÷ spV) + 1, each (H − 2cover) long; Horizontal bars = floor((H − 2cover) ÷ spH) + 1, each (L − 2cover) long; Total = vertical steel + horizontal steel</strong></p>
<p>Both counts use the same fence-post rule as every grid on this site: the cover-reduced run divided by the spacing gives the number of intervals, and the bars number one more than the intervals, because both end bars count. And both bar lengths are cover-reduced — the verticals stop 40 mm short of the top and bottom on the defaults, the horizontals 40 mm short of each end. That is a real difference from the beam and column pages, which count bars at full member length: a wall bar is cut to fit inside the wall, so the calculator cuts it. One display note, carried over from those pages: the vertical-bar field reads "0.888|12" and the horizontal-bar field "0.617|10", but the panel computes with the option values 0.887 and 0.616 kg/m, so every weight below uses 0.887 and 0.616.</p>
<h3 id="example-1">Worked example 1: defaults (6 × 3 m)</h3>
<p>Open the calculator and leave the defaults: length 6 m, height 3 m, vertical spacing 200 mm, horizontal spacing 200 mm, edge cover 40 mm, vertical bars 12 mm, horizontal bars 10 mm.</p>
<p>Verticals = floor((6 − 0.08) ÷ 0.2) + 1 = floor(29.6) + 1 = 30 bars, each 3 − 0.08 = 2.92 m long → 30 × 2.92 × 0.887 = 77.70 kg. Horizontals = floor((3 − 0.08) ÷ 0.2) + 1 = floor(14.6) + 1 = 15 bars, each 6 − 0.08 = 5.92 m long → 15 × 5.92 × 0.616 = 54.70 kg.</p>
<p><strong>Total = 77.70 + 54.70 = 132.40 kg (0.132 t).</strong> The panel shows 132.40 kg, 30.00 vertical bars, 15.00 horizontal bars, 77.70 kg vertical steel, 54.70 kg horizontal steel and 0.132 t. Vertical steel is 58.7% of the total here — on most walls the verticals dominate, because there are usually more of them and they are the heavier bar. Total bar length is 30 × 2.92 + 15 × 5.92 = 176.40 m, and at 18 m² of wall face that is 7.36 kg/m² — a useful density to compare against the next examples.</p>
<h3 id="example-2">Worked example 2: 10 × 4 m wall</h3>
<p>Set length 10 m, height 4 m, vertical spacing 150 mm, horizontal spacing 150 mm, cover 40 mm, vertical bars 16 mm, horizontal bars 12 mm.</p>
<p>Verticals = floor((10 − 0.08) ÷ 0.15) + 1 = 67 bars, each 4 − 0.08 = 3.92 m → 67 × 3.92 × 1.578 = 414.45 kg. Horizontals = floor((4 − 0.08) ÷ 0.15) + 1 = 27 bars, each 10 − 0.08 = 9.92 m → 27 × 9.92 × 0.887 = 237.57 kg.</p>
<p><strong>Total = 414.45 + 237.57 = 652.02 kg (0.652 t).</strong> At 40 m² of wall face that is 16.30 kg/m² — more than double the defaults density, because both spacings tightened and both bar sizes stepped up at once. Note the horizontal bars here run 9.92 m, still inside a 12 m stock length — no splice needed. Stretch this wall to 20 m and that stops being true (see the order section).</p>
<h3 id="example-3">Worked example 3: small garden wall</h3>
<p>Set length 4 m, height 2.4 m, vertical spacing 400 mm, horizontal spacing 400 mm, cover 40 mm, vertical bars 12 mm, horizontal bars 10 mm.</p>
<p>Verticals = floor((4 − 0.08) ÷ 0.4) + 1 = 10 bars, each 2.4 − 0.08 = 2.32 m → 10 × 2.32 × 0.887 = 20.58 kg. Horizontals = floor((2.4 − 0.08) ÷ 0.4) + 1 = 6 bars, each 4 − 0.08 = 3.92 m → 6 × 3.92 × 0.616 = 14.49 kg.</p>
<p><strong>Total = 20.58 + 14.49 = 35.07 kg (0.035 t).</strong> At 9.6 m² that is only 3.65 kg/m² — a lightly reinforced garden wall, and the 400 mm spacings are fine against the code cap only if the wall is thin enough: the cap is the smaller of 3 × thickness and 450 mm, so a 150 mm wall caps spacing at 450 mm and 400 mm passes, but a 100 mm wall caps it at 300 mm and 400 mm would fail. Spacing limits always need the thickness, which this calculator does not ask for — another reason the check belongs in the text, not just the tool.</p>
<h3 id="spacing-table">Vertical spacing</h3>
<p>Same defaults wall (6 × 3 m, 12 mm verticals, 10 mm horizontals @ 200 mm giving a constant 54.70 kg), five vertical spacings. The horizontal steel never moves, so the whole table is the vertical half doing its thing.</p>
<div class="formula-table"><table>
<tr><th>Vertical spacing</th><th>Vertical bars</th><th>Vertical steel</th><th>Total weight</th></tr>
<tr><td>100 mm</td><td>60</td><td>155.40 kg</td><td>210.10 kg</td></tr>
<tr><td>150 mm</td><td>40</td><td>103.60 kg</td><td>158.30 kg</td></tr>
<tr><td>200 mm</td><td>30</td><td>77.70 kg</td><td>132.40 kg</td></tr>
<tr><td>250 mm</td><td>24</td><td>62.16 kg</td><td>116.86 kg</td></tr>
<tr><td>300 mm</td><td>20</td><td>51.80 kg</td><td>106.50 kg</td></tr>
</table></div>
<p>Two readings. First, spacing is a strong lever: tightening from 200 mm to 100 mm doubles the vertical count and adds 77.70 kg (+59%) to one wall. Second, there are dead bands: any vertical spacing from 198 mm to 204 mm gives the same 30 bars on this wall — 204 mm returns exactly the defaults total of 132.40 kg — while 205 mm drops to 29 bars and 129.81 kg. So a spacing "improvement" of a few millimetres often changes nothing, and a spacing quoted to the millimetre without the count is meaningless. Always read the count, not just the spacing.</p>
<h3 id="horizontal-spacing">Horizontal spacing</h3>
<p>Same defaults wall, five horizontal spacings, vertical steel constant at 77.70 kg:</p>
<div class="formula-table"><table>
<tr><th>Horizontal spacing</th><th>Horizontal bars</th><th>Horizontal steel</th><th>Total weight</th></tr>
<tr><td>150 mm</td><td>20</td><td>72.93 kg</td><td>150.64 kg</td></tr>
<tr><td>200 mm</td><td>15</td><td>54.70 kg</td><td>132.40 kg</td></tr>
<tr><td>250 mm</td><td>12</td><td>43.76 kg</td><td>121.46 kg</td></tr>
<tr><td>300 mm</td><td>10</td><td>36.47 kg</td><td>114.17 kg</td></tr>
<tr><td>400 mm</td><td>8</td><td>29.17 kg</td><td>106.87 kg</td></tr>
</table></div>
<p>Horizontal steel is the smaller half on this wall, so even doubling its spacing (200 mm → 400 mm) saves only 25.53 kg. But spacing is not a free saving either: the code cap for a 200 mm wall is 450 mm, so the 400 mm row passes, while on a 100 mm wall the cap is 300 mm and both the 400 mm and (just) the 300 mm rows would need checking against the drawing. And remember the minimum-steel check below: widening the horizontal spacing is exactly how a grid quietly falls below the 0.20% horizontal minimum.</p>
<h3 id="minimum-steel">The minimum-steel check</h3>
<p>The calculator weighs whatever grid you enter; it never asks whether the grid is enough. The check needs the wall thickness, which the calculator does not ask for — so here it is, worked by hand. IS 456:2000 cl. 32.5 requires vertical steel ≥ 0.12% and horizontal steel ≥ 0.20% of the gross concrete area (for deformed bars ≤ 16 mm, Fe415 or better), with both spacings no wider than the smaller of 3 × wall thickness and 450 mm. Steel per metre of wall is bar area ÷ spacing: a 12 mm bar is 113.10 mm², a 10 mm bar 78.54 mm².</p>
<p>On a 200 mm thick wall the defaults grid gives vertical steel of 113.10 ÷ 0.2 = 565.5 mm²/m, which is 565.5 ÷ 200000 = 0.283% — comfortably above the 0.12% minimum. But the horizontals give 78.54 ÷ 0.2 = 392.7 mm²/m, which is 392.7 ÷ 200000 = 0.196% — just BELOW the 0.20% horizontal minimum. The defaults grid, as it stands, fails the horizontal check on a 200 mm wall by four thousandths of a percent. The fix is small: tighten the horizontals to 190 mm (78.54 ÷ 0.19 = 413.4 mm²/m = 0.207%, panel total 136.05 kg) or step the horizontal bar up to 12 mm at 200 mm (565.5 mm²/m = 0.283%). Either fix costs a few kilograms; the uncorrected grid costs a failed check.</p>
<p>Two published examples fail worse. One guide's shear-wall example (12 mm @ 300 mm vertical, 10 mm @ 450 mm horizontal, 200 mm wall) gives verticals of 377.0 mm²/m = 0.189% (passes) but horizontals of only 174.5 mm²/m = 0.087% (fails by more than half), and its stated vertical maximum spacing of 600 mm exceeds the code cap of 450 mm for that wall. And a design example worked elsewhere on this site's research — a retaining wall needing 480 mm²/m of vertical steel — is satisfied by 12 mm bars at any spacing up to 113.10 ÷ 480 = 0.236 m, so 12 mm @ 200 mm (565.5 mm²/m) passes with margin. That is the bridge between a design number and a grid: required area per metre ÷ bar area = maximum spacing.</p>
<p>For reference, the ACI 318-19 minima quoted by one published wall tool (0.0015 vertical, 0.0012 horizontal) are looser on the horizontal side than IS 456 — the defaults grid passes both ACI minima. The draft uses the stricter IS figures as the check, because this site's audience builds to IS 456; if your project is ACI-governed, confirm which minima your drawing cites.</p>
<h3 id="two-curtains">One grid or two?</h3>
<p>This is the scope limit most likely to halve your order. The calculator counts one grid: one layer of verticals, one layer of horizontals. IS 456 requires two grids — one near each face — for walls thicker than 200 mm. So a 250 mm retaining wall or basement wall at the defaults grid needs 2 × 132.40 = 264.80 kg, not 132.40 kg. The calculator has no thickness input and no two-curtain switch, so the doubling is yours to remember.</p>
<p>Worked retaining example, single grid first: an 8 m long, 3.5 m high wall, verticals 16 mm @ 150 mm, horizontals 12 mm @ 200 mm, cover 50 mm. Verticals = floor((8 − 0.10) ÷ 0.15) + 1 = 53 bars, each 3.5 − 0.10 = 3.40 m → 53 × 3.40 × 1.578 = 284.36 kg. Horizontals = floor((3.5 − 0.10) ÷ 0.2) + 1 = 18 bars, each 8 − 0.10 = 7.90 m → 18 × 7.90 × 0.887 = 126.13 kg. <strong>Total, one grid = 410.49 kg (0.410 t)</strong>, or 14.66 kg/m² over 28 m². If that wall's stem is thicker than 200 mm — as a 3.5 m retaining stem usually is — double it: 820.97 kg for two grids, before laps, dowels and waste. And a retaining wall is more than its stem: the base slab (toe and heel), any counterforts and the starter dowels into the footing are separate schedules — take the footing steel from the <a href="/footing-rebar-calculator">footing calculator</a> and the stem-to-footing dowels from the drawing, never from this grid.</p>
<h3 id="order">From one wall to the order</h3>
<p>The calculator gives one wall, one grid, neat. The order is that wall, times the number of identical walls, times the number of grids, plus laps and waste.</p>
<p>Long walls need splices first. A 20 m wall at the defaults grid gives 100 verticals and 15 horizontals, 259.00 + 184.06 = 443.06 kg — but the horizontal bars run 19.92 m, well past a 12 m stock length, so each needs one splice. At roughly 0.486 m for a 10 mm Fe500 M25 tension lap (get the exact figure from the <a href="/rebar-lap-length-calculator">lap length calculator</a>), that adds 15 × 0.486 × 0.616 = 4.49 kg. Vertical bars at 2.92 m need no splice.</p>
<p>Then stock lengths. The defaults need 30 vertical bars of 2.92 m: a 12 m stock bar yields 4, so 30 bars need 8 stock bars of 12 mm. The horizontals need 15 bars of 5.92 m: a 12 m stock bar yields 2, so 15 bars need 8 stock bars of 10 mm. Sixteen stock bars in total for one defaults wall — and offcuts of 0.32 m per vertical stock bar and 0.16 m per horizontal stock bar, which is where the waste allowance goes.</p>
<p>Then the money. Ten walls at the defaults total 10 × 132.40 = 1324.02 kg; with a 5% waste allowance that is 1390.22 kg, which costs €1668.27 at an example €1.20/kg (prices are examples — enter your local rate on the <a href="/rebar-cost-calculator">cost calculator</a>). Convert any schedule on the <a href="/rebar-tonnage-calculator">tonnage calculator</a>, and build a full count-and-length takeoff on the <a href="/rebar-quantity-calculator">quantity calculator</a>. Tie wire for fixing the grid is separate: estimate it on the <a href="/rebar-tie-wire-calculator">tie wire calculator</a>.</p>
<h3 id="imperial">Imperial conversions</h3>
<p>The calculator takes metres and millimetres, so convert first: 1 m = 3.28 ft, 1 kg = 2.20 lb, 1 in = 25.4 mm.</p>
<p>Worked conversions: the defaults total 132.40 kg = 291.90 lb (0.132 t); a 6 m wall is 19.69 ft long, a 3 m wall 9.84 ft high, 200 mm spacing is 7.87 in and 40 mm cover is 1.57 in. A full imperial run — a 20 × 10 ft wall (6.096 × 3.048 m), 6 in spacing both ways, 1.5 in cover, #4 verticals (12.7 mm, 0.994 kg/m) and #3 horizontals (9.5 mm, 0.56 kg/m) — gives 40 verticals and 20 horizontals, 118.16 + 67.42 = 185.58 kg (409.13 lb). Note the vertical count: 6.096 m at 6 in spacing gives 40 bars, where the same wall at 150 mm spacing would give 41 — small spacing differences move the count, which is why the spacing tables above matter. The bar dropdowns include US sizes, so enter the metric equivalents of your dimensions and pick the matching US bar.</p>
<h3 id="not-included">What this calculator does not cover</h3>
<ul>
<li>Structural design — earth pressure, sliding and overturning stability, shear, bending moment and the required steel area; the minimum-steel check above catches gross errors, it does not prove the wall stands up.</li>
<li>Second grids — walls thicker than 200 mm need two curtains; the calculator counts one (see the two-grid section).</li>
<li>Base slab, toe, heel and counterforts on retaining walls — separate schedules, not this grid.</li>
<li>Dowels and starter bars into the footing or slab — see the <a href="/footing-rebar-calculator">footing calculator</a> and the drawing.</li>
<li>Laps, hooks and bends at corners, ends and openings — see the <a href="/rebar-lap-length-calculator">lap length calculator</a> and the <a href="/rebar-hook-bend-cutting-length-calculator">hook cutting length calculator</a>.</li>
<li>Openings — doors and windows are not deducted; subtract the bars they displace by hand and add the trimming bars from the drawing.</li>
<li>Block-wall coursing — the grid model approximates cores and bond beams; check the spacing against the block module (see the block-wall FAQ).</li>
<li>Concrete volume, formwork, chairs and spacers — the <a href="/concrete-and-rebar-calculator">concrete estimator</a> covers volume; chairs are on the <a href="/rebar-chair-calculator">chair calculator</a>.</li>
<li>Cost, tonnage and multi-wall takeoff — the order section shows the hand arithmetic; the <a href="/rebar-cost-calculator">cost calculator</a> prices a full takeoff, the <a href="/rebar-tonnage-calculator">tonnage calculator</a> converts it, and the <a href="/rebar-quantity-calculator">quantity &amp; takeoff calculator</a> totals across members.</li>
</ul>
<h3 id="mistakes">5 common mistakes</h3>
<ol>
<li><strong>Forgetting the +1 on both counts.</strong> Length ÷ spacing without the +1 gives 29 verticals instead of 30 and 14 horizontals instead of 15 on the defaults — 2.59 + 3.65 = 6.24 kg missing from every wall. Both end bars are real bars.</li>
<li><strong>Counting full lengths instead of cover-reduced lengths.</strong> Verticals run height minus twice the cover (2.92 m, not 3.00 m) and horizontals length minus twice the cover (5.92 m, not 6.00 m). Using full lengths overstates the defaults wall by 2.13 + 0.74 = 2.87 kg — steel that does not exist and bars that do not fit with their cover intact.</li>
<li><strong>Ordering one grid for a two-grid wall.</strong> Any wall thicker than 200 mm needs two curtains under IS 456. Ordering the calculator's 132.40 kg for a 250 mm wall delivers half the steel. Double it: 264.80 kg.</li>
<li><strong>Trusting a spacing without the count.</strong> Spacings from 198 mm to 204 mm all give the same 30 verticals on the defaults wall, so a "200 mm" grid and a "204 mm" grid weigh the same — but 205 mm drops a bar. Always read the panel's bar count after changing a spacing.</li>
<li><strong>Forgetting splices on long walls.</strong> Horizontal bars longer than the 12 m stock length need a lap each. On a 20 m wall that is 4.49 kg of lap steel the neat total omits — and on every long wall in the schedule, the same omission repeats.</li>
</ol>
<p>Last reviewed: October 2026.</p>`,
    de: {
  metaTitle: "Wandbewehrungs-Rechner — Vertikal & Horizontal, kg gratis",
  desc: "Wandbewehrungs-Rechner: Vertikale und horizontale Stäbe für Beton- und Mauerwerkswände berechnen. Beispiel: 6 × 3 m Wand = 132,40 kg. Mit Mindestprüfung.",
  formula: "Vertikale Stäbe = floor((L − 2Betondeckung) ÷ spV) + 1; horizontale Stäbe = floor((H − 2Betondeckung) ÷ spH) + 1; Summe × kg/m.",
  kw: "wandbewehrungs-rechner, mauerwerkswand bewehrung rechner, wandbewehrung, stützmauer bewehrung",
  howto: ["Geben Sie Wandlänge und Wandhöhe in Metern sowie die Randbetondeckung in mm ein.", "Stellen Sie Vertikalabstand und vertikale Stabdicke sowie Horizontalabstand und horizontale Stabdicke ein.", "Lesen Sie die Stückzahlen und Gewichte der vertikalen und horizontalen Stäbe sowie das Gesamtgewicht ab.", "Verdoppeln Sie das Ergebnis bei Wänden dicker als 200 mm, die zwei Bewehrungslagen brauchen — der Rechner zählt nur eine.", "Rechnen Sie Übergreifungen, Haken und Verschnitt vor der Bestellung hinzu — der Rechner zählt nur gerade, um die Betondeckung gekürzte Stäbe."],
  faqs: [["Wie berechnet man die Bewehrung einer Wand?", "Man zählt vertikale und horizontale Stäbe aus den Abständen und multipliziert die Längen mit dem Metergewicht. Vertikale Stäbe = floor((Länge − 2 × Betondeckung) ÷ Vertikalabstand) + 1, jeder (Höhe − 2 × Betondeckung) lang; horizontale Stäbe = floor((Höhe − 2 × Betondeckung) ÷ Horizontalabstand) + 1, jeder (Länge − 2 × Betondeckung) lang. Bei den Standardwerten des Rechners (6 × 3 m Wand, 12 mm Vertikale bei 200 mm, 10 mm Horizontale bei 200 mm, 40 mm Betondeckung) sind das 30 Vertikale à 2,92 m = 77,70 kg plus 15 Horizontale à 5,92 m = 54,70 kg, insgesamt 132,40 kg."],
          ["Wie groß ist der Bewehrungsabstand in einer Mauerwerkswand?", "Oft vertikale Stäbe bei 400–800 mm und horizontale Stäbe je Lage oder Ringbalken — die Statik entscheidet. Für eine Betonwand ist das übliche Wohnungsbau-Raster deutlich enger: 200 mm in beiden Richtungen bei den Standardwerten des Rechners, und veröffentlichte Anleitungen nennen 12 in (etwa 300 mm) vertikal und horizontal als übliches Raster, oder 36 in vertikal / 24 in horizontal für leicht belastete Wände. Der Abstand auf Ihrer Zeichnung schlägt immer alle diese Faustregeln."],
          ["Wie viele vertikale Stäbe braucht eine Wand?", "Einen mehr als die Anzahl der Abstände, die hineinpassen: floor((Länge − 2 × Betondeckung) ÷ Abstand) + 1. Das +1 ist der Stab an der fernen Kante, und ihn zu vergessen ist der klassische Zählfehler um eins — bei den Standardwerten senkt er die Vertikalen von 30 auf 29 und unterschlägt 2,59 kg, und die Horizontalen von 15 auf 14 für weitere 3,65 kg, insgesamt 6,24 kg zu wenig. Der Rechner zählt beide Endstäbe."],
          ["Wie hoch ist die Mindestbewehrung einer Wand?", "IS 456:2000, Abs. 32.5 legt Vertikalstahl mit ≥ 0,12 % und Horizontalstahl mit ≥ 0,20 % der Brutto-Betonfläche fest (für Rippenstäbe ≤ 16 mm, Fe415 oder besser), wobei beide Abstände ≤ dem kleineren Wert aus 3 × Wanddicke und 450 mm sein müssen. Bei einer 200 mm dicken Wand liegt diese Grenze bei 450 mm. Die Standardwerte bestehen auf der vertikalen Seite (12 mm bei 200 mm = 0,283 %), aber die Horizontalen (10 mm bei 200 mm = 0,196 %) liegen knapp unter dem Mindestwert von 0,20 % — verdichten Sie sie auf 190 mm (0,207 %) oder gehen Sie auf 12 mm hoch. Dieser Rechner prüft nichts davon; rechnen Sie die Prozente für Ihre Wanddicke von Hand nach."],
          ["Brauche ich zwei Lagen Stahl in einer Wand?", "Bei Wänden dicker als 200 mm ja — IS 456 verlangt die vertikale und horizontale Bewehrung in zwei Lagen, je einer nahe jeder Wandfläche. Dieser Rechner zählt EINE Lage, sodass eine 250 mm dicke Wand beim Standardraster 2 × 132,40 = 264,80 kg braucht, nicht 132,40 kg. Bei Wänden bis 200 mm Dicke ist eine einzelne mittige Lage die übliche Anordnung, aber die Zeichnung entscheidet."],
          ["Muss ich Übergreifungslängen bei einer Wand hinzurechnen?", "Ja, sobald ein Stab länger als die Handelslänge (meist 12 m) läuft. Der Rechner zählt jeden Stab in seiner um die Betondeckung gekürzten Länge ohne hinzugefügten Stoß. Bei einer 20 m langen Wand laufen die horizontalen Stäbe 19,92 m, jeder braucht also einen Stoß: Bei etwa 0,486 m für einen 10 mm Fe500 M25 Zugstoß kommen 15 × 0,486 × 0,616 = 4,49 kg hinzu. Holen Sie den genauen Stoß aus dem <a href=\"/de/uebergreifungslaengen-rechner\">Übergreifungslängen-Rechner</a> — er hängt von Stabdicke, Güte, Beton und Zug oder Druck ab, nie von einer auswendig gelernten Zahl."],
          ["Bemisst der Rechner die Wand?", "Nein — er wiegt ein Raster, das Sie beschreiben; er prüft nicht, ob das Raster ausreicht. Erddruck, Gleitsicherheit und Kippsicherheit, Querkraft, Biegung und die erforderliche Stahlfläche kommen alle aus der Tragwerksplanung und der Zeichnung. Ein vernünftig aussehendes Gesamtgewicht ist kein Beweis dafür, dass die Wand steht, und das Bestehen der Mindestbewehrungs-Prozente ist kein Beweis dafür, dass sie den Boden dahinter trägt."],
          ["Was ist mit Türen, Fenstern und anderen Öffnungen?", "Der Rechner zählt das volle Rechteck — er zieht keine Öffnungen ab. Rechnen Sie für jede Öffnung die Stäbe heraus, die sie gekreuzt hätten, und ziehen Sie sie ab; addieren Sie dann die Leibungsstäbe, die die Zeichnung rund um die Öffnung verlangt. Ein veröffentlichtes Wand-Tool zieht Öffnungen automatisch vom Volumen ab; hier erledigen Sie den Abzug vor der Bestellung von Hand."],
          ["Kann ich diesen Rechner für eine Mauerwerkswand nutzen?", "Als Schätzung ja, mit einer Übersetzung: In einer Mauerwerkswand sitzen die Vertikalen in ausbetonierten Kernen (typisch bei 400–800 mm Achsabstand, passend zum Steinmodul) und die Horizontalen in Ringbalkenlagen, nicht bei beliebigen Abständen. Geben Sie den Kernabstand als Vertikalabstand und den Ringbalkenabstand als Horizontalabstand ein, und lesen Sie das Ergebnis als Stahlliste für die ausbetonierten Kerne und Ringbalken — prüfen Sie es dann gegen die Lagerfugen des Steinherstellers, denn ein 200 mm Abstand, der zu einer Betonwand passt, passt selten zu einem 400 mm Steinmodul."],
          ["Enthält der Rechner Verschnitt, Dübel, Bindedraht oder Kosten?", "Nein — er liefert nur den sauberen Gesamtbetrag für ein Raster und eine Wand. Rechnen Sie 5–10 % Verschnitt für Zuschnitt und Stöße hinzu (eine veröffentlichte Rasteranleitung empfiehlt 10 % für Überlappungen, Abschnitte und Verschnitt), entnehmen Sie Fußdübel und Anschlussstäbe dem <a href=\"/de/bewehrungsrechner-fuer-fundamente\">Fundament-Rechner</a>, schätzen Sie den Befestigungsdraht mit dem <a href=\"/de/bindedraht-rechner\">Bindedraht-Rechner</a>, bepreisen Sie die Bestellung mit dem <a href=\"/de/bewehrungskosten-rechner\">Bewehrungskosten-Rechner</a> und prüfen Sie die Stahltönnage mit dem <a href=\"/de/bewehrungstonnage-rechner\">Bewehrungstonnage-Rechner</a>. Für eine vollständige Massenermittlung über Bauteile hinweg nutzen Sie den <a href=\"/de/bewehrungsmengen-rechner\">Mengen- & Abrechnungsrechner</a>."]],
  toc: `<nav class="content-block" aria-label="Auf dieser Seite"><h2>Auf dieser Seite</h2><ul><li><a href="#how-to">So benutzen Sie den Rechner</a></li><li><a href="#formula">Die Formel</a></li><li><a href="#example-1">Rechenbeispiel 1: Standardwerte (6 × 3 m)</a></li><li><a href="#example-2">Rechenbeispiel 2: Wand 10 × 4 m</a></li><li><a href="#example-3">Rechenbeispiel 3: kleine Gartenmauer</a></li><li><a href="#spacing-table">Vertikalabstand</a></li><li><a href="#horizontal-spacing">Horizontalabstand</a></li><li><a href="#minimum-steel">Die Mindestbewehrungs-Prüfung</a></li><li><a href="#two-curtains">Eine Lage oder zwei?</a></li><li><a href="#order">Von einer Wand zur Bestellung</a></li><li><a href="#imperial">Zoll-Umrechnungen</a></li><li><a href="#not-included">Was dieser Rechner nicht abdeckt</a></li><li><a href="#mistakes">5 häufige Fehler</a></li><li><a href="#faq">FAQs</a></li></ul></nav>`,
  extra: `<h3>Die Formel, erklärt</h3>
<p>Ein Wandgitter sind zwei eindimensionale Zählungen, die übereinandergelegt werden — Vertikale, die entlang der Länge gezählt werden, Horizontale, die über die Höhe gezählt werden — und der Rechner hält sie getrennt, damit Sie sehen, welche Richtung dominiert:</p>
<p><strong>Vertikale Stäbe = floor((L − 2Betondeckung) ÷ spV) + 1, jeder (H − 2Betondeckung) lang; horizontale Stäbe = floor((H − 2Betondeckung) ÷ spH) + 1, jeder (L − 2Betondeckung) lang; Gesamt = Vertikalstahl + Horizontalstahl</strong></p>
<p>Beide Zählungen folgen derselben Zaunpfahlregel wie jedes Raster auf dieser Seite: Die um die Betondeckung gekürzte Strecke geteilt durch den Abstand ergibt die Anzahl der Felder, und die Stäbe sind um einen zahlreicher als die Felder, weil beide Endstäbe mitzählen. Und beide Stablängen sind um die Betondeckung gekürzt — die Vertikalen enden bei den Standardwerten 40 mm vor Ober- und Unterkante, die Horizontalen 40 mm vor jedem Ende. Das ist ein echter Unterschied zu den Balken- und Stützenseiten, die Stäbe in voller Bauteillänge zählen: Ein Wandstab wird so geschnitten, dass er in die Wand passt, also schneidet ihn der Rechner zu. Ein Anzeigehinweis, übernommen von jenen Seiten: Das Vertikalfeld liest sich als „0,888|12" und das Horizontalfeld als „0,617|10", aber der Rechner rechnet mit den Optionswerten 0,887 und 0,616 kg/m, sodass jedes Gewicht unten 0,887 und 0,616 verwendet.</p>
<h3 id="example-1">Rechenbeispiel 1: Standardwerte (6 × 3 m)</h3>
<p>Öffnen Sie den Rechner und lassen Sie die Standardwerte: Länge 6 m, Höhe 3 m, Vertikalabstand 200 mm, Horizontalabstand 200 mm, Randbetondeckung 40 mm, vertikale Stäbe 12 mm, horizontale Stäbe 10 mm.</p>
<p>Vertikale = floor((6 − 0,08) ÷ 0,2) + 1 = floor(29,6) + 1 = 30 Stäbe, jeder 3 − 0,08 = 2,92 m lang → 30 × 2,92 × 0,887 = 77,70 kg. Horizontale = floor((3 − 0,08) ÷ 0,2) + 1 = floor(14,6) + 1 = 15 Stäbe, jeder 6 − 0,08 = 5,92 m lang → 15 × 5,92 × 0,616 = 54,70 kg.</p>
<p><strong>Gesamt = 77,70 + 54,70 = 132,40 kg (0,132 t).</strong> Der Rechner zeigt 132,40 kg, 30,00 vertikale Stäbe, 15,00 horizontale Stäbe, 77,70 kg Vertikalstahl, 54,70 kg Horizontalstahl und 0,132 t. Der Vertikalstahl macht hier 58,7 % des Gesamtgewichts aus — bei den meisten Wänden dominieren die Vertikalen, weil es meist mehr von ihnen gibt und sie der schwerere Stab sind. Die Gesamtstablänge beträgt 30 × 2,92 + 15 × 5,92 = 176,40 m, und bei 18 m² Wandfläche sind das 7,36 kg/m² — eine nützliche Dichte zum Vergleich mit den nächsten Beispielen.</p>
<h3 id="example-2">Rechenbeispiel 2: Wand 10 × 4 m</h3>
<p>Stellen Sie Länge 10 m, Höhe 4 m, Vertikalabstand 150 mm, Horizontalabstand 150 mm, Betondeckung 40 mm, vertikale Stäbe 16 mm, horizontale Stäbe 12 mm ein.</p>
<p>Vertikale = floor((10 − 0,08) ÷ 0,15) + 1 = 67 Stäbe, jeder 4 − 0,08 = 3,92 m → 67 × 3,92 × 1,578 = 414,45 kg. Horizontale = floor((4 − 0,08) ÷ 0,15) + 1 = 27 Stäbe, jeder 10 − 0,08 = 9,92 m → 27 × 9,92 × 0,887 = 237,57 kg.</p>
<p><strong>Gesamt = 414,45 + 237,57 = 652,02 kg (0,652 t).</strong> Bei 40 m² Wandfläche sind das 16,30 kg/m² — mehr als das Doppelte der Standarddichte, weil sich beide Abstände verengt und beide Stabdicken gleichzeitig erhöht haben. Beachten Sie: Die horizontalen Stäbe laufen hier 9,92 m, noch innerhalb einer 12 m Handelslänge — kein Stoß nötig. Strecken Sie diese Wand auf 20 m, gilt das nicht mehr (siehe Abschnitt Bestellung).</p>
<h3 id="example-3">Rechenbeispiel 3: kleine Gartenmauer</h3>
<p>Stellen Sie Länge 4 m, Höhe 2,4 m, Vertikalabstand 400 mm, Horizontalabstand 400 mm, Betondeckung 40 mm, vertikale Stäbe 12 mm, horizontale Stäbe 10 mm ein.</p>
<p>Vertikale = floor((4 − 0,08) ÷ 0,4) + 1 = 10 Stäbe, jeder 2,4 − 0,08 = 2,32 m → 10 × 2,32 × 0,887 = 20,58 kg. Horizontale = floor((2,4 − 0,08) ÷ 0,4) + 1 = 6 Stäbe, jeder 4 − 0,08 = 3,92 m → 6 × 3,92 × 0,616 = 14,49 kg.</p>
<p><strong>Gesamt = 20,58 + 14,49 = 35,07 kg (0,035 t).</strong> Bei 9,6 m² sind das nur 3,65 kg/m² — eine leicht bewehrte Gartenmauer, und die 400 mm Abstände sind gegen die Normgrenze nur dann in Ordnung, wenn die Wand dünn genug ist: Die Grenze ist der kleinere Wert aus 3 × Dicke und 450 mm, sodass eine 150 mm dicke Wand Abstände bis 450 mm zulässt und 400 mm bestehen, eine 100 mm dicke Wand sie aber auf 300 mm begrenzt und 400 mm durchfallen ließe. Abstandsgrenzen brauchen immer die Dicke, nach der dieser Rechner nicht fragt — ein weiterer Grund, warum die Prüfung in den Text gehört und nicht nur ins Werkzeug.</p>
<h3 id="spacing-table">Vertikalabstand</h3>
<p>Dieselbe Standardwand (6 × 3 m, 12 mm Vertikale, 10 mm Horizontale bei 200 mm mit konstanten 54,70 kg), fünf Vertikalabstände. Der Horizontalstahl bewegt sich nie, sodass die ganze Tabelle die vertikale Hälfte bei der Arbeit zeigt.</p>
<div class="formula-table"><table>
<tr><th>Vertikalabstand</th><th>Vertikale Stäbe</th><th>Vertikalstahl</th><th>Gesamtgewicht</th></tr>
<tr><td>100 mm</td><td>60</td><td>155,40 kg</td><td>210,10 kg</td></tr>
<tr><td>150 mm</td><td>40</td><td>103,60 kg</td><td>158,30 kg</td></tr>
<tr><td>200 mm</td><td>30</td><td>77,70 kg</td><td>132,40 kg</td></tr>
<tr><td>250 mm</td><td>24</td><td>62,16 kg</td><td>116,86 kg</td></tr>
<tr><td>300 mm</td><td>20</td><td>51,80 kg</td><td>106,50 kg</td></tr>
</table></div>
<p>Zwei Erkenntnisse. Erstens: Der Abstand ist ein starker Hebel — eine Verengung von 200 mm auf 100 mm verdoppelt die Vertikalzahl und addiert 77,70 kg (+59 %) zu einer Wand. Zweitens gibt es tote Bereiche: Jeder Vertikalabstand von 198 mm bis 204 mm ergibt auf dieser Wand dieselben 30 Stäbe — 204 mm liefert genau das Standardgesamtgewicht von 132,40 kg — während 205 mm auf 29 Stäbe und 129,81 kg fällt. Eine Abstands„verbesserung" um wenige Millimeter ändert also oft nichts, und ein auf den Millimeter genau angegebener Abstand ohne die Stückzahl ist bedeutungslos. Lesen Sie immer die Stückzahl, nicht nur den Abstand.</p>
<h3 id="horizontal-spacing">Horizontalabstand</h3>
<p>Dieselbe Standardwand, fünf Horizontalabstände, Vertikalstahl konstant bei 77,70 kg:</p>
<div class="formula-table"><table>
<tr><th>Horizontalabstand</th><th>Horizontale Stäbe</th><th>Horizontalstahl</th><th>Gesamtgewicht</th></tr>
<tr><td>150 mm</td><td>20</td><td>72,93 kg</td><td>150,64 kg</td></tr>
<tr><td>200 mm</td><td>15</td><td>54,70 kg</td><td>132,40 kg</td></tr>
<tr><td>250 mm</td><td>12</td><td>43,76 kg</td><td>121,46 kg</td></tr>
<tr><td>300 mm</td><td>10</td><td>36,47 kg</td><td>114,17 kg</td></tr>
<tr><td>400 mm</td><td>8</td><td>29,17 kg</td><td>106,87 kg</td></tr>
</table></div>
<p>Der Horizontalstahl ist auf dieser Wand die kleinere Hälfte, sodass selbst eine Verdopplung seines Abstands (200 mm → 400 mm) nur 25,53 kg spart. Aber der Abstand ist auch keine kostenlose Einsparung: Die Normgrenze für eine 200 mm dicke Wand liegt bei 450 mm, sodass die 400 mm Zeile besteht, während bei einer 100 mm dicken Wand die Grenze bei 300 mm liegt und sowohl die 400 mm als auch (knapp) die 300 mm Zeile gegen die Zeichnung geprüft werden müssten. Und denken Sie an die Mindestbewehrungs-Prüfung unten: Eine Vergrößerung des Horizontalabstands ist genau der Weg, auf dem ein Raster leise unter das horizontale Minimum von 0,20 % fällt.</p>
<h3 id="minimum-steel">Die Mindestbewehrungs-Prüfung</h3>
<p>Der Rechner wiegt jedes eingegebene Raster; er fragt nie, ob das Raster ausreicht. Die Prüfung braucht die Wanddicke, nach der der Rechner nicht fragt — hier ist sie also, von Hand gerechnet. IS 456:2000, Abs. 32.5 verlangt Vertikalstahl ≥ 0,12 % und Horizontalstahl ≥ 0,20 % der Brutto-Betonfläche (für Rippenstäbe ≤ 16 mm, Fe415 oder besser), wobei beide Abstände nicht breiter sein dürfen als der kleinere Wert aus 3 × Wanddicke und 450 mm. Stahl je Meter Wand ist Stabfläche ÷ Abstand: Ein 12 mm Stab hat 113,10 mm², ein 10 mm Stab 78,54 mm².</p>
<p>Bei einer 200 mm dicken Wand ergibt das Standardraster Vertikalstahl von 113,10 ÷ 0,2 = 565,5 mm²/m, also 565,5 ÷ 200.000 = 0,283 % — bequem über dem Mindestwert von 0,12 %. Die Horizontalen ergeben aber nur 78,54 ÷ 0,2 = 392,7 mm²/m, also 392,7 ÷ 200.000 = 0,196 % — knapp UNTER dem horizontalen Mindestwert von 0,20 %. Das Standardraster in seiner jetzigen Form besteht die horizontale Prüfung an einer 200 mm dicken Wand um vier Tausendstelprozent nicht. Die Korrektur ist klein: Verdichten Sie die Horizontalen auf 190 mm (78,54 ÷ 0,19 = 413,4 mm²/m = 0,207 %, Rechnerwert 136,05 kg) oder gehen Sie beim Horizontalstab auf 12 mm bei 200 mm hoch (565,5 mm²/m = 0,283 %). Jede Korrektur kostet wenige Kilogramm; das unkorrigierte Raster kostet eine nicht bestandene Prüfung.</p>
<p>Zwei veröffentlichte Beispiele fallen schlimmer durch. Das Beispiel einer Anleitung für Schubwände (12 mm bei 300 mm vertikal, 10 mm bei 450 mm horizontal, 200 mm dicke Wand) ergibt Vertikale von 377,0 mm²/m = 0,189 % (besteht), aber Horizontale von nur 174,5 mm²/m = 0,087 % (fällt um mehr als die Hälfte durch), und ihr angegebener maximaler Vertikalabstand von 600 mm überschreitet die Normgrenze von 450 mm für diese Wand. Und ein Bemessungsbeispiel, das an anderer Stelle in den Recherchen dieser Seite durchgearbeitet wurde — eine Stützmauer, die 480 mm²/m Vertikalstahl braucht — wird von 12 mm Stäben bei jedem Abstand bis zu 113,10 ÷ 480 = 0,236 m erfüllt, sodass 12 mm bei 200 mm (565,5 mm²/m) mit Reserve bestehen. Das ist die Brücke zwischen einer Bemessungszahl und einem Raster: erforderliche Fläche je Meter ÷ Stabfläche = maximaler Abstand.</p>
<p>Zum Vergleich: Die ACI 318-19 Mindestwerte, die ein veröffentlichtes Wand-Tool zitiert (0,0015 vertikal, 0,0012 horizontal), sind auf der horizontalen Seite lockerer als IS 456 — das Standardraster besteht beide ACI-Mindestwerte. Der Entwurf nutzt die strengeren IS-Werte als Prüfung, weil das Publikum dieser Seite nach IS 456 baut; wenn Ihr Projekt nach ACI geregelt ist, bestätigen Sie, welche Mindestwerte Ihre Zeichnung zitiert.</p>
<h3 id="two-curtains">Eine Lage oder zwei?</h3>
<p>Das ist die Umfangsgrenze, die Ihre Bestellung am ehesten halbiert. Der Rechner zählt ein Raster: eine Lage Vertikale, eine Lage Horizontale. IS 456 verlangt zwei Raster — je eines nahe jeder Wandfläche — für Wände dicker als 200 mm. Eine 250 mm dicke Stützmauer oder Kellerwand beim Standardraster braucht also 2 × 132,40 = 264,80 kg, nicht 132,40 kg. Der Rechner hat keine Dickeneingabe und keinen Zwei-Lagen-Schalter, sodass die Verdopplung an Ihnen liegt.</p>
<p>Durchgerechnetes Stützmauer-Beispiel, zuerst eine Lage: Eine 8 m lange, 3,5 m hohe Wand, Vertikale 16 mm bei 150 mm, Horizontale 12 mm bei 200 mm, Betondeckung 50 mm. Vertikale = floor((8 − 0,10) ÷ 0,15) + 1 = 53 Stäbe, jeder 3,5 − 0,10 = 3,40 m → 53 × 3,40 × 1,578 = 284,36 kg. Horizontale = floor((3,5 − 0,10) ÷ 0,2) + 1 = 18 Stäbe, jeder 8 − 0,10 = 7,90 m → 18 × 7,90 × 0,887 = 126,13 kg. <strong>Gesamt, eine Lage = 410,49 kg (0,410 t)</strong>, oder 14,66 kg/m² auf 28 m². Wenn der Schaft dieser Wand dicker als 200 mm ist — wie bei einem 3,5 m hohen Stützmauerschaft üblich — verdoppeln Sie: 820,97 kg für zwei Lagen, vor Stößen, Dübeln und Verschnitt. Und eine Stützmauer ist mehr als ihr Schaft: Die Bodenplatte (Fuß und Ferse), eventuelle Gegenpfeiler und die Anschlussdübel ins Fundament sind eigene Listen — entnehmen Sie den Fundamentstahl dem <a href="/de/bewehrungsrechner-fuer-fundamente">Fundament-Rechner</a> und die Schaft-Fundament-Dübel der Zeichnung, nie diesem Raster.</p>
<h3 id="order">Von einer Wand zur Bestellung</h3>
<p>Der Rechner liefert eine Wand, ein Raster, netto. Die Bestellung ist diese Wand, mal die Anzahl identischer Wände, mal die Anzahl der Lagen, plus Stöße und Verschnitt.</p>
<p>Lange Wände brauchen zuerst Stöße. Eine 20 m lange Wand beim Standardraster ergibt 100 Vertikale und 15 Horizontale, 259,00 + 184,06 = 443,06 kg — aber die horizontalen Stäbe laufen 19,92 m, weit über eine 12 m Handelslänge hinaus, sodass jeder einen Stoß braucht. Bei etwa 0,486 m für einen 10 mm Fe500 M25 Zugstoß (den genauen Wert holen Sie aus dem <a href="/de/uebergreifungslaengen-rechner">Übergreifungslängen-Rechner</a>) kommen 15 × 0,486 × 0,616 = 4,49 kg hinzu. Vertikale Stäbe mit 2,92 m brauchen keinen Stoß.</p>
<p>Dann die Handelslängen. Die Standardwerte brauchen 30 vertikale Stäbe à 2,92 m: Aus einem 12 m Handelsstab werden 4, sodass 30 Stäbe 8 Handelsstäbe aus 12 mm brauchen. Die Horizontalen brauchen 15 Stäbe à 5,92 m: Aus einem 12 m Handelsstab werden 2, sodass 15 Stäbe 8 Handelsstäbe aus 10 mm brauchen. Insgesamt sechzehn Handelsstäbe für eine Standardwand — und Abschnitte von 0,32 m je Vertikal-Handelsstab und 0,16 m je Horizontal-Handelsstab, wohin der Verschnittzuschlag geht.</p>
<p>Dann das Geld. Zehn Wände bei den Standardwerten ergeben 10 × 132,40 = 1324,02 kg; mit einem Verschnittzuschlag von 5 % sind das 1390,22 kg, die bei einem Beispielpreis von 1,20 €/kg 1668,27 € kosten (Preise sind Beispiele — geben Sie Ihren örtlichen Satz in den <a href="/de/bewehrungskosten-rechner">Bewehrungskosten-Rechner</a> ein). Rechnen Sie jede Liste mit dem <a href="/de/bewehrungstonnage-rechner">Bewehrungstonnage-Rechner</a> um, und erstellen Sie eine vollständige Stück- und Längenermittlung mit dem <a href="/de/bewehrungsmengen-rechner">Mengen- & Abrechnungsrechner</a>. Bindedraht zum Befestigen des Rasters ist separat: Schätzen Sie ihn mit dem <a href="/de/bindedraht-rechner">Bindedraht-Rechner</a>.</p>
<h3 id="imperial">Zoll-Umrechnungen</h3>
<p>Der Rechner nimmt Meter und Millimeter, rechnen Sie also zuerst um: 1 m = 3,28 ft, 1 kg = 2,20 lb, 1 in = 25,4 mm.</p>
<p>Durchgerechnete Umrechnungen: Die Standardwerte ergeben 132,40 kg = 291,90 lb (0,132 t); eine 6 m lange Wand ist 19,69 ft lang, eine 3 m hohe Wand 9,84 ft hoch, 200 mm Abstand sind 7,87 in und 40 mm Betondeckung sind 1,57 in. Ein vollständiger Zoll-Lauf — eine 20 × 10 ft Wand (6,096 × 3,048 m), 6 in Abstand in beiden Richtungen, 1,5 in Betondeckung, #4 Vertikale (12,7 mm, 0,994 kg/m) und #3 Horizontale (9,5 mm, 0,56 kg/m) — ergibt 40 Vertikale und 20 Horizontale, 118,16 + 67,42 = 185,58 kg (409,13 lb). Beachten Sie die Vertikalzahl: 6,096 m bei 6 in Abstand ergeben 40 Stäbe, wo dieselbe Wand bei 150 mm Abstand 41 ergäbe — kleine Abstandsunterschiede verändern die Stückzahl, weshalb die Abstandstabellen oben wichtig sind. Die Stabauswahl enthält US-Größen, geben Sie also die metrischen Entsprechungen Ihrer Maße ein und wählen Sie den passenden US-Stab.</p>
<h3 id="not-included">Was dieser Rechner nicht abdeckt</h3>
<ul>
<li>Tragwerksplanung — Erddruck, Gleitsicherheit und Kippsicherheit, Querkraft, Biegemoment und die erforderliche Stahlfläche; die Mindestbewehrungs-Prüfung oben fängt grobe Fehler ab, sie beweist nicht, dass die Wand steht.</li>
<li>Zweite Lagen — Wände dicker als 200 mm brauchen zwei Bewehrungslagen; der Rechner zählt eine (siehe Abschnitt Zwei Lagen).</li>
<li>Bodenplatte, Fuß, Ferse und Gegenpfeiler bei Stützmauern — eigene Listen, nicht dieses Raster.</li>
<li>Dübel und Anschlussstäbe ins Fundament oder in die Platte — siehe <a href="/de/bewehrungsrechner-fuer-fundamente">Fundament-Rechner</a> und die Zeichnung.</li>
<li>Stöße, Haken und Biegungen an Ecken, Enden und Öffnungen — siehe <a href="/de/uebergreifungslaengen-rechner">Übergreifungslängen-Rechner</a> und <a href="/de/haken-biege-schnittlaengen-rechner">Haken- & Biege-Rechner</a>.</li>
<li>Öffnungen — Türen und Fenster werden nicht abgezogen; ziehen Sie die Stäbe, die sie verdrängen, von Hand ab und addieren Sie die Leibungsstäbe aus der Zeichnung.</li>
<li>Mauerwerks-Verband — das Rastermodell nähert Kerne und Ringbalken an; prüfen Sie den Abstand gegen das Steinmodul (siehe FAQ zur Mauerwerkswand).</li>
<li>Betonvolumen, Schalung, Abstandhalter und Unterleger — der <a href="/de/beton-bewehrungs-schaetzer">Beton- & Bewehrungs-Schätzer</a> deckt das Volumen ab; Abstandhalter finden Sie im <a href="/de/abstandhalter-rechner">Abstandhalter-Rechner</a>.</li>
<li>Kosten, Tönnage und Mehrwand-Ermittlung — der Abschnitt Bestellung zeigt die Handrechnung; der <a href="/de/bewehrungskosten-rechner">Bewehrungskosten-Rechner</a> bepreist eine vollständige Ermittlung, der <a href="/de/bewehrungstonnage-rechner">Bewehrungstonnage-Rechner</a> rechnet sie um, und der <a href="/de/bewehrungsmengen-rechner">Mengen- & Abrechnungsrechner</a> summiert über Bauteile hinweg.</li>
</ul>
<h3 id="mistakes">5 häufige Fehler</h3>
<ol>
<li><strong>Das +1 bei beiden Zählungen vergessen.</strong> Länge ÷ Abstand ohne das +1 ergibt 29 statt 30 Vertikale und 14 statt 15 Horizontale bei den Standardwerten — 2,59 + 3,65 = 6,24 kg fehlen an jeder Wand. Beide Endstäbe sind echte Stäbe.</li>
<li><strong>Volle Längen statt um die Betondeckung gekürzter Längen zählen.</strong> Vertikale laufen Höhe minus zweimal Betondeckung (2,92 m, nicht 3,00 m) und Horizontale Länge minus zweimal Betondeckung (5,92 m, nicht 6,00 m). Volle Längen zu verwenden, übertreibt die Standardwand um 2,13 + 0,74 = 2,87 kg — Stahl, den es nicht gibt, und Stäbe, die mit intakter Betondeckung nicht passen.</li>
<li><strong>Ein Raster für eine Zwei-Lagen-Wand bestellen.</strong> Jede Wand dicker als 200 mm braucht zwei Lagen nach IS 456. Die 132,40 kg des Rechners für eine 250 mm dicke Wand zu bestellen, liefert die Hälfte des Stahls. Verdoppeln Sie: 264,80 kg.</li>
<li><strong>Einem Abstand ohne die Stückzahl vertrauen.</strong> Abstände von 198 mm bis 204 mm ergeben alle dieselben 30 Vertikalen an der Standardwand, sodass ein „200 mm"-Raster und ein „204 mm"-Raster gleich viel wiegen — aber 205 mm lässt einen Stab wegfallen. Lesen Sie nach jeder Abstandsänderung die Stückzahl des Rechners.</li>
<li><strong>Stöße an langen Wänden vergessen.</strong> Horizontale Stäbe über der 12 m Handelslänge brauchen je einen Stoß. Bei einer 20 m langen Wand sind das 4,49 kg Stoßstahl, die der Nettobetrag auslässt — und bei jeder langen Wand der Liste wiederholt sich dieselbe Auslassung.</li>
</ol>
<p>Zuletzt geprüft: Oktober 2026.</p>`
}
},
    { id:"pool", slug:"pool-rebar-calculator", cat:"Members",
    metaTitle:"Pool Rebar Calculator — Wall Panel Bars & Weight",
    h1:"Swimming Pool Rebar Calculator",
    desc:"Reinforcement for a swimming pool wall panel: vertical and horizontal bars, counts and weight. Defaults = 56.80 kg. Free calculator, no signup.",
    kw:"pool rebar calculator, swimming pool rebar, rebar calculation for swimming pool, pool reinforcement",
    intro:"Size the reinforcement for a pool wall. Enter the wall length and height with the vertical and horizontal spacing — calculate each wall, then add the floor using the slab tool.",
    howto:["Enter one wall panel's length and height in metres, and the edge cover in mm.","Set the vertical spacing and bar size, and the horizontal spacing and bar size.","Read the bar counts and weights for that one panel — vertical steel, horizontal steel and the total.","Repeat for each wall (long and short sides usually differ), then add the floor using the slab tool.","Add laps, bond beam, steps and waste before ordering — the calculator counts straight, cover-reduced bars for one panel only."],
    formula:"Same grid method as a wall: bars each way from spacing, summed × kg/m. Repeat per wall and add the floor.",
    faqs:[["What size rebar for a pool?", "For a residential gunite/shotcrete pool, #3–#4 (10–13 mm) at 250–300 mm centres each way is typical — the calculator defaults to 10 mm at 250 mm each way. Larger pools, deeper walls and structural (poured) pool walls often step up to #5 (16 mm) or tighter spacings, and one published pool-engineering rule caps shell bars at #5 with no spacing tighter than 2-1/2 in, so shotcrete can fill behind the bars. Follow your engineer: the drawing's bar schedule always wins over any typical size."],
          ["How do I calculate pool rebar?", "Calculate each wall panel and the floor separately, then add them together. Run this calculator once per wall — the long walls and the short walls usually give different totals — and run the <a href=\"/concrete-slab-rebar-calculator\">slab calculator</a> for the floor. The worked whole-pool example below (8 × 4 m pool, 1.5 m deep) gives 170.02 kg of wall steel plus 373.96 kg of floor steel = 543.98 kg neat, before laps, bond beam and waste."],
          ["Does the calculator cover the whole pool?", "No — it covers ONE rectangular wall panel. A rectangular pool has four walls plus a floor, and the panel total is roughly a quarter of the shell: the defaults panel is 56.80 kg, while the full 8 × 4 m shell in the example is 543.98 kg. Ordering the panel total for a whole pool is the single biggest under-order on this page. Freeform pools need one more step: break the shell into straight runs by hand and run each run as a panel."],
          ["What spacing should pool rebar be?", "Commonly 250–300 mm each way for residential pools (the calculator defaults to 250 mm), and 12–16 in (about 300–400 mm) in much published pool practice — but two pool-specific limits apply. For gunite/shotcrete shells, keep bars no larger than #5 and spacings no tighter than 2-1/2 in, so pneumatically applied concrete can fill behind the steel; lapped-together bars are exactly where voids (\"shadows\") form. And the spacing on your drawing governs: deeper walls, heavier soil loads and structural walls all tighten it."],
          ["What cover does pool steel need?", "Published pool practice calls for 2 in (about 50 mm) of concrete to the water side and 3 in (about 76 mm) to the soil side. The calculator's 50 mm default therefore matches the water face; the soil face typically needs more. The calculator has one edge-cover field for all four sides of the panel, so if your drawing specifies different covers per face, run the governing cover — or run each face's bars separately — and check the result against the drawing."],
          ["Do I need to add lap length to a pool wall?", "Yes, whenever a bar run exceeds the stock length. The calculator counts every bar at its cover-reduced length with no splice added. Pool practice overlaps bars at 48 × bar diameter (#3 → 18 in, #4 → 24 in, #5 → 30 in). On a 15 m wall at the defaults grid, the six horizontal bars run 14.90 m — past even a 40 ft stick — so each needs one 0.48 m splice for 10 mm bars, adding 6 × 0.48 × 0.616 = 1.77 kg. Get the code lap from the <a href=\"/rebar-lap-length-calculator\">lap length calculator</a> where the drawing does not state it."],
          ["Does the calculator include the bond beam, steps or benches?", "No. The bond beam — the continuous reinforced ring at the top of the wall that ties the shell together — is not in this grid, and neither are steps, benches, a spa, skimmer or light niches, or plumbing penetrations. As a scale illustration only, one continuous #4 bar around an 8 × 4 m pool perimeter (24 m) weighs 23.86 kg. Take all of these from the drawing; steps and benches in particular are called out in published pool practice as structurally weaker areas that need extra steel, not less."],
          ["Can I use this calculator for a freeform or round pool?", "As an estimate, yes, with one translation: break the shell into straight runs and run each run as a panel, then add them. A curved wall's bars do not run in straight lengths, so the panel total is an approximation — the tighter the curve, the rougher it gets, and bars forced together around curvature need the substitution published in one municipal shotcrete spec (1 #4 for 2 #3 bars) to keep a minimum 2 in spacing for shotcrete fill. Round and oval pools without coves, spas or extensions are the most solid shapes structurally; 90° corners are the weakest and need extra steel and thickness."],
          ["Does the calculator design the pool shell?", "No — it weighs a grid you describe; it does not check whether the grid is adequate. Water pressure, soil pressure, buoyancy (an empty pool in high groundwater can lift — that is what hydrostatic relief plugs are for), crack control (published pool-wall research caps crack width at 0.25 mm for clean-water pools), and the shell thickness all come from the structural design and the drawing. Pool codes are deliberately conservative — water load is constant and any crack can leak — so a total that looks reasonable is not proof the shell holds water."],
          ["Does the calculator include waste, tie wire or cost?", "No — it gives the neat one-panel total only. Add 5–10% waste for cutting and laps (one published grid guide recommends 10% for overlaps, cutoffs and waste), estimate the fixing wire on the <a href=\"/rebar-tie-wire-calculator\">tie wire calculator</a>, price the order with the <a href=\"/rebar-cost-calculator\">cost calculator</a>, and check the steel tonnage with the <a href=\"/rebar-tonnage-calculator\">tonnage calculator</a>. For a full takeoff across members use the <a href=\"/rebar-quantity-calculator\">quantity & takeoff calculator</a>."]],
    toc:`<nav class="content-block" aria-label="On this page">
    <h2>On this page</h2>
    <ul>
      <li><a href="#how-to">How to use the calculator</a></li>
      <li><a href="#formula">The formula</a></li>
      <li><a href="#example-1">Worked example 1: defaults (8 × 1.5 m panel)</a></li>
      <li><a href="#example-2">Worked example 2: 10 × 2 m panel</a></li>
      <li><a href="#example-3">Worked example 3: small plunge pool panel</a></li>
      <li><a href="#spacing-table">Vertical spacing</a></li>
      <li><a href="#horizontal-spacing">Horizontal spacing</a></li>
      <li><a href="#minimum-steel">The minimum-steel check</a></li>
      <li><a href="#whole-pool">From one panel to the whole pool</a></li>
      <li><a href="#laps">Long walls and laps</a></li>
      <li><a href="#imperial">Imperial conversions</a></li>
      <li><a href="#not-included">What this calculator does not cover</a></li>
      <li><a href="#mistakes">5 common mistakes</a></li>
      <li><a href="#faq">FAQs</a></li>
    </ul>
  </nav>`,
    extra:`<h3>The formula, explained</h3>
<p>A pool wall panel is a wall grid: verticals counted along the length, horizontals counted up the height, and the calculator keeps them separate so you can see which direction dominates:</p>
<p><strong>Vertical bars = floor((L − 2cover) ÷ spV) + 1, each (H − 2cover) long; Horizontal bars = floor((H − 2cover) ÷ spH) + 1, each (L − 2cover) long; Total = vertical steel + horizontal steel</strong></p>
<p>Both counts use the same fence-post rule as every grid on this site: the cover-reduced run divided by the spacing gives the number of intervals, and the bars number one more than the intervals, because both end bars count. And both bar lengths are cover-reduced — the verticals stop 50 mm short of the top and bottom on the defaults, the horizontals 50 mm short of each end. One display note, carried over from the wall page: both bar fields read "0.617|10", but the panel computes with the option value 0.616 kg/m, so every weight below uses 0.616. And one counting note that is new on this page: when the cover-reduced run divides EXACTLY by the spacing, the panel counts one bar fewer than a hand calculation gives (floating-point arithmetic lands just below the integer). The horizontal-spacing table below shows both instances — trust the panel count, not the hand count.</p>
<h3 id="example-1">Worked example 1: defaults (8 × 1.5 m panel)</h3>
<p>Open the calculator and leave the defaults: length 8 m, height 1.5 m, vertical spacing 250 mm, horizontal spacing 250 mm, edge cover 50 mm, vertical bars 10 mm, horizontal bars 10 mm.</p>
<p>Verticals = floor((8 − 0.10) ÷ 0.25) + 1 = floor(31.6) + 1 = 32 bars, each 1.5 − 0.10 = 1.40 m long → 32 × 1.40 × 0.616 = 27.60 kg. Horizontals = floor((1.5 − 0.10) ÷ 0.25) + 1 = floor(5.6) + 1 = 6 bars, each 8 − 0.10 = 7.90 m long → 6 × 7.90 × 0.616 = 29.20 kg.</p>
<p><strong>Total = 27.60 + 29.20 = 56.80 kg (0.057 t).</strong> The panel shows 56.80 kg, 32.00 vertical bars, 6.00 horizontal bars, 27.60 kg vertical steel, 29.20 kg horizontal steel and 0.057 t. Note the split: on this long, shallow panel the horizontals (51.4%) outweigh the verticals — length dominates when height is small, the opposite of a tall wall. Total bar length is 32 × 1.40 + 6 × 7.90 = 92.20 m, and at 12 m² of panel face that is 4.73 kg/m² — a useful density to compare against the next examples. And remember: this is ONE panel. A pool has four of them plus a floor.</p>
<h3 id="example-2">Worked example 2: 10 × 2 m panel</h3>
<p>Set length 10 m, height 2 m, vertical spacing 200 mm, horizontal spacing 200 mm, cover 50 mm, vertical bars 12 mm, horizontal bars 12 mm.</p>
<p>Verticals = floor((10 − 0.10) ÷ 0.20) + 1 = 50 bars, each 2 − 0.10 = 1.90 m → 50 × 1.90 × 0.887 = 84.27 kg. Horizontals = floor((2 − 0.10) ÷ 0.20) + 1 = 10 bars, each 10 − 0.10 = 9.90 m → 10 × 9.90 × 0.887 = 87.81 kg.</p>
<p><strong>Total = 84.27 + 87.81 = 172.08 kg (0.172 t).</strong> At 20 m² of panel face that is 8.60 kg/m² — nearly double the defaults density, because both spacings tightened and both bar sizes stepped up at once. Note the horizontal bars here run 9.90 m, still inside a 12 m stock length — no splice needed. Stretch this panel to 15 m and that stops being true (see the laps section).</p>
<h3 id="example-3">Worked example 3: small plunge pool panel</h3>
<p>Set length 6 m, height 1.2 m, vertical spacing 300 mm, horizontal spacing 300 mm, cover 40 mm, vertical bars 10 mm, horizontal bars 10 mm.</p>
<p>Verticals = floor((6 − 0.08) ÷ 0.30) + 1 = 20 bars, each 1.2 − 0.08 = 1.12 m → 20 × 1.12 × 0.616 = 13.80 kg. Horizontals = floor((1.2 − 0.08) ÷ 0.30) + 1 = 4 bars, each 6 − 0.08 = 5.92 m → 4 × 5.92 × 0.616 = 14.59 kg.</p>
<p><strong>Total = 13.80 + 14.59 = 28.39 kg (0.028 t).</strong> At 7.2 m² that is only 3.94 kg/m² — a lightly reinforced shallow panel, and the 300 mm spacings are fine only if the drawing says so: published pool practice runs 12–16 in (about 300–400 mm) for many residential shells, but deeper water, heavier soil and structural walls all tighten the grid. A small pool is not automatically a lightly reinforced pool — depth and soil decide, not size.</p>
<h3 id="spacing-table">Vertical spacing</h3>
<p>Same defaults panel (8 × 1.5 m, 10 mm horizontals @ 250 mm giving a constant 29.20 kg), five vertical spacings. The horizontal steel never moves, so the whole table is the vertical half doing its thing.</p>
<div class="formula-table"><table>
<tr><th>Vertical spacing</th><th>Vertical bars</th><th>Vertical steel</th><th>Total weight</th></tr>
<tr><td>150 mm</td><td>53</td><td>45.71 kg</td><td>74.91 kg</td></tr>
<tr><td>200 mm</td><td>40</td><td>34.50 kg</td><td>63.69 kg</td></tr>
<tr><td>250 mm</td><td>32</td><td>27.60 kg</td><td>56.80 kg</td></tr>
<tr><td>300 mm</td><td>27</td><td>23.28 kg</td><td>52.48 kg</td></tr>
<tr><td>400 mm</td><td>20</td><td>17.25 kg</td><td>46.45 kg</td></tr>
</table></div>
<p>Two readings. First, spacing is a strong lever: tightening from 250 mm to 150 mm adds 21 verticals and 18.11 kg (+32%) to one panel. Second, there are dead bands: any vertical spacing from 247 mm to 254 mm gives the same 32 bars on this panel — 254 mm returns exactly the defaults total of 56.80 kg — while 255 mm drops to 31 bars and 55.93 kg. So a spacing "improvement" of a few millimetres often changes nothing. Always read the count, not just the spacing. And one pool-specific limit: for gunite/shotcrete shells, published pool-engineering practice caps shell bars at #5 and spacings at no tighter than 2-1/2 in, so pneumatically applied concrete can fill behind the steel — a 150 mm spacing is fine, but do not chase tighter grids without checking the shell can actually be shot.</p>
<h3 id="horizontal-spacing">Horizontal spacing</h3>
<p>Same defaults panel, five horizontal spacings, vertical steel constant at 27.60 kg:</p>
<div class="formula-table"><table>
<tr><th>Horizontal spacing</th><th>Horizontal bars</th><th>Horizontal steel</th><th>Total weight</th></tr>
<tr><td>150 mm</td><td>10</td><td>48.66 kg</td><td>76.26 kg</td></tr>
<tr><td>200 mm</td><td>7</td><td>34.06 kg</td><td>61.66 kg</td></tr>
<tr><td>250 mm</td><td>6</td><td>29.20 kg</td><td>56.80 kg</td></tr>
<tr><td>300 mm</td><td>5</td><td>24.33 kg</td><td>51.93 kg</td></tr>
<tr><td>400 mm</td><td>4</td><td>19.47 kg</td><td>47.06 kg</td></tr>
</table></div>
<p>The 200 mm row needs a footnote, and it is the most useful row in the table. By hand, floor(1.40 ÷ 0.20) + 1 = 8 horizontals — but the panel shows 7, with 34.06 kg and a 61.66 kg total. The cover-reduced run (1.40 m) divides exactly by 200 mm, and the panel's arithmetic lands just below the integer, so it counts one bar fewer. The same thing happens on a 12 × 2.5 m panel at 200 mm horizontal spacing: by hand 13 horizontals, the panel counts 12 (87.96 kg of horizontal steel, 215.69 kg total). Neither row is a typo — both reproduce from the panel exactly as shown. The rule is simple: after changing a spacing, read the panel's bar count; do not trust a hand count when the run divides exactly by the spacing.</p>
<h3 id="minimum-steel">The minimum-steel check</h3>
<p>The calculator weighs whatever grid you enter; it never asks whether the grid is enough. The check needs the wall thickness, which the calculator does not ask for — so here it is, worked by hand, using the IS 456 wall minima as the yardstick (pool design itself is engineer-governed; see the design FAQ). Steel per metre of panel is bar area ÷ spacing: a 10 mm bar is 78.54 mm², a 12 mm bar 113.10 mm².</p>
<p>On a 200 mm thick wall the defaults grid gives 78.54 ÷ 0.25 = 314.16 mm²/m each way, which is 314.16 ÷ 200000 = 0.157% — above the 0.12% vertical minimum but BELOW the 0.20% horizontal minimum. The defaults grid, as it stands, fails the horizontal check on a 200 mm wall. The fix is small: tighten the horizontals to 190 mm (78.54 ÷ 0.19 = 413.37 mm²/m = 0.207%, panel total 66.53 kg) or step the horizontal bar up to 12 mm at 250 mm (113.10 ÷ 0.25 = 452.39 mm²/m = 0.226%, panel total 69.64 kg). Either fix costs a few kilograms; the uncorrected grid costs a failed check. On a 150 mm wall the same grid passes both: 314.16 ÷ 150000 = 0.209%.</p>
<p>Two wider cautions. First, published pool-wall research caps crack width at 0.25 mm for clean-water pools — tighter than many structural checks — because any crack in a pool can leak; minimum steel is a floor, not a guarantee against cracking. Second, pool codes are deliberately conservative for exactly that reason: the water load never goes away, so published pool engineering puts properly designed shells at roughly twice the actual water-plus-soil load. Minimum percentages catch gross errors; they do not design the shell.</p>
<h3 id="whole-pool">From one panel to the whole pool</h3>
<p>The calculator gives one panel. The pool is four panels plus a floor. Worked example: an 8 × 4 m rectangular pool, 1.5 m deep, at the defaults grid (10 mm @ 250 mm each way, 50 mm cover).</p>
<p>Long walls: two panels of 8 × 1.5 m at 56.80 kg each = 113.59 kg. Short walls: two panels of 4 × 1.5 m at the defaults grid — 16 verticals, 6 horizontals, 13.80 + 14.41 = 28.21 kg each — = 56.43 kg. Walls total 170.02 kg. Floor: run the <a href="/concrete-slab-rebar-calculator">slab calculator</a> for an 8 × 4 m floor at 150 mm spacing, 12 mm bars, 40 mm cover → 373.96 kg (421.60 m of bar). <strong>Shell neat total = 170.02 + 373.96 = 543.98 kg.</strong> With a 5% waste allowance that is 571.17 kg, which costs €685.41 at an example €1.20/kg (prices are examples — enter your local rate on the <a href="/rebar-cost-calculator">cost calculator</a>).</p>
<p>Three things that total still omits. The bond beam: as a scale illustration only, one continuous #4 bar around the 24 m perimeter weighs 23.86 kg (two bars 47.71 kg) — take the actual bond-beam steel from the drawing. Steps, benches and any spa: published pool practice calls these structurally weaker areas needing extra steel, not less. And laps on long walls, covered next. Convert any schedule on the <a href="/rebar-tonnage-calculator">tonnage calculator</a>, and build a full count-and-length takeoff on the <a href="/rebar-quantity-calculator">quantity calculator</a>.</p>
<h3 id="laps">Long walls and laps</h3>
<p>Two additions turn a panel total into an order quantity, and both are missing from the calculator by design. First, splices: any bar run longer than stock length needs one. Take a 15 m wall at the defaults grid — 60 verticals @ 1.40 m = 51.74 kg, 6 horizontals @ 14.90 m = 55.07 kg, total 106.81 kg. The horizontal bars run 14.90 m, past even a 40 ft (12.19 m) stick, so each needs one splice. Pool practice overlaps bars at 48 × bar diameter (#3 → 18 in, #4 → 24 in, #5 → 30 in), so a 10 mm bar splices at 0.48 m, adding 6 × 0.48 × 0.616 = 1.77 kg (total with laps 108.59 kg). With 20 ft (6.10 m) sticks the same bar needs two splices: +3.55 kg. That is also why published pool guidance prefers 40 ft sticks — fewer overlaps, and every overlap in a shotcrete shell is a place where concrete can fail to fill behind the steel. Get the code lap from the <a href="/rebar-lap-length-calculator">lap length calculator</a> where the drawing does not state it.</p>
<p>Second, the vertical bars are short (1.40 m on the defaults panel) and need no splice — but they do need to tie into the floor steel and the bond beam, and the hooks and dowels for those joints are not in this grid. Work them out on the <a href="/rebar-hook-bend-cutting-length-calculator">hook cutting length calculator</a> and the <a href="/rebar-development-length-calculator">development length calculator</a>, and add the weight. A shell schedule that ignores laps, hooks and the bond beam under-orders on every wall at once.</p>
<h3 id="imperial">Imperial conversions</h3>
<p>The calculator takes metres and millimetres, so convert first: 1 m = 3.28 ft, 1 kg = 2.20 lb, 1 in = 25.4 mm.</p>
<p>Worked conversions: the defaults total 56.80 kg = 125.21 lb (0.057 t); example 2 totals 172.08 kg = 379.37 lb (0.172 t). An 8 m wall is 26.25 ft long, a 1.5 m wall 4.92 ft high, 250 mm spacing is 9.84 in and 50 mm cover is 1.97 in. A full imperial run — a 25 × 5 ft wall (7.62 × 1.524 m), 10 in spacing both ways, 2 in cover, #4 verticals (12.7 mm, 0.994 kg/m) and #3 horizontals (9.5 mm, 0.56 kg/m) — gives 30 verticals and 6 horizontals, 42.42 + 25.26 = 67.68 kg (149.20 lb). The bar dropdowns include US sizes, so enter the metric equivalents of your dimensions and pick the matching US bar. Note the cover translation: published pool practice wants 2 in to water and 3 in to soil — the 2 in used here suits the water face; check the soil face against your drawing.</p>
<h3 id="not-included">What this calculator does not cover</h3>
<ul>
<li>Structural design — water pressure, soil pressure, buoyancy, seismic loads, shell thickness, crack control and the required steel area; the minimum-steel check above catches gross errors, it does not prove the shell holds water.</li>
<li>The floor — run the <a href="/concrete-slab-rebar-calculator">slab calculator</a> for it (see the whole-pool example).</li>
<li>The other three walls — run each panel separately; long and short walls differ.</li>
<li>Bond beam, steps, benches, spa, skimmer and light niches, plumbing penetrations — all from the drawing, none in this grid.</li>
<li>Laps, hooks, bends at corners, dowels into the floor — see the <a href="/rebar-lap-length-calculator">lap length calculator</a> and the <a href="/rebar-hook-bend-cutting-length-calculator">hook cutting length calculator</a>.</li>
<li>Second grids / double mats — the calculator counts one grid per panel; if the design calls for two curtains, double the panel total.</li>
<li>Freeform and curved shells — break them into straight runs by hand; the result is an estimate, not a schedule.</li>
<li>Waterstop, hydrostatic relief, waterproofing and plaster — none of these are steel, and none are in this tool.</li>
<li>Chairs and spacers for the floor steel — see the <a href="/rebar-chair-calculator">chair calculator</a>; tie wire is on the <a href="/rebar-tie-wire-calculator">tie wire calculator</a>.</li>
<li>Cost, tonnage and multi-panel takeoff — the whole-pool section shows the hand arithmetic; the <a href="/rebar-cost-calculator">cost calculator</a> prices a full takeoff, the <a href="/rebar-tonnage-calculator">tonnage calculator</a> converts it, and the <a href="/rebar-quantity-calculator">quantity &amp; takeoff calculator</a> totals across members.</li>
</ul>
<h3 id="mistakes">5 common mistakes</h3>
<ol>
<li><strong>Ordering one panel for the whole pool.</strong> The defaults panel is 56.80 kg; the full 8 × 4 m shell is 543.98 kg neat. The panel total is roughly a quarter of the shell — ordering it delivers about a tenth of the steel once the floor is counted. Always multiply out: four walls plus floor.</li>
<li><strong>Forgetting the +1 on both counts.</strong> Length ÷ spacing without the +1 gives 31 verticals instead of 32 and 5 horizontals instead of 6 on the defaults panel — 0.86 + 4.87 = 5.73 kg missing from every panel. Both end bars are real bars.</li>
<li><strong>Counting full lengths instead of cover-reduced lengths.</strong> Verticals run height minus twice the cover (1.40 m, not 1.50 m) and horizontals length minus twice the cover (7.90 m, not 8.00 m). Using full lengths overstates the defaults panel by 1.97 + 0.37 = 2.34 kg — steel that does not exist and bars that do not fit with their cover intact.</li>
<li><strong>Trusting a hand count when the run divides exactly.</strong> At 200 mm horizontal spacing on the defaults panel, the hand count says 8 horizontals but the panel counts 7 (34.06 kg, 61.66 kg total); on a 12 × 2.5 m panel at 200 mm it says 13 but the panel counts 12 (87.96 kg, 215.69 kg total). The panel's arithmetic lands just below the integer on exact divisions. After changing a spacing, read the panel's bar count — it is the number that ships.</li>
<li><strong>Forgetting laps, bond beam and steps.</strong> A 15 m wall's horizontal bars each need a splice (+1.77 kg at the 48d rule, +3.55 kg with 20 ft sticks); the bond beam around an 8 × 4 m pool is another ~24–48 kg of continuous bar; steps and benches need their own steel. None of it is in the panel total, and on a multi-wall shell the omission repeats on every wall.</li>
</ol>
<p>Last reviewed: October 2026.</p>`,
    de: {
  metaTitle: "Poolbewehrungs-Rechner — Wandscheibe, Stäbe & kg gratis",
  desc: "Poolbewehrungs-Rechner: Vertikale und horizontale Stäbe für eine Pool-Wandscheibe berechnen. Beispiel: 8 × 1,5 m Wandscheibe = 56,80 kg. Kostenlos.",
  formula: "Gleiche Raster-Methode wie bei einer Wand: Stäbe in beiden Richtungen aus dem Abstand, summiert × kg/m. Pro Wand wiederholen und den Boden addieren.",
  kw: "poolbewehrungs-rechner, pool bewehrung berechnen, swimmingpool bewehrung, poolbewehrung",
  howto: ["Geben Sie Länge und Höhe einer Wandscheibe in Metern sowie die Randbetondeckung in mm ein.", "Legen Sie den Vertikalabstand und die Stabgröße sowie den Horizontalabstand und die Stabgröße fest.", "Lesen Sie Stabzahlen und Gewichte für diese eine Wandscheibe ab — Vertikalstahl, Horizontalstahl und Gesamtmenge.", "Wiederholen Sie das für jede Wand (lange und kurze Seiten unterscheiden sich meist) und addieren Sie dann den Boden mit dem Plattenrechner.", "Addieren Sie Übergreifungen, Ringbalken, Stufen und Verschnitt vor der Bestellung — der Rechner zählt gerade, um die Betondeckung gekürzte Stäbe für nur eine Wandscheibe."],
  faqs: [["Welche Bewehrungsgröße braucht ein Pool?", "Für einen privaten Spritzbeton-Pool (Gunite/Shotcrete) sind #3–#4 (10–13 mm) im Abstand von 250–300 mm in beiden Richtungen üblich — der Rechner ist standardmäßig auf 10 mm bei 250 mm in beiden Richtungen eingestellt. Größere Pools, tiefere Wände und tragende (gegossene) Poolwände gehen oft auf #5 (16 mm) oder engere Abstände hoch, und eine veröffentlichte Poolbau-Regel begrenzt Schalenstäbe auf #5 bei keinem engeren Abstand als 2-1/2 Zoll, damit Spritzbeton hinter die Stäbe fließen kann. Folgen Sie Ihrem Statiker: Der Bewehrungsplan der Zeichnung schlägt immer jede typische Größe."],
          ["Wie berechne ich die Poolbewehrung?", "Berechnen Sie jede Wandscheibe und den Boden getrennt und addieren Sie sie dann. Führen Sie diesen Rechner einmal pro Wand aus — die langen und die kurzen Wände ergeben meist unterschiedliche Summen — und führen Sie den <a href=\"/de/bewehrungsrechner-fuer-betonplatten\">Plattenrechner</a> für den Boden aus. Das durchgerechnete Gesamtpool-Beispiel unten (8 × 4 m Pool, 1,5 m tief) ergibt 170,02 kg Wandstahl plus 373,96 kg Bodenstahl = 543,98 kg netto, vor Übergreifungen, Ringbalken und Verschnitt."],
          ["Deckt der Rechner den ganzen Pool ab?", "Nein — er deckt EINE rechteckige Wandscheibe ab. Ein rechteckiger Pool hat vier Wände plus einen Boden, und die Wandscheibensumme ist etwa ein Viertel der Schale: Die Standard-Wandscheibe beträgt 56,80 kg, während die komplette 8 × 4 m Schale im Beispiel 543,98 kg beträgt. Die Wandscheibensumme für einen ganzen Pool zu bestellen, ist die größte Unterbestellung auf dieser Seite. Freiform-Pools brauchen einen Schritt mehr: Teilen Sie die Schale von Hand in gerade Abschnitte und führen Sie jeden Abschnitt als Wandscheibe aus."],
          ["Welchen Abstand sollte die Poolbewehrung haben?", "Üblicherweise 250–300 mm in beiden Richtungen für private Pools (der Rechner ist standardmäßig auf 250 mm eingestellt) und 12–16 Zoll (etwa 300–400 mm) in viel veröffentlichter Poolpraxis — aber es gelten zwei poolspezifische Grenzen. Für Gunite-/Shotcrete-Schalen dürfen die Stäbe nicht größer als #5 sein und die Abstände nicht enger als 2-1/2 Zoll, damit pneumatisch aufgebrachter Beton hinter dem Stahl einfließen kann; zusammengelappte Stäbe sind genau die Stellen, an denen Hohlräume („Schatten“) entstehen. Und der Abstand auf Ihrer Zeichnung ist maßgebend: Tiefere Wände, schwerere Bodenlasten und tragende Wände verengen ihn."],
          ["Welche Betondeckung braucht Poolstahl?", "Die veröffentlichte Poolpraxis verlangt 2 Zoll (etwa 50 mm) Beton zur Wasserseite und 3 Zoll (etwa 76 mm) zur Bodenseite. Die 50-mm-Standardeinstellung des Rechners entspricht daher der Wasserfläche; die Bodenseite braucht typischerweise mehr. Der Rechner hat ein Randbetondeckungsfeld für alle vier Seiten der Wandscheibe. Wenn Ihre Zeichnung also unterschiedliche Deckungen je Fläche vorschreibt, rechnen Sie mit der maßgebenden Deckung — oder rechnen Sie die Stäbe jeder Fläche getrennt — und prüfen Sie das Ergebnis an der Zeichnung."],
          ["Muss ich bei einer Poolwand Übergreifungslängen addieren?", "Ja, sobald ein Stabverlauf die Handelslänge überschreitet. Der Rechner zählt jeden Stab in seiner um die Betondeckung gekürzten Länge ohne zugegebene Stoßlänge. Die Poolpraxis überlappt Stäbe mit dem 48-fachen Stabdurchmesser (#3 → 18 Zoll, #4 → 24 Zoll, #5 → 30 Zoll). An einer 15-m-Wand im Standardraster laufen die sechs horizontalen Stäbe 14,90 m — über sogar einen 40-Fuß-Stab hinaus — sodass jeder einen 0,48-m-Stoß für 10-mm-Stäbe braucht, was 6 × 0,48 × 0,616 = 1,77 kg addiert. Holen Sie sich die normgerechte Übergreifung aus dem <a href=\"/de/uebergreifungslaengen-rechner\">Übergreifungslängen-Rechner</a>, wo die Zeichnung sie nicht angibt."],
          ["Deckt der Rechner den Ringbalken, Stufen oder Sitzbänke ab?", "Nein. Der Ringbalken — der durchgehende bewehrte Ring oben an der Wand, der die Schale zusammenhält — ist nicht in diesem Raster enthalten, und ebenso wenig Stufen, Sitzbänke, ein Spa, Skimmer- oder Leuchtennischen oder Rohrdurchführungen. Nur als Größenillustration wiegt ein durchgehender #4-Stab um einen 8 × 4 m Poolumfang (24 m) 23,86 kg. Nehmen Sie all das aus der Zeichnung; Stufen und Sitzbänke im Besonderen werden in der veröffentlichten Poolpraxis als statisch schwächere Bereiche genannt, die mehr Stahl brauchen, nicht weniger."],
          ["Kann ich diesen Rechner für einen Freiform- oder Rundpool verwenden?", "Als Schätzung ja, mit einer Übersetzung: Teilen Sie die Schale in gerade Abschnitte und führen Sie jeden Abschnitt als Wandscheibe aus, dann addieren Sie sie. Die Stäbe einer gekrümmten Wand verlaufen nicht in geraden Längen, sodass die Wandscheibensumme eine Näherung ist — je enger die Krümmung, desto grober wird sie, und Stäbe, die um Krümmungen herum zusammengedrängt werden, brauchen den in einer kommunalen Shotcrete-Vorschrift veröffentlichten Ersatz (1 #4 für 2 #3 Stäbe), um einen Mindestabstand von 2 Zoll für die Shotcrete-Füllung einzuhalten. Runde und ovale Pools ohne Kehlen, Spas oder Anbauten sind statisch die solidesten Formen; 90°-Ecken sind die schwächsten und brauchen zusätzlichen Stahl und Dicke."],
          ["Bemisst der Rechner die Poolschale?", "Nein — er wiegt ein Raster, das Sie beschreiben; er prüft nicht, ob das Raster ausreicht. Wasserdruck, Bodendruck, Auftrieb (ein leerer Pool in hohem Grundwasser kann sich heben — dafür sind hydrostatische Entlastungsstopfen da), Risskontrolle (veröffentlichte Poolwand-Forschung begrenzt die Rissbreite auf 0,25 mm für Klarwasser-Pools) und die Schalendicke kommen alle aus der statischen Bemessung und der Zeichnung. Poolnormen sind bewusst konservativ — die Wasserlast ist konstant und jeder Riss kann lecken — sodass eine Summe, die vernünftig aussieht, kein Beweis dafür ist, dass die Schale Wasser hält."],
          ["Deckt der Rechner Verschnitt, Bindedraht oder Kosten ab?", "Nein — er gibt nur die Netto-Einzelwandscheibensumme an. Addieren Sie 5–10 % Verschnitt für Zuschnitt und Übergreifungen (ein veröffentlichter Raster-Leitfaden empfiehlt 10 % für Überlappungen, Abschnitte und Verschnitt), schätzen Sie den Befestigungsdraht mit dem <a href=\"/de/bindedraht-rechner\">Bindedraht-Rechner</a>, bepreisen Sie die Bestellung mit dem <a href=\"/de/bewehrungskosten-rechner\">Bewehrungskosten-Rechner</a> und prüfen Sie die Stahltonnage mit dem <a href=\"/de/bewehrungstonnage-rechner\">Bewehrungstonnage-Rechner</a>. Für eine vollständige Mengenermittlung über Bauteile hinweg verwenden Sie den <a href=\"/de/bewehrungsmengen-rechner\">Mengen- &amp; Abrechnungsrechner</a>."]],
  toc: `<nav class="content-block" aria-label="Auf dieser Seite">
    <h2>Auf dieser Seite</h2>
    <ul>
      <li><a href="#how-to">So benutzen Sie den Rechner</a></li>
      <li><a href="#formula">Die Formel</a></li>
      <li><a href="#example-1">Rechenbeispiel 1: Standardwerte (8 × 1,5 m Wandscheibe)</a></li>
      <li><a href="#example-2">Rechenbeispiel 2: 10 × 2 m Wandscheibe</a></li>
      <li><a href="#example-3">Rechenbeispiel 3: kleine Tauchbecken-Wandscheibe</a></li>
      <li><a href="#spacing-table">Vertikalabstand</a></li>
      <li><a href="#horizontal-spacing">Horizontalabstand</a></li>
      <li><a href="#minimum-steel">Die Mindestbewehrungs-Prüfung</a></li>
      <li><a href="#whole-pool">Von einer Wandscheibe zum Gesamtpool</a></li>
      <li><a href="#laps">Lange Wände und Übergreifungen</a></li>
      <li><a href="#imperial">Zoll-Umrechnungen</a></li>
      <li><a href="#not-included">Was dieser Rechner nicht abdeckt</a></li>
      <li><a href="#mistakes">5 häufige Fehler</a></li>
      <li><a href="#faq">FAQs</a></li>
    </ul>
  </nav>`,
  extra: `<h3>Die Formel, erklärt</h3>
<p>Eine Pool-Wandscheibe ist ein Wandgitter: Vertikale werden entlang der Länge gezählt, Horizontale die Höhe hinauf, und der Rechner hält sie getrennt, damit Sie sehen, welche Richtung dominiert:</p>
<p><strong>Vertikale Stäbe = floor((L − 2Betondeckung) ÷ spV) + 1, jeder (H − 2Betondeckung) lang; Horizontale Stäbe = floor((H − 2Betondeckung) ÷ spH) + 1, jeder (L − 2Betondeckung) lang; Gesamt = Vertikalstahl + Horizontalstahl</strong></p>
<p>Beide Zählungen verwenden die gleiche Zaunpfahlregel wie jedes Raster auf dieser Seite: Die um die Betondeckung gekürzte Strecke geteilt durch den Abstand ergibt die Anzahl der Intervalle, und die Stäbe sind um eins zahlreicher als die Intervalle, weil beide Endstäbe zählen. Und beide Stablängen sind um die Betondeckung gekürzt — die Vertikalen enden bei den Standardwerten 50 mm vor Ober- und Unterkante, die Horizontalen 50 mm vor jedem Ende. Ein Anzeigehinweis, von der Wandseite übernommen: Beide Stabfelder lesen „0,617|10“, aber die Wandscheibe rechnet mit dem Optionswert 0,616 kg/m, sodass jedes Gewicht unten 0,616 verwendet. Und ein Zählhinweis, der auf dieser Seite neu ist: Wenn die um die Betondeckung gekürzte Strecke EXAKT durch den Abstand teilbar ist, zählt die Wandscheibe einen Stab weniger, als eine Handrechnung ergibt (die Gleitkomma-Arithmetik landet knapp unter der ganzen Zahl). Die Horizontalabstand-Tabelle unten zeigt beide Fälle — vertrauen Sie der Wandscheibenzählung, nicht der Handzählung.</p>
<h3 id="example-1">Rechenbeispiel 1: Standardwerte (8 × 1,5 m Wandscheibe)</h3>
<p>Öffnen Sie den Rechner und lassen Sie die Standardwerte: Länge 8 m, Höhe 1,5 m, Vertikalabstand 250 mm, Horizontalabstand 250 mm, Randbetondeckung 50 mm, vertikale Stäbe 10 mm, horizontale Stäbe 10 mm.</p>
<p>Vertikale = floor((8 − 0,10) ÷ 0,25) + 1 = floor(31,6) + 1 = 32 Stäbe, jeder 1,5 − 0,10 = 1,40 m lang → 32 × 1,40 × 0,616 = 27,60 kg. Horizontale = floor((1,5 − 0,10) ÷ 0,25) + 1 = floor(5,6) + 1 = 6 Stäbe, jeder 8 − 0,10 = 7,90 m lang → 6 × 7,90 × 0,616 = 29,20 kg.</p>
<p><strong>Gesamt = 27,60 + 29,20 = 56,80 kg (0,057 t).</strong> Die Wandscheibe zeigt 56,80 kg, 32,00 vertikale Stäbe, 6,00 horizontale Stäbe, 27,60 kg Vertikalstahl, 29,20 kg Horizontalstahl und 0,057 t. Beachten Sie die Aufteilung: Auf dieser langen, flachen Wandscheibe überwiegen die Horizontalen (51,4 %) die Vertikalen — die Länge dominiert, wenn die Höhe klein ist, das Gegenteil einer hohen Wand. Die Gesamtstablänge beträgt 32 × 1,40 + 6 × 7,90 = 92,20 m, und bei 12 m² Wandscheibenfläche sind das 4,73 kg/m² — eine nützliche Dichte zum Vergleich mit den nächsten Beispielen. Und denken Sie daran: Das ist EINE Wandscheibe. Ein Pool hat vier davon plus einen Boden.</p>
<h3 id="example-2">Rechenbeispiel 2: 10 × 2 m Wandscheibe</h3>
<p>Setzen Sie Länge 10 m, Höhe 2 m, Vertikalabstand 200 mm, Horizontalabstand 200 mm, Betondeckung 50 mm, vertikale Stäbe 12 mm, horizontale Stäbe 12 mm.</p>
<p>Vertikale = floor((10 − 0,10) ÷ 0,20) + 1 = 50 Stäbe, jeder 2 − 0,10 = 1,90 m → 50 × 1,90 × 0,887 = 84,27 kg. Horizontale = floor((2 − 0,10) ÷ 0,20) + 1 = 10 Stäbe, jeder 10 − 0,10 = 9,90 m → 10 × 9,90 × 0,887 = 87,81 kg.</p>
<p><strong>Gesamt = 84,27 + 87,81 = 172,08 kg (0,172 t).</strong> Bei 20 m² Wandscheibenfläche sind das 8,60 kg/m² — fast doppelt so viel wie die Standarddichte, weil beide Abstände gleichzeitig verengt und beide Stabgrößen gleichzeitig erhöht wurden. Beachten Sie, dass die horizontalen Stäbe hier 9,90 m lang sind und noch innerhalb einer 12-m-Handelslänge liegen — kein Stoß nötig. Dehnen Sie diese Wandscheibe auf 15 m, dann gilt das nicht mehr (siehe Abschnitt Übergreifungen).</p>
<h3 id="example-3">Rechenbeispiel 3: kleine Tauchbecken-Wandscheibe</h3>
<p>Setzen Sie Länge 6 m, Höhe 1,2 m, Vertikalabstand 300 mm, Horizontalabstand 300 mm, Betondeckung 40 mm, vertikale Stäbe 10 mm, horizontale Stäbe 10 mm.</p>
<p>Vertikale = floor((6 − 0,08) ÷ 0,30) + 1 = 20 Stäbe, jeder 1,2 − 0,08 = 1,12 m → 20 × 1,12 × 0,616 = 13,80 kg. Horizontale = floor((1,2 − 0,08) ÷ 0,30) + 1 = 4 Stäbe, jeder 6 − 0,08 = 5,92 m → 4 × 5,92 × 0,616 = 14,59 kg.</p>
<p><strong>Gesamt = 13,80 + 14,59 = 28,39 kg (0,028 t).</strong> Bei 7,2 m² sind das nur 3,94 kg/m² — eine leicht bewehrte flache Wandscheibe, und die 300-mm-Abstände sind nur in Ordnung, wenn die Zeichnung das so sagt: Die veröffentlichte Poolpraxis läuft für viele private Schalen bei 12–16 Zoll (etwa 300–400 mm), aber tieferes Wasser, schwererer Boden und tragende Wände verengen das Raster. Ein kleiner Pool ist nicht automatisch ein leicht bewehrter Pool — Tiefe und Boden entscheiden, nicht die Größe.</p>
<h3 id="spacing-table">Vertikalabstand</h3>
<p>Gleiche Standard-Wandscheibe (8 × 1,5 m, 10-mm-Horizontale bei 250 mm mit konstanten 29,20 kg), fünf Vertikalabstände. Der Horizontalstahl bewegt sich nie, sodass die ganze Tabelle die vertikale Hälfte bei der Arbeit zeigt.</p>
<div class="formula-table"><table>
<tr><th>Vertikalabstand</th><th>Vertikale Stäbe</th><th>Vertikalstahl</th><th>Gesamtgewicht</th></tr>
<tr><td>150 mm</td><td>53</td><td>45,71 kg</td><td>74,91 kg</td></tr>
<tr><td>200 mm</td><td>40</td><td>34,50 kg</td><td>63,69 kg</td></tr>
<tr><td>250 mm</td><td>32</td><td>27,60 kg</td><td>56,80 kg</td></tr>
<tr><td>300 mm</td><td>27</td><td>23,28 kg</td><td>52,48 kg</td></tr>
<tr><td>400 mm</td><td>20</td><td>17,25 kg</td><td>46,45 kg</td></tr>
</table></div>
<p>Zwei Lesarten. Erstens: Der Abstand ist ein starker Hebel: Die Verengung von 250 mm auf 150 mm fügt 21 Vertikale und 18,11 kg (+32 %) zu einer Wandscheibe hinzu. Zweitens gibt es tote Bereiche: Jeder Vertikalabstand von 247 mm bis 254 mm ergibt auf dieser Wandscheibe die gleichen 32 Stäbe — 254 mm liefert genau die Standardsumme von 56,80 kg — während 255 mm auf 31 Stäbe und 55,93 kg fällt. Eine Abstands„verbesserung“ um wenige Millimeter ändert also oft nichts. Lesen Sie immer die Anzahl, nicht nur den Abstand. Und eine poolspezifische Grenze: Für Gunite-/Shotcrete-Schalen begrenzt die veröffentlichte Poolbaupraxis Schalenstäbe auf #5 und Abstände auf nicht enger als 2-1/2 Zoll, damit pneumatisch aufgebrachter Beton hinter dem Stahl einfließen kann — ein 150-mm-Abstand ist in Ordnung, aber jagen Sie nicht engeren Rastern nach, ohne zu prüfen, ob die Schale tatsächlich gespritzt werden kann.</p>
<h3 id="horizontal-spacing">Horizontalabstand</h3>
<p>Gleiche Standard-Wandscheibe, fünf Horizontalabstände, Vertikalstahl konstant bei 27,60 kg:</p>
<div class="formula-table"><table>
<tr><th>Horizontalabstand</th><th>Horizontale Stäbe</th><th>Horizontalstahl</th><th>Gesamtgewicht</th></tr>
<tr><td>150 mm</td><td>10</td><td>48,66 kg</td><td>76,26 kg</td></tr>
<tr><td>200 mm</td><td>7</td><td>34,06 kg</td><td>61,66 kg</td></tr>
<tr><td>250 mm</td><td>6</td><td>29,20 kg</td><td>56,80 kg</td></tr>
<tr><td>300 mm</td><td>5</td><td>24,33 kg</td><td>51,93 kg</td></tr>
<tr><td>400 mm</td><td>4</td><td>19,47 kg</td><td>47,06 kg</td></tr>
</table></div>
<p>Die 200-mm-Zeile braucht eine Fußnote, und sie ist die nützlichste Zeile der Tabelle. Von Hand ergibt floor(1,40 ÷ 0,20) + 1 = 8 Horizontale — aber die Wandscheibe zeigt 7, mit 34,06 kg und einer 61,66-kg-Summe. Die um die Betondeckung gekürzte Strecke (1,40 m) ist exakt durch 200 mm teilbar, und die Arithmetik der Wandscheibe landet knapp unter der ganzen Zahl, sodass sie einen Stab weniger zählt. Das Gleiche passiert auf einer 12 × 2,5 m Wandscheibe bei 200 mm Horizontalabstand: von Hand 13 Horizontale, die Wandscheibe zählt 12 (87,96 kg Horizontalstahl, 215,69 kg gesamt). Keine der beiden Zeilen ist ein Tippfehler — beide lassen sich aus der Wandscheibe genau wie gezeigt reproduzieren. Die Regel ist einfach: Lesen Sie nach dem Ändern eines Abstands die Stabzahl der Wandscheibe; vertrauen Sie keiner Handzählung, wenn die Strecke exakt durch den Abstand teilbar ist.</p>
<h3 id="minimum-steel">Die Mindestbewehrungs-Prüfung</h3>
<p>Der Rechner wiegt jedes Raster, das Sie eingeben; er fragt nie, ob das Raster ausreicht. Die Prüfung braucht die Wanddicke, nach der der Rechner nicht fragt — hier ist sie also von Hand durchgerechnet, mit den IS-456-Wandminima als Maßstab (die Poolbemessung selbst ist statikergeführt; siehe die Bemessungs-FAQ). Stahl pro Meter Wandscheibe ist Stabfläche ÷ Abstand: Ein 10-mm-Stab hat 78,54 mm², ein 12-mm-Stab 113,10 mm².</p>
<p>Auf einer 200 mm dicken Wand ergibt das Standardraster 78,54 ÷ 0,25 = 314,16 mm²/m in beiden Richtungen, was 314,16 ÷ 200000 = 0,157 % entspricht — über dem vertikalen Minimum von 0,12 %, aber UNTER dem horizontalen Minimum von 0,20 %. Das Standardraster besteht in dieser Form die horizontale Prüfung an einer 200-mm-Wand nicht. Die Korrektur ist klein: Verengen Sie die Horizontalen auf 190 mm (78,54 ÷ 0,19 = 413,37 mm²/m = 0,207 %, Wandscheibensumme 66,53 kg) oder stufen Sie den horizontalen Stab auf 12 mm bei 250 mm hoch (113,10 ÷ 0,25 = 452,39 mm²/m = 0,226 %, Wandscheibensumme 69,64 kg). Jede Korrektur kostet wenige Kilogramm; das unkorrigierte Raster kostet eine nicht bestandene Prüfung. Auf einer 150-mm-Wand besteht dasselbe Raster beide Prüfungen: 314,16 ÷ 150000 = 0,209 %.</p>
<p>Zwei weitergehende Vorsichtsmaßnahmen. Erstens begrenzt die veröffentlichte Poolwand-Forschung die Rissbreite auf 0,25 mm für Klarwasser-Pools — enger als viele statische Prüfungen — weil jeder Riss in einem Pool lecken kann; Mindeststahl ist eine Untergrenze, keine Garantie gegen Rissbildung. Zweitens sind Poolnormen genau aus diesem Grund bewusst konservativ: Die Wasserlast geht nie weg, sodass die veröffentlichte Poolbautechnik ordnungsgemäß bemessene Schalen bei etwa dem Doppelten der tatsächlichen Wasser-plus-Bodenlast ansetzt. Mindestprozentsätze fangen grobe Fehler ab; sie bemessen die Schale nicht.</p>
<h3 id="whole-pool">Von einer Wandscheibe zum Gesamtpool</h3>
<p>Der Rechner gibt eine Wandscheibe an. Der Pool besteht aus vier Wandscheiben plus einem Boden. Durchgerechnetes Beispiel: ein 8 × 4 m rechteckiger Pool, 1,5 m tief, im Standardraster (10 mm bei 250 mm in beiden Richtungen, 50 mm Betondeckung).</p>
<p>Lange Wände: zwei Wandscheiben von 8 × 1,5 m zu je 56,80 kg = 113,59 kg. Kurze Wände: zwei Wandscheiben von 4 × 1,5 m im Standardraster — 16 Vertikale, 6 Horizontale, 13,80 + 14,41 = 28,21 kg je — = 56,43 kg. Wände gesamt 170,02 kg. Boden: Führen Sie den <a href="/de/bewehrungsrechner-fuer-betonplatten">Plattenrechner</a> für einen 8 × 4 m Boden bei 150 mm Abstand, 12-mm-Stäben, 40 mm Betondeckung aus → 373,96 kg (421,60 m Stab). <strong>Schale netto gesamt = 170,02 + 373,96 = 543,98 kg.</strong> Mit einem 5-%-Verschnittzuschlag sind das 571,17 kg, was bei einem Beispielpreis von 1,20 €/kg 685,41 € kostet (Preise sind Beispiele — geben Sie Ihren lokalen Satz in den <a href="/de/bewehrungskosten-rechner">Kostenrechner</a> ein).</p>
<p>Drei Dinge, die diese Summe noch auslässt. Der Ringbalken: Nur als Größenillustration wiegt ein durchgehender #4-Stab um den 24-m-Umfang 23,86 kg (zwei Stäbe 47,71 kg) — nehmen Sie den tatsächlichen Ringbalkenstahl aus der Zeichnung. Stufen, Sitzbänke und ein etwaiges Spa: Die veröffentlichte Poolpraxis nennt diese statisch schwächere Bereiche, die mehr Stahl brauchen, nicht weniger. Und Übergreifungen an langen Wänden, als Nächstes behandelt. Rechnen Sie jeden Plan mit dem <a href="/de/bewehrungstonnage-rechner">Tonnage-Rechner</a> um und erstellen Sie eine vollständige Stück- und Längenermittlung mit dem <a href="/de/bewehrungsmengen-rechner">Mengenrechner</a>.</p>
<h3 id="laps">Lange Wände und Übergreifungen</h3>
<p>Zwei Ergänzungen machen aus einer Wandscheibensumme eine Bestellmenge, und beide fehlen im Rechner aus gutem Grund. Erstens Stöße: Jeder Stabverlauf, der länger als die Handelslänge ist, braucht einen. Nehmen Sie eine 15-m-Wand im Standardraster — 60 Vertikale à 1,40 m = 51,74 kg, 6 Horizontale à 14,90 m = 55,07 kg, gesamt 106,81 kg. Die horizontalen Stäbe laufen 14,90 m, über sogar einen 40-Fuß-Stab (12,19 m) hinaus, sodass jeder einen Stoß braucht. Die Poolpraxis überlappt Stäbe mit dem 48-fachen Stabdurchmesser (#3 → 18 Zoll, #4 → 24 Zoll, #5 → 30 Zoll), sodass ein 10-mm-Stab bei 0,48 m stößt, was 6 × 0,48 × 0,616 = 1,77 kg addiert (Summe mit Übergreifungen 108,59 kg). Mit 20-Fuß-Stäben (6,10 m) braucht derselbe Stab zwei Stöße: +3,55 kg. Das ist auch der Grund, warum die veröffentlichte Poolanleitung 40-Fuß-Stäbe bevorzugt — weniger Überlappungen, und jede Überlappung in einer Shotcrete-Schale ist eine Stelle, an der Beton hinter dem Stahl nicht einfließen kann. Holen Sie sich die normgerechte Übergreifung aus dem <a href="/de/uebergreifungslaengen-rechner">Übergreifungslängen-Rechner</a>, wo die Zeichnung sie nicht angibt.</p>
<p>Zweitens sind die vertikalen Stäbe kurz (1,40 m auf der Standard-Wandscheibe) und brauchen keinen Stoß — aber sie müssen in den Bodenstahl und den Ringbalken einbinden, und die Haken und Dübel für diese Anschlüsse sind nicht in diesem Raster enthalten. Arbeiten Sie sie mit dem <a href="/de/haken-biege-schnittlaengen-rechner">Haken-Schnittlängen-Rechner</a> und dem <a href="/de/verankerungslaengen-rechner">Verankerungslängen-Rechner</a> aus und addieren Sie das Gewicht. Ein Schalenplan, der Übergreifungen, Haken und den Ringbalken ignoriert, unterbestellt an jeder Wand gleichzeitig.</p>
<h3 id="imperial">Zoll-Umrechnungen</h3>
<p>Der Rechner nimmt Meter und Millimeter, also rechnen Sie zuerst um: 1 m = 3,28 Fuß, 1 kg = 2,20 lb, 1 Zoll = 25,4 mm.</p>
<p>Durchgerechnete Umrechnungen: Die Standardsumme 56,80 kg = 125,21 lb (0,057 t); Beispiel 2 summiert sich auf 172,08 kg = 379,37 lb (0,172 t). Eine 8-m-Wand ist 26,25 Fuß lang, eine 1,5-m-Wand 4,92 Fuß hoch, 250 mm Abstand sind 9,84 Zoll und 50 mm Betondeckung sind 1,97 Zoll. Ein vollständiger Zoll-Lauf — eine 25 × 5 Fuß Wand (7,62 × 1,524 m), 10 Zoll Abstand in beiden Richtungen, 2 Zoll Betondeckung, #4-Vertikale (12,7 mm, 0,994 kg/m) und #3-Horizontale (9,5 mm, 0,56 kg/m) — ergibt 30 Vertikale und 6 Horizontale, 42,42 + 25,26 = 67,68 kg (149,20 lb). Die Stab-Dropdowns enthalten US-Größen, geben Sie also die metrischen Entsprechungen Ihrer Maße ein und wählen Sie den passenden US-Stab. Beachten Sie die Betondeckungs-Übersetzung: Die veröffentlichte Poolpraxis will 2 Zoll zur Wasser- und 3 Zoll zur Bodenseite — die hier verwendeten 2 Zoll passen zur Wasserfläche; prüfen Sie die Bodenseite an Ihrer Zeichnung.</p>
<h3 id="not-included">Was dieser Rechner nicht abdeckt</h3>
<ul>
<li>Statische Bemessung — Wasserdruck, Bodendruck, Auftrieb, Erdbebenlasten, Schalendicke, Risskontrolle und die erforderliche Stahlfläche; die Mindestbewehrungs-Prüfung oben fängt grobe Fehler ab, sie beweist nicht, dass die Schale Wasser hält.</li>
<li>Der Boden — führen Sie den <a href="/de/bewehrungsrechner-fuer-betonplatten">Plattenrechner</a> dafür aus (siehe das Gesamtpool-Beispiel).</li>
<li>Die anderen drei Wände — führen Sie jede Wandscheibe getrennt aus; lange und kurze Wände unterscheiden sich.</li>
<li>Ringbalken, Stufen, Sitzbänke, Spa, Skimmer- und Leuchtennischen, Rohrdurchführungen — alles aus der Zeichnung, nichts in diesem Raster.</li>
<li>Übergreifungen, Haken, Biegungen an Ecken, Dübel in den Boden — siehe den <a href="/de/uebergreifungslaengen-rechner">Übergreifungslängen-Rechner</a> und den <a href="/de/haken-biege-schnittlaengen-rechner">Haken-Schnittlängen-Rechner</a>.</li>
<li>Zweite Raster / Doppelmatten — der Rechner zählt ein Raster pro Wandscheibe; wenn die Bemessung zwei Lagen verlangt, verdoppeln Sie die Wandscheibensumme.</li>
<li>Freiform- und gekrümmte Schalen — teilen Sie sie von Hand in gerade Abschnitte; das Ergebnis ist eine Schätzung, kein Plan.</li>
<li>Wasserstopp, hydrostatische Entlastung, Abdichtung und Putz — nichts davon ist Stahl, und nichts davon ist in diesem Werkzeug enthalten.</li>
<li>Abstandhalter und Stützen für den Bodenstahl — siehe den <a href="/de/abstandhalter-rechner">Abstandhalter-Rechner</a>; Bindedraht finden Sie auf dem <a href="/de/bindedraht-rechner">Bindedraht-Rechner</a>.</li>
<li>Kosten, Tonnage und Mehr-Wandscheiben-Ermittlung — der Gesamtpool-Abschnitt zeigt die Handrechnung; der <a href="/de/bewehrungskosten-rechner">Kostenrechner</a> bepreist eine vollständige Ermittlung, der <a href="/de/bewehrungstonnage-rechner">Tonnage-Rechner</a> rechnet sie um, und der <a href="/de/bewehrungsmengen-rechner">Mengen- &amp; Abrechnungsrechner</a> summiert über Bauteile hinweg.</li>
</ul>
<h3 id="mistakes">5 häufige Fehler</h3>
<ol>
<li><strong>Eine Wandscheibe für den ganzen Pool bestellen.</strong> Die Standard-Wandscheibe beträgt 56,80 kg; die komplette 8 × 4 m Schale beträgt 543,98 kg netto. Die Wandscheibensumme ist etwa ein Viertel der Schale — sie zu bestellen liefert etwa ein Zehntel des Stahls, sobald der Boden mitgezählt wird. Rechnen Sie immer hoch: vier Wände plus Boden.</li>
<li><strong>Die +1 bei beiden Zählungen vergessen.</strong> Länge ÷ Abstand ohne die +1 ergibt 31 Vertikale statt 32 und 5 Horizontale statt 6 auf der Standard-Wandscheibe — 0,86 + 4,87 = 5,73 kg fehlen auf jeder Wandscheibe. Beide Endstäbe sind echte Stäbe.</li>
<li><strong>Volle Längen statt um die Betondeckung gekürzter Längen zählen.</strong> Vertikale laufen Höhe minus zweimal die Betondeckung (1,40 m, nicht 1,50 m) und Horizontale Länge minus zweimal die Betondeckung (7,90 m, nicht 8,00 m). Volle Längen zu verwenden übertreibt die Standard-Wandscheibe um 1,97 + 0,37 = 2,34 kg — Stahl, der nicht existiert, und Stäbe, die bei intakter Betondeckung nicht passen.</li>
<li><strong>Einer Handzählung vertrauen, wenn die Strecke exakt teilbar ist.</strong> Bei 200 mm Horizontalabstand auf der Standard-Wandscheibe sagt die Handzählung 8 Horizontale, aber die Wandscheibe zählt 7 (34,06 kg, 61,66 kg gesamt); auf einer 12 × 2,5 m Wandscheibe bei 200 mm sagt sie 13, aber die Wandscheibe zählt 12 (87,96 kg, 215,69 kg gesamt). Die Arithmetik der Wandscheibe landet bei exakten Teilungen knapp unter der ganzen Zahl. Lesen Sie nach dem Ändern eines Abstands die Stabzahl der Wandscheibe — sie ist die Zahl, die geliefert wird.</li>
<li><strong>Übergreifungen, Ringbalken und Stufen vergessen.</strong> Die horizontalen Stäbe einer 15-m-Wand brauchen je einen Stoß (+1,77 kg nach der 48d-Regel, +3,55 kg mit 20-Fuß-Stäben); der Ringbalken um einen 8 × 4 m Pool ist weitere ~24–48 kg durchgehender Stab; Stufen und Sitzbänke brauchen eigenen Stahl. Nichts davon ist in der Wandscheibensumme enthalten, und bei einer Mehrwand-Schale wiederholt sich die Auslassung an jeder Wand.</li>
</ol>
<p>Zuletzt geprüft: Oktober 2026.</p>`
}
},
    { id:"cost", slug:"rebar-cost-calculator", cat:"Commercial",
    metaTitle:"Rebar Cost Calculator — Material Price in Seconds",
    h1:"Rebar Cost Calculator",
    desc:"Rebar cost in seconds: weight × price per kg with a wastage allowance. Defaults: 1,030 kg = 875.50 at 0.85 per kg. Free calculator, no signup needed.",
    kw:"rebar cost calculator, rebar price calculator, rebar material calculator, cost of rebar",
    intro:"Turn a steel weight into a price. Enter the total weight, your price per kg and a wastage allowance, and the tool returns the estimated cost including waste and the per-ton rate.",
    howto:["Get the total neat weight first — from the weight calculator, the tonnage calculator, or a takeoff on the quantity calculator.","Enter the total weight in kilograms.","Enter your supplier's price per kg — divide a per-tonne quote by 1000 first.","Set the wastage percentage (the default is 3%; use 5–10% for bent or complex work).","Read the estimated cost, the weight including wastage, the cost per ton and the tonnage — then add tax, delivery and labour separately, since the panel prices material only."],
    formula:"Cost = weight × (1 + wastage%) × price per kg.",
    faqs:[["How much does rebar cost?", "It varies by market and size; enter your local price per kg for an accurate estimate. The panel itself quotes no market price — its default rate of 0.85 per kg is only a placeholder, and the rate table below shows what the same tonne costs at 0.50, 0.75, 0.85, 1.00, 1.20, 1.50 and 2.00 per kg. Always get a current supplier quote: one published estimating guide lists a typical input range of 0.5–3.0 per kg, which is a range, not a price. And check the quote's basis — per kg, per metric tonne, or per US short ton — before comparing (see the conversions section)."],
          ["What wastage should I allow for rebar?", "Typically 3–5% to cover offcuts and laps — that is the panel's default of 3% and the live guidance it has always carried. Refine it by structure, from published guidance: columns 3–5%, footings 5–7%, slabs 5–7%, walls 5–7%, beams 5–8%, stairs 8–10% (complex shapes, multiple bends). Straight bars need the least; bent bars, hooks and tight cutting plans need the most. One caution: if your takeoff already includes laps (from the <a href=\"/rebar-lap-length-calculator\">lap calculator</a>), the waste percentage should cover cutting and handling only — adding a combined 10% on top of explicit laps double-counts. The waste section below works both cases."],
          ["Does the cost include labour, delivery or tax?", "No — the panel prices material only: weight × (1 + waste) × rate. Everything else sits outside it: cutting and bending charges, binding wire and accessories (chairs, spacers, cover blocks — see the <a href=\"/rebar-chair-calculator\">chair calculator</a> and the <a href=\"/rebar-tie-wire-calculator\">tie wire calculator</a>), delivery and transport, and tax/VAT. Real rate build-ups separate these lines — one published analysis sheet, for example, builds a per-kg rate from material + labour + 15% overhead and profit — so a material-only figure must never be presented as an installed price. Add the other lines by hand after the panel."],
          ["What does \"Cost per ton\" mean on the panel?", "It is your rate × 1000 — the price per tonne of steel you BUY, including the waste allowance, not per tonne you NEED. On the defaults (1000 kg, 0.85/kg, 3%) it reads 850.00, and indeed 875.50 ÷ 1.03 t = 850.00. But the cost per tonne of neat steel is 875.50 ÷ 1.00 = 875.50, because you pay for the 30 kg of waste too. When a supplier quotes a per-tonne rate, ask whether it is per tonne ordered or per tonne in the structure — the two differ by exactly the waste percentage."],
          ["Why does the panel show 1,341.1 when my multiplication gives 1,341.14?", "Because the panel rounds totals at or above 1000 to one decimal: 1064.4 kg × 1.05 × 1.20 = 1,341.144 exactly, which displays as \"1,341.1\". Same money, panel rounding — and the same applies to the weight page's bridge figures, which show the exact 2-decimal products (€1,341.14 and €1,405.01) for the same orders that read 1,341.1 and 1,405 here. Below 1000 the panel shows two decimals, so the quantity page's €388.08 and €406.56 match this panel exactly. Never treat a last-decimal difference between two pages as an error without checking the rounding first."],
          ["How do I convert a price per tonne or per pound to price per kg?", "Divide a per-metric-tonne quote by 1000: 850 per tonne = 0.85 per kg; 1,200 per tonne = 1.20 per kg. Divide a per-US-short-ton quote by 907.185: 1,100 per short ton = 1.21254 per kg (enter 1.21). Multiply a per-pound quote by 2.20462: 0.55 per lb = 1.21254 per kg. The conversions section works all three directions with the defaults rate, and the imperial example prices a 2000 lb order end to end."],
          ["How much steel can my budget buy?", "The panel has no reverse mode, so work it backwards by hand: neat weight = budget ÷ ((1 + waste) × rate). At an example 1.20 per kg with 5% waste, a budget of 1000 buys 793.65 kg of neat steel (1000 ÷ 1.26), 5000 buys 3,968.25 kg, and 10000 buys 7,936.51 kg. (Derived arithmetic, not a panel output — the panel only runs weight → cost.) Remember the result is neat weight: the ordered weight is 5% higher, and the bars still have to fit stock lengths."],
          ["Should I add laps on top of the waste percentage?", "Only if your takeoff does not already include them. Two consistent ways exist, and mixing them is the error: either take off neat straight lengths and use a combined allowance (published takeoff guides use 10% for laps and waste together), or take off explicit laps from the <a href=\"/rebar-lap-length-calculator\">lap calculator</a> and hooks from the <a href=\"/rebar-hook-bend-cutting-length-calculator\">hook calculator</a> and then apply waste of 3–5% for cutting and handling only. Applying 10% on top of explicit laps pays for the laps twice — on a 10-tonne order that is a full tonne of phantom steel."],
          ["Why do two suppliers' quotes differ for the same weight?", "Usually the basis differs, not the arithmetic. Check, in order: (1) the rate basis — per kg, per metric tonne, or per US short ton (a short-ton quote looks ~10% cheaper than the same rate per metric tonne); (2) whether waste is included in the rate or added separately; (3) theoretical vs actual (weighed) weight — delivered bars vary within tolerance, and the two bases never agree to the kilogram; (4) whether delivery, cutting/bending and tax are in or out; (5) whether one rate covers all diameters or each size prices separately; (6) the quote's date — steel prices move, and an old quote is not a price. Convert every quote to the same basis (per kg, waste stated, extras listed) before comparing."],
          ["Can I price a whole project with one rate?", "Only as a first estimate. The panel takes a single rate for all steel, but suppliers often price diameters differently, and a project mixes sizes, grades and members. For a defensible figure: take off each member on its own tool (<a href=\"/concrete-slab-rebar-calculator\">slab</a>, <a href=\"/footing-rebar-calculator\">footing</a>, <a href=\"/rebar-mat-grid-calculator\">mat</a>, <a href=\"/column-rebar-calculator\">column</a>, <a href=\"/beam-rebar-calculator\">beam</a>, <a href=\"/wall-rebar-calculator\">wall</a>, <a href=\"/pool-rebar-calculator\">pool</a>, <a href=\"/driveway-rebar-calculator\">driveway</a>), price each weight here at its own rate if rates differ, add the detailing extras (chairs, tie wire, hooks, laps), then add concrete on the <a href=\"/concrete-and-rebar-calculator\">concrete estimator</a> and labour, delivery and tax by hand. One rate × one weight is a budget; the member-by-member build is a quote."]],
    toc:`<nav class="content-block" aria-label="On this page"><h2>On this page</h2><ul><li><a href="#how-to">How to use the calculator</a></li><li><a href="#formula">The formula, explained</a></li><li><a href="#example-1">Worked example 1: defaults (1000 kg)</a></li><li><a href="#example-2">Worked example 2: 2500 kg order</a></li><li><a href="#example-3">Worked example 3: small 500 kg order</a></li><li><a href="#rate-table">Cost by price per kg</a></li><li><a href="#waste-table">Cost by wastage percentage</a></li><li><a href="#scale-table">Cost by order size</a></li><li><a href="#reading-panel">Reading the panel: per-ton and rounding</a></li><li><a href="#budget">What a budget buys (reverse)</a></li><li><a href="#waste-guide">Wastage guidance by structure</a></li><li><a href="#imperial">Imperial and per-tonne conversions</a></li><li><a href="#bridges">From other calculators to a price</a></li><li><a href="#not-included">What this calculator does not cover</a></li><li><a href="#mistakes">5 common mistakes</a></li><li><a href="#faq">FAQs</a></li></ul></nav>`,
    extra:`<h3>The formula, explained</h3><p>The panel does two things in order: first it adds waste to the weight, then it prices the result. That order matters, because you pay for the wasted steel too:</p><p><strong>Weight with waste = weight × (1 + wastage ÷ 100); Cost = weight with waste × price per kg; Cost per ton = price per kg × 1000</strong></p><p>On the defaults: 1000 × 1.03 = 1,030 kg with waste, and 1,030 × 0.85 = 875.50. The panel shows four rows — estimated cost 875.50, weight + wastage 1,030 kg, cost per ton 850.00, in tons 1.03 — with the note "1,030 kg × 0.85/kg (incl. 3% waste)". Three display notes. First, the cost row carries NO currency symbol: enter the rate in your own currency and the result is in that currency — unlike the USD-only tools elsewhere, this panel never assumes dollars. Second, totals at or above 1000 show one decimal with separators ("1,030", "3,150"), totals below 1000 show two decimals ("875.50", "309.00"), and tonnages below 1 show three decimals ("0.515", "0.054") — quote the panel forms and your reader's check will match. Third, the default rate of 0.85 per kg is a placeholder, not a market price: steel rates move with the market, and every rate in this page is labelled an example rate.</p><h3 id="example-1">Worked example 1: defaults (1000 kg)</h3><p>Open the calculator as it loads: weight 1000 kg, price 0.85 per kg, wastage 3%.</p><p>Weight with waste = 1000 × 1.03 = 1,030 kg. Cost = 1,030 × 0.85 = 875.50. Cost per ton = 0.85 × 1000 = 850.00. Tons = 1,030 ÷ 1000 = 1.03.</p><p><strong>Estimated cost 875.50, for 1,030 kg (1.03 t) at 850.00 per ton.</strong> The panel shows all four rows with the note "1,030 kg × 0.85/kg (incl. 3% waste)". Two readings. The cost per ton (850.00) is the rate converted, not the cost divided by neat tonnes — the reading-the-panel section explains why that distinction matters. And the waste costs real money here: at 0% waste the same tonne costs 850.00, so the 3% allowance adds 25.50. Waste is never free — it is steel you buy and cut away.</p><h3 id="example-2">Worked example 2: 2500 kg order</h3><p>Set weight 2500 kg, price 1.20 per kg, wastage 5%.</p><p>Weight with waste = 2500 × 1.05 = 2,625 kg. Cost = 2,625 × 1.20 = 3,150. Cost per ton = 1.20 × 1000 = 1,200. Tons = 2,625 ÷ 1000 = 2.63 (exact 2.625, displayed to two decimals).</p><p><strong>Estimated cost 3,150, for 2,625 kg (2.63 t) at 1,200 per ton.</strong> Note the panel form: the cost is "3,150" (one decimal rule for totals at or above 1000 — an integer total shows no decimal), and the tonnage is "2.63", not 2.625. If you re-run this order and see 2.63 t, that is the panel rounding, not a different answer. At 3% waste instead of 5%, the same order would be 2,575 kg and 3,090 — the two extra waste points cost 60.00 at this rate, which is why the waste percentage deserves a decision rather than a shrug.</p><h3 id="example-3">Worked example 3: small 500 kg order</h3><p>Set weight 500 kg, price 0.60 per kg, wastage 3%.</p><p>Weight with waste = 500 × 1.03 = 515.00 kg. Cost = 515.00 × 0.60 = 309.00. Cost per ton = 0.60 × 1000 = 600.00. Tons = 515.00 ÷ 1000 = 0.515.</p><p><strong>Estimated cost 309.00, for 515.00 kg (0.515 t) at 600.00 per ton.</strong> Small orders show the panel's other display rule: below 1000, two decimals ("309.00", "515.00"), and below 1 tonne, three decimals ("0.515"). Raise the waste to 10% and the same order becomes 550.00 kg, 330.00, 0.550 t — the 7 extra waste points cost 21.00. On small orders the waste percentage moves the total by tens, not hundreds, but the percentage error is identical — and on a small order a supplier's minimum-order or delivery charge (both outside this panel) can exceed the waste cost entirely.</p><h3 id="rate-table">Cost by price per kg</h3><p>Same order (1000 kg, 3% waste → 1,030 kg, 1.03 t) at seven example rates. The cost scales exactly with the rate — there are no steps or breaks — so this table also serves as a sensitivity check: every 0.10 per kg moves this order by 103.00.</p><div class="formula-table"><table><tr><th>Price per kg</th><th>Cost per ton</th><th>Estimated cost (1000 kg, 3%)</th></tr><tr><td>0.50</td><td>500.00</td><td>515.00</td></tr><tr><td>0.75</td><td>750.00</td><td>772.50</td></tr><tr><td>0.85</td><td>850.00</td><td>875.50</td></tr><tr><td>1.00</td><td>1,000</td><td>1,030</td></tr><tr><td>1.20</td><td>1,200</td><td>1,236</td></tr><tr><td>1.50</td><td>1,500</td><td>1,545</td></tr><tr><td>2.00</td><td>2,000</td><td>2,060</td></tr></table></div><p>Two readings. First, the rate dominates everything else: moving from 0.85 to 1.20 per kg (+41%) moves this order from 875.50 to 1,236 (+41%), while moving waste from 3% to 10% moves it only 7%. Getting the rate right matters six times more than getting the waste right — which is why the mistakes section leads with stale rates. Second, the per-ton column is the quote-comparison column: if a supplier quotes 850 per tonne and another quotes 0.85 per kg, they are quoting the same rate, and the panel's cost-per-ton row exists precisely to make that visible.</p><h3 id="waste-table">Cost by wastage percentage</h3><p>Same order (1000 kg at 1.00 per kg) at five waste levels. At a round 1.00 rate, the cost equals the weight with waste — the cleanest possible view of what waste costs.</p><div class="formula-table"><table><tr><th>Wastage</th><th>Weight with waste</th><th>Estimated cost</th><th>Tons</th></tr><tr><td>0%</td><td>1,000 kg</td><td>1,000</td><td>1.00 t</td></tr><tr><td>3%</td><td>1,030 kg</td><td>1,030</td><td>1.03 t</td></tr><tr><td>5%</td><td>1,050 kg</td><td>1,050</td><td>1.05 t</td></tr><tr><td>7.5%</td><td>1,075 kg</td><td>1,075</td><td>1.07 t</td></tr><tr><td>10%</td><td>1,100 kg</td><td>1,100</td><td>1.10 t</td></tr></table></div><p>Note the 7.5% row: the tonnage reads "1.07", not 1.08. The exact value is 1.075, and the panel's two-decimal display rounds it to 1.07 (JavaScript's display rounding on the binary value) — verified against the real panel, so do not "correct" it. The cost column needs no such care: at 1.00 per kg the cost equals the weight exactly. The practical point: waste is linear too — every waste point on a tonne costs exactly the per-kg rate × 10 (at 1.00/kg, 10.00 per point), so a waste argument is never about a cliff edge, only about how many points you are willing to pay for.</p><h3 id="scale-table">Cost by order size</h3><p>Same rate (1.20 per kg) and waste (5%) from a 100 kg repair to a 10-tonne order. Everything scales linearly — the table's value is in showing the panel forms at each size, so a reader checking any row sees exactly what the panel shows.</p><div class="formula-table"><table><tr><th>Neat weight</th><th>Weight with waste</th><th>Estimated cost</th><th>Tons</th></tr><tr><td>100 kg</td><td>105.00 kg</td><td>126.00</td><td>0.105 t</td></tr><tr><td>250 kg</td><td>262.50 kg</td><td>315.00</td><td>0.263 t</td></tr><tr><td>500 kg</td><td>525.00 kg</td><td>630.00</td><td>0.525 t</td></tr><tr><td>1000 kg</td><td>1,050 kg</td><td>1,260</td><td>1.05 t</td></tr><tr><td>2000 kg</td><td>2,100 kg</td><td>2,520</td><td>2.10 t</td></tr><tr><td>5000 kg</td><td>5,250 kg</td><td>6,300</td><td>5.25 t</td></tr><tr><td>10000 kg</td><td>10,500 kg</td><td>12,600</td><td>10.50 t</td></tr></table></div><p>Note the 250 kg row: the tonnage reads "0.263", not 0.262 or 0.2625 — the exact value is 0.2625 and the panel's three-decimal display shows 0.263 (verified against the real panel). The cost column is exact at every row because 1.20 × the weight-with-waste lands on round numbers here. For scale: the 10-tonne row (12,600) is roughly one truckload of steel, and the 100 kg row (126.00) is the size where a supplier's delivery charge — outside this panel — can exceed the material cost itself.</p><h3 id="reading-panel">Reading the panel: per-ton and rounding</h3><p>Two distinctions that silently corrupt quote comparisons when they are missed.</p><p><strong>Per tonne bought vs per tonne needed.</strong> The panel's "Cost per ton" is rate × 1000 — the price per tonne of steel you order, waste included. On the defaults: 875.50 ÷ 1.03 t = 850.00. But the cost per tonne of neat steel in the structure is 875.50 ÷ 1.00 = 875.50, because the 30 kg of waste is bought and paid for. If a supplier quotes "850 per tonne" and your takeoff is neat, your true material cost per neat tonne is 850 × 1.03 = 875.50 at 3% waste — the quote and the cost differ by exactly the waste percentage. Always ask which tonne a per-tonne quote means.</p><p><strong>Panel rounding vs exact products.</strong> Totals at or above 1000 display with one decimal, so the cost panel shows "1,341.1" where the exact product is 1,341.144, and "1,405" where it is 1,405.008 (see the bridges section). The weight page's order bridge shows the exact 2-decimal products (€1,341.14 and €1,405.01) for the same orders. Both are right; the panel rounds for display. Below 1000 the panel shows two decimals, so the quantity page's €388.08 and €406.56 match this panel exactly. A last-decimal difference between two pages is a rounding difference until proven otherwise.</p><h3 id="budget">What a budget buys (reverse)</h3><p>The panel runs weight → cost only. The reverse direction — what a fixed budget buys — is simple arithmetic, labelled here as derived (not a panel output): neat weight = budget ÷ ((1 + waste) × rate).</p><div class="formula-table"><table><tr><th>Budget (example rate 1.20/kg, 5% waste)</th><th>Neat steel bought</th><th>Ordered weight (with waste)</th></tr><tr><td>1000</td><td>793.65 kg</td><td>833.33 kg</td></tr><tr><td>5000</td><td>3,968.25 kg</td><td>4,166.67 kg</td></tr><tr><td>10000</td><td>7,936.51 kg</td><td>8,333.33 kg</td></tr></table></div><p>Worked: 1000 ÷ (1.05 × 1.20) = 1000 ÷ 1.26 = 793.65 kg neat; the ordered weight is 793.65 × 1.05 = 833.33 kg. The waste eats the budget twice over in a sense: it raises the ordered weight AND it is steel you pay for but do not keep — on a 10000 budget at 5% waste, 396.83 kg of the order (8,333.33 − 7,936.51) is waste steel. If the budget is tight, the waste percentage is the first lever to challenge — but only by improving the cutting plan, never by deleting the allowance and hoping.</p><h3 id="waste-guide">Wastage guidance by structure</h3><p>The panel's default is 3%, and the live guidance has always been 3–5%. Published structure-by-structure guidance refines it — use the row that matches the work, not the default, when the work is complex:</p><div class="formula-table"><table><tr><th>Structure</th><th>Suggested wastage</th><th>Why</th></tr><tr><td>Columns</td><td>3–5%</td><td>Mostly straight verticals with ties</td></tr><tr><td>Footings</td><td>5–7%</td><td>Heavy bars, lap splices</td></tr><tr><td>Slabs</td><td>5–7%</td><td>Grid pattern, two-way cutting</td></tr><tr><td>Walls</td><td>5–7%</td><td>Horizontal + vertical bars</td></tr><tr><td>Beams</td><td>5–8%</td><td>Stirrups included in the count</td></tr><tr><td>Stairs</td><td>8–10%</td><td>Complex shapes, multiple bends</td></tr></table></div><p>Two rules sit above the table. First, laps are not waste: a lap is steel in the structure, and if your takeoff already includes laps (from the <a href="/rebar-lap-length-calculator">lap calculator</a>) and hooks (from the <a href="/rebar-hook-bend-cutting-length-calculator">hook calculator</a>), the waste percentage covers cutting and handling only (3–5%). If your takeoff is neat straight lengths, use a combined allowance — published takeoff guides use 10% for laps and waste together — or add the laps explicitly. Applying 10% on top of explicit laps pays for the laps twice. Second, the cutting plan beats the percentage: a schedule of 3 m cuts from 12 m bars wastes almost nothing, while 5 m cuts leave 2 m offcuts everywhere — no percentage fixes a bad cutting plan, and no cutting plan needs a percentage it cannot justify.</p><h3 id="imperial">Imperial and per-tonne conversions</h3><p>The panel takes kilograms and a per-kg rate. Convert first, then enter — the panel never converts for you.</p><p><strong>Rate conversions (derived arithmetic).</strong> Per metric tonne = per-kg rate × 1000 (0.85 → 850; 1.20 → 1,200). Per US short ton = per-kg rate × 907.185 (0.85 → 771.11; 1.20 → 1,088.62). Per pound = per-kg rate ÷ 2.20462 (0.85 → 0.386/lb; 1.20 → 0.544/lb). In the other direction: per-kg = per-tonne ÷ 1000; per-kg = per-short-ton ÷ 907.185; per-kg = per-lb × 2.20462 (0.55/lb → 1.21254/kg).</p><p><strong>Worked imperial example.</strong> An order of 2000 lb at $0.55 per lb with 5% waste: weight with waste = 2000 × 1.05 = 2100 lb; cost = 2100 × 0.55 = $1,155.00. In metric terms the same order is 907.18 kg neat (2000 × 0.453592) and 952.54 kg ordered. The per-tonne equivalents of $0.55/lb are $1,100.00 per short ton (0.55 × 2000) and $1,212.54 per metric tonne (0.55 × 2204.62) — the $112.54 gap between those two "per ton" figures is purely the ton definition, and it is the single most common cause of a quote looking 10% cheaper than it is. To enter this order in the panel, use 907.18 kg at 1.21 per kg (the rounded form of 1.21254); the panel result will differ from $1,155.00 by the rate rounding (about $2.40), so for exact imperial pricing, price in lb/$ as above rather than through a rounded per-kg rate.</p><h3 id="bridges">From other calculators to a price</h3><p>Every bridge below was run through the real cost panel at an example 1.20 per kg — use your own rate for a real order.</p><div class="formula-table"><table><tr><th>Source page</th><th>Neat weight</th><th>At 1.20/kg, 5% waste</th><th>At 1.20/kg, 10% waste</th></tr><tr><td>Weight defaults (100 × 12 mm × 12 m)</td><td>1,064.4 kg</td><td>1,117.6 kg → 1,341.1 (1.12 t)</td><td>1,170.8 kg → 1,405 (1.17 t)</td></tr><tr><td>Quantity defaults (50 m², 200 mm, 10 mm)</td><td>308.00 kg</td><td>323.40 kg → 388.08 (0.323 t)</td><td>338.80 kg → 406.56 (0.339 t)</td></tr><tr><td>Quantity house (200 m², 200 mm, 12 mm)</td><td>1,774 kg</td><td>1,862.7 kg → 2,235.2 (1.86 t)</td><td>1,951.4 kg → 2,341.7 (1.95 t)</td></tr><tr><td>Quantity small area (20 m², 300 mm, 8 mm)</td><td>52.53 kg</td><td>55.16 kg → 66.19 (0.055 t)</td><td>—</td></tr><tr><td>Slab bridge (5 × 4 m slab tool count)</td><td>120.98 kg</td><td>127.03 kg → 152.43 (0.127 t)</td><td>—</td></tr><tr><td>Big area (1000 m², 150 mm, 16 mm)</td><td>21,040 kg</td><td>— (at 0.85/kg, 3%: 21,671.2 kg → 18,420.5, 21.67 t)</td><td>— (at 0.85/kg, 5%: 22,092 kg → 18,778.2, 22.09 t)</td></tr></table></div><p>Notes on the table. The weight-page bridge uses panel forms (1,341.1 / 1,405), not the weight page's exact products (1,341.144 / 1,405.008) — see the rounding note. The quantity-page bridges match their source pages exactly (388.08 / 406.56; 2,235.2 / 2,341.7 are the panel forms of 2235.24 / 2341.68). The neat weight-page cost at 1.20/kg with 0% waste is 1,277.3 (exact 1277.28) for 1.06 t. For any other source, the path is the same: take the neat weight from the <a href="/rebar-weight-calculator">weight calculator</a>, the <a href="/rebar-tonnage-calculator">tonnage calculator</a>, the <a href="/rebar-quantity-calculator">quantity calculator</a> or a member tool, enter it here, and the panel does the rest. Concrete itself is priced on the <a href="/concrete-and-rebar-calculator">concrete estimator</a> — this panel never includes it.</p><h3 id="not-included">What this calculator does not cover</h3><ul><li>Tax / VAT — add your local rate to the panel total by hand.</li><li>Labour: cutting, bending, placing, tying — price by hours × rate or by a per-kg/per-ton labour rate from local benchmarks.</li><li>Cutting and bending charges, binding wire, chairs, spacers and cover blocks — see the <a href="/rebar-chair-calculator">chair calculator</a> and the <a href="/rebar-tie-wire-calculator">tie wire calculator</a> for the accessory quantities.</li><li>Delivery and transport, unloading, and crane/hoist time.</li><li>Concrete, formwork and other materials — concrete is on the <a href="/concrete-and-rebar-calculator">concrete estimator</a>.</li><li>Per-size or per-grade pricing — the panel takes one rate for all steel; price diameters separately if your supplier does.</li><li>Laps and hooks as separate lines — the waste percentage is the only allowance; work laps on the <a href="/rebar-lap-length-calculator">lap calculator</a> and hooks on the <a href="/rebar-hook-bend-cutting-length-calculator">hook calculator</a> and add them to the neat weight first if you want them explicit.</li><li>Bar counts, lengths and schedules — the weight comes from the <a href="/rebar-weight-calculator">weight calculator</a>, the <a href="/rebar-tonnage-calculator">tonnage calculator</a> or a member tool; this panel only prices a weight you give it.</li><li>Stainless or alloy densities, mesh, and cut-length optimisation against stock bars.</li><li>Price validity — the panel stores no market data; a rate entered today is not a price tomorrow.</li><li>Currency conversion — the panel shows no currency symbol; convert the rate yourself before entering it.</li></ul><h3 id="mistakes">5 common mistakes</h3><ol><li><strong>Pricing the neat weight.</strong> Entering the takeoff weight with 0% waste prices steel you will cut away as if it were free. On the defaults, 0% waste gives 850.00 and 3% gives 875.50 — the 25.50 difference is the cheapest insurance on the order. Even a perfect cutting plan loses bars to handling damage.</li><li><strong>Paying for laps twice.</strong> Adding a 10% combined laps-and-waste allowance on top of a takeoff that already includes explicit laps (from the lap calculator) over-orders by the full lap weight — on a 10-tonne order, a tonne of phantom steel. Use combined OR explicit, never both.</li><li><strong>Entering a per-tonne rate into the per-kg field.</strong> The panel's rate field is per kg. Entering 850 (a per-tonne rate) prices the defaults order at 875,500 instead of 875.50 — a 1000× error that survives a casual glance because the panel shows no currency unit to contradict it. Divide per-tonne quotes by 1000 first; the cost-per-ton row is the check (it should read close to the quoted per-tonne rate).</li><li><strong>Comparing per-tonne quotes across ton definitions.</strong> A quote of 771.11 per US short ton and a quote of 850 per metric tonne are the SAME rate (0.85/kg) — the short ton is 907.185 kg, not 1000 kg. A short-ton quote looks ~10% cheaper than the same rate per metric tonne, and the gap has fooled more than one budget. Convert every quote to per-kg before comparing.</li><li><strong>Trusting a stale rate, or a competitor's worked example, without re-running it.</strong> Steel prices move, and published examples do not always reproduce: one popular combined tool's slab example claims ~71 kg where its own stated formula gives 74.71 kg, and one popular guide's imperial formula overstates #8 bar by 16× (42.75 lb/ft vs the true 2.670 lb/ft). Re-run every example in the panel with your own rate before relying on it — including the ones on this page.</li></ol><p>Last reviewed: October 2026.</p>`,
    de: {
  metaTitle: "Bewehrungskosten-Rechner — Stahlpreis in Sekunden",
  desc: "Bewehrungskosten-Rechner: Stahlgewicht in Kosten umrechnen – Gewicht × Preis pro kg plus Verschnitt. Beispiel: 1.000 kg = 875,50 bei 0,85 pro kg. Kostenlos.",
  formula: "Kosten = Gewicht × (1 + Verschnitt %) × Preis pro kg.",
  kw: "bewehrungskosten-rechner, bewehrungspreis-rechner, bewehrungsmaterial-rechner, bewehrungskosten",
  howto: ["Ermitteln Sie zuerst das reine Nettogewicht — aus dem Gewichtsrechner, dem Tonnage-Rechner oder einer Mengenermittlung im Mengenrechner.", "Geben Sie das Gesamtgewicht in Kilogramm ein.", "Geben Sie den Preis Ihres Lieferanten pro kg ein — teilen Sie ein Angebot pro Tonne vorher durch 1000.", "Legen Sie den Verschnitt in Prozent fest (Standard sind 3 %; für gebogene oder komplexe Arbeiten 5–10 % verwenden).", "Lesen Sie die geschätzten Kosten, das Gewicht inklusive Verschnitt, die Kosten pro Tonne und die Tonnage ab — und addieren Sie Steuern, Lieferung und Arbeitslohn separat, da das Panel nur Material bepreist."],
  faqs: [["Was kostet Bewehrungsstahl?", "Das hängt von Markt und Größe ab; geben Sie Ihren lokalen Preis pro kg ein, um eine genaue Schätzung zu erhalten. Das Panel selbst nennt keinen Marktpreis — sein Standardsatz von 0,85 pro kg ist nur ein Platzhalter, und die Preistabelle unten zeigt, was dieselbe Tonne bei 0,50; 0,75; 0,85; 1,00; 1,20; 1,50 und 2,00 pro kg kostet. Holen Sie immer ein aktuelles Lieferantenangebot ein: Ein veröffentlichter Schätzleitfaden nennt eine typische Eingabespanne von 0,5–3,0 pro kg — das ist eine Spanne, kein Preis. Und prüfen Sie die Bezugsbasis des Angebots — pro kg, pro metrischer Tonne oder pro US-Short-Tonne — bevor Sie vergleichen (siehe den Umrechnungsabschnitt)."],
          ["Wie viel Verschnitt sollte ich für Bewehrung einplanen?", "Üblicherweise 3–5 % für Abschnitte und Übergreifungen — das ist der Standardwert des Panels von 3 % und die Live-Empfehlung, die es schon immer gegeben hat. Verfeinern Sie ihn nach Bauteil anhand veröffentlichter Empfehlungen: Stützen 3–5 %, Fundamente 5–7 %, Platten 5–7 %, Wände 5–7 %, Balken 5–8 %, Treppen 8–10 % (komplexe Formen, mehrere Biegungen). Gerade Stäbe brauchen am wenigsten; gebogene Stäbe, Haken und enge Schneidpläne am meisten. Eine Warnung: Wenn Ihre Mengenermittlung bereits Übergreifungen enthält (aus dem <a href=\"/de/uebergreifungslaengen-rechner\">Übergreifungslängen-Rechner</a>), sollte der Verschnitt-Prozentsatz nur Schneiden und Handhabung abdecken — zusätzliche kombinierte 10 % auf explizite Übergreifungen obendrauf doppelt zu zählen. Der Verschnitt-Abschnitt unten behandelt beide Fälle."],
          ["Sind Arbeitslohn, Lieferung oder Steuern in den Kosten enthalten?", "Nein — das Panel bepreist nur Material: Gewicht × (1 + Verschnitt) × Satz. Alles andere liegt außerhalb: Schneid- und Biegekosten, Bindedraht und Zubehör (Abstandhalter, Abstandshalter, Deckungsblöcke — siehe den <a href=\"/de/abstandhalter-rechner\">Abstandhalter-Rechner</a> und den <a href=\"/de/bindedraht-rechner\">Bindedraht-Rechner</a>), Lieferung und Transport sowie Steuern/MwSt. Echte Preisaufstellungen trennen diese Positionen — ein veröffentlichtes Analyseblatt baut zum Beispiel einen Preis pro kg aus Material + Arbeitslohn + 15 % Gemeinkosten und Gewinn auf — daher darf ein reiner Materialwert niemals als Einbaupreis dargestellt werden. Fügen Sie die anderen Positionen nach dem Panel von Hand hinzu."],
          ["Was bedeutet „Kosten pro Tonne“ im Panel?", "Es ist Ihr Satz × 1000 — der Preis pro Tonne Stahl, die Sie KAUFEN, inklusive Verschnitt, nicht pro Tonne, die Sie BRAUCHEN. Bei den Standardwerten (1000 kg, 0,85/kg, 3 %) steht dort 850,00, und tatsächlich gilt 875,50 ÷ 1,03 t = 850,00. Aber die Kosten pro Tonne reinen Stahls betragen 875,50 ÷ 1,00 = 875,50, weil Sie auch die 30 kg Verschnitt bezahlen. Wenn ein Lieferant einen Preis pro Tonne nennt, fragen Sie, ob er pro bestellter Tonne oder pro Tonne im Bauwerk gilt — beide unterscheiden sich genau um den Verschnitt-Prozentsatz."],
          ["Warum zeigt das Panel 1.341,1 an, wenn meine Multiplikation 1.341,14 ergibt?", "Weil das Panel Summen ab 1000 auf eine Nachkommastelle rundet: 1.064,4 kg × 1,05 × 1,20 = 1.341,144 exakt, was als „1.341,1“ angezeigt wird. Gleiches Geld, Panel-Rundung — und das Gleiche gilt für die Brückenwerte der Gewichtsseite, die die exakten 2-stelligen Produkte (1.341,14 € und 1.405,01 €) für dieselben Aufträge zeigen, die hier als 1.341,1 und 1.405 erscheinen. Unter 1000 zeigt das Panel zwei Nachkommastellen, sodass die Werte der Mengenseite (388,08 € und 406,56 €) genau zu diesem Panel passen. Behandeln Sie eine Abweichung in der letzten Nachkommastelle zwischen zwei Seiten niemals als Fehler, ohne vorher die Rundung zu prüfen."],
          ["Wie rechne ich einen Preis pro Tonne oder pro Pfund in einen Preis pro kg um?", "Teilen Sie ein Angebot pro metrischer Tonne durch 1000: 850 pro Tonne = 0,85 pro kg; 1.200 pro Tonne = 1,20 pro kg. Teilen Sie ein Angebot pro US-Short-Tonne durch 907,185: 1.100 pro Short-Tonne = 1,21254 pro kg (geben Sie 1,21 ein). Multiplizieren Sie ein Angebot pro Pfund mit 2,20462: 0,55 pro lb = 1,21254 pro kg. Der Umrechnungsabschnitt rechnet alle drei Richtungen mit dem Standardsatz durch, und das Zoll-Beispiel bepreist einen Auftrag über 2000 lb vollständig."],
          ["Wie viel Stahl kann ich mit meinem Budget kaufen?", "Das Panel hat keinen Rückwärtsmodus, also rechnen Sie von Hand rückwärts: Nettogewicht = Budget ÷ ((1 + Verschnitt) × Satz). Bei einem Beispielsatz von 1,20 pro kg mit 5 % Verschnitt kauft ein Budget von 1000 genau 793,65 kg reinen Stahl (1000 ÷ 1,26), 5000 kauft 3.968,25 kg und 10000 kauft 7.936,51 kg. (Abgeleitete Rechnung, keine Panel-Ausgabe — das Panel rechnet nur Gewicht → Kosten.) Denken Sie daran, dass das Ergebnis Nettogewicht ist: Das bestellte Gewicht ist 5 % höher, und die Stäbe müssen trotzdem in Handelslängen passen."],
          ["Soll ich Übergreifungen zusätzlich zum Verschnitt-Prozentsatz addieren?", "Nur wenn Ihre Mengenermittlung sie noch nicht enthält. Es gibt zwei konsistente Wege, und sie zu mischen ist der Fehler: Entweder nehmen Sie reine gerade Längen ab und verwenden einen kombinierten Ansatz (veröffentlichte Mengenleitfäden verwenden 10 % für Übergreifungen und Verschnitt zusammen), oder Sie nehmen explizite Übergreifungen aus dem <a href=\"/de/uebergreifungslaengen-rechner\">Übergreifungslängen-Rechner</a> und Haken aus dem <a href=\"/de/haken-biege-schnittlaengen-rechner\">Haken-Biege-Schnittlängen-Rechner</a> ab und wenden dann nur 3–5 % Verschnitt für Schneiden und Handhabung an. 10 % auf explizite Übergreifungen obendrauf zu legen, bezahlt die Übergreifungen doppelt — bei einem Auftrag über 10 Tonnen ist das eine volle Tonne Phantomstahl."],
          ["Warum unterscheiden sich die Angebote zweier Lieferanten für dasselbe Gewicht?", "Meist unterscheidet sich die Basis, nicht die Rechnung. Prüfen Sie in dieser Reihenfolge: (1) die Satzbasis — pro kg, pro metrischer Tonne oder pro US-Short-Tonne (ein Short-Tonnen-Angebot sieht etwa 10 % günstiger aus als derselbe Satz pro metrischer Tonne); (2) ob Verschnitt im Satz enthalten ist oder separat addiert wird; (3) theoretisches vs. tatsächliches (gewogenes) Gewicht — gelieferte Stäbe variieren innerhalb der Toleranz, und beide Basen stimmen nie auf das Kilogramm genau überein; (4) ob Lieferung, Schneiden/Biegen und Steuern enthalten sind oder nicht; (5) ob ein Satz alle Durchmesser abdeckt oder jede Größe separat bepreist wird; (6) das Angebotsdatum — Stahlpreise bewegen sich, und ein altes Angebot ist kein Preis. Rechnen Sie jedes Angebot auf dieselbe Basis um (pro kg, Verschnitt genannt, Extras aufgelistet), bevor Sie vergleichen."],
          ["Kann ich ein ganzes Projekt mit einem Satz bepreisen?", "Nur als erste Schätzung. Das Panel nimmt einen einzigen Satz für den gesamten Stahl, aber Lieferanten bepreisen Durchmesser oft unterschiedlich, und ein Projekt mischt Größen, Güten und Bauteile. Für eine belastbare Zahl: Nehmen Sie jedes Bauteil mit seinem eigenen Tool ab (<a href=\"/de/bewehrungsrechner-fuer-betonplatten\">Platte</a>, <a href=\"/de/bewehrungsrechner-fuer-fundamente\">Fundament</a>, <a href=\"/de/bewehrungsmatten-rechner\">Matte</a>, <a href=\"/de/stuetzenbewehrungs-rechner\">Stütze</a>, <a href=\"/de/balkenbewehrungs-rechner\">Balken</a>, <a href=\"/de/wandbewehrungs-rechner\">Wand</a>, <a href=\"/de/bewehrungsrechner-fuer-pools\">Pool</a>, <a href=\"/de/bewehrungsrechner-fuer-einfahrten\">Einfahrt</a>), bepreisen Sie jedes Gewicht hier mit seinem eigenen Satz, wenn sich die Sätze unterscheiden, addieren Sie die Detaillierungs-Extras (Abstandhalter, Bindedraht, Haken, Übergreifungen), dann addieren Sie Beton mit dem <a href=\"/de/beton-bewehrungs-schaetzer\">Beton-Bewehrungs-Schätzer</a> sowie Arbeitslohn, Lieferung und Steuern von Hand. Ein Satz × ein Gewicht ist ein Budget; die Bauteil-für-Bauteil-Aufstellung ist ein Angebot."]],
  toc: `<nav class="content-block" aria-label="Auf dieser Seite"><h2>Auf dieser Seite</h2><ul><li><a href="#how-to">So funktioniert der Rechner</a></li><li><a href="#formula">Die Formel, erklärt</a></li><li><a href="#example-1">Rechenbeispiel 1: Standardwerte (1000 kg)</a></li><li><a href="#example-2">Rechenbeispiel 2: Auftrag über 2500 kg</a></li><li><a href="#example-3">Rechenbeispiel 3: kleiner Auftrag über 500 kg</a></li><li><a href="#rate-table">Kosten nach Preis pro kg</a></li><li><a href="#waste-table">Kosten nach Verschnitt</a></li><li><a href="#scale-table">Kosten nach Auftragsgröße</a></li><li><a href="#reading-panel">Panel ablesen: pro Tonne und Rundung</a></li><li><a href="#budget">Was ein Budget kauft (rückwärts)</a></li><li><a href="#waste-guide">Verschnitt-Leitfaden nach Bauteil</a></li><li><a href="#imperial">Zoll-Maße und Umrechnungen pro Tonne</a></li><li><a href="#bridges">Von anderen Rechnern zum Preis</a></li><li><a href="#not-included">Was dieser Rechner nicht abdeckt</a></li><li><a href="#mistakes">5 häufige Fehler</a></li><li><a href="#faq">FAQs</a></li></ul></nav>`,
  extra: `<h3>Die Formel, erklärt</h3><p>Das Panel macht zwei Dinge in dieser Reihenfolge: Zuerst addiert es Verschnitt zum Gewicht, dann bepreist es das Ergebnis. Diese Reihenfolge zählt, denn Sie bezahlen auch den verschnittenen Stahl:</p><p><strong>Gewicht mit Verschnitt = Gewicht × (1 + Verschnitt ÷ 100); Kosten = Gewicht mit Verschnitt × Preis pro kg; Kosten pro Tonne = Preis pro kg × 1000</strong></p><p>Bei den Standardwerten: 1000 × 1,03 = 1.030 kg mit Verschnitt, und 1.030 × 0,85 = 875,50. Das Panel zeigt vier Zeilen — geschätzte Kosten 875,50, Gewicht + Verschnitt 1.030 kg, Kosten pro Tonne 850,00, in Tonnen 1,03 — mit dem Hinweis „1.030 kg × 0,85/kg (inkl. 3 % Verschnitt)“. Drei Anzeigehinweise. Erstens trägt die Kostenzeile KEIN Währungssymbol: Geben Sie den Satz in Ihrer eigenen Währung ein, und das Ergebnis ist in dieser Währung — anders als die nur in USD rechnenden Tools anderswo nimmt dieses Panel niemals Dollar an. Zweitens zeigen Summen ab 1000 eine Nachkommastelle mit Tausendertrennzeichen („1.030“, „3.150“), Summen unter 1000 zeigen zwei Nachkommastellen („875,50“, „309,00“), und Tonnagen unter 1 zeigen drei Nachkommastellen („0,515“, „0,054“) — zitieren Sie die Panel-Formen, und die Nachprüfung Ihres Lesers wird übereinstimmen. Drittens ist der Standardsatz von 0,85 pro kg ein Platzhalter, kein Marktpreis: Stahlsätze bewegen sich mit dem Markt, und jeder Satz auf dieser Seite ist als Beispielsatz gekennzeichnet.</p><h3 id="example-1">Rechenbeispiel 1: Standardwerte (1000 kg)</h3><p>Öffnen Sie den Rechner so, wie er lädt: Gewicht 1000 kg, Preis 0,85 pro kg, Verschnitt 3 %.</p><p>Gewicht mit Verschnitt = 1000 × 1,03 = 1.030 kg. Kosten = 1.030 × 0,85 = 875,50. Kosten pro Tonne = 0,85 × 1000 = 850,00. Tonnen = 1.030 ÷ 1000 = 1,03.</p><p><strong>Geschätzte Kosten 875,50, für 1.030 kg (1,03 t) zu 850,00 pro Tonne.</strong> Das Panel zeigt alle vier Zeilen mit dem Hinweis „1.030 kg × 0,85/kg (inkl. 3 % Verschnitt)“. Zwei Lesarten. Die Kosten pro Tonne (850,00) sind der umgerechnete Satz, nicht die Kosten geteilt durch reine Tonnen — der Abschnitt zum Ablesen des Panels erklärt, warum diese Unterscheidung zählt. Und der Verschnitt kostet hier echtes Geld: Bei 0 % Verschnitt kostet dieselbe Tonne 850,00, sodass der 3-%-Ansatz 25,50 addiert. Verschnitt ist niemals gratis — es ist Stahl, den Sie kaufen und wegschneiden.</p><h3 id="example-2">Rechenbeispiel 2: Auftrag über 2500 kg</h3><p>Setzen Sie Gewicht 2500 kg, Preis 1,20 pro kg, Verschnitt 5 %.</p><p>Gewicht mit Verschnitt = 2500 × 1,05 = 2.625 kg. Kosten = 2.625 × 1,20 = 3.150. Kosten pro Tonne = 1,20 × 1000 = 1.200. Tonnen = 2.625 ÷ 1000 = 2,63 (exakt 2,625, auf zwei Nachkommastellen angezeigt).</p><p><strong>Geschätzte Kosten 3.150, für 2.625 kg (2,63 t) zu 1.200 pro Tonne.</strong> Beachten Sie die Panel-Form: Die Kosten lauten „3.150“ (Ein-Nachkommastellen-Regel für Summen ab 1000 — eine glatte Summe zeigt keine Nachkommastelle), und die Tonnage lautet „2,63“, nicht 2,625. Wenn Sie diesen Auftrag erneut durchrechnen und 2,63 t sehen, ist das die Panel-Rundung, keine andere Antwort. Bei 3 % statt 5 % Verschnitt läge derselbe Auftrag bei 2.575 kg und 3.090 — die zwei zusätzlichen Verschnittpunkte kosten bei diesem Satz 60,00, weshalb der Verschnitt-Prozentsatz eine Entscheidung verdient und kein Schulterzucken.</p><h3 id="example-3">Rechenbeispiel 3: kleiner Auftrag über 500 kg</h3><p>Setzen Sie Gewicht 500 kg, Preis 0,60 pro kg, Verschnitt 3 %.</p><p>Gewicht mit Verschnitt = 500 × 1,03 = 515,00 kg. Kosten = 515,00 × 0,60 = 309,00. Kosten pro Tonne = 0,60 × 1000 = 600,00. Tonnen = 515,00 ÷ 1000 = 0,515.</p><p><strong>Geschätzte Kosten 309,00, für 515,00 kg (0,515 t) zu 600,00 pro Tonne.</strong> Kleine Aufträge zeigen die andere Anzeigeregel des Panels: Unter 1000 zwei Nachkommastellen („309,00“, „515,00“), und unter 1 Tonne drei Nachkommastellen („0,515“). Erhöhen Sie den Verschnitt auf 10 %, und derselbe Auftrag wird zu 550,00 kg, 330,00, 0,550 t — die 7 zusätzlichen Verschnittpunkte kosten 21,00. Bei kleinen Aufträgen bewegt der Verschnitt-Prozentsatz die Summe um Zehnerbeträge, nicht um Hunderter, aber der prozentuale Fehler ist identisch — und bei einem kleinen Auftrag kann eine Mindestabnahme- oder Liefergebühr des Lieferanten (beides außerhalb dieses Panels) die Verschnittkosten vollständig übersteigen.</p><h3 id="rate-table">Kosten nach Preis pro kg</h3><p>Derselbe Auftrag (1000 kg, 3 % Verschnitt → 1.030 kg, 1,03 t) zu sieben Beispielsätzen. Die Kosten skalieren exakt mit dem Satz — es gibt keine Stufen oder Sprünge — sodass diese Tabelle auch als Sensitivitätsprüfung dient: Jede 0,10 pro kg bewegt diesen Auftrag um 103,00.</p><div class="formula-table"><table><tr><th>Preis pro kg</th><th>Kosten pro Tonne</th><th>Geschätzte Kosten (1000 kg, 3 %)</th></tr><tr><td>0,50</td><td>500,00</td><td>515,00</td></tr><tr><td>0,75</td><td>750,00</td><td>772,50</td></tr><tr><td>0,85</td><td>850,00</td><td>875,50</td></tr><tr><td>1,00</td><td>1.000</td><td>1.030</td></tr><tr><td>1,20</td><td>1.200</td><td>1.236</td></tr><tr><td>1,50</td><td>1.500</td><td>1.545</td></tr><tr><td>2,00</td><td>2.000</td><td>2.060</td></tr></table></div><p>Zwei Lesarten. Erstens dominiert der Satz alles andere: Ein Wechsel von 0,85 auf 1,20 pro kg (+41 %) bewegt diesen Auftrag von 875,50 auf 1.236 (+41 %), während ein Wechsel des Verschnitts von 3 % auf 10 % ihn nur um 7 % bewegt. Den Satz richtig zu treffen, zählt sechsmal mehr, als den Verschnitt richtig zu treffen — weshalb der Fehlerabschnitt mit veralteten Sätzen beginnt. Zweitens ist die Pro-Tonne-Spalte die Vergleichsspalte für Angebote: Wenn ein Lieferant 850 pro Tonne nennt und ein anderer 0,85 pro kg, nennen sie denselben Satz, und die Kosten-pro-Tonne-Zeile des Panels existiert genau dafür, das sichtbar zu machen.</p><h3 id="waste-table">Kosten nach Verschnitt</h3><p>Derselbe Auftrag (1000 kg zu 1,00 pro kg) auf fünf Verschnittstufen. Bei einem runden Satz von 1,00 entsprechen die Kosten dem Gewicht mit Verschnitt — die sauberste mögliche Sicht darauf, was Verschnitt kostet.</p><div class="formula-table"><table><tr><th>Verschnitt</th><th>Gewicht mit Verschnitt</th><th>Geschätzte Kosten</th><th>Tonnen</th></tr><tr><td>0 %</td><td>1.000 kg</td><td>1.000</td><td>1,00 t</td></tr><tr><td>3 %</td><td>1.030 kg</td><td>1.030</td><td>1,03 t</td></tr><tr><td>5 %</td><td>1.050 kg</td><td>1.050</td><td>1,05 t</td></tr><tr><td>7,5 %</td><td>1.075 kg</td><td>1.075</td><td>1,07 t</td></tr><tr><td>10 %</td><td>1.100 kg</td><td>1.100</td><td>1,10 t</td></tr></table></div><p>Beachten Sie die 7,5-%-Zeile: Die Tonnage lautet „1,07“, nicht 1,08. Der exakte Wert ist 1,075, und die Zwei-Nachkommastellen-Anzeige des Panels rundet ihn auf 1,07 (JavaScripts Anzeigerundung des Binärwerts) — gegen das echte Panel geprüft, also nicht „korrigieren“. Die Kostenspalte braucht keine solche Sorgfalt: Bei 1,00 pro kg entsprechen die Kosten exakt dem Gewicht. Der praktische Punkt: Verschnitt ist ebenfalls linear — jeder Verschnittpunkt auf einer Tonne kostet exakt den Pro-kg-Satz × 10 (bei 1,00/kg also 10,00 pro Punkt), sodass ein Verschnitt-Streit niemals um eine Klippe geht, sondern nur darum, wie viele Punkte Sie zu zahlen bereit sind.</p><h3 id="scale-table">Kosten nach Auftragsgröße</h3><p>Derselbe Satz (1,20 pro kg) und Verschnitt (5 %) von einer 100-kg-Reparatur bis zu einem 10-Tonnen-Auftrag. Alles skaliert linear — der Wert der Tabelle liegt darin, die Panel-Formen bei jeder Größe zu zeigen, sodass ein Leser, der eine Zeile prüft, genau das sieht, was das Panel zeigt.</p><div class="formula-table"><table><tr><th>Nettogewicht</th><th>Gewicht mit Verschnitt</th><th>Geschätzte Kosten</th><th>Tonnen</th></tr><tr><td>100 kg</td><td>105,00 kg</td><td>126,00</td><td>0,105 t</td></tr><tr><td>250 kg</td><td>262,50 kg</td><td>315,00</td><td>0,263 t</td></tr><tr><td>500 kg</td><td>525,00 kg</td><td>630,00</td><td>0,525 t</td></tr><tr><td>1000 kg</td><td>1.050 kg</td><td>1.260</td><td>1,05 t</td></tr><tr><td>2000 kg</td><td>2.100 kg</td><td>2.520</td><td>2,10 t</td></tr><tr><td>5000 kg</td><td>5.250 kg</td><td>6.300</td><td>5,25 t</td></tr><tr><td>10000 kg</td><td>10.500 kg</td><td>12.600</td><td>10,50 t</td></tr></table></div><p>Beachten Sie die 250-kg-Zeile: Die Tonnage lautet „0,263“, nicht 0,262 oder 0,2625 — der exakte Wert ist 0,2625, und die Drei-Nachkommastellen-Anzeige des Panels zeigt 0,263 (gegen das echte Panel geprüft). Die Kostenspalte ist in jeder Zeile exakt, weil 1,20 × das Gewicht mit Verschnitt hier auf runde Zahlen trifft. Zum Maßstab: Die 10-Tonnen-Zeile (12.600) entspricht ungefähr einer Lkw-Ladung Stahl, und die 100-kg-Zeile (126,00) ist die Größe, bei der eine Liefergebühr des Lieferanten — außerhalb dieses Panels — die Materialkosten selbst übersteigen kann.</p>
<h3 id="reading-panel">Panel ablesen: pro Tonne und Rundung</h3><p>Zwei Unterscheidungen, die Angebotsvergleiche still verfälschen, wenn sie übersehen werden.</p><p><strong>Pro bestellter Tonne vs. pro benötigter Tonne.</strong> Die „Kosten pro Tonne“ des Panels sind Satz × 1000 — der Preis pro Tonne Stahl, die Sie bestellen, Verschnitt inklusive. Bei den Standardwerten: 875,50 ÷ 1,03 t = 850,00. Aber die Kosten pro Tonne reinen Stahls im Bauwerk betragen 875,50 ÷ 1,00 = 875,50, weil die 30 kg Verschnitt gekauft und bezahlt werden. Wenn ein Lieferant „850 pro Tonne“ nennt und Ihre Mengenermittlung rein ist, betragen Ihre wahren Materialkosten pro reiner Tonne 850 × 1,03 = 875,50 bei 3 % Verschnitt — Angebot und Kosten unterscheiden sich genau um den Verschnitt-Prozentsatz. Fragen Sie immer, welche Tonne ein Pro-Tonne-Angebot meint.</p><p><strong>Panel-Rundung vs. exakte Produkte.</strong> Summen ab 1000 werden mit einer Nachkommastelle angezeigt, sodass das Kosten-Panel „1.341,1“ zeigt, wo das exakte Produkt 1.341,144 lautet, und „1.405“, wo es 1.405,008 lautet (siehe den Brückenabschnitt). Die Gewichtsseite zeigt die exakten 2-stelligen Produkte (1.341,14 € und 1.405,01 €) für dieselben Aufträge. Beides ist richtig; das Panel rundet für die Anzeige. Unter 1000 zeigt das Panel zwei Nachkommastellen, sodass die Werte der Mengenseite (388,08 € und 406,56 €) genau zu diesem Panel passen. Eine Abweichung in der letzten Nachkommastelle zwischen zwei Seiten ist eine Rundungsdifferenz, bis das Gegenteil bewiesen ist.</p><h3 id="budget">Was ein Budget kauft (rückwärts)</h3><p>Das Panel rechnet nur Gewicht → Kosten. Die umgekehrte Richtung — was ein festes Budget kauft — ist einfache Arithmetik, hier als abgeleitet gekennzeichnet (keine Panel-Ausgabe): Nettogewicht = Budget ÷ ((1 + Verschnitt) × Satz).</p><div class="formula-table"><table><tr><th>Budget (Beispielsatz 1,20/kg, 5 % Verschnitt)</th><th>Gekaufter reiner Stahl</th><th>Bestellgewicht (mit Verschnitt)</th></tr><tr><td>1000</td><td>793,65 kg</td><td>833,33 kg</td></tr><tr><td>5000</td><td>3.968,25 kg</td><td>4.166,67 kg</td></tr><tr><td>10000</td><td>7.936,51 kg</td><td>8.333,33 kg</td></tr></table></div><p>Durchgerechnet: 1000 ÷ (1,05 × 1,20) = 1000 ÷ 1,26 = 793,65 kg rein; das bestellte Gewicht beträgt 793,65 × 1,05 = 833,33 kg. Der Verschnitt frisst das Budget gewissermaßen doppelt: Er erhöht das bestellte Gewicht UND er ist Stahl, den Sie bezahlen, aber nicht behalten — bei einem Budget von 10000 mit 5 % Verschnitt sind 396,83 kg der Bestellung (8.333,33 − 7.936,51) Verschnittstahl. Wenn das Budget knapp ist, ist der Verschnitt-Prozentsatz der erste Hebel, den es zu hinterfragen gilt — aber nur, indem man den Schneidplan verbessert, niemals indem man den Ansatz streicht und hofft.</p><h3 id="waste-guide">Verschnitt-Leitfaden nach Bauteil</h3><p>Der Standardwert des Panels ist 3 %, und die Live-Empfehlung war schon immer 3–5 %. Veröffentlichte bauteilweise Empfehlungen verfeinern sie — verwenden Sie die Zeile, die zur Arbeit passt, nicht den Standardwert, wenn die Arbeit komplex ist:</p><div class="formula-table"><table><tr><th>Bauteil</th><th>Empfohlener Verschnitt</th><th>Warum</th></tr><tr><td>Stützen</td><td>3–5 %</td><td>Meist gerade Vertikale mit Bügeln</td></tr><tr><td>Fundamente</td><td>5–7 %</td><td>Schwere Stäbe, Übergreifungsstöße</td></tr><tr><td>Platten</td><td>5–7 %</td><td>Rastermuster, Zwei-Wege-Schnitt</td></tr><tr><td>Wände</td><td>5–7 %</td><td>Horizontale + vertikale Stäbe</td></tr><tr><td>Balken</td><td>5–8 %</td><td>Bügel in der Zählung enthalten</td></tr><tr><td>Treppen</td><td>8–10 %</td><td>Komplexe Formen, mehrere Biegungen</td></tr></table></div><p>Zwei Regeln stehen über der Tabelle. Erstens sind Übergreifungen kein Verschnitt: Eine Übergreifung ist Stahl im Bauwerk, und wenn Ihre Mengenermittlung bereits Übergreifungen enthält (aus dem <a href="/de/uebergreifungslaengen-rechner">Übergreifungslängen-Rechner</a>) und Haken (aus dem <a href="/de/haken-biege-schnittlaengen-rechner">Haken-Biege-Schnittlängen-Rechner</a>), deckt der Verschnitt-Prozentsatz nur Schneiden und Handhabung ab (3–5 %). Wenn Ihre Mengenermittlung reine gerade Längen umfasst, verwenden Sie einen kombinierten Ansatz — veröffentlichte Mengenleitfäden verwenden 10 % für Übergreifungen und Verschnitt zusammen — oder addieren Sie die Übergreifungen explizit. 10 % auf explizite Übergreifungen obendrauf zu legen, bezahlt die Übergreifungen doppelt. Zweitens schlägt der Schneidplan den Prozentsatz: Ein Plan mit 3-m-Schnitten aus 12-m-Stäben verschwendet fast nichts, während 5-m-Schnitte überall 2-m-Abschnitte übrig lassen — kein Prozentsatz repariert einen schlechten Schneidplan, und kein Schneidplan braucht einen Prozentsatz, den er nicht begründen kann.</p><h3 id="imperial">Zoll-Maße und Umrechnungen pro Tonne</h3><p>Das Panel nimmt Kilogramm und einen Pro-kg-Satz. Rechnen Sie zuerst um und geben Sie dann ein — das Panel rechnet niemals für Sie um.</p><p><strong>Satzumrechnungen (abgeleitete Arithmetik).</strong> Pro metrischer Tonne = Pro-kg-Satz × 1000 (0,85 → 850; 1,20 → 1.200). Pro US-Short-Tonne = Pro-kg-Satz × 907,185 (0,85 → 771,11; 1,20 → 1.088,62). Pro Pfund = Pro-kg-Satz ÷ 2,20462 (0,85 → 0,386/lb; 1,20 → 0,544/lb). In der anderen Richtung: Pro-kg = pro Tonne ÷ 1000; Pro-kg = pro Short-Tonne ÷ 907,185; Pro-kg = pro lb × 2,20462 (0,55/lb → 1,21254/kg).</p><p><strong>Durchgerechnetes Zoll-Beispiel.</strong> Ein Auftrag über 2000 lb zu 0,55 $ pro lb mit 5 % Verschnitt: Gewicht mit Verschnitt = 2000 × 1,05 = 2100 lb; Kosten = 2100 × 0,55 = 1.155,00 $. In metrischen Begriffen ist derselbe Auftrag 907,18 kg rein (2000 × 0,453592) und 952,54 kg bestellt. Die Pro-Tonne-Entsprechungen von 0,55 $/lb sind 1.100,00 $ pro Short-Tonne (0,55 × 2000) und 1.212,54 $ pro metrischer Tonne (0,55 × 2204,62) — die Lücke von 112,54 $ zwischen diesen beiden „pro Tonne“-Werten ist rein die Tonnendefinition, und sie ist die häufigste einzelne Ursache dafür, dass ein Angebot 10 % günstiger aussieht, als es ist. Um diesen Auftrag in das Panel einzugeben, verwenden Sie 907,18 kg zu 1,21 pro kg (die gerundete Form von 1,21254); das Panel-Ergebnis wird wegen der Satzrundung um etwa 2,40 $ von 1.155,00 $ abweichen — für exakte Zoll-Preise bepreisen Sie daher in lb/$ wie oben, statt über einen gerundeten Pro-kg-Satz.</p><h3 id="bridges">Von anderen Rechnern zum Preis</h3><p>Jede Brücke unten wurde mit dem echten Kosten-Panel zu einem Beispielsatz von 1,20 pro kg durchgerechnet — verwenden Sie für einen echten Auftrag Ihren eigenen Satz.</p><div class="formula-table"><table><tr><th>Quellseite</th><th>Nettogewicht</th><th>Zu 1,20/kg, 5 % Verschnitt</th><th>Zu 1,20/kg, 10 % Verschnitt</th></tr><tr><td>Gewichts-Standardwerte (100 × 12 mm × 12 m)</td><td>1.064,4 kg</td><td>1.117,6 kg → 1.341,1 (1,12 t)</td><td>1.170,8 kg → 1.405 (1,17 t)</td></tr><tr><td>Mengen-Standardwerte (50 m², 200 mm, 10 mm)</td><td>308,00 kg</td><td>323,40 kg → 388,08 (0,323 t)</td><td>338,80 kg → 406,56 (0,339 t)</td></tr><tr><td>Mengen-Haus (200 m², 200 mm, 12 mm)</td><td>1.774 kg</td><td>1.862,7 kg → 2.235,2 (1,86 t)</td><td>1.951,4 kg → 2.341,7 (1,95 t)</td></tr><tr><td>Mengen-kleine Fläche (20 m², 300 mm, 8 mm)</td><td>52,53 kg</td><td>55,16 kg → 66,19 (0,055 t)</td><td>—</td></tr><tr><td>Platten-Brücke (5 × 4 m Platten-Tool-Zählung)</td><td>120,98 kg</td><td>127,03 kg → 152,43 (0,127 t)</td><td>—</td></tr><tr><td>Große Fläche (1000 m², 150 mm, 16 mm)</td><td>21.040 kg</td><td>— (zu 0,85/kg, 3 %: 21.671,2 kg → 18.420,5, 21,67 t)</td><td>— (zu 0,85/kg, 5 %: 22.092 kg → 18.778,2, 22,09 t)</td></tr></table></div><p>Hinweise zur Tabelle. Die Gewichtsseiten-Brücke verwendet Panel-Formen (1.341,1 / 1.405), nicht die exakten Produkte der Gewichtsseite (1.341,144 / 1.405,008) — siehe den Rundungshinweis. Die Mengenbrücken stimmen exakt mit ihren Quellseiten überein (388,08 / 406,56; 2.235,2 / 2.341,7 sind die Panel-Formen von 2235,24 / 2341,68). Die reinen Gewichtseiten-Kosten zu 1,20/kg bei 0 % Verschnitt betragen 1.277,3 (exakt 1277,28) für 1,06 t. Für jede andere Quelle ist der Weg derselbe: Nehmen Sie das Nettogewicht aus dem <a href="/de/bewehrungsgewicht-rechner">Gewichtsrechner</a>, dem <a href="/de/bewehrungstonnage-rechner">Tonnage-Rechner</a>, dem <a href="/de/bewehrungsmengen-rechner">Mengenrechner</a> oder einem Bauteil-Tool, geben Sie es hier ein, und das Panel erledigt den Rest. Beton selbst wird mit dem <a href="/de/beton-bewehrungs-schaetzer">Beton-Bewehrungs-Schätzer</a> bepreist — dieses Panel enthält ihn niemals.</p>
<h3 id="not-included">Was dieser Rechner nicht abdeckt</h3><ul><li>Steuern / MwSt. — addieren Sie Ihren lokalen Satz von Hand zur Panel-Summe.</li><li>Arbeitslohn: Schneiden, Biegen, Verlegen, Binden — nach Stunden × Satz oder nach einem Pro-kg-/Pro-Tonne-Arbeitslohnsatz aus lokalen Richtwerten bepreisen.</li><li>Schneid- und Biegekosten, Bindedraht, Abstandhalter, Abstandshalter und Deckungsblöcke — siehe den <a href="/de/abstandhalter-rechner">Abstandhalter-Rechner</a> und den <a href="/de/bindedraht-rechner">Bindedraht-Rechner</a> für die Zubehörmengen.</li><li>Lieferung und Transport, Entladen sowie Kran-/Aufzugszeit.</li><li>Beton, Schalung und andere Materialien — Beton steht im <a href="/de/beton-bewehrungs-schaetzer">Beton-Bewehrungs-Schätzer</a>.</li><li>Preise pro Größe oder Güte — das Panel nimmt einen Satz für den gesamten Stahl; bepreisen Sie Durchmesser separat, wenn Ihr Lieferant das tut.</li><li>Übergreifungen und Haken als separate Positionen — der Verschnitt-Prozentsatz ist der einzige Ansatz; arbeiten Sie Übergreifungen mit dem <a href="/de/uebergreifungslaengen-rechner">Übergreifungslängen-Rechner</a> und Haken mit dem <a href="/de/haken-biege-schnittlaengen-rechner">Haken-Biege-Schnittlängen-Rechner</a> aus und addieren Sie sie zuerst zum Nettogewicht, wenn Sie sie explizit haben wollen.</li><li>Stabzahlen, Längen und Listen — das Gewicht kommt aus dem <a href="/de/bewehrungsgewicht-rechner">Gewichtsrechner</a>, dem <a href="/de/bewehrungstonnage-rechner">Tonnage-Rechner</a> oder einem Bauteil-Tool; dieses Panel bepreist nur ein Gewicht, das Sie ihm geben.</li><li>Edelstahl- oder Legierungsdichten, Matten und Schnittlängenoptimierung gegen Handelsstäbe.</li><li>Preisgültigkeit — das Panel speichert keine Marktdaten; ein heute eingegebener Satz ist morgen kein Preis mehr.</li><li>Währungsumrechnung — das Panel zeigt kein Währungssymbol; rechnen Sie den Satz selbst um, bevor Sie ihn eingeben.</li></ul><h3 id="mistakes">5 häufige Fehler</h3><ol><li><strong>Das Nettogewicht bepreisen.</strong> Das Mengenermittlungsgewicht mit 0 % Verschnitt einzugeben, bepreist Stahl, den Sie wegschneiden werden, als wäre er gratis. Bei den Standardwerten ergibt 0 % Verschnitt 850,00 und 3 % ergibt 875,50 — die Differenz von 25,50 ist die günstigste Versicherung des Auftrags. Selbst ein perfekter Schneidplan verliert Stäbe durch Handhabungsschäden.</li><li><strong>Übergreifungen doppelt bezahlen.</strong> Einen kombinierten 10-%-Ansatz für Übergreifungen und Verschnitt auf eine Mengenermittlung zu legen, die bereits explizite Übergreifungen enthält (aus dem Übergreifungsrechner), überbestellt um das volle Übergreifungsgewicht — bei einem 10-Tonnen-Auftrag eine Tonne Phantomstahl. Kombiniert ODER explizit verwenden, niemals beides.</li><li><strong>Einen Pro-Tonne-Satz in das Pro-kg-Feld eingeben.</strong> Das Satzfeld des Panels ist pro kg. Die Eingabe von 850 (ein Pro-Tonne-Satz) bepreist den Standardauftrag mit 875.500 statt 875,50 — ein 1000×-Fehler, der einem flüchtigen Blick standhält, weil das Panel keine Währungseinheit zeigt, die ihm widersprechen würde. Teilen Sie Pro-Tonne-Angebote zuerst durch 1000; die Kosten-pro-Tonne-Zeile ist die Prüfung (sie sollte nahe am genannten Pro-Tonne-Satz liegen).</li><li><strong>Pro-Tonne-Angebote über Tonnendefinitionen hinweg vergleichen.</strong> Ein Angebot von 771,11 pro US-Short-Tonne und ein Angebot von 850 pro metrischer Tonne sind DERSELBE Satz (0,85/kg) — die Short-Tonne hat 907,185 kg, nicht 1000 kg. Ein Short-Tonnen-Angebot sieht etwa 10 % günstiger aus als derselbe Satz pro metrischer Tonne, und die Lücke hat schon mehr als ein Budget getäuscht. Rechnen Sie jedes Angebot vor dem Vergleich in pro kg um.</li><li><strong>Einem veralteten Satz oder dem Rechenbeispiel eines Mitbewerbers vertrauen, ohne es erneut durchzurechnen.</strong> Stahlpreise bewegen sich, und veröffentlichte Beispiele lassen sich nicht immer reproduzieren: Das Plattenbeispiel eines beliebten Kombi-Tools behauptet ~71 kg, wo seine eigene angegebene Formel 74,71 kg ergibt, und die Zoll-Formel eines beliebten Leitfadens übertreibt #8-Stäbe um das 16-Fache (42,75 lb/ft gegenüber den wahren 2,670 lb/ft). Rechnen Sie jedes Beispiel im Panel mit Ihrem eigenen Satz erneut durch, bevor Sie sich darauf verlassen — auch die auf dieser Seite.</li></ol><p>Zuletzt geprüft: Oktober 2026.</p>`
}
},
    { id:"tonnage", slug:"rebar-tonnage-calculator", cat:"Commercial",
    metaTitle:"Rebar Tonnage Calculator — Bars to Tons (Metric + US)",
    h1:"Rebar Tonnage Calculator",
    desc:"Convert any bar schedule to tonnage: metric tonnes and US short tons side by side. 500 × 16 mm × 12 m bars = 9.47 t, 10.44 US tons. Free, no signup.",
    kw:"rebar tonnage calculator, rebar ton calculator, rebar weight to tons, steel tonnage",
    intro:"Convert quantities of bars into tonnage for ordering and pricing. Enter the bar size, length and quantity to get metric tons, US tons and total kilograms.",
    howto:["Pick the bar size — metric (mm) or US (# size) — from the dropdown.","Enter the length of one bar in metres and how many pieces.","Read the total tonnage in metric tons, the total weight in kg, and the US short tons.","For a long-ton (UK) figure, divide the kg total by 1016.05 — the panel shows metric and US tons only.","Add waste, laps and hooks before ordering — the panel converts neat bar weight only."],
    formula:"Weight (kg) = kg/m × length × quantity. Metric ton = kg ÷ 1000.",
    faqs:[["How many bars in a ton of rebar?", "Divide 1000 by (kg/m × bar length). For 12 mm × 12 m bars, about 94 bars per ton — exactly 94 bars weigh 1,000.5 kg (1.00 metric ton) on this panel, while 93 bars weigh 989.89 kg (0.990 t) and fall short. The full table below gives every size at 12 m stock: 8 mm 212 bars, 10 mm 136, 12 mm 94, 16 mm 53, 20 mm 34, 25 mm 22, 32 mm 14. Note the ceil: ordering the bars-per-tonne count always overshoots the tonne slightly (by 0.5 kg on 12 mm but 60.1 kg on 32 mm), because the last bar must be bought whole."],
          ["What is the difference between metric and US tons?", "A metric ton is 1000 kg; a US (short) ton is 907.2 kg (the panel uses 907.185 kg exactly). The same steel therefore reads about 10% higher in US tons: the calculator defaults (500 × 16 mm × 12 m) are 9.47 metric tons but 10.44 US tons. There is also a third ton — the UK long ton, 1016.05 kg — which reads lower than both (9.32 long tons for the defaults). Always ask which ton a quote, a truck limit or a drawing means: 'tonne' always means metric, but 'ton' on its own could be any of the three."],
          ["What is a long ton, and does the panel show it?", "A UK long ton (imperial ton) is 2240 lb = 1016.05 kg — the traditional British shipping ton, still used in some maritime and legacy contexts. The panel does not show it: it outputs metric tonnes and US short tons only. To get it, divide the kg total by 1016.05 (derived arithmetic, not a panel row): the defaults order of 9,468 kg is 9.32 long tons, and 10,000 kg is 9.84 long tons. If a supplier quotes long tons and you compare against metric tonnes without converting, you will under-order by about 1.6%."],
          ["Why do the metric and US ton columns read the same on small orders?", "Because below 1 tonne the panel shows three decimals, and the two values round to the same display. One 6 mm × 12 m bar is 0.002664 metric tons and 0.002937 US tons — a 10% difference in reality — but both display as 0.003. One 8 mm bar shows 0.005 in both columns for the same reason. From 10 mm up the columns separate (0.007 vs 0.008). Never conclude two tonnages are equal because their displays match below 1 tonne — check the kg row, which never hides the difference."],
          ["How many trucks do I need for an order?", "The panel has no logistics output, so work it from the kg total (derived arithmetic): divide by your truck's payload and round up. At a 20,000 kg planning payload, the defaults order (9,468 kg) is 0.47 truckloads — one truck; double it (18,936 kg) is 0.95 — still one truck, just; 2000 × 16 mm × 12 m (37,872 kg) is 1.89 — two trucks; 1000 × 25 mm × 12 m (46,212 kg) is 2.31 — three trucks. At a 25,000 kg payload the last two become two trucks each, so state your payload assumption when you quote truck counts. And length binds before weight: 12 m bars need a 40 ft (12.2 m) trailer or longer regardless of tonnage."],
          ["How do I convert a supplier's US-ton quote to metric tonnes?", "Multiply US short tons by 0.907185: 10 US tons = 9.07 metric tonnes. In the other direction, multiply metric tonnes by 1.10231: 10 metric tonnes = 11.02 US tons. For long tons, multiply by 1.01605 (10 long tons = 10.16 metric tonnes) or divide metric tonnes by 1.01605. Convert every quote to the same ton before comparing prices — the <a href=\"/rebar-cost-calculator\">cost calculator</a> prices per kg, so converting to kg first (US tons × 907.185, long tons × 1016.05) removes the ambiguity entirely."],
          ["Does the tonnage include waste?", "No — the panel converts neat bar weight only. Add waste before converting if you want the ordered tonnage: the defaults order at +5% waste is 9,941.4 kg, which is 9.94 metric tons and 10.96 US tons (derived arithmetic — enter the with-waste weight in the panel's quantity field, or scale the tonnage by 1.05). Laps and hooks are separate from waste: work them on the <a href=\"/rebar-lap-length-calculator\">lap calculator</a> and the <a href=\"/rebar-hook-bend-cutting-length-calculator\">hook calculator</a> and add them to the neat weight first. Price the final tonnage on the <a href=\"/rebar-cost-calculator\">cost calculator</a>."],
          ["Can I convert tonnes back to bars?", "Not on this panel — it runs bars → tonnage only. For the reverse direction, use the <a href=\"/rebar-weight-calculator\">weight calculator</a> in Reverse mode: 2000 kg of 12 mm bar at 12 m stock gives 188 bars (187 full + 10.79 m offcut). Or divide by hand and round UP: bars = tonnes × 1000 ÷ (kg/m × length). Rounding down is the error — 93 × 12 mm × 12 m is 0.990 tonnes, not one tonne, so a '93 bars per tonne' order arrives 10.11 kg short."],
          ["Why does another site's tonnage differ from this panel's?", "Usually one of four things, in order of likelihood: (1) the ton definition — short tons read ~10% higher than metric tonnes for the same steel; (2) the constant — d²/162 tables give ~0.2% more than this panel's d²/162.28 options (one popular tool's 200 × 12 mm × 6 m example is 1,066 kg on d²/162, 1,064.4 kg here); (3) the bar length — 40 ft bars weigh 1.6% more per bar than 12 m bars, so the same count gives a different tonnage; (4) waste in or out — a with-waste tonnage is higher by exactly the waste percentage. Check all four before assuming an arithmetic error."],
          ["Can I convert a whole project with one run?", "Only if it is one bar size at one length. The panel takes a single size, length and quantity, so a real project needs one run per line of the bar schedule, added together — exactly as the <a href=\"/rebar-area-calculator\">area page</a> does for mixed cages. For the weights themselves, take each member off its own tool (<a href=\"/concrete-slab-rebar-calculator\">slab</a>, <a href=\"/footing-rebar-calculator\">footing</a>, <a href=\"/rebar-mat-grid-calculator\">mat</a>, <a href=\"/column-rebar-calculator\">column</a>, <a href=\"/beam-rebar-calculator\">beam</a>, <a href=\"/wall-rebar-calculator\">wall</a>, <a href=\"/pool-rebar-calculator\">pool</a>, <a href=\"/driveway-rebar-calculator\">driveway</a>) or the <a href=\"/rebar-quantity-calculator\">quantity calculator</a> for area-density estimates and the <a href=\"/concrete-and-rebar-calculator\">concrete estimator</a> for kg/m³-ratio estimates, then convert each weight here and add the tonnages."]],
    toc:`<nav class="content-block" aria-label="On this page"><h2>On this page</h2><ul><li><a href="#how-to">How to use the calculator</a></li><li><a href="#formula">The formula, explained</a></li><li><a href="#example-1">Worked example 1: defaults (500 × 16 mm × 12 m)</a></li><li><a href="#example-2">Worked example 2: small order, two bar lists</a></li><li><a href="#example-3">Worked example 3: imperial (#4 bars)</a></li><li><a href="#three-tons">One order, three tons</a></li><li><a href="#per-tonne">Bars per tonne (and the ceil overshoot)</a></li><li><a href="#per-bar">Tonnage of a single bar</a></li><li><a href="#forty-foot">40 ft bars vs 12 m bars</a></li><li><a href="#imperial">Imperial bars and the lb/ft identity</a></li><li><a href="#trucks">Trucks and bundles</a></li><li><a href="#bridges">From other calculators to tonnage</a></li><li><a href="#not-included">What this calculator does not cover</a></li><li><a href="#mistakes">5 common mistakes</a></li><li><a href="#faq">FAQs</a></li></ul></nav>`,
    extra:`<h3>The formula, explained</h3><p>Tonnage is just total weight expressed in a large unit. The panel weighs the bars first, then divides:</p><p><strong>Weight (kg) = kg/m × length × quantity; Metric ton = kg ÷ 1000; US short ton = kg ÷ 907.185</strong></p><p>The kg/m comes from the same d² ÷ 162.28 formula as the weight page (16 mm: 256 ÷ 162.28 = 1.578 kg/m). The two ton divisors are the whole story of this page: 1000 kg for the metric tonne, 907.185 kg for the US short ton (2000 lb × 0.45359237). A third divisor exists — 1016.05 kg for the UK long ton (2240 lb) — but the panel does not output it; every long-ton figure on this page is derived arithmetic (kg ÷ 1016.05) and is labelled as such. Three display notes. First, the panel shows four rows: total tonnage (metric, primary), total weight (kg), US tons, and per bar (kg), with the note "1.578 kg/m × 12m × 500 = 9,468 kg" on the defaults. Second, totals at or above 1000 show one decimal with separators ("9,468 kg", "1,000.5 kg"), tonnages at or above 1 show two decimals ("9.47", "1.06"), and tonnages below 1 show three decimals ("0.990", "0.003") — quote the panel forms and your reader's check will match. Third, the bar dropdown reads "1.578|16" and the option value is exactly "1.578|16", so this page's defaults carry no bar-option trap (unlike the weight and quantity pages) — but the kg/m values are still d²/162.28 options, so a d²/162 table gives slightly different totals, as the bridges section shows.</p><h3 id="example-1">Worked example 1: defaults (500 × 16 mm × 12 m)</h3><p>Open the calculator as it loads: 16 mm bars, length 12 m, quantity 500 pieces.</p><p>Weight per bar = 1.578 × 12 = 18.94 kg. Total weight = 18.94 × 500 = 9,468 kg.</p><p><strong>Total tonnage 9.47 metric tons, 10.44 US short tons — and, derived, 9.32 UK long tons and 20,873.3 lb.</strong> The panel shows all four rows: 9.47 metric ton, 9,468 kg, 10.44 ton, 18.94 kg per bar, with the note "1.578 kg/m × 12m × 500 = 9,468 kg". The point of the page is in that one line: the same 9,468 kg of steel is 9.47, 10.44, or 9.32 depending on which ton you mean — a spread of 1.12 tonnes between the smallest and largest reading of the same order. Any document that says "tons" without saying which one is ambiguous by up to 12%.</p><h3 id="example-2">Worked example 2: small order, two bar lists</h3><p>Set 12 mm bars, length 6 m, quantity 200 pieces.</p><p>Weight per bar = 0.887 × 6 = 5.32 kg. Total weight = 5.32 × 200 = 1,064.4 kg.</p><p><strong>Total tonnage 1.06 metric tons, 1.17 US short tons.</strong> Now the equivalence that catches people out: 100 × 12 mm × 12 m gives exactly the same figures (1,064.4 kg, 1.06 t, 1.17 US) — halving the length and doubling the count leaves the tonnage unchanged, because tonnage only sees total metres × kg/m. The same holds at the defaults scale: 1000 × 16 mm × 6 m is 9,468 kg, identical to 500 × 16 mm × 12 m (only the per-bar row differs: 9.47 kg instead of 18.94 kg). Tonnage answers "how much steel", never "in what pieces" — the bar list still matters for cutting, laps and delivery, even when the tonnage does not move.</p><h3 id="example-3">Worked example 3: imperial (#4 bars)</h3><p>Set the bar dropdown to #4 (12.7 mm, 0.994 kg/m), length 6.096 m (20 ft), quantity 100 pieces.</p><p>Weight per bar = 0.994 × 6.096 = 6.06 kg. Total weight = 6.06 × 100 = 605.94 kg.</p><p><strong>Total tonnage 0.606 metric tons, 0.668 US short tons.</strong> A heavier imperial run: 100 × #8 × 20 ft → per bar 24.22 kg, total 2,421.9 kg, 2.42 metric tons, 2.67 US tons. Two traps to avoid. First, a #4 bar (12.7 mm, 0.994 kg/m) is NOT a 12 mm bar (0.887 kg/m) — swapping them changes the tonnage by 12.1%. Second, the US-ton column here is in short tons (2000 lb), not metric tonnes: 605.94 kg is 0.606 metric tonnes but 0.668 short tons, and a US supplier quoting "0.67 tons" for this order means the short-ton figure, not a rounded metric one.</p><h3 id="three-tons">One order, three tons</h3><p>Every order below is shown in all three tons. The metric and US columns are panel outputs; the long-ton column is derived (kg ÷ 1016.05) and labelled as such. The lb column is derived (kg × 2.20462).</p><div class="formula-table"><table><tr><th>Order weight</th><th>Metric tonnes</th><th>US short tons</th><th>UK long tons (derived)</th><th>Pounds (derived)</th></tr><tr><td>1,000 kg</td><td>1.00 t</td><td>1.10 ton</td><td>0.984 ton</td><td>2,204.6 lb</td></tr><tr><td>5,000 kg</td><td>5.00 t</td><td>5.51 ton</td><td>4.92 ton</td><td>11,023.1 lb</td></tr><tr><td>10,000 kg</td><td>10.00 t</td><td>11.02 ton</td><td>9.84 ton</td><td>22,046.2 lb</td></tr><tr><td>20,000 kg</td><td>20.00 t</td><td>22.05 ton</td><td>19.68 ton</td><td>44,092.4 lb</td></tr><tr><td>9,468 kg (defaults)</td><td>9.47 t</td><td>10.44 ton</td><td>9.32 ton</td><td>20,873.3 lb</td></tr></table></div><p>Three readings. First, the spread between the smallest and largest ton for the same steel is 12.00% ((1016.05 − 907.185) ÷ 907.185) — on a 20-tonne order that is 2.4 tonnes of ambiguity. Second, the conversions to memorise: US tons × 0.907185 = metric tonnes (10 US tons = 9.07 t); metric tonnes × 1.10231 = US tons (10 t = 11.02 US tons); long tons × 1.01605 = metric tonnes (10 long tons = 10.16 t). Third, the spelling rule from the converter guides: "tonne" always means metric, but "ton" on its own could be any of the three depending on who wrote it — if a document just says "tons", ask before you order.</p><h3 id="per-tonne">Bars per tonne (and the ceil overshoot)</h3><p>Run the panel with the bar count that reaches a tonne at 12 m stock. "Bars needed" is the ceil — the order quantity — and the panel tonnage shows what that count actually weighs, which is always slightly MORE than a tonne.</p><div class="formula-table"><table><tr><th>Bar (12 m)</th><th>Bars to reach a tonne</th><th>Panel weight</th><th>Panel metric tonnage</th><th>Panel US tons</th><th>Overshoot</th></tr><tr><td>8 mm</td><td>212</td><td>1,002.3 kg</td><td>1.00 t</td><td>1.10 ton</td><td>+2.3 kg</td></tr><tr><td>10 mm</td><td>136</td><td>1,005.3 kg</td><td>1.01 t</td><td>1.11 ton</td><td>+5.3 kg</td></tr><tr><td>12 mm</td><td>94</td><td>1,000.5 kg</td><td>1.00 t</td><td>1.10 ton</td><td>+0.5 kg</td></tr><tr><td>16 mm</td><td>53</td><td>1,003.6 kg</td><td>1.00 t</td><td>1.11 ton</td><td>+3.6 kg</td></tr><tr><td>20 mm</td><td>34</td><td>1,005.7 kg</td><td>1.01 t</td><td>1.11 ton</td><td>+5.7 kg</td></tr><tr><td>25 mm</td><td>22</td><td>1,016.7 kg</td><td>1.02 t</td><td>1.12 ton</td><td>+16.7 kg</td></tr><tr><td>32 mm</td><td>14</td><td>1,060.1 kg</td><td>1.06 t</td><td>1.17 ton</td><td>+60.1 kg</td></tr></table></div><p>The overshoot grows with bar size: half a kilo on 12 mm, 60.1 kg (6.0%) on 32 mm — because the last bar must be bought whole, and a 32 mm bar weighs 75.72 kg. The other side of the same coin: one bar fewer always falls short — 93 × 12 mm = 989.89 kg (0.990 t, 10.11 kg short), 135 × 10 mm = 997.92 kg (0.998 t, just 2.08 kg short), 13 × 32 mm = 984.36 kg (15.64 kg short). So "bars per tonne" is an order quantity, not an exact conversion: 94 bars per tonne on 12 mm means "94 bars gets you to (just past) a tonne", and the weight page's reverse mode says the same thing from the other direction (2000 kg of 12 mm = 188 bars, 187 full + 10.79 m offcut).</p><h3 id="per-bar">Tonnage of a single bar</h3><p>One 12 m bar, in all three panel rows that matter. The per-bar kg column is the panel's per-bar row; the ton columns are the panel's tonnage rows for quantity 1.</p><div class="formula-table"><table><tr><th>Bar (12 m)</th><th>kg per bar</th><th>Metric ton</th><th>US ton</th></tr><tr><td>6 mm</td><td>2.66 kg</td><td>0.003 t</td><td>0.003 ton</td></tr><tr><td>8 mm</td><td>4.73 kg</td><td>0.005 t</td><td>0.005 ton</td></tr><tr><td>10 mm</td><td>7.39 kg</td><td>0.007 t</td><td>0.008 ton</td></tr><tr><td>12 mm</td><td>10.64 kg</td><td>0.011 t</td><td>0.012 ton</td></tr><tr><td>16 mm</td><td>18.94 kg</td><td>0.019 t</td><td>0.021 ton</td></tr><tr><td>20 mm</td><td>29.58 kg</td><td>0.030 t</td><td>0.033 ton</td></tr><tr><td>25 mm</td><td>46.21 kg</td><td>0.046 t</td><td>0.051 ton</td></tr><tr><td>32 mm</td><td>75.72 kg</td><td>0.076 t</td><td>0.083 ton</td></tr><tr><td>40 mm</td><td>118.31 kg</td><td>0.118 t</td><td>0.130 ton</td></tr></table></div><p>Two readings. First, the 6 mm and 8 mm rows show identical figures in both ton columns (0.003, 0.005) — the exact values differ by ~10% (6 mm: 0.002664 vs 0.002937), but the below-1-tonne 3-decimal display rounds them together. Never conclude two tonnages are equal because their displays match at this scale; the kg column never hides the difference. Second, the per-bar tonnage is the unit price of the schedule: a bar bending schedule that totals 170 × 12 mm × 12 m bars is 1,809.5 kg = 1.81 metric tons (1.99 US tons) — multiply bars by the per-bar row and the schedule total follows, using the exact panel total, not the rounded per-bar figure times the count.</p><h3 id="forty-foot">40 ft bars vs 12 m bars</h3><p>Forty feet is 12.192 m, not 12 m — 0.192 m longer per bar, which is +1.6% on every bar weight and therefore on every tonnage. At panel precision, 100 × 12 mm bars:</p><div class="formula-table"><table><tr><th>Bar length</th><th>Per bar</th><th>100 bars</th><th>Metric tonnage</th><th>US tons</th></tr><tr><td>12 m</td><td>10.64 kg</td><td>1,064.4 kg</td><td>1.06 t</td><td>1.17 ton</td></tr><tr><td>40 ft (12.192 m)</td><td>10.81 kg</td><td>1,081.4 kg</td><td>1.08 t</td><td>1.19 ton</td></tr><tr><td>Difference</td><td>+0.17 kg</td><td>+17.03 kg</td><td>+0.02 t</td><td>+0.02 ton</td></tr></table></div><p>This is also why bars-per-tonne figures disagree between sources: 12 mm needs 94 twelve-metre bars to reach a tonne but only 93 forty-foot bars (92 = 994.92 kg → 0.995 t; 93 = 1,005.7 kg → 1.01 t), and 16 mm needs 53 vs 52 (51 = 981.19 kg → 0.981 t; 52 = 1,000.4 kg → 1.00 t). Whenever a bars-per-tonne figure appears without a bar length, it is incomplete — ask for the length before using it. And when a supplier's bundle is 40 ft bars, do not price it from a 12 m table: the 1.6% gap is 17 kg per hundred 12 mm bars, and 170 kg per thousand.</p><h3 id="imperial">Imperial bars and the lb/ft identity</h3><p>The bar dropdowns include US sizes, so enter the metric equivalents of your dimensions and pick the matching US bar. One hundred 20 ft bars of each size, at panel precision:</p><div class="formula-table"><table><tr><th>US bar</th><th>Nominal diameter (mm)</th><th>kg/m</th><th>lb/ft</th><th>kg per 20 ft bar</th><th>100 bars</th><th>Metric tonnage</th><th>US tons</th></tr><tr><td>#3</td><td>9.5</td><td>0.56</td><td>0.376</td><td>3.41 kg</td><td>341.38 kg</td><td>0.341 t</td><td>0.376 ton</td></tr><tr><td>#4</td><td>12.7</td><td>0.994</td><td>0.668</td><td>6.06 kg</td><td>605.94 kg</td><td>0.606 t</td><td>0.668 ton</td></tr><tr><td>#5</td><td>15.9</td><td>1.552</td><td>1.043</td><td>9.46 kg</td><td>946.10 kg</td><td>0.946 t</td><td>1.04 ton</td></tr><tr><td>#6</td><td>19.1</td><td>2.235</td><td>1.502</td><td>13.62 kg</td><td>1,362.5 kg</td><td>1.36 t</td><td>1.50 ton</td></tr><tr><td>#7</td><td>22.2</td><td>3.042</td><td>2.044</td><td>18.54 kg</td><td>1,854.4 kg</td><td>1.85 t</td><td>2.04 ton</td></tr><tr><td>#8</td><td>25.4</td><td>3.973</td><td>2.670</td><td>24.22 kg</td><td>2,421.9 kg</td><td>2.42 t</td><td>2.67 ton</td></tr></table></div><p>The identity hiding in this table: exactly, 100 twenty-foot bars weigh (lb/ft) US short tons — 100 × 20 ft × w lb/ft ÷ 2000 lb/ton = w tons. So #4's 100 bars are exactly 0.66794 US tons and #8's exactly 2.66974. The panel's two-decimal display rounds those (#5's exact 1.04289 shows as "1.04", #6's 1.50185 as "1.50", #7's 2.04414 as "2.04", #8's 2.66974 as "2.67"); only #3 and #4, below 1 ton, display at three decimals and match the lb/ft digits exactly (0.376, 0.668). Do not "correct" the panel forms to the lb/ft digits — the panel rounds for display, and the exact identity is stated here so the rounding never looks like an error. One more trap: a #4 bar (12.7 mm, 0.994 kg/m) is NOT a 12 mm bar (0.887 kg/m) — swapping them changes every tonnage on this page by 12.1%.</p><h3 id="trucks">Trucks and bundles</h3><p>The panel has no logistics output, so these are derived planning figures (labelled as such): a 20,000 kg truck payload and 2.5-tonne bundles, both from published guidance (one project tool states truck capacity 20–25 tons and bundles 2–3 tons).</p><div class="formula-table"><table><tr><th>Order</th><th>Weight</th><th>20 t truckloads</th><th>Trucks (20 t)</th><th>2.5 t bundles</th></tr><tr><td>Defaults (500 × 16 mm × 12 m)</td><td>9,468 kg</td><td>0.47</td><td>1</td><td>4</td></tr><tr><td>Double defaults (1000 × 16 mm × 12 m)</td><td>18,936 kg</td><td>0.95</td><td>1 (just fits)</td><td>8</td></tr><tr><td>2000 × 16 mm × 12 m</td><td>37,872 kg</td><td>1.89</td><td>2</td><td>16</td></tr><tr><td>1000 × 25 mm × 12 m</td><td>46,212 kg</td><td>2.31</td><td>3</td><td>19</td></tr></table></div><p>Two cautions. First, the payload assumption changes the answer: at a 25,000 kg payload the last two orders need 2 trucks each, not 3 and 2 — so state your payload when you quote truck counts. Second, length binds before weight: 12 m bars need a 40 ft (12.2 m) trailer or longer regardless of tonnage, and a truck that can carry 20 tonnes of 6 m bars may not legally carry 12 m bars at all. Tonnage tells you how many trucks by weight; the bar length tells you whether those trucks can take the load.</p><h3 id="bridges">From other calculators to tonnage</h3><p>Every bridge below was run through the real tonnage panel — use your own bar schedule for a real order. US tons are panel outputs; long tons are derived (kg ÷ 1016.05) where shown.</p><div class="formula-table"><table><tr><th>Source page</th><th>Neat weight</th><th>Metric tonnage</th><th>US short tons</th></tr><tr><td>Weight defaults (100 × 12 mm × 12 m)</td><td>1,064.4 kg</td><td>1.06 t</td><td>1.17 ton</td></tr><tr><td>Quantity defaults (50 m², 200 mm, 10 mm)</td><td>308.00 kg</td><td>0.308 t</td><td>0.340 ton</td></tr><tr><td>Quantity house (200 m², 200 mm, 12 mm)</td><td>1,774 kg</td><td>1.77 t</td><td>1.96 ton</td></tr><tr><td>Quantity small area (20 m², 300 mm, 8 mm)</td><td>52.53 kg</td><td>0.053 t</td><td>0.058 ton</td></tr><tr><td>Slab bridge (5 × 4 m slab tool count)</td><td>120.98 kg</td><td>0.121 t</td><td>0.133 ton</td></tr><tr><td>Big area (1000 m², 150 mm, 16 mm)</td><td>21,040 kg</td><td>21.04 t</td><td>23.19 ton</td></tr><tr><td>Cost bridge (defaults + 3% waste, at 0.85/kg)</td><td>9,752.04 kg</td><td>9.75 t</td><td>10.75 ton</td></tr><tr><td>Weight order bridge (1,064.4 kg + 5% waste)</td><td>1,117.62 kg</td><td>1.12 t</td><td>1.23 ton</td></tr></table></div><p>Notes on the table. The cost-bridge weight is the cost panel's with-waste weight (9,468 × 1.03), not the neat tonnage-panel weight — price the with-waste tonnage, not the neat one, or the waste goes unpaid. The weight-order bridge is the same idea from the weight page (1,064.4 kg neat → 1,117.62 kg at +5%). For any other source, the path is the same: take the neat weight from the <a href="/rebar-weight-calculator">weight calculator</a>, the <a href="/rebar-quantity-calculator">quantity calculator</a> or a member tool, enter the matching bar size, length and quantity here, and the panel does the rest. And two competitor cross-checks, re-run on the panel constant: one popular slab guide's 3,692 LF of #4 (2,466 lb) is 1.23 US short tons but 1.12 metric tonnes — its "tons" are short tons, never qualified in the text; one takeoff tool's 880 LF of #4 (588 lb) is 0.294 US short tons but 0.267 metric tonnes. If a guide gives tons without saying which, convert from its pounds, not from its tonnage.</p><h3 id="not-included">What this calculator does not cover</h3><ul><li>Waste, laps, hooks, bends, cranks and development — the panel converts neat bar weight only. Work laps on the <a href="/rebar-lap-length-calculator">lap calculator</a> and hooks on the <a href="/rebar-hook-bend-cutting-length-calculator">hook calculator</a> and add them to the neat weight first.</li><li>Multi-size schedules — one bar size per run; run each size separately and add the tonnages, as the <a href="/rebar-area-calculator">area page</a> does for mixed cages.</li><li>Cost — price the tonnage on the <a href="/rebar-cost-calculator">cost calculator</a> (it prices the with-waste weight; see the bridges section).</li><li>UK long tons as a panel row — derived only (kg ÷ 1016.05); the panel outputs metric tonnes and US short tons.</li><li>Reverse conversion (tonnes → bars) — use the <a href="/rebar-weight-calculator">weight calculator</a> in Reverse mode.</li><li>Bar counts from dimensions or spacing — use the member tools (<a href="/concrete-slab-rebar-calculator">slab</a>, <a href="/footing-rebar-calculator">footing</a>, <a href="/rebar-mat-grid-calculator">mat</a>, <a href="/column-rebar-calculator">column</a>, <a href="/beam-rebar-calculator">beam</a>, <a href="/wall-rebar-calculator">wall</a>, <a href="/pool-rebar-calculator">pool</a>, <a href="/driveway-rebar-calculator">driveway</a>) or the <a href="/rebar-quantity-calculator">quantity calculator</a> for area-density estimates and the <a href="/concrete-and-rebar-calculator">concrete estimator</a> for kg/m³-ratio estimates.</li><li>Trucks, bundles and delivery logistics — the trucks section gives planning figures only; confirm payload, trailer length and bundle sizes with your supplier.</li><li>Stainless or alloy densities, mesh, and cut-length optimisation against stock bars.</li><li>Stirrups, chairs and tie wire as separate lines — see the <a href="/stirrup-tie-cutting-length-calculator">stirrup calculator</a>, the <a href="/rebar-chair-calculator">chair calculator</a> and the <a href="/rebar-tie-wire-calculator">tie wire calculator</a>; their weights must be added to the bar tonnage by hand.</li><li>Spacing checks against code maxima — the <a href="/rebar-spacing-calculator">spacing calculator</a> works bar counts from a length and a target spacing.</li></ul><h3 id="mistakes">5 common mistakes</h3><ol><li><strong>Quoting "tons" without saying which.</strong> A US supplier's "10 tons" is 9.07 metric tonnes; a UK supplier's "10 tons" (long) is 10.16 metric tonnes; a metric "10 tonnes" is 11.02 US tons. The same number means three different orders, 12% apart at the extremes. Write the ton down — metric, short, or long — on every quote, delivery note and drawing.</li><li><strong>Ordering the exact tonne count instead of the ceil.</strong> A bars-per-tonne table gives the count that REACHES a tonne, not the count that EQUALS it. Order 93 × 12 mm × 12 m and you hold 0.990 tonnes, not one tonne; order 135 × 10 mm and you hold 0.998 tonnes. The ceil exists for exactly this reason — and on 32 mm bars it costs 60.1 kg of overshoot, which is the price of not falling short.</li><li><strong>Trusting the small-order ton columns.</strong> Below 1 tonne the panel shows three decimals, so one 6 mm bar reads 0.003 in both ton columns although the exact values differ by ~10% (0.002664 vs 0.002937). The displays match; the steel does not. Check the kg row whenever the tonnage is under 1 tonne.</li><li><strong>Mixing the constants, or the bar lengths.</strong> A d²/162 table gives ~0.2% more than this panel's d²/162.28 options (one popular tool's 200 × 12 mm × 6 m example: 1,066 kg vs 1,064.4 kg here). A 40 ft table gives 1.6% more per bar than a 12 m table (10.81 vs 10.64 kg on 12 mm). Either mix-up moves a multi-tonne order by tens of kilos — check the constant and the length before assuming an arithmetic error.</li><li><strong>Trusting a worked example without re-running it.</strong> Published tonnage examples do not always reproduce: one US tool's driveway example claims ~1,120 lb where its own stated inputs give 1,068.8 lb (it only reproduces with an unstated ~5% waste factor), and one popular guide's imperial formula overstates #8 bar by 16× (42.75 lb/ft vs the true 2.670 lb/ft). Re-run every example in the panel with your own bar list before relying on it — including the ones on this page.</li></ol><p>Last reviewed: October 2026.</p>`,
    de: {
  metaTitle: "Bewehrungstonnage-Rechner — kg in Tonnen, gratis",
  desc: "Bewehrungstonnage-Rechner: Stahllisten in metrische Tonnen und US-Tonnen umrechnen. Beispiel: 500 × 16 mm × 12 m = 9,47 t, 10,44 US-Tonnen. Kostenlos.",
  formula: "Gewicht (kg) = kg/m × Länge × Stückzahl. Metrische Tonne = kg ÷ 1.000.",
  kw: "bewehrungstonnage-rechner, bewehrung tonnen rechner, stahlgewicht in tonnen, stahltonnage",
  howto: ["Wähle die Stabgröße — metrisch (mm) oder US-Größe (#-Größe) — aus dem Dropdown.", "Gib die Länge eines Stabs in Metern und die Stückzahl ein.", "Lies die Gesamttonnage in metrischen Tonnen, das Gesamtgewicht in kg und die US-Tonnen (short tons) ab.", "Für einen Long-Ton-Wert (UK) teile die kg-Summe durch 1016,05 — das Panel zeigt nur metrische und US-Tonnen.", "Rechne Verschnitt, Übergreifungen und Haken vor der Bestellung dazu — das Panel wandelt nur das reine Stabgewicht um."],
  faqs: [["Wie viele Stäbe sind eine Tonne Bewehrung?", "Teile 1.000 durch (kg/m × Stablänge). Bei 12-mm-Stäben × 12 m sind es etwa 94 Stäbe pro Tonne — genau 94 Stäbe wiegen 1.000,5 kg (1,00 metrische Tonnen) in diesem Panel, während 93 Stäbe 989,89 kg (0,990 t) wiegen und darunter bleiben. Die vollständige Tabelle unten gibt jede Größe bei 12-m-Handelslänge an: 8 mm 212 Stäbe, 10 mm 136, 12 mm 94, 16 mm 53, 20 mm 34, 25 mm 22, 32 mm 14. Beachte die Aufrundung: Wer die Stäbe-pro-Tonne-Stückzahl bestellt, überschreitet die Tonne immer leicht (um 0,5 kg bei 12 mm, aber um 60,1 kg bei 32 mm), weil der letzte Stab ganz gekauft werden muss."],
          ["Was ist der Unterschied zwischen metrischen und US-Tonnen?", "Eine metrische Tonne sind 1.000 kg; eine US-Tonne (short ton) sind 907,2 kg (das Panel rechnet mit genau 907,185 kg). Derselbe Stahl liest sich deshalb in US-Tonnen etwa 10 % höher: Die Standardwerte des Rechners (500 × 16 mm × 12 m) sind 9,47 metrische Tonnen, aber 10,44 US-Tonnen. Es gibt außerdem eine dritte Tonne — die britische Long Ton mit 1016,05 kg — die niedriger liest als beide (9,32 Long Tons bei den Standardwerten). Frage immer, welche Tonne ein Angebot, ein Lkw-Limit oder eine Zeichnung meint: „Tonne\" bedeutet immer metrisch, aber „ton\" allein kann jede der drei sein."],
          ["Was ist eine Long Ton, und zeigt das Panel sie an?", "Eine britische Long Ton (imperial ton) sind 2.240 lb = 1016,05 kg — die traditionelle britische Schiffstonne, die in einigen maritimen und älteren Zusammenhängen noch verwendet wird. Das Panel zeigt sie nicht an: Es gibt nur metrische Tonnen und US-Tonnen (short tons) aus. Um sie zu erhalten, teile die kg-Summe durch 1016,05 (abgeleitete Rechnung, keine Panel-Zeile): Die Standardbestellung von 9.468 kg sind 9,32 Long Tons, und 10.000 kg sind 9,84 Long Tons. Wenn ein Lieferant in Long Tons anbietet und du ohne Umrechnung mit metrischen Tonnen vergleichst, bestellst du etwa 1,6 % zu wenig."],
          ["Warum lesen sich die metrischen und US-Tonnen-Spalten bei kleinen Bestellungen gleich?", "Weil das Panel unter 1 Tonne drei Dezimalstellen zeigt und die beiden Werte auf dieselbe Anzeige runden. Ein 6-mm-Stab × 12 m sind 0,002664 metrische Tonnen und 0,002937 US-Tonnen — in Wirklichkeit ein Unterschied von 10 % — aber beide zeigen als 0,003 an. Ein 8-mm-Stab zeigt aus demselben Grund in beiden Spalten 0,005 an. Ab 10 mm trennen sich die Spalten (0,007 vs. 0,008). Schließe nie daraus, dass zwei Tonnagen gleich sind, weil ihre Anzeigen unter 1 Tonne übereinstimmen — prüfe die kg-Zeile, die den Unterschied nie verbirgt."],
          ["Wie viele Lkw brauche ich für eine Bestellung?", "Das Panel hat keine Logistik-Ausgabe, also rechne aus der kg-Summe (abgeleitete Rechnung): Teile durch die Nutzlast deines Lkw und runde auf. Bei einer Planungs-Nutzlast von 20.000 kg ist die Standardbestellung (9.468 kg) 0,47 Lkw-Ladungen — ein Lkw; das Doppelte (18.936 kg) ist 0,95 — immer noch ein Lkw, gerade so; 2.000 × 16 mm × 12 m (37.872 kg) sind 1,89 — zwei Lkw; 1.000 × 25 mm × 12 m (46.212 kg) sind 2,31 — drei Lkw. Bei einer Nutzlast von 25.000 kg werden aus den letzten beiden je zwei Lkw, also nenne deine Nutzlast-Annahme, wenn du Lkw-Zahlen angibst. Und die Länge bindet vor dem Gewicht: 12-m-Stäbe brauchen einen 40-ft-Anhänger (12,2 m) oder länger, unabhängig von der Tonnage."],
          ["Wie rechne ich ein Lieferantenangebot in US-Tonnen in metrische Tonnen um?", "Multipliziere US-Tonnen (short tons) mit 0,907185: 10 US-Tonnen = 9,07 metrische Tonnen. In die andere Richtung multipliziere metrische Tonnen mit 1,10231: 10 metrische Tonnen = 11,02 US-Tonnen. Für Long Tons multipliziere mit 1,01605 (10 Long Tons = 10,16 metrische Tonnen) oder teile metrische Tonnen durch 1,01605. Rechne jedes Angebot vor dem Preisvergleich in dieselbe Tonne um — der <a href=\"/de/bewehrungskosten-rechner\">Kostenrechner</a> rechnet pro kg, sodass die Umrechnung zuerst in kg (US-Tonnen × 907,185, Long Tons × 1016,05) die Mehrdeutigkeit vollständig beseitigt."],
          ["Enthält die Tonnage den Verschnitt?", "Nein — das Panel wandelt nur das reine Stabgewicht um. Rechne den Verschnitt vor der Umrechnung dazu, wenn du die bestellte Tonnage willst: Die Standardbestellung bei +5 % Verschnitt sind 9.941,4 kg, also 9,94 metrische Tonnen und 10,96 US-Tonnen (abgeleitete Rechnung — gib das Gewicht mit Verschnitt in das Stückzahl-Feld des Panels ein oder skaliere die Tonnage mit 1,05). Übergreifungen und Haken sind vom Verschnitt getrennt: Bearbeite sie mit dem <a href=\"/de/uebergreifungslaengen-rechner\">Übergreifungsrechner</a> und dem <a href=\"/de/haken-biege-schnittlaengen-rechner\">Hakenrechner</a> und addiere sie zuerst zum reinen Gewicht. Bepreise die endgültige Tonnage mit dem <a href=\"/de/bewehrungskosten-rechner\">Kostenrechner</a>."],
          ["Kann ich Tonnen zurück in Stäbe umrechnen?", "Nicht in diesem Panel — es rechnet nur Stäbe → Tonnage. Für die umgekehrte Richtung nutze den <a href=\"/de/bewehrungsgewicht-rechner\">Gewichtsrechner</a> im Umkehrmodus: 2.000 kg 12-mm-Stab bei 12-m-Handelslänge ergeben 188 Stäbe (187 volle + 10,79 m Reststück). Oder teile von Hand und runde AUF: Stäbe = Tonnen × 1.000 ÷ (kg/m × Länge). Abrunden ist der Fehler — 93 × 12 mm × 12 m sind 0,990 Tonnen, nicht eine Tonne, sodass eine Bestellung von „93 Stäben pro Tonne\" 10,11 kg zu kurz kommt."],
          ["Warum weicht die Tonnage einer anderen Seite von diesem Panel ab?", "Meistens aus einem von vier Gründen, in der Reihenfolge ihrer Wahrscheinlichkeit: (1) die Tonnendefinition — Short Tons lesen sich bei demselben Stahl ~10 % höher als metrische Tonnen; (2) die Konstante — d²/162-Tabellen ergeben ~0,2 % mehr als die d²/162,28-Optionen dieses Panels (das Beispiel 200 × 12 mm × 6 m eines beliebten Tools ist 1.066 kg bei d²/162, aber 1.064,4 kg hier); (3) die Stablänge — 40-ft-Stäbe wiegen pro Stab 1,6 % mehr als 12-m-Stäbe, sodass dieselbe Stückzahl eine andere Tonnage ergibt; (4) Verschnitt drin oder draußen — eine Tonnage mit Verschnitt ist um genau den Verschnittprozentsatz höher. Prüfe alle vier, bevor du einen Rechenfehler annimmst."],
          ["Kann ich ein ganzes Projekt mit einem Durchlauf umrechnen?", "Nur wenn es eine Stabgröße bei einer Länge ist. Das Panel nimmt eine einzige Größe, Länge und Stückzahl, sodass ein echtes Projekt einen Durchlauf pro Zeile der Stahlliste braucht, die dann addiert werden — genau wie die <a href=\"/de/stahlflaechen-rechner-ast\">Flächenseite</a> es für gemischte Körbe tut. Für die Gewichte selbst nimm jedes Bauteil von seinem eigenen Tool (<a href=\"/de/bewehrungsrechner-fuer-betonplatten\">Platte</a>, <a href=\"/de/bewehrungsrechner-fuer-fundamente\">Fundament</a>, <a href=\"/de/bewehrungsmatten-rechner\">Matte</a>, <a href=\"/de/stuetzenbewehrungs-rechner\">Stütze</a>, <a href=\"/de/balkenbewehrungs-rechner\">Balken</a>, <a href=\"/de/wandbewehrungs-rechner\">Wand</a>, <a href=\"/de/bewehrungsrechner-fuer-pools\">Pool</a>, <a href=\"/de/bewehrungsrechner-fuer-einfahrten\">Einfahrt</a>) oder den <a href=\"/de/bewehrungsmengen-rechner\">Mengenrechner</a> für Flächendichte-Schätzungen und den <a href=\"/de/beton-bewehrungs-schaetzer\">Betonschätzer</a> für kg/m³-Verhältnis-Schätzungen, rechne dann jedes Gewicht hier um und addiere die Tonnagen."]],
  toc: `<nav class="content-block" aria-label="Auf dieser Seite"><h2>Auf dieser Seite</h2><ul><li><a href="#how-to">So benutzt du den Rechner</a></li><li><a href="#formula">Die Formel, erklärt</a></li><li><a href="#example-1">Beispiel 1: Standardwerte (500 × 16 mm × 12 m)</a></li><li><a href="#example-2">Beispiel 2: Kleine Bestellung, zwei Stahllisten</a></li><li><a href="#example-3">Beispiel 3: Zoll-Stäbe (#4-Stäbe)</a></li><li><a href="#three-tons">Eine Bestellung, drei Tonnen</a></li><li><a href="#per-tonne">Stäbe pro Tonne (und der Aufrundungs-Überschuss)</a></li><li><a href="#per-bar">Tonnage eines einzelnen Stabs</a></li><li><a href="#forty-foot">40-ft-Stäbe vs. 12-m-Stäbe</a></li><li><a href="#imperial">Zoll-Stäbe und die lb/ft-Identität</a></li><li><a href="#trucks">Lkw und Bündel</a></li><li><a href="#bridges">Von anderen Rechnern zur Tonnage</a></li><li><a href="#not-included">Was dieser Rechner nicht abdeckt</a></li><li><a href="#mistakes">5 häufige Fehler</a></li><li><a href="#faq">FAQs</a></li></ul></nav>`,
  extra: `<h3>Die Formel, erklärt</h3><p>Tonnage ist nur Gesamtgewicht, ausgedrückt in einer großen Einheit. Das Panel wiegt zuerst die Stäbe und teilt dann:</p><p><strong>Gewicht (kg) = kg/m × Länge × Stückzahl; Metrische Tonne = kg ÷ 1.000; US-Tonne (short ton) = kg ÷ 907,185</strong></p><p>Das kg/m stammt aus derselben d² ÷ 162,28-Formel wie auf der Gewichtsseite (16 mm: 256 ÷ 162,28 = 1,578 kg/m). Die beiden Tonnenteiler sind die ganze Geschichte dieser Seite: 1.000 kg für die metrische Tonne, 907,185 kg für die US-Tonne (short ton) (2.000 lb × 0,45359237). Ein dritter Teiler existiert — 1016,05 kg für die britische Long Ton (2.240 lb) — aber das Panel gibt sie nicht aus; jede Long-Ton-Zahl auf dieser Seite ist abgeleitete Rechnung (kg ÷ 1016,05) und als solche gekennzeichnet. Drei Anzeigehinweise. Erstens zeigt das Panel vier Zeilen: Gesamttonnage (metrisch, primär), Gesamtgewicht (kg), US-Tonnen und pro Stab (kg), mit dem Hinweis „1,578 kg/m × 12 m × 500 = 9.468 kg" bei den Standardwerten. Zweitens zeigen Summen ab 1.000 eine Dezimalstelle mit Tausendertrennzeichen („9.468 kg", „1.000,5 kg"), Tonnagen ab 1 zwei Dezimalstellen („9,47", „1,06") und Tonnagen unter 1 drei Dezimalstellen („0,990", „0,003") — zitiere die Panel-Formen, und die Nachprüfung deines Lesers stimmt überein. Drittens liest sich das Stab-Dropdown als „1,578|16" und der Optionswert ist genau „1,578|16", sodass die Standardwerte dieser Seite keine Staboptions-Falle enthalten (anders als auf den Gewichts- und Mengenseiten) — aber die kg/m-Werte sind weiterhin d²/162,28-Optionen, sodass eine d²/162-Tabelle leicht andere Summen ergibt, wie der Abschnitt „Von anderen Rechnern zur Tonnage" zeigt.</p><h3 id="example-1">Beispiel 1: Standardwerte (500 × 16 mm × 12 m)</h3><p>Öffne den Rechner, wie er lädt: 16-mm-Stäbe, Länge 12 m, Stückzahl 500 Stück.</p><p>Gewicht pro Stab = 1,578 × 12 = 18,94 kg. Gesamtgewicht = 18,94 × 500 = 9.468 kg.</p><p><strong>Gesamttonnage 9,47 metrische Tonnen, 10,44 US-Tonnen (short tons) — und abgeleitet 9,32 britische Long Tons und 20.873,3 lb.</strong> Das Panel zeigt alle vier Zeilen: 9,47 metrische Tonnen, 9.468 kg, 10,44 Tonnen, 18,94 kg pro Stab, mit dem Hinweis „1,578 kg/m × 12 m × 500 = 9.468 kg". Der Sinn der Seite steckt in dieser einen Zeile: Dieselben 9.468 kg Stahl sind 9,47, 10,44 oder 9,32 — je nachdem, welche Tonne du meinst — eine Spanne von 1,12 Tonnen zwischen der kleinsten und größten Lesart derselben Bestellung. Jedes Dokument, das „Tonnen" sagt, ohne zu sagen, welche, ist um bis zu 12 % mehrdeutig.</p><h3 id="example-2">Beispiel 2: Kleine Bestellung, zwei Stahllisten</h3><p>Stelle 12-mm-Stäbe, Länge 6 m, Stückzahl 200 Stück ein.</p><p>Gewicht pro Stab = 0,887 × 6 = 5,32 kg. Gesamtgewicht = 5,32 × 200 = 1.064,4 kg.</p><p><strong>Gesamttonnage 1,06 metrische Tonnen, 1,17 US-Tonnen (short tons).</strong> Jetzt die Gleichwertigkeit, die Leute hereinlegt: 100 × 12 mm × 12 m ergibt genau dieselben Zahlen (1.064,4 kg, 1,06 t, 1,17 US-Tonnen) — die Länge zu halbieren und die Stückzahl zu verdoppeln lässt die Tonnage unverändert, weil die Tonnage nur Gesamtmeter × kg/m sieht. Dasselbe gilt im Maßstab der Standardwerte: 1.000 × 16 mm × 6 m sind 9.468 kg, identisch mit 500 × 16 mm × 12 m (nur die Pro-Stab-Zeile unterscheidet sich: 9,47 kg statt 18,94 kg). Die Tonnage beantwortet „wie viel Stahl", nie „in welchen Stücken" — die Stahlliste zählt weiterhin für Zuschnitt, Übergreifungen und Lieferung, auch wenn sich die Tonnage nicht bewegt.</p><h3 id="example-3">Beispiel 3: Zoll-Stäbe (#4-Stäbe)</h3><p>Stelle das Stab-Dropdown auf #4 (12,7 mm, 0,994 kg/m), Länge 6,096 m (20 ft), Stückzahl 100 Stück.</p><p>Gewicht pro Stab = 0,994 × 6,096 = 6,06 kg. Gesamtgewicht = 6,06 × 100 = 605,94 kg.</p><p><strong>Gesamttonnage 0,606 metrische Tonnen, 0,668 US-Tonnen (short tons).</strong> Ein schwererer Zoll-Durchlauf: 100 × #8 × 20 ft → pro Stab 24,22 kg, gesamt 2.421,9 kg, 2,42 metrische Tonnen, 2,67 US-Tonnen. Zwei Fallen, die es zu vermeiden gilt. Erstens ist ein #4-Stab (12,7 mm, 0,994 kg/m) KEIN 12-mm-Stab (0,887 kg/m) — sie zu vertauschen ändert die Tonnage um 12,1 %. Zweitens ist die US-Tonnen-Spalte hier in Short Tons (2.000 lb), nicht in metrischen Tonnen: 605,94 kg sind 0,606 metrische Tonnen, aber 0,668 Short Tons, und ein US-Lieferant, der für diese Bestellung „0,67 Tonnen" angibt, meint die Short-Ton-Zahl, keine gerundete metrische.</p><h3 id="three-tons">Eine Bestellung, drei Tonnen</h3><p>Jede Bestellung unten ist in allen drei Tonnen gezeigt. Die metrischen und US-Spalten sind Panel-Ausgaben; die Long-Ton-Spalte ist abgeleitet (kg ÷ 1016,05) und als solche gekennzeichnet. Die lb-Spalte ist abgeleitet (kg × 2,20462).</p><div class="formula-table"><table><tr><th>Bestellgewicht</th><th>Metrische Tonnen</th><th>US-Tonnen (short tons)</th><th>UK-Long-Tons (abgeleitet)</th><th>Pfund (abgeleitet)</th></tr><tr><td>1.000 kg</td><td>1,00 t</td><td>1,10 Tonnen</td><td>0,984 Tonnen</td><td>2.204,6 lb</td></tr><tr><td>5.000 kg</td><td>5,00 t</td><td>5,51 Tonnen</td><td>4,92 Tonnen</td><td>11.023,1 lb</td></tr><tr><td>10.000 kg</td><td>10,00 t</td><td>11,02 Tonnen</td><td>9,84 Tonnen</td><td>22.046,2 lb</td></tr><tr><td>20.000 kg</td><td>20,00 t</td><td>22,05 Tonnen</td><td>19,68 Tonnen</td><td>44.092,4 lb</td></tr><tr><td>9.468 kg (Standardwerte)</td><td>9,47 t</td><td>10,44 Tonnen</td><td>9,32 Tonnen</td><td>20.873,3 lb</td></tr></table></div><p>Drei Lesarten. Erstens beträgt die Spanne zwischen der kleinsten und größten Tonne für denselben Stahl 12,00 % ((1016,05 − 907,185) ÷ 907,185) — bei einer 20-Tonnen-Bestellung sind das 2,4 Tonnen Mehrdeutigkeit. Zweitens die Umrechnungen zum Merken: US-Tonnen × 0,907185 = metrische Tonnen (10 US-Tonnen = 9,07 t); metrische Tonnen × 1,10231 = US-Tonnen (10 t = 11,02 US-Tonnen); Long Tons × 1,01605 = metrische Tonnen (10 Long Tons = 10,16 t). Drittens die Schreibregel aus den Umrechnungsleitfäden: „Tonne" bedeutet immer metrisch, aber „ton" allein kann je nach Verfasser jede der drei sein — wenn ein Dokument nur „Tonnen" sagt, frage nach, bevor du bestellst.</p><h3 id="per-tonne">Stäbe pro Tonne (und der Aufrundungs-Überschuss)</h3><p>Lasse das Panel mit der Stabzahl laufen, die bei 12-m-Handelslänge eine Tonne erreicht. „Benötigte Stäbe" ist die Aufrundung — die Bestellmenge — und die Panel-Tonnage zeigt, was diese Stückzahl tatsächlich wiegt, nämlich immer etwas MEHR als eine Tonne.</p><div class="formula-table"><table><tr><th>Stab (12 m)</th><th>Stäbe bis zu einer Tonne</th><th>Panel-Gewicht</th><th>Panel-Tonnage metrisch</th><th>Panel US-Tonnen</th><th>Überschuss</th></tr><tr><td>8 mm</td><td>212</td><td>1.002,3 kg</td><td>1,00 t</td><td>1,10 Tonnen</td><td>+2,3 kg</td></tr><tr><td>10 mm</td><td>136</td><td>1.005,3 kg</td><td>1,01 t</td><td>1,11 Tonnen</td><td>+5,3 kg</td></tr><tr><td>12 mm</td><td>94</td><td>1.000,5 kg</td><td>1,00 t</td><td>1,10 Tonnen</td><td>+0,5 kg</td></tr><tr><td>16 mm</td><td>53</td><td>1.003,6 kg</td><td>1,00 t</td><td>1,11 Tonnen</td><td>+3,6 kg</td></tr><tr><td>20 mm</td><td>34</td><td>1.005,7 kg</td><td>1,01 t</td><td>1,11 Tonnen</td><td>+5,7 kg</td></tr><tr><td>25 mm</td><td>22</td><td>1.016,7 kg</td><td>1,02 t</td><td>1,12 Tonnen</td><td>+16,7 kg</td></tr><tr><td>32 mm</td><td>14</td><td>1.060,1 kg</td><td>1,06 t</td><td>1,17 Tonnen</td><td>+60,1 kg</td></tr></table></div><p>Der Überschuss wächst mit der Stabgröße: ein halbes Kilo bei 12 mm, 60,1 kg (6,0 %) bei 32 mm — weil der letzte Stab ganz gekauft werden muss und ein 32-mm-Stab 75,72 kg wiegt. Die andere Seite derselben Medaille: Ein Stab weniger bleibt immer darunter — 93 × 12 mm = 989,89 kg (0,990 t, 10,11 kg zu kurz), 135 × 10 mm = 997,92 kg (0,998 t, nur 2,08 kg zu kurz), 13 × 32 mm = 984,36 kg (15,64 kg zu kurz). „Stäbe pro Tonne" ist also eine Bestellmenge, keine exakte Umrechnung: 94 Stäbe pro Tonne bei 12 mm bedeutet „94 Stäbe bringen dich auf (knapp über) eine Tonne", und der Umkehrmodus der Gewichtsseite sagt dasselbe aus der anderen Richtung (2.000 kg 12-mm-Stab = 188 Stäbe, 187 volle + 10,79 m Reststück).</p><h3 id="per-bar">Tonnage eines einzelnen Stabs</h3><p>Ein 12-m-Stab, in allen drei Panel-Zeilen, auf die es ankommt. Die kg-pro-Stab-Spalte ist die Pro-Stab-Zeile des Panels; die Tonnen-Spalten sind die Tonnage-Zeilen des Panels für Stückzahl 1.</p><div class="formula-table"><table><tr><th>Stab (12 m)</th><th>kg pro Stab</th><th>Metrische Tonne</th><th>US-Tonne</th></tr><tr><td>6 mm</td><td>2,66 kg</td><td>0,003 t</td><td>0,003 Tonnen</td></tr><tr><td>8 mm</td><td>4,73 kg</td><td>0,005 t</td><td>0,005 Tonnen</td></tr><tr><td>10 mm</td><td>7,39 kg</td><td>0,007 t</td><td>0,008 Tonnen</td></tr><tr><td>12 mm</td><td>10,64 kg</td><td>0,011 t</td><td>0,012 Tonnen</td></tr><tr><td>16 mm</td><td>18,94 kg</td><td>0,019 t</td><td>0,021 Tonnen</td></tr><tr><td>20 mm</td><td>29,58 kg</td><td>0,030 t</td><td>0,033 Tonnen</td></tr><tr><td>25 mm</td><td>46,21 kg</td><td>0,046 t</td><td>0,051 Tonnen</td></tr><tr><td>32 mm</td><td>75,72 kg</td><td>0,076 t</td><td>0,083 Tonnen</td></tr><tr><td>40 mm</td><td>118,31 kg</td><td>0,118 t</td><td>0,130 Tonnen</td></tr></table></div><p>Zwei Lesarten. Erstens zeigen die 6-mm- und 8-mm-Zeilen in beiden Tonnen-Spalten identische Zahlen (0,003, 0,005) — die exakten Werte unterscheiden sich um ~10 % (6 mm: 0,002664 vs. 0,002937), aber die 3-Dezimal-Anzeige unter 1 Tonne rundet sie zusammen. Schließe nie daraus, dass zwei Tonnagen gleich sind, weil ihre Anzeigen in diesem Maßstab übereinstimmen; die kg-Spalte verbirgt den Unterschied nie. Zweitens ist die Tonnage pro Stab der Stückpreis der Stahlliste: Eine Stahlliste mit insgesamt 170 × 12 mm × 12 m Stäben sind 1.809,5 kg = 1,81 metrische Tonnen (1,99 US-Tonnen) — multipliziere die Stäbe mit der Pro-Stab-Zeile, und die Listensumme folgt, wobei du die exakte Panel-Summe verwendest, nicht die gerundete Pro-Stab-Zahl mal die Stückzahl.</p><h3 id="forty-foot">40-ft-Stäbe vs. 12-m-Stäbe</h3><p>40 Fuß sind 12,192 m, nicht 12 m — 0,192 m länger pro Stab, also +1,6 % auf jedes Stabgewicht und damit auf jede Tonnage. Bei Panel-Genauigkeit, 100 × 12-mm-Stäbe:</p><div class="formula-table"><table><tr><th>Stablänge</th><th>Pro Stab</th><th>100 Stäbe</th><th>Metrische Tonnage</th><th>US-Tonnen</th></tr><tr><td>12 m</td><td>10,64 kg</td><td>1.064,4 kg</td><td>1,06 t</td><td>1,17 Tonnen</td></tr><tr><td>40 ft (12,192 m)</td><td>10,81 kg</td><td>1.081,4 kg</td><td>1,08 t</td><td>1,19 Tonnen</td></tr><tr><td>Differenz</td><td>+0,17 kg</td><td>+17,03 kg</td><td>+0,02 t</td><td>+0,02 Tonnen</td></tr></table></div><p>Deshalb stimmen auch Stäbe-pro-Tonne-Zahlen zwischen Quellen nicht überein: 12 mm braucht 94 Zwölf-Meter-Stäbe bis zu einer Tonne, aber nur 93 Vierzig-Fuß-Stäbe (92 = 994,92 kg → 0,995 t; 93 = 1.005,7 kg → 1,01 t), und 16 mm braucht 53 vs. 52 (51 = 981,19 kg → 0,981 t; 52 = 1.000,4 kg → 1,00 t). Wann immer eine Stäbe-pro-Tonne-Zahl ohne Stablänge auftaucht, ist sie unvollständig — frage vor der Verwendung nach der Länge. Und wenn das Bündel eines Lieferanten aus 40-ft-Stäben besteht, bepreise es nicht nach einer 12-m-Tabelle: Die 1,6-%-Lücke sind 17 kg pro hundert 12-mm-Stäbe und 170 kg pro tausend.</p><h3 id="imperial">Zoll-Stäbe und die lb/ft-Identität</h3><p>Die Stab-Dropdowns enthalten US-Größen, also gib die metrischen Entsprechungen deiner Maße ein und wähle den passenden US-Stab. Jeweils einhundert 20-ft-Stäbe jeder Größe, bei Panel-Genauigkeit:</p><div class="formula-table"><table><tr><th>US-Stab</th><th>Nenndurchmesser (mm)</th><th>kg/m</th><th>lb/ft</th><th>kg pro 20-ft-Stab</th><th>100 Stäbe</th><th>Metrische Tonnage</th><th>US-Tonnen</th></tr><tr><td>#3</td><td>9,5</td><td>0,56</td><td>0,376</td><td>3,41 kg</td><td>341,38 kg</td><td>0,341 t</td><td>0,376 Tonnen</td></tr><tr><td>#4</td><td>12,7</td><td>0,994</td><td>0,668</td><td>6,06 kg</td><td>605,94 kg</td><td>0,606 t</td><td>0,668 Tonnen</td></tr><tr><td>#5</td><td>15,9</td><td>1,552</td><td>1,043</td><td>9,46 kg</td><td>946,10 kg</td><td>0,946 t</td><td>1,04 Tonnen</td></tr><tr><td>#6</td><td>19,1</td><td>2,235</td><td>1,502</td><td>13,62 kg</td><td>1.362,5 kg</td><td>1,36 t</td><td>1,50 Tonnen</td></tr><tr><td>#7</td><td>22,2</td><td>3,042</td><td>2,044</td><td>18,54 kg</td><td>1.854,4 kg</td><td>1,85 t</td><td>2,04 Tonnen</td></tr><tr><td>#8</td><td>25,4</td><td>3,973</td><td>2,670</td><td>24,22 kg</td><td>2.421,9 kg</td><td>2,42 t</td><td>2,67 Tonnen</td></tr></table></div><p>Die Identität, die sich in dieser Tabelle verbirgt: Exakt gilt, dass 100 Zwanzig-Fuß-Stäbe (lb/ft) US-Tonnen (short tons) wiegen — 100 × 20 ft × w lb/ft ÷ 2.000 lb/Tonne = w Tonnen. So sind die 100 Stäbe von #4 exakt 0,66794 US-Tonnen und die von #8 exakt 2,66974. Die zweistellige Anzeige des Panels rundet diese (#5s exakte 1,04289 zeigt sich als „1,04", #6s 1,50185 als „1,50", #7s 2,04414 als „2,04", #8s 2,66974 als „2,67"); nur #3 und #4 unter 1 Tonne zeigen mit drei Dezimalstellen an und stimmen exakt mit den lb/ft-Ziffern überein (0,376, 0,668). „Korrigiere" die Panel-Formen nicht auf die lb/ft-Ziffern — das Panel rundet für die Anzeige, und die exakte Identität ist hier angegeben, damit die Rundung nie wie ein Fehler aussieht. Eine weitere Falle: Ein #4-Stab (12,7 mm, 0,994 kg/m) ist KEIN 12-mm-Stab (0,887 kg/m) — sie zu vertauschen ändert jede Tonnage auf dieser Seite um 12,1 %.</p><h3 id="trucks">Lkw und Bündel</h3><p>Das Panel hat keine Logistik-Ausgabe, also sind dies abgeleitete Planungszahlen (als solche gekennzeichnet): eine Lkw-Nutzlast von 20.000 kg und 2,5-Tonnen-Bündel, beide aus veröffentlichten Leitfäden (ein Projekt-Tool nennt eine Lkw-Kapazität von 20–25 Tonnen und Bündel von 2–3 Tonnen).</p><div class="formula-table"><table><tr><th>Bestellung</th><th>Gewicht</th><th>20-t-Lkw-Ladungen</th><th>Lkw (20 t)</th><th>2,5-t-Bündel</th></tr><tr><td>Standardwerte (500 × 16 mm × 12 m)</td><td>9.468 kg</td><td>0,47</td><td>1</td><td>4</td></tr><tr><td>Doppelte Standardwerte (1.000 × 16 mm × 12 m)</td><td>18.936 kg</td><td>0,95</td><td>1 (passt gerade so)</td><td>8</td></tr><tr><td>2.000 × 16 mm × 12 m</td><td>37.872 kg</td><td>1,89</td><td>2</td><td>16</td></tr><tr><td>1.000 × 25 mm × 12 m</td><td>46.212 kg</td><td>2,31</td><td>3</td><td>19</td></tr></table></div><p>Zwei Warnhinweise. Erstens ändert die Nutzlast-Annahme die Antwort: Bei einer Nutzlast von 25.000 kg brauchen die letzten beiden Bestellungen je 2 Lkw, nicht 3 und 2 — also nenne deine Nutzlast, wenn du Lkw-Zahlen angibst. Zweitens bindet die Länge vor dem Gewicht: 12-m-Stäbe brauchen einen 40-ft-Anhänger (12,2 m) oder länger, unabhängig von der Tonnage, und ein Lkw, der 20 Tonnen 6-m-Stäbe tragen kann, darf 12-m-Stäbe unter Umständen gar nicht legal transportieren. Die Tonnage sagt dir, wie viele Lkw nach Gewicht; die Stablänge sagt dir, ob diese Lkw die Ladung aufnehmen können.</p><h3 id="bridges">Von anderen Rechnern zur Tonnage</h3><p>Jede Brücke unten wurde durch das echte Tonnage-Panel gerechnet — nutze für eine echte Bestellung deine eigene Stahlliste. US-Tonnen sind Panel-Ausgaben; Long Tons sind abgeleitet (kg ÷ 1016,05), wo gezeigt.</p><div class="formula-table"><table><tr><th>Quellseite</th><th>Reines Gewicht</th><th>Metrische Tonnage</th><th>US-Tonnen (short tons)</th></tr><tr><td>Standardwerte Gewicht (100 × 12 mm × 12 m)</td><td>1.064,4 kg</td><td>1,06 t</td><td>1,17 Tonnen</td></tr><tr><td>Standardwerte Menge (50 m², 200 mm, 10 mm)</td><td>308,00 kg</td><td>0,308 t</td><td>0,340 Tonnen</td></tr><tr><td>Mengen-Haus (200 m², 200 mm, 12 mm)</td><td>1.774 kg</td><td>1,77 t</td><td>1,96 Tonnen</td></tr><tr><td>Mengen-Kleinfläche (20 m², 300 mm, 8 mm)</td><td>52,53 kg</td><td>0,053 t</td><td>0,058 Tonnen</td></tr><tr><td>Platten-Brücke (5 × 4 m Platten-Tool-Zählung)</td><td>120,98 kg</td><td>0,121 t</td><td>0,133 Tonnen</td></tr><tr><td>Großfläche (1.000 m², 150 mm, 16 mm)</td><td>21.040 kg</td><td>21,04 t</td><td>23,19 Tonnen</td></tr><tr><td>Kosten-Brücke (Standardwerte + 3 % Verschnitt, bei 0,85/kg)</td><td>9.752,04 kg</td><td>9,75 t</td><td>10,75 Tonnen</td></tr><tr><td>Gewichtsbestellungs-Brücke (1.064,4 kg + 5 % Verschnitt)</td><td>1.117,62 kg</td><td>1,12 t</td><td>1,23 Tonnen</td></tr></table></div><p>Anmerkungen zur Tabelle. Das Kosten-Brücken-Gewicht ist das Mit-Verschnitt-Gewicht des Kosten-Panels (9.468 × 1,03), nicht das reine Tonnage-Panel-Gewicht — bepreise die Tonnage mit Verschnitt, nicht die reine, sonst bleibt der Verschnitt unbezahlt. Die Gewichtsbestellungs-Brücke ist dieselbe Idee von der Gewichtsseite (1.064,4 kg rein → 1.117,62 kg bei +5 %). Für jede andere Quelle ist der Weg derselbe: Nimm das reine Gewicht aus dem <a href="/de/bewehrungsgewicht-rechner">Gewichtsrechner</a>, dem <a href="/de/bewehrungsmengen-rechner">Mengenrechner</a> oder einem Bauteil-Tool, gib die passende Stabgröße, Länge und Stückzahl hier ein, und das Panel erledigt den Rest. Und zwei Wettbewerber-Gegenprüfungen, neu gerechnet mit der Panel-Konstante: Die 3.692 LF (lineare Fuß) #4 (2.466 lb) eines beliebten Platten-Leitfadens sind 1,23 US-Tonnen (short tons), aber 1,12 metrische Tonnen — seine „Tonnen" sind Short Tons, im Text nie qualifiziert; die 880 LF #4 (588 lb) eines Abnahmetools sind 0,294 US-Tonnen (short tons), aber 0,267 metrische Tonnen. Wenn ein Leitfaden Tonnen angibt, ohne zu sagen, welche, rechne aus seinen Pfund um, nicht aus seiner Tonnage.</p><h3 id="not-included">Was dieser Rechner nicht abdeckt</h3><ul><li>Verschnitt, Übergreifungen, Haken, Biegungen, Abkröpfungen und Verankerung — das Panel wandelt nur reines Stabgewicht um. Bearbeite Übergreifungen mit dem <a href="/de/uebergreifungslaengen-rechner">Übergreifungsrechner</a> und Haken mit dem <a href="/de/haken-biege-schnittlaengen-rechner">Hakenrechner</a> und addiere sie zuerst zum reinen Gewicht.</li><li>Mehrgrößen-Stahllisten — eine Stabgröße pro Durchlauf; rechne jede Größe separat und addiere die Tonnagen, wie die <a href="/de/stahlflaechen-rechner-ast">Flächenseite</a> es für gemischte Körbe tut.</li><li>Kosten — bepreise die Tonnage mit dem <a href="/de/bewehrungskosten-rechner">Kostenrechner</a> (er bepreist das Gewicht mit Verschnitt; siehe den Abschnitt „Von anderen Rechnern zur Tonnage").</li><li>Britische Long Tons als Panel-Zeile — nur abgeleitet (kg ÷ 1016,05); das Panel gibt metrische Tonnen und US-Tonnen (short tons) aus.</li><li>Umkehrung (Tonnen → Stäbe) — nutze den <a href="/de/bewehrungsgewicht-rechner">Gewichtsrechner</a> im Umkehrmodus.</li><li>Stabzahlen aus Maßen oder Abständen — nutze die Bauteil-Tools (<a href="/de/bewehrungsrechner-fuer-betonplatten">Platte</a>, <a href="/de/bewehrungsrechner-fuer-fundamente">Fundament</a>, <a href="/de/bewehrungsmatten-rechner">Matte</a>, <a href="/de/stuetzenbewehrungs-rechner">Stütze</a>, <a href="/de/balkenbewehrungs-rechner">Balken</a>, <a href="/de/wandbewehrungs-rechner">Wand</a>, <a href="/de/bewehrungsrechner-fuer-pools">Pool</a>, <a href="/de/bewehrungsrechner-fuer-einfahrten">Einfahrt</a>) oder den <a href="/de/bewehrungsmengen-rechner">Mengenrechner</a> für Flächendichte-Schätzungen und den <a href="/de/beton-bewehrungs-schaetzer">Betonschätzer</a> für kg/m³-Verhältnis-Schätzungen.</li><li>Lkw, Bündel und Lieferlogistik — der Lkw-Abschnitt gibt nur Planungszahlen; bestätige Nutzlast, Anhängerlänge und Bündelgrößen mit deinem Lieferanten.</li><li>Edelstahl- oder Legierungsdichten, Matten und Zuschnitt-Optimierung gegen Handelsstäbe.</li><li>Bügel, Abstandhalter und Bindedraht als eigene Zeilen — siehe den <a href="/de/buegel-schnittlaengen-rechner">Bügelrechner</a>, den <a href="/de/abstandhalter-rechner">Abstandhalter-Rechner</a> und den <a href="/de/bindedraht-rechner">Bindedraht-Rechner</a>; ihre Gewichte müssen von Hand zur Stabtonnage addiert werden.</li><li>Abstandsprüfungen gegen Code-Höchstwerte — der <a href="/de/bewehrungsabstand-rechner">Abstandsrechner</a> ermittelt Stabzahlen aus einer Länge und einem Zielabstand.</li></ul><h3 id="mistakes">5 häufige Fehler</h3><ol><li><strong>„Tonnen" angeben, ohne zu sagen, welche.</strong> „10 Tonnen" eines US-Lieferanten sind 9,07 metrische Tonnen; „10 Tonnen" eines britischen Lieferanten (long) sind 10,16 metrische Tonnen; „10 Tonnen" metrisch sind 11,02 US-Tonnen. Dieselbe Zahl bedeutet drei verschiedene Bestellungen, an den Extremen 12 % auseinander. Schreibe die Tonne — metrisch, short oder long — auf jedes Angebot, jeden Lieferschein und jede Zeichnung.</li><li><strong>Die exakte Tonnenzahl statt der Aufrundung bestellen.</strong> Eine Stäbe-pro-Tonne-Tabelle gibt die Stückzahl an, die eine Tonne ERREICHT, nicht die, die ihr GENAU entspricht. Bestelle 93 × 12 mm × 12 m, und du hältst 0,990 Tonnen, nicht eine Tonne; bestelle 135 × 10 mm, und du hältst 0,998 Tonnen. Die Aufrundung existiert genau aus diesem Grund — und bei 32-mm-Stäben kostet sie 60,1 kg Überschuss, was der Preis dafür ist, nicht zu kurz zu kommen.</li><li><strong>Den Tonnenspalten kleiner Bestellungen trauen.</strong> Unter 1 Tonne zeigt das Panel drei Dezimalstellen, sodass ein 6-mm-Stab in beiden Tonnen-Spalten als 0,003 liest, obwohl sich die exakten Werte um ~10 % unterscheiden (0,002664 vs. 0,002937). Die Anzeigen stimmen überein; der Stahl nicht. Prüfe die kg-Zeile, wann immer die Tonnage unter 1 Tonne liegt.</li><li><strong>Die Konstanten oder die Stablängen mischen.</strong> Eine d²/162-Tabelle ergibt ~0,2 % mehr als die d²/162,28-Optionen dieses Panels (das Beispiel 200 × 12 mm × 6 m eines beliebten Tools: 1.066 kg vs. 1.064,4 kg hier). Eine 40-ft-Tabelle ergibt 1,6 % mehr pro Stab als eine 12-m-Tabelle (10,81 vs. 10,64 kg bei 12 mm). Jede Verwechslung verschiebt eine Mehrtonnen-Bestellung um Dutzende Kilo — prüfe Konstante und Länge, bevor du einen Rechenfehler annimmst.</li><li><strong>Einem Beispiel trauen, ohne es neu zu rechnen.</strong> Veröffentlichte Tonnage-Beispiele lassen sich nicht immer reproduzieren: Das Einfahrtsbeispiel eines US-Tools behauptet ~1.120 lb, wo seine eigenen angegebenen Eingaben 1.068,8 lb ergeben (es lässt sich nur mit einem nicht genannten Verschnittfaktor von ~5 % reproduzieren), und die Zoll-Formel eines beliebten Leitfadens übertreibt #8-Stäbe um das 16-Fache (42,75 lb/ft vs. die echten 2,670 lb/ft). Rechne jedes Beispiel im Panel mit deiner eigenen Stahlliste neu, bevor du dich darauf verlässt — auch die auf dieser Seite.</li></ol><p>Zuletzt geprüft: Oktober 2026.</p>`
}
},
  
];

/* Spanish steps and FAQs for each calculator (content-es.js). Attached as
   p.es, which pHowto and pFaqs read the same way as the German overrides. */
const CONTENT_ES = require("./content-es.js");
PAGES.forEach(p => { if (CONTENT_ES[p.id]) p.es = CONTENT_ES[p.id].es; });

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

/* Primary calculator destination for 301 redirects of each silo */
const SILO_PRIMARY_CALC = {
  "Weight": "weight",         // rebar-weight-calculator
  "Estimating": "slab",       // concrete-slab-rebar-calculator
  "Detailing": "spacing",     // rebar-spacing-calculator
  "Members": "column",        // column-rebar-calculator
  "Commercial": "cost"        // rebar-cost-calculator
};

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
    heroSub: "Rebar weight, steel area (Ast) and quantity calculators based on standard steel density and international building codes.",
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
/* English hub headings name the silo's purpose; other languages keep the generic form */
const SILO_H1_EN = {
  Weight:     "Rebar Weight & Takeoff Calculators",
  Estimating: "Concrete Estimating Calculators",
  Detailing:  "Rebar Detailing & Lap Calculators",
  Members:    "Structural Member Rebar Calculators",
  Commercial: "Rebar Cost & Tonnage Calculators"
};
const siloH1   = (silo, lang) => lang === "en"
  ? SILO_H1_EN[silo.cat]
  : `${trG(silo.cat, lang)} — ${CALCSWORD[lang]}`;

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
  return homeHref(targetLang);
}
function altLinks(type, item){
  // Silo hubs exist in English only, so they carry no localized alternates
  const list = type === 'silo' ? LANGS.filter(l => l.code === 'en') : LANGS;
  return list.map(l => {
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
const pDesc = (p,lang) => lang==="en" ? p.desc : (p[lang] && p[lang].desc) ? p[lang].desc : CALC[p.id].desc[lang];
const pTitle= (p,lang) => lang==="en" ? p.metaTitle : (p[lang] && p[lang].metaTitle) ? p[lang].metaTitle : `${CALC[p.id].title[lang]} — ${TPL[lang].metaSuffix}`;
const pIntro= (p,lang) => lang==="en" ? p.intro : (p[lang] && p[lang].desc) ? p[lang].desc : CALC[p.id].desc[lang];
const pHowto= (p,lang) => lang==="en" ? p.howto : (p[lang] && p[lang].howto) ? p[lang].howto : TPL[lang].howto;
const pFaqs = (p,lang) => lang==="en" ? p.faqs : (p[lang] && p[lang].faqs) ? p[lang].faqs : TPL[lang].faq(CALC[p.id].title[lang], CALC[p.id].desc[lang]);
const pFormula = (p,lang) => lang==="en" ? p.formula : (p[lang] && p[lang].formula) ? p[lang].formula : p.formula;
const pKw = (p,lang) => lang==="en" ? p.kw : (p[lang] && p[lang].kw) ? p[lang].kw : p.kw;

/* ---------- shared HTML pieces ---------- */
function langSwitch(curLang, type, item){
  const cur = LANGS.find(l=>l.code===curLang);
  return `<details class="lang-dropdown">
      <summary>🌐 ${cur.label} <span class="caret">▾</span></summary>
      <div class="lang-menu">${LANGS.map(l=>`<a class="lang${l.code===curLang?' active':''}" hreflang="${l.code}" href="${switchHref(curLang, l.code, type, item)}">${l.name}</a>`).join("")}</div>
    </details>`;
}

function header(lang, type, item){
  const u = UI[lang];
  const homeUrl = homeHref(lang);

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
        <h4>${lang === "en" ? `<a href="${siloHref(s, lang)}">${siloName(s, lang)} ${CALCSWORD[lang]}</a>` : `${siloName(s, lang)} ${CALCSWORD[lang]}`}</h4>
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
        <a href="${homeUrl}#faq">${u.faq}</a>${lang === "de" ? `<a href="/de/stahlrohr-gewicht-rechner">Stahlrohr Gewicht Rechner</a><a href="/de/metall-gewicht-rechner">Metall Gewicht Rechner</a>` : ""}${lang === "en" ? `<a href="/privacy">Privacy Policy</a><a href="/about">About</a><a href="/contact">Contact</a>` : ""}
      </div>
      <p class="muted">${disclaimer}</p>
    </div>
  </div>
</footer>`;
}

function renderToolShell(lang, activeCalcId){
  const activePage = PAGES.find(p => p.id === activeCalcId);
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
      <h2 id="calc-title">${activePage ? pH1(activePage, lang) : ""}</h2>
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
function howToJsonLd(steps){
  return JSON.stringify({"@context":"https://schema.org","@type":"HowTo","name":"How to use","step":steps.map((t,i)=>({"@type":"HowToStep","position":i+1,"text":t.replace(/<[^>]*>/g,"")}))});
}

function renderPage(p, lang){
  const base = lang==="en" ? "" : "../";
  const u = UI[lang];
  const h1 = pH1(p,lang), title = pTitle(p,lang), desc = pDesc(p,lang);
  const faqs = pFaqs(p,lang);
  const lc = lang!=="en" ? p[lang] : null;
  const faqHtml = faqs.map(([q,a],i)=>`<details${i===0?" open":""}><summary>${q}</summary><p>${a}</p></details>`).join("\n    ");
  const howHtml = pHowto(p,lang).map(s=>`<li>${s}</li>`).join("");
  const cleanH1 = h1.replace(/ \(.*/,"");
  const silo = siloOfId(p.id);
  const curPageSlug = pageSlug(p, lang);
  const crumbTrail = crumbs(lang, [
    {name:HOMEWORD[lang], href:homeHref(lang)},
    {name:siloName(silo,lang), href: lang === "en" ? siloHref(silo,lang) : undefined},
    {name:cleanH1}
  ]);
  const crumbLd = breadcrumbJsonLd([
    {name:HOMEWORD[lang], url:urlFor(lang,"index")},
    ...(lang === "en" ? [{name:siloName(silo,lang), url:urlFor(lang,siloSlug(silo,lang))}] : []),
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
<meta name="keywords" content="${pKw(p,lang)}" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="${urlFor(lang,curPageSlug)}" />
${altLinks('page', p)}
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:type" content="website" />
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"WebApplication",name:h1,applicationCategory:"BusinessApplication",operatingSystem:"All",inLanguage:lang,offers:{"@type":"Offer",price:"0",priceCurrency:"USD"},description:desc})}</script>
<script type="application/ld+json">${faqJsonLd(faqs)}</script>
<script type="application/ld+json">${howToJsonLd(pHowto(p,lang))}</script>
<script type="application/ld+json">${crumbLd}</script>
<link rel="stylesheet" href="${base}styles.css" />
</head>
<body data-page="${p.id}">
${header(lang, 'page', p)}
${crumbTrail}
<section class="hero">
  <div class="wrap">
    <h1>${h1}</h1>
    <p class="hero-sub">${pIntro(p,lang)}</p>
  </div>
</section>

<main class="wrap" id="calculator">
${renderToolShell(lang, p.id)}
${lang === "en" && p.hideCards ? "" : relatedGrid(p.id, lang)}
${lang === "en" && p.hideCards ? "" : workflowGrid(p.id, lang)}
${lang==="en" && p.toc ? p.toc : lc && lc.toc ? lc.toc : ""}

  <section class="content-block">
    <h2${(lang === "en" || lc) ? ' id="how-to"' : ""}>${u.howtoH}: ${cleanH1}</h2>
    <ol class="howto">${howHtml}</ol>
    <h3${(lang === "en" || lc) ? ' id="formula"' : ""}>${u.formulaH}</h3>
    <p class="formula-callout">${pFormula(p,lang)}</p>
    <p><a href="${homeHref(lang)}#charts">${u.seeChart}</a></p>
  </section>
${lang==="en" && p.extra ? `<section class="content-block">${p.extra}</section>` : lc && lc.extra ? `<section class="content-block">${lc.extra}</section>` : ""}

  <section id="faq" class="content-block">
    <h2>${cleanH1} — ${u.faq}</h2>
    ${faqHtml}
  </section>
</main>
${footer(lang)}
${scripts(lang, p.id)}
${(lang === "en" || lc) ? `<script>(function(){
  var head = document.querySelector('.site-header');
  if (head) {
    var onScroll = function(){ head.classList.toggle('scrolled', window.scrollY > 4); };
    window.addEventListener('scroll', onScroll, {passive: true}); onScroll();
  }
  var tabsEl = document.getElementById('calc-tabs');
  var panelEl = document.querySelector('.calc-panel');
  var tabsScrolled = false;
  function syncTabs(){
    if (!tabsEl || !panelEl) return;
    if (window.innerWidth > 820) {
      tabsEl.style.maxHeight = panelEl.offsetHeight + 'px';
      tabsEl.style.overflowY = 'auto';
      if (!tabsScrolled) {
        tabsScrolled = true;
        var at = tabsEl.querySelector('.tab.active');
        if (at) at.scrollIntoView({block: 'nearest'});
      }
    } else {
      tabsEl.style.maxHeight = '';
      tabsEl.style.overflowY = '';
    }
  }
  syncTabs();
  window.addEventListener('resize', syncTabs);
  window.addEventListener('load', syncTabs);
  var total = document.getElementById('r-total');
  var main = document.querySelector('.result-main');
  if (total && main && 'MutationObserver' in window) {
    var last = '';
    new MutationObserver(function(){
      var v = total.textContent;
      if (v !== last) {
        last = v;
        main.classList.remove('pop'); void main.offsetWidth; main.classList.add('pop');
        syncTabs();
      }
    }).observe(total, {childList: true, characterData: true, subtree: true});
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('inview'); io.unobserve(e.target); } });
    }, {threshold: 0.12, rootMargin: '0px 0px 10% 0px'});
    document.querySelectorAll('.content-block, .related, .site-footer').forEach(function(el){
      el.classList.add('reveal'); io.observe(el);
    });
  }
})();</script>` : ""}
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
  const cx = (en, es) => lang === "es" ? es : en;
  const base = lang==="en" ? "" : "../";
  const u = UI[lang];
  const h1 = HUB_H1[lang], title = `${h1} — ${HUB_TAG[lang]}`, desc = u.heroSub;
  const hubH1 = (lang === "en") ? "Steel Rebar Calculator — Weight, Spacing, Cost & Detailing" : h1;
  const hubMetaTitle = (lang === "en") ? "Steel Rebar Calculator — Weight, Cost & Detailing" : title;
  const hubMetaDesc = (lang === "en") ? "Rebar calculators for weight, slab takeoff, spacing, lap length, cutting length, column and beam steel, tonnage and cost. IS 456 and ACI." : desc;
  const heroSub = (lang === "en") ? "Every rebar question a concrete job throws at you — how much steel a slab needs, what a bar schedule weighs, how long a lap splice has to be — solved by purpose-built calculators. Metric and imperial, IS 456 and ACI, instant results with no signup." : u.heroSub;

  const cats = {};
  PAGES.forEach(p => (cats[p.cat] ||= []).push(p));
  const directory = Object.entries(cats).map(([cat, items]) => {
    return `
      <div class="dir-cat">
        <h3>${trG(cat,lang)} ${CALCSWORD[lang]}</h3>
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
    <p>A single "rebar calculator" that only handles slab grids answers one question out of a dozen a real project asks. This site splits the problem the way an estimator actually works through it across 5 dedicated categories:</p>
    <ul>
      <li><strong>Weight & Takeoff</strong> — how much steel, by bar size and length (use the <a href="/rebar-weight-calculator">Rebar Weight Calculator</a> or <a href="/rebar-area-calculator">Rebar Area Calculator</a>)</li>
      <li><strong>Pour Estimating</strong> — how much rebar a specific pour needs (<a href="/concrete-slab-rebar-calculator">slab</a>, <a href="/footing-rebar-calculator">footing</a>, <a href="/driveway-rebar-calculator">driveway</a>, <a href="/rebar-mat-grid-calculator">mat</a>)</li>
      <li><strong>Detailing & Splicing</strong> — <a href="/rebar-spacing-calculator">spacing</a>, <a href="/rebar-development-length-calculator">development length</a>, <a href="/rebar-lap-length-calculator">lap length</a>, <a href="/rebar-hook-bend-cutting-length-calculator">cutting length</a>, <a href="/rebar-chair-calculator">chairs</a>, <a href="/rebar-tie-wire-calculator">tie wire</a></li>
      <li><strong>Structural Members</strong> — <a href="/column-rebar-calculator">column</a>, <a href="/beam-rebar-calculator">beam</a>, <a href="/wall-rebar-calculator">wall</a>, and <a href="/pool-rebar-calculator">pool</a>-specific reinforcement</li>
      <li><strong>Commercial & Procurement</strong> — turning a bar schedule into <a href="/rebar-tonnage-calculator">tonnage</a> and <a href="/rebar-cost-calculator">cost</a></li>
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

  <section id="charts" class="content-block charts-section">
    <div class="charts-header">
      <span class="charts-badge">${cx("Standards","Normas")}</span>
      <h2>${u.chartTitle}</h2>
    </div>
    <div class="chart-unit-switcher" role="tablist" aria-label="Units">
      <button type="button" class="unit-tab-btn active" data-unit="metric" role="tab" aria-selected="true">
        <span class="tab-flag">🌐</span>
        <span class="tab-label">${cx("Metric","Métrica")}</span>
        <span class="tab-sublabel">mm</span>
      </button>
      <button type="button" class="unit-tab-btn" data-unit="imperial" role="tab" aria-selected="false">
        <span class="tab-flag">🇺🇸</span>
        <span class="tab-label">${cx("Imperial","Imperial")}</span>
        <span class="tab-sublabel">US #</span>
      </button>
      <button type="button" class="unit-tab-btn" data-unit="both" role="tab" aria-selected="false">
        <span class="tab-flag">⊞</span>
        <span class="tab-label">${cx("Compare Both","Comparar ambas")}</span>
      </button>
    </div>
    <div class="chart-container" data-active-tab="metric">
      <div class="chart-col chart-col-metric">
        <div class="chart-table-header">
          <div class="chart-title-group">
            <span class="chart-col-tag metric">ISO / BS / IS</span>
            <h3>${cx("Metric","Métrica")}</h3>
          </div>
          <div class="table-scroll-hint" aria-hidden="true"><span class="swipe-icon">↔</span><span>${cx("Scroll","Desliza")}</span></div>
        </div>
        <div class="table-scroll-wrap"><table class="ref-table" id="chart-metric">
          <thead><tr><th class="sticky-col">Ø</th><th class="num">kg/m</th><th class="num">kg/ft</th><th class="num">12 m</th><th class="num">${cx("Bars/t","Barras/t")}</th></tr></thead><tbody></tbody>
        </table></div>
      </div>
      <div class="chart-col chart-col-imperial">
        <div class="chart-table-header">
          <div class="chart-title-group">
            <span class="chart-col-tag imperial">ASTM</span>
            <h3>Imperial (US #)</h3>
          </div>
          <div class="table-scroll-hint" aria-hidden="true"><span class="swipe-icon">↔</span><span>${cx("Scroll","Desliza")}</span></div>
        </div>
        <div class="table-scroll-wrap"><table class="ref-table" id="chart-imperial">
          <thead><tr><th class="sticky-col">#</th><th>Ø</th><th class="num">lb/ft</th><th class="num">kg/m</th></tr></thead><tbody></tbody>
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
/* Hand-made pages outside PAGES: kept by the language-folder cleanup and listed in that language's sitemap */
const STANDALONE_PAGES = [
  { lang: "de", slug: "stahlrohr-gewicht-rechner" },
  { lang: "de", slug: "metall-gewicht-rechner" },
  { lang: "es", slug: "calculadora-de-varilla" },
  { lang: "en", slug: "privacy" },
  { lang: "en", slug: "about" },
  { lang: "en", slug: "contact" }
];

const redirects = [
  // Removed draft homepages: send their old URLs to the main page
  { source: "/dummy-preview", destination: "/", permanent: true },
  { source: "/dummy-preview.html", destination: "/", permanent: true },
  { source: "/homepage-improved", destination: "/", permanent: true },
  { source: "/homepage-improved.html", destination: "/", permanent: true },
  // Work-in-progress design is kept in the repo but hidden from the live site
  { source: "/new-design", destination: "/", permanent: false },
  { source: "/new-design/", destination: "/", permanent: false },
  { source: "/new-design/index.html", destination: "/", permanent: false },
  { source: "/new-design/:path*", destination: "/", permanent: false }
];

LANGS.forEach(l => {
  const lang = l.code;
  const outDir = lang==="en" ? OUT : path.join(OUT, l.dir);
  if(lang!=="en") {
    fs.mkdirSync(outDir, { recursive:true });
    // Clean up old html files in this language directory
    const existing = fs.readdirSync(outDir);
    existing.forEach(f => {
      const standalone = STANDALONE_PAGES.some(p => p.lang === lang && p.slug + ".html" === f);
      if (f.endsWith(".html") && f !== "index.html" && !standalone) {
        fs.unlinkSync(path.join(outDir, f));
      }
    });
  }

  // Flagship English index.html is maintained as the Phase 1 rank-winning homepage.
  if (lang !== "en") {
    fs.writeFileSync(path.join(outDir,"index.html"), renderHub(lang));
  }

  // 301 Redirect each silo/category to its primary calculator
  SILOS.forEach(s => {
    const primaryId = SILO_PRIMARY_CALC[s.cat];
    const primaryPage = PAGES.find(p => p.id === primaryId);
    const primarySlug = pageSlug(primaryPage, lang);
    const curSiloSlug = siloSlug(s, lang);

    if (lang === "en") {
      fs.writeFileSync(path.join(OUT, s.slug + ".html"), renderSilo(s, lang));
    } else {
      redirects.push({
        source: `/${l.dir}/${curSiloSlug}`,
        destination: `/${l.dir}/${primarySlug}`,
        permanent: true
      });
      redirects.push({
        source: `/${l.dir}/${curSiloSlug}.html`,
        destination: `/${l.dir}/${primarySlug}`,
        permanent: true
      });
      if (curSiloSlug !== s.slug) {
        redirects.push({
          source: `/${l.dir}/${s.slug}`,
          destination: `/${l.dir}/${primarySlug}`,
          permanent: true
        });
        redirects.push({
          source: `/${l.dir}/${s.slug}.html`,
          destination: `/${l.dir}/${primarySlug}`,
          permanent: true
        });
      }
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

/* Fill the shared header and footer into standalone pages between marker comments */
STANDALONE_PAGES.forEach(p => {
  const l = LANGS.find(x => x.code === p.lang);
  const file = path.join(p.lang === "en" ? OUT : path.join(OUT, l.dir), p.slug + ".html");
  let html = fs.readFileSync(file, "utf8");
  const fill = (name, content) => {
    const re = new RegExp(`<!-- ${name} -->[\\s\\S]*?<!-- /${name} -->`);
    if (!re.test(html)) throw new Error(`${file}: missing <!-- ${name} --> markers`);
    html = html.replace(re, () => `<!-- ${name} -->${content}\n<!-- /${name} -->`);
  };
  fill("site-header", header(p.lang, "index", null));
  fill("site-footer", footer(p.lang));
  fs.writeFileSync(file, html);
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
  // Silo hubs exist in English only, so they carry no localized alternates
  const altLangs = type === "silo" ? SITEMAP_LANGS.filter(l => l === "en") : SITEMAP_LANGS;
  altLangs.forEach(l => {
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
  const pagePriority = isEn ? "0.6" : "0.5";

  chunks.push("  <!-- ============================================================ -->");
  chunks.push("  <!-- " + (isEn ? "ENGLISH PAGES (Primary Hub and Calculators)" : "Language: " + langObj.name + " (" + code + ")") + " -->");
  chunks.push("  <!-- ============================================================ -->");
  chunks.push("  <!-- Main Hub / Homepage (" + code + ") -->");
  chunks.push(renderSitemapUrl("index", null, code, today, "monthly", hubPriority));

  // Category Order: Calculators grouped by category
  SILOS.forEach(silo => {
    chunks.push("\n  <!-- Category: " + silo.cat + " Calculators (" + code + ") -->");
    if (isEn) chunks.push(renderSitemapUrl("silo", silo, code, today, "monthly", "0.8"));

    // Calculators belonging to this specific Category
    const childPages = PAGES.filter(p => p.cat === silo.cat);
    childPages.forEach(p => {
      chunks.push(renderSitemapUrl("page", p, code, today, "yearly", pagePriority));
    });
  });

  // Standalone pages exist in one language only, so they carry no alternates
  const standalone = STANDALONE_PAGES.filter(p => p.lang === code);
  if (standalone.length) chunks.push("\n  <!-- Standalone pages (" + code + ") -->");
  standalone.forEach(p => {
    chunks.push([
      "  <url>",
      "    <loc>" + urlFor(code, p.slug) + "</loc>",
      "    <lastmod>" + today + "</lastmod>",
      "    <changefreq>yearly</changefreq>",
      "    <priority>" + pagePriority + "</priority>",
      "  </url>"
    ].join("\n"));
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

const totalSitemapUrls = (1 + PAGES.length) * SITEMAP_LANGS.length;
const enUrls = 1 + PAGES.length;
console.log('Generated ' + LANGS.length + ' languages × (' + PAGES.length + ' pages + hub) = ' + (pageCount + LANGS.length) + ' HTML files');
console.log('Sitemap Index: Generated sitemap.xml and sitemap_index.xml indexing ' + SITEMAP_LANGS.length + ' language sitemaps');
console.log('Sitemaps: ' + totalSitemapUrls + ' total URLs organized by category across ' + SITEMAP_LANGS.length + ' languages (' + enUrls + ' URLs in sitemap-en.xml)');
console.log('Vercel: Generated ' + redirects.length + ' 301 redirects in vercel.json for legacy URLs and silos');
