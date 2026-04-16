// ─────────────────────────────────────────────
// Shared colour palette
// ─────────────────────────────────────────────
const COLORS = {
  Male:   "#4e79a7",
  Female: "#f28e2b",
  "9th grade":  "#59a14f",
  "10th grade": "#e15759",
  "11th grade": "#76b7b2",
  "12th grade": "#edc948",
  default: d3.schemeTableau10,
};

function colorFor(key, i) {
  return COLORS[key] ?? COLORS.default[i % 10];
}

// ─────────────────────────────────────────────
// YRBS dataset
// ─────────────────────────────────────────────
d3.csv("data/yrbs2023_readable.csv").then(raw => {

  // Attach friendly shorthand fields
  raw.forEach(d => {
    d.sex   = d.Q2_label;
    d.grade = d.Q3_label;
    d.race  = d.RACEETH_label;
    d.age   = d.Q1_label;
  });

  // Filter out rows with missing key demographics
  const data = raw.filter(d => d.sex && d.grade);

  drawDemographics(data);
  renderRadarToggles(data, "sex");
  drawRadar(data, "sex");
  drawDotPlot(data, "sex");

  d3.select("#radar-group-select").on("change", function () {
    const field = this.value;
    renderRadarToggles(data, field);
    drawRadar(data, field);
  });

  d3.select("#group-select").on("change", function () {
    drawDotPlot(data, this.value);
  });
});

// ─────────────────────────────────────────────
// Phone addiction dataset
// ─────────────────────────────────────────────
d3.csv("data/teen_phone_addiction_dataset.csv").then(data => {
  data.forEach(d => {
    d.Daily_Usage_Hours   = +d.Daily_Usage_Hours;
    d.Sleep_Hours         = +d.Sleep_Hours;
    d.Anxiety_Level       = +d.Anxiety_Level;
    d.Depression_Level    = +d.Depression_Level;
    d.Self_Esteem         = +d.Self_Esteem;
    d.Exercise_Hours      = +d.Exercise_Hours;
    d.Addiction_Level     = +d.Addiction_Level;
    d.Phone_Checks_Per_Day = +d.Phone_Checks_Per_Day;
  });

  drawSummaryPhone(data);
  drawHeatmap(data);
  drawScatter(data);
  drawBarChartPhone(data, "A");

  d3.select("#phone-option").on("change", function () {
    drawBarChartPhone(data, this.value);
  });
});

// ═══════════════════════════════════════════════════════════
// SECTION 1 — Demographics (interactive cross-filter)
// ═══════════════════════════════════════════════════════════

// naturalW drives both the SVG viewBox width and the CSS grid fr ratio.
// When grid proportions == naturalW ratios, all charts render at the same height.
const DEMO_SPECS = [
  {
    field: "age", title: "Age", naturalW: 340,
    order: ["12 years old or younger","13 years old","14 years old",
            "15 years old","16 years old","17 years old","18 years old or older"],
    shorten: v => v.replace(" years old","").replace("12 years old or younger","≤12").replace("18 years old or older","18+"),
  },
  {
    field: "sex", title: "Sex", naturalW: 180,
    order: ["Male","Female"],
    shorten: v => v,
  },
  {
    field: "grade", title: "Grade", naturalW: 260,
    order: ["9th grade","10th grade","11th grade","12th grade"],
    shorten: v => v.replace(" grade",""),
  },
  {
    field: "race", title: "Race / Ethnicity", naturalW: 480,
    order: null,
    shorten: v => v.length > 16 ? v.slice(0, 15) + "…" : v,
  },
];

// Cross-filter state: { age: null, sex: null, grade: null, race: null }
const demoFilters = Object.fromEntries(DEMO_SPECS.map(s => [s.field, null]));

function applyDemoFilters(data, excluding = null) {
  return data.filter(d =>
    DEMO_SPECS.every(spec => {
      if (spec.field === excluding) return true;
      const v = demoFilters[spec.field];
      return !v || d[spec.field] === v;
    })
  );
}

// Shared reusable tooltip
const demoTooltip = d3.select("body").append("div").attr("class", "demo-tooltip");

function drawDemographics(allData) {
  _allDemoData = allData;
  // Set grid columns proportional to naturalW so all charts render at equal height
  d3.select("#demo-charts")
    .style("grid-template-columns", DEMO_SPECS.map(s => `${s.naturalW}fr`).join(" "));
  renderDemographics(allData);
}

// Keep a reference so filters can trigger re-renders
let _allDemoData = null;

function renderDemographics(allData) {
  const container = d3.select("#demo-charts");

  // ── Filtered count badge ──────────────────────────────────
  let badge = d3.select("#demo-filter-badge");
  if (badge.empty()) {
    badge = d3.select("#section-demographics")
      .insert("div", "#demo-charts")
      .attr("id", "demo-filter-badge");
  }

  const active = Object.values(demoFilters).filter(Boolean);
  const filteredTotal = applyDemoFilters(allData).length;

  if (active.length > 0) {
    badge.html(`
      <span class="filter-count">Showing <strong>${filteredTotal.toLocaleString()}</strong> of ${allData.length.toLocaleString()} students</span>
      <button class="filter-reset" id="demo-reset-btn">✕ Clear filters</button>
    `);
    d3.select("#demo-reset-btn").on("click", () => {
      DEMO_SPECS.forEach(s => { demoFilters[s.field] = null; });
      renderDemographics(allData);
    });
  } else {
    badge.html(`<span class="filter-count-neutral">${allData.length.toLocaleString()} students total — <em>click any bar to filter</em></span>`);
  }

  // ── Per-chart rendering ───────────────────────────────────
  const H = 210;   // same viewBox height for all charts
  const margin = { top: 10, right: 14, bottom: 62, left: 44 };
  const ih = H - margin.top - margin.bottom;
  const TRANSITION_MS = 350;

  DEMO_SPECS.forEach(spec => {
    const W  = spec.naturalW;                       // per-chart viewBox width
    const iw = W - margin.left - margin.right;
    const chartId = `demo-chart-${spec.field}`;

    // Create wrapper once
    let wrap = container.select(`#${chartId}`);
    if (wrap.empty()) {
      wrap = container.append("div")
        .attr("class", "demo-chart-wrap")
        .attr("id", chartId);
      wrap.append("div").attr("class", "chart-title").text(spec.title);
      wrap.append("svg")
          .attr("viewBox", `0 0 ${W} ${H}`)
          .attr("width", "100%")           // fills grid cell
          .attr("preserveAspectRatio", "xMidYMid meet")
          .style("display", "block")
          .style("overflow", "visible")
        .append("g")
          .attr("class", "demo-g")
          .attr("transform", `translate(${margin.left},${margin.top})`);
    }

    const svg = wrap.select("svg");
    const g   = svg.select(".demo-g");

    // Data: filtered by everything except this dimension
    const sliceData = applyDemoFilters(allData, spec.field);
    const totalSlice = sliceData.length;
    const activeVal  = demoFilters[spec.field];

    const counts = d3.rollups(sliceData.filter(d => d[spec.field]), v => v.length, d => d[spec.field]);

    let sorted;
    if (spec.order) {
      sorted = spec.order
        .map(k => ({ key: k, val: counts.find(c => c[0] === k)?.[1] ?? 0 }))
        .filter(d => d.val > 0);
    } else {
      sorted = counts.map(([k, v]) => ({ key: k, val: v })).sort((a, b) => b.val - a.val);
    }

    // Scales
    const x = d3.scaleBand().domain(sorted.map(d => d.key)).range([0, iw]).padding(0.25);
    const y = d3.scaleLinear().domain([0, d3.max(sorted, d => d.val) || 1]).nice().range([ih, 0]);

    // ── Bars ─────────────────────────────────────────────────
    const bars = g.selectAll(".demo-bar").data(sorted, d => d.key);

    // ENTER
    const barsEnter = bars.enter().append("rect").attr("class", "demo-bar")
      .attr("x", d => x(d.key))
      .attr("width", x.bandwidth())
      .attr("y", ih)            // start from bottom
      .attr("height", 0)
      .attr("rx", 4)
      .style("cursor", "pointer");

    // UPDATE + ENTER merged
    barsEnter.merge(bars)
      .on("mouseover", (_event, d) => {
        const pct = totalSlice ? (d.val / totalSlice * 100).toFixed(1) : 0;
        demoTooltip
          .style("opacity", 1)
          .html(`<strong>${d.key}</strong><br>${d.val.toLocaleString()} students<br>${pct}%`);
      })
      .on("mousemove", event => {
        demoTooltip
          .style("left", (event.pageX + 14) + "px")
          .style("top",  (event.pageY - 38) + "px");
      })
      .on("mouseout", () => demoTooltip.style("opacity", 0))
      .on("click", (_ev, d) => {
        // Toggle filter
        demoFilters[spec.field] = (demoFilters[spec.field] === d.key) ? null : d.key;
        renderDemographics(allData);
      })
      .transition().duration(TRANSITION_MS).ease(d3.easeCubicOut)
      .attr("x", d => x(d.key))
      .attr("width", x.bandwidth())
      .attr("y", d => y(d.val))
      .attr("height", d => ih - y(d.val))
      .attr("fill", (d, i) => colorFor(d.key, i))
      .attr("fill-opacity", d => (!activeVal || d.key === activeVal) ? 1 : 0.2)
      .attr("stroke", d => d.key === activeVal ? "#1a1a2e" : "none")
      .attr("stroke-width", 2);

    bars.exit().transition().duration(TRANSITION_MS).attr("height", 0).attr("y", ih).remove();

    // ── Value labels ─────────────────────────────────────────
    const labels = g.selectAll(".demo-val-label").data(sorted, d => d.key);

    labels.enter().append("text").attr("class", "demo-val-label")
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("pointer-events", "none")
      .attr("y", ih)
      .merge(labels)
      .transition().duration(TRANSITION_MS).ease(d3.easeCubicOut)
      .attr("x", d => x(d.key) + x.bandwidth() / 2)
      .attr("y", d => y(d.val) - 4)
      .style("fill", d => (!activeVal || d.key === activeVal) ? "#444" : "#bbb")
      .text(d => d3.format("~s")(d.val));

    labels.exit().remove();

    // ── Axes (re-render fresh each time) ─────────────────────
    g.selectAll(".x-axis").remove();
    g.selectAll(".y-axis").remove();

    g.append("g").attr("class","x-axis")
      .attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(x).tickFormat(k => spec.shorten(k)))
      .selectAll("text")
        .attr("transform", "rotate(-35)")
        .style("text-anchor", "end")
        .style("font-size", "11px");

    g.append("g").attr("class","y-axis")
      .call(d3.axisLeft(y).ticks(4).tickFormat(d3.format("~s")))
      .selectAll("text").style("font-size", "10px");
  });
}

// ═══════════════════════════════════════════════════════════
// SECTION 2 — Radar chart
// ═══════════════════════════════════════════════════════════
const RADAR_AXES = [
  { key: "mentalHealth", label: "Good mental health" },
  { key: "sleep",        label: "Adequate sleep" },
  { key: "active",       label: "Physically active" },
  { key: "noSubstance",  label: "No substance use" },
  { key: "safety",       label: "School safety" },
];

const RADAR_GROUP_ORDERS = {
  sex:   ["Male", "Female"],
  grade: ["9th grade", "10th grade", "11th grade", "12th grade"],
  age:   ["12 years old or younger", "13 years old", "14 years old",
          "15 years old", "16 years old", "17 years old", "18 years old or older"],
  race:  ["White", "Multiple - Hispanic", "Black or African American",
          "Multiple - Non-Hispanic", "Am Indian/Alaska Native",
          "Hispanic/Latino", "Asian", "Native Hawaiian/Other PI"],
};

// Selected groups state — persists across redraws
const radarSelected = new Set();

function radarGroupsFor(allData, groupField) {
  const order = RADAR_GROUP_ORDERS[groupField];
  return order.filter(g => allData.some(d => d[groupField] === g));
}

function renderRadarToggles(allData, groupField) {
  const groups = radarGroupsFor(allData, groupField);

  // Reset selection to all groups when dimension changes
  radarSelected.clear();
  groups.forEach(g => radarSelected.add(g));

  const container = d3.select("#radar-toggles");
  container.selectAll("*").remove();

  groups.forEach((grp, i) => {
    const col = colorFor(grp, i);
    container.append("button")
      .attr("class", "radar-toggle active")
      .attr("data-group", grp)
      .style("--toggle-color", col)
      .text(grp)
      .on("click", function () {
        const key = d3.select(this).attr("data-group");
        if (radarSelected.has(key)) {
          if (radarSelected.size > 1) {
            radarSelected.delete(key);
            d3.select(this).classed("active", false);
          }
        } else {
          radarSelected.add(key);
          d3.select(this).classed("active", true);
        }
        drawRadar(allData, groupField);
      });
  });
}

function computeRadarScores(allData, groupField) {
  return Array.from(radarSelected).map((grp, si) => {
    const subset = allData.filter(d => d[groupField] === grp);
    const n = subset.length;
    const pct = fn => n ? +(subset.filter(fn).length / n * 100).toFixed(1) : 0;
    // Map back to original palette index for consistent colours
    const paletteIdx = radarGroupsFor(allData, groupField).indexOf(grp);
    return {
      group: grp,
      color: colorFor(grp, paletteIdx === -1 ? si : paletteIdx),
      scores: {
        mentalHealth: pct(d => d.Q26_label === "No"),
        sleep:        pct(d => ["8 hours","9 hours","10 or more hours"].includes(d.Q85_label)),
        active:       pct(d => d.Q75_label === "7 days"),
        noSubstance:  pct(d => d.Q47_label === "Never tried marijuana" && d.Q41_label === "Never drank alcohol"),
        safety:       pct(d => d.Q14_label === "0 days"),
      },
    };
  });
}

function drawRadar(allData, groupField) {
  d3.select("#radar-chart").selectAll("*").remove();

  const seriesData = computeRadarScores(allData, groupField);
  const many = seriesData.length > 4;

  const W = 660, H = 600;          // viewBox dimensions — rendered size is CSS-controlled
  const cx = W / 2, cy = H / 2 + 16;
  const R = 210;
  const levels = 5;
  const angleSlice = (Math.PI * 2) / RADAR_AXES.length;

  const svg = d3.select("#radar-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("display", "block")
    .style("overflow", "visible");

  const g = svg.append("g").attr("transform", `translate(${cx},${cy})`);

  // Grid circles
  for (let lvl = 1; lvl <= levels; lvl++) {
    const r = (R / levels) * lvl;
    g.append("circle")
      .attr("r", r)
      .attr("fill", lvl % 2 === 0 ? "#f5f5f8" : "none")
      .attr("stroke", "#ccc")
      .attr("stroke-dasharray", "3,3");

    g.append("text")
      .attr("x", 5).attr("y", -r).attr("dy", "0.35em")
      .style("font-size", "13px").style("fill", "#999")
      .text(`${(100 / levels * lvl).toFixed(0)}%`);
  }

  // Axis lines and labels
  RADAR_AXES.forEach((ax, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    g.append("line")
      .attr("x1", 0).attr("y1", 0)
      .attr("x2", Math.cos(angle) * R).attr("y2", Math.sin(angle) * R)
      .attr("stroke", "#ccc");

    const labelR = R + 42;
    g.append("text")
      .attr("x", Math.cos(angle) * labelR)
      .attr("y", Math.sin(angle) * labelR)
      .attr("text-anchor", "middle").attr("dy", "0.35em")
      .style("font-size", "15px").style("font-weight", "600").style("fill", "#444")
      .text(ax.label);
  });

  // Radar paths
  const radarLine = d3.lineRadial()
    .radius(d => (d.value / 100) * R)
    .angle((_d, i) => i * angleSlice)
    .curve(d3.curveLinearClosed);

  seriesData.forEach(series => {
    const pathData = RADAR_AXES.map(ax => ({ value: series.scores[ax.key] }));
    const col = series.color;

    g.append("path")
      .datum(pathData)
      .attr("d", radarLine)
      .attr("fill", col)
      .attr("fill-opacity", many ? 0.07 : 0.15)
      .attr("stroke", col)
      .attr("stroke-width", many ? 1.5 : 2.5);

    // Dots with tooltip
    pathData.forEach((pt, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      g.append("circle")
        .attr("cx", Math.cos(angle) * (pt.value / 100) * R)
        .attr("cy", Math.sin(angle) * (pt.value / 100) * R)
        .attr("r", many ? 3 : 4)
        .attr("fill", col)
        .style("cursor", "default")
        .append("title")
        .text(`${series.group}\n${RADAR_AXES[i].label}: ${pt.value}%`);
    });
  });

}

// ═══════════════════════════════════════════════════════════
// SECTION 3 — Health indicator grouped bar chart
// ═══════════════════════════════════════════════════════════
const INDICATORS = {
  sad:        { label: "Felt sad or hopeless (%)",  fn: d => d.Q26_label === "Yes" },
  sleep:      { label: "Adequate sleep ≥8 hrs (%)", fn: d => ["8 hours","9 hours","10 or more hours"].includes(d.Q85_label) },
  active:     { label: "Active 7 days/wk (%)",      fn: d => d.Q75_label === "7 days" },
  marijuana:  { label: "No marijuana use (%)",       fn: d => d.Q47_label === "Never tried marijuana" },
  alcohol:    { label: "No alcohol use (%)",         fn: d => d.Q41_label === "Never drank alcohol" },
  safety:     { label: "School safety – no weapon (%)", fn: d => d.Q14_label === "0 days" },
};

const DOT_GROUP_ORDERS = {
  sex:   ["Male","Female"],
  grade: ["9th grade","10th grade","11th grade","12th grade"],
  age:   ["12 years old or younger","13 years old","14 years old",
          "15 years old","16 years old","17 years old","18 years old or older"],
  race:  ["White","Multiple - Hispanic","Black or African American",
          "Multiple - Non-Hispanic","Am Indian/Alaska Native",
          "Hispanic/Latino","Asian","Native Hawaiian/Other PI"],
};

const DOT_INDICATORS = [
  { key: "sad",       label: "Felt sad / hopeless",    fn: d => d.Q26_label === "Yes" },
  { key: "sleep",     label: "Adequate sleep (≥8 hrs)", fn: d => ["8 hours","9 hours","10 or more hours"].includes(d.Q85_label) },
  { key: "active",    label: "Physically active 7d/wk", fn: d => d.Q75_label === "7 days" },
  { key: "marijuana", label: "No marijuana use",        fn: d => d.Q47_label === "Never tried marijuana" },
  { key: "alcohol",   label: "No alcohol use",          fn: d => d.Q41_label === "Never drank alcohol" },
  { key: "safety",    label: "School safety",           fn: d => d.Q14_label === "0 days" },
];

function drawDotPlot(data, groupField) {
  d3.select("#bar-chart").selectAll("*").remove();

  const groups = DOT_GROUP_ORDERS[groupField]
    .filter(g => data.some(d => d[groupField] === g));

  // Compute % per indicator × group
  const rows = DOT_INDICATORS.map(ind => {
    const pts = groups.map((g, gi) => {
      const subset = data.filter(d => d[groupField] === g);
      const pct = subset.length ? +(subset.filter(ind.fn).length / subset.length * 100).toFixed(1) : 0;
      return { group: g, gi, pct };
    });
    return { label: ind.label, pts };
  });

  // Tooltip
  const tip = d3.select("body").selectAll(".dot-tooltip").data([1])
    .join("div").attr("class", "dot-tooltip");

  // Each group gets a fixed vertical lane within its row so dots never overlap
  const laneStep = groups.length <= 2 ? 10 : groups.length <= 4 ? 11 : 10;
  const laneSpan = (groups.length - 1) * laneStep;          // total spread in px
  const rowH     = Math.max(52, laneSpan + 28);             // row height adapts
  const offsets  = groups.map((_, i) => (i - (groups.length - 1) / 2) * laneStep);

  const labelW = 190;
  const margin = { top: 32, right: 24, bottom: 40, left: labelW };
  const W = 700;
  const H = rows.length * rowH + margin.top + margin.bottom;
  const iw = W - margin.left - margin.right;

  const svg = d3.select("#bar-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .style("max-width", "720px")
    .style("display", "block")
    .style("overflow", "visible");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([0, 100]).range([0, iw]);

  // Light vertical grid lines
  g.append("g").attr("class", "grid")
    .call(d3.axisBottom(x).ticks(5).tickSize(rows.length * rowH).tickFormat(""))
    .selectAll("line").style("stroke", "#eee");
  g.select(".grid .domain").remove();

  // X-axis at bottom
  g.append("g")
    .attr("transform", `translate(0,${rows.length * rowH})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d => `${d}%`))
    .selectAll("text").style("font-size", "13px");
  g.select(".domain").style("display", "none");

  // Legend — placed to the right of the chart
  const leg = svg.append("g")
    .attr("transform", `translate(${margin.left + iw + 16}, ${margin.top})`);
  groups.forEach((grp, i) => {
    const col = colorFor(grp, i);
    leg.append("circle").attr("cx", 5).attr("cy", i * 18 + 5).attr("r", 5).attr("fill", col);
    leg.append("text").attr("x", 14).attr("y", i * 18 + 9)
      .style("font-size", "11px").style("fill", "#333")
      .text(grp.replace(" grade","").replace(" years old","y").replace("Multiple - ",""));
  });

  // Rows
  rows.forEach((row, ri) => {
    const rowMid = ri * rowH + rowH / 2;
    const rowG   = g.append("g");

    // Alternating stripe
    if (ri % 2 === 0) {
      rowG.append("rect")
        .attr("x", -labelW).attr("y", ri * rowH)
        .attr("width", W).attr("height", rowH)
        .attr("fill", "#f8f9fc");
    }

    // Indicator label (vertically centred in row)
    rowG.append("text")
      .attr("x", -12).attr("y", rowMid)
      .attr("text-anchor", "end").attr("dy", "0.35em")
      .style("font-size", "13px").style("fill", "#333")
      .text(row.label);

    // Horizontal range line at row centre
    const pcts = row.pts.map(p => p.pct);
    rowG.append("line")
      .attr("x1", x(d3.min(pcts))).attr("x2", x(d3.max(pcts)))
      .attr("y1", rowMid).attr("y2", rowMid)
      .attr("stroke", "#ddd").attr("stroke-width", 2);

    // Dots — each group at its own vertical lane offset
    row.pts.forEach(pt => {
      const col = colorFor(pt.group, pt.gi);
      const cy  = rowMid + offsets[pt.gi];
      rowG.append("circle")
        .attr("cx", x(pt.pct)).attr("cy", cy)
        .attr("r", 6).attr("fill", col)
        .attr("stroke", "#fff").attr("stroke-width", 1.5)
        .style("cursor", "default")
        .on("mouseover", () => {
          tip.style("opacity", 1)
            .html(`<strong>${pt.group}</strong><br>${row.label}: <strong>${pt.pct}%</strong>`);
        })
        .on("mousemove", event => {
          tip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 36) + "px");
        })
        .on("mouseout", () => tip.style("opacity", 0));
    });
  });
}

// ═══════════════════════════════════════════════════════════
// SECTION 4 — Correlation bar chart: metrics vs addiction
// ═══════════════════════════════════════════════════════════
function pearsonR(xs, ys) {
  const mx = d3.mean(xs), my = d3.mean(ys);
  const num = d3.sum(xs.map((x, i) => (x - mx) * (ys[i] - my)));
  const den = Math.sqrt(d3.sum(xs.map(x => (x - mx) ** 2)) * d3.sum(ys.map(y => (y - my) ** 2)));
  return den === 0 ? 0 : num / den;
}

function drawHeatmap(data) {
  d3.select("#heatmap-chart").selectAll("*").remove();

  const addiction = data.map(d => d.Addiction_Level);

  const METRICS = [
    { key: "Phone_Checks_Per_Day", label: "Phone checks / day", higherBad: true  },
    { key: "Sleep_Hours",          label: "Sleep (hrs)",         higherBad: false },
    { key: "Anxiety_Level",        label: "Anxiety",             higherBad: true  },
    { key: "Depression_Level",     label: "Depression",          higherBad: true  },
    { key: "Exercise_Hours",       label: "Exercise (hrs)",      higherBad: false },
    { key: "Self_Esteem",          label: "Self-Esteem",         higherBad: false },
  ];

  // Compute r and sort by |r| descending
  const corrs = METRICS.map(m => ({
    ...m,
    r: pearsonR(addiction, data.map(d => d[m.key])),
  })).sort((a, b) => Math.abs(b.r) - Math.abs(a.r));

  const margin = { top: 16, right: 90, bottom: 40, left: 160 };
  const W = 560, H = corrs.length * 46 + margin.top + margin.bottom;
  const iw = W - margin.left - margin.right;
  const ih = H - margin.top - margin.bottom;

  const svg = d3.select("#heatmap-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .style("max-width", "620px")
    .style("display", "block")
    .style("overflow", "visible");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([-0.35, 0.35]).range([0, iw]);
  const y = d3.scaleBand().domain(corrs.map(d => d.label)).range([0, ih]).padding(0.3);

  // Zero line
  g.append("line")
    .attr("x1", x(0)).attr("x2", x(0))
    .attr("y1", 0).attr("y2", ih)
    .attr("stroke", "#999").attr("stroke-width", 1.5);

  // Reference lines at ±0.2
  [-0.2, 0.2].forEach(v => {
    g.append("line")
      .attr("x1", x(v)).attr("x2", x(v))
      .attr("y1", 0).attr("y2", ih)
      .attr("stroke", "#ddd").attr("stroke-dasharray", "4,3").attr("stroke-width", 1);
  });

  // X-axis
  g.append("g")
    .attr("transform", `translate(0,${ih})`)
    .call(d3.axisBottom(x).ticks(7).tickFormat(d3.format("+.2f")))
    .call(ax => ax.select(".domain").remove())
    .selectAll("text").style("font-size", "12px");

  // Axis label
  g.append("text")
    .attr("x", iw / 2).attr("y", ih + 34)
    .attr("text-anchor", "middle")
    .style("font-size", "12px").style("fill", "#555")
    .text("Pearson r with Addiction Level");

  const tip = d3.select("body").selectAll(".corr-tooltip").data([1])
    .join("div").attr("class", "corr-tooltip dot-tooltip");

  // Bars
  corrs.forEach(d => {
    const barColor = d.r > 0
      ? (d.higherBad ? "#e15759" : "#59a14f")   // positive r: red if bad, green if good
      : (d.higherBad ? "#59a14f" : "#e15759");   // negative r: green if bad metric goes down

    const cy = y(d.label) + y.bandwidth() / 2;
    const x0 = x(0);
    const x1 = x(d.r);

    g.append("rect")
      .attr("x", Math.min(x0, x1))
      .attr("y", y(d.label))
      .attr("width", Math.abs(x1 - x0))
      .attr("height", y.bandwidth())
      .attr("fill", barColor)
      .attr("rx", 3)
      .on("mouseover", () => tip.style("opacity", 1)
        .html(`<strong>${d.label}</strong><br>r = ${d.r.toFixed(3)}`))
      .on("mousemove", ev => tip
        .style("left", (ev.pageX + 12) + "px")
        .style("top",  (ev.pageY - 32) + "px"))
      .on("mouseout", () => tip.style("opacity", 0));

    // r value label
    const labelX = d.r >= 0 ? x1 + 5 : x1 - 5;
    g.append("text")
      .attr("x", labelX).attr("y", cy)
      .attr("dy", "0.35em")
      .attr("text-anchor", d.r >= 0 ? "start" : "end")
      .style("font-size", "12px").style("font-weight", "600")
      .style("fill", barColor)
      .text(d3.format("+.2f")(d.r));

    // Metric label
    g.append("text")
      .attr("x", -10).attr("y", cy)
      .attr("dy", "0.35em").attr("text-anchor", "end")
      .style("font-size", "13px").style("fill", "#333")
      .text(d.label);
  });

  // Legend
  const leg = svg.append("g").attr("transform", `translate(${margin.left}, ${H - 14})`);
  [["#e15759","Higher addiction → worse"], ["#59a14f","Higher addiction → better"]].forEach(([col, lbl], i) => {
    leg.append("rect").attr("x", i * 230).attr("y", 0).attr("width", 12).attr("height", 12).attr("fill", col).attr("rx", 2);
    leg.append("text").attr("x", i * 230 + 16).attr("y", 10).style("font-size", "11px").style("fill", "#555").text(lbl);
  });
}

// ═══════════════════════════════════════════════════════════
// SECTION 5 — Scatter: daily usage vs anxiety
// ═══════════════════════════════════════════════════════════
function drawScatter(data) {
  d3.select("#scatter-chart").selectAll("*").remove();

  const margin = { top: 20, right: 140, bottom: 55, left: 55 };
  const W = 560, H = 360;
  const iw = W - margin.left - margin.right;
  const ih = H - margin.top - margin.bottom;

  const svg = d3.select("#scatter-chart")
    .append("svg").attr("width", W).attr("height", H);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain(d3.extent(data, d => d.Daily_Usage_Hours)).nice().range([0, iw]);
  const y = d3.scaleLinear().domain(d3.extent(data, d => d.Anxiety_Level)).nice().range([ih, 0]);

  function addictionGroup(v) {
    if (v <= 3) return "Low";
    if (v <= 6) return "Medium";
    return "High";
  }

  const colorScale = d3.scaleOrdinal()
    .domain(["Low","Medium","High"])
    .range(["#59a14f","#f28e2b","#e15759"]);

  // Tooltip div
  const tooltip = d3.select("body").selectAll(".scatter-tooltip").data([1])
    .join("div").attr("class", "scatter-tooltip")
    .style("position", "absolute").style("background", "rgba(0,0,0,0.75)")
    .style("color", "#fff").style("padding", "6px 10px").style("border-radius", "5px")
    .style("font-size", "12px").style("pointer-events", "none").style("opacity", 0);

  g.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(d.Daily_Usage_Hours))
    .attr("cy", d => y(d.Anxiety_Level))
    .attr("r", 4)
    .attr("fill", d => colorScale(addictionGroup(d.Addiction_Level)))
    .attr("fill-opacity", 0.7)
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5)
    .on("mouseover", (_event, d) => {
      tooltip.style("opacity", 1)
        .html(`Usage: ${d.Daily_Usage_Hours}h<br>Anxiety: ${d.Anxiety_Level}<br>Addiction: ${d.Addiction_Level}`);
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

  g.append("g").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x).ticks(7));
  g.append("g").call(d3.axisLeft(y).ticks(6));

  // Axis labels
  g.append("text").attr("x", iw / 2).attr("y", ih + 42)
    .attr("text-anchor", "middle").style("font-size", "12px").text("Daily Phone Usage (hours)");

  g.append("text").attr("transform", "rotate(-90)").attr("x", -ih / 2).attr("y", -42)
    .attr("text-anchor", "middle").style("font-size", "12px").text("Anxiety Level");

  // Legend
  const legend = svg.append("g").attr("transform", `translate(${W - margin.right + 16}, ${margin.top + 10})`);
  legend.append("text").attr("y", -8).style("font-size", "11px").style("font-weight", "600").text("Addiction");
  ["Low","Medium","High"].forEach((grp, i) => {
    legend.append("circle").attr("cx", 6).attr("cy", i * 20 + 6).attr("r", 5).attr("fill", colorScale(grp));
    legend.append("text").attr("x", 16).attr("y", i * 20 + 10).style("font-size", "11px").text(grp);
  });
}

// ═══════════════════════════════════════════════════════════
// LEGACY phone charts (kept from first draft, polished)
// ═══════════════════════════════════════════════════════════
function drawSummaryPhone(data) {
  const n = data.length;
  const avg = field => d3.mean(data, d => d[field]);

  const highUsers  = data.filter(d => d.Daily_Usage_Hours >= 5).length;
  const lowSleep   = data.filter(d => d.Sleep_Hours < 6).length;

  d3.select("#summary-phone").html(`
    <div class="stat-grid">
      <div class="stat-card"><span class="stat-num">${n}</span><span class="stat-label">Students</span></div>
      <div class="stat-card"><span class="stat-num">${avg("Daily_Usage_Hours").toFixed(1)}h</span><span class="stat-label">Avg daily usage</span></div>
      <div class="stat-card"><span class="stat-num">${avg("Sleep_Hours").toFixed(1)}h</span><span class="stat-label">Avg sleep</span></div>
      <div class="stat-card"><span class="stat-num">${avg("Anxiety_Level").toFixed(1)}</span><span class="stat-label">Avg anxiety</span></div>
      <div class="stat-card"><span class="stat-num">${avg("Addiction_Level").toFixed(1)}</span><span class="stat-label">Avg addiction score</span></div>
      <div class="stat-card"><span class="stat-num">${(highUsers/n*100).toFixed(0)}%</span><span class="stat-label">High users ≥5h/day</span></div>
      <div class="stat-card"><span class="stat-num">${(lowSleep/n*100).toFixed(0)}%</span><span class="stat-label">Low sleep &lt;6h</span></div>
    </div>
  `);
}

function getUsageGroup(d) {
  if (d.Daily_Usage_Hours < 2) return "Low (<2h)";
  if (d.Daily_Usage_Hours < 5) return "Medium (2–5h)";
  return "High (≥5h)";
}

function drawBarChartPhone(data, option) {
  d3.select("#bar-chart-phone").selectAll("*").remove();

  let counts, xLabel, yLabel;

  if (option === "A") {
    counts = d3.rollups(data, v => d3.mean(v, d => d.Daily_Usage_Hours), d => d.Addiction_Level)
      .sort((a, b) => a[0] - b[0])
      .map(([k, v]) => ({ key: String(k), val: v }));
    xLabel = "Addiction Level";
    yLabel = "Avg Daily Usage (hrs)";
  } else {
    const order = ["Low (<2h)","Medium (2–5h)","High (≥5h)"];
    counts = d3.rollups(data, v => d3.mean(v, d => d.Anxiety_Level), d => getUsageGroup(d))
      .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
      .map(([k, v]) => ({ key: k, val: v }));
    xLabel = "Usage Group";
    yLabel = "Avg Anxiety Level";
  }

  const margin = { top: 20, right: 20, bottom: 55, left: 55 };
  const W = 460, H = 320;
  const iw = W - margin.left - margin.right;
  const ih = H - margin.top - margin.bottom;

  const svg = d3.select("#bar-chart-phone")
    .append("svg").attr("width", W).attr("height", H);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().domain(counts.map(d => d.key)).range([0, iw]).padding(0.25);
  const y = d3.scaleLinear().domain([0, d3.max(counts, d => d.val)]).nice().range([ih, 0]);

  g.selectAll("rect").data(counts).join("rect")
    .attr("x", d => x(d.key)).attr("y", d => y(d.val))
    .attr("width", x.bandwidth()).attr("height", d => ih - y(d.val))
    .attr("fill", (_d, i) => d3.schemeTableau10[i % 10])
    .attr("rx", 3);

  g.append("g").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x))
    .selectAll("text").attr("transform", "rotate(-30)").style("text-anchor", "end").style("font-size", "11px");

  g.append("g").call(d3.axisLeft(y).ticks(5));

  g.append("text").attr("x", iw / 2).attr("y", ih + 48)
    .attr("text-anchor", "middle").style("font-size", "12px").text(xLabel);

  g.append("text").attr("transform", "rotate(-90)").attr("x", -ih / 2).attr("y", -42)
    .attr("text-anchor", "middle").style("font-size", "12px").text(yLabel);
}
