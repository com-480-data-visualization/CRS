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
  drawRadar(data, "sex");
  drawBarChart(data, "sad", "sex");

  d3.select("#radar-group-select").on("change", function () {
    drawRadar(data, this.value);
  });

  d3.select("#indicator-select").on("change", function () {
    const group = d3.select("#group-select").property("value");
    drawBarChart(data, this.value, group);
  });

  d3.select("#group-select").on("change", function () {
    const indicator = d3.select("#indicator-select").property("value");
    drawBarChart(data, indicator, this.value);
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
  const H = 260;   // same viewBox height for all charts
  const margin = { top: 12, right: 14, bottom: 72, left: 48 };
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
      .style("font-size", "10px")
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
        .style("font-size", "10px");

    g.append("g").attr("class","y-axis")
      .call(d3.axisLeft(y).ticks(4).tickFormat(d3.format("~s")));
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

function computeRadarScores(data, groupField) {
  const groups = Array.from(new Set(data.map(d => d[groupField]).filter(Boolean)));
  return groups.map(g => {
    const subset = data.filter(d => d[groupField] === g);
    const n = subset.length;
    const pct = fn => +(subset.filter(fn).length / n * 100).toFixed(1);
    return {
      group: g,
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

function drawRadar(data, groupField) {
  d3.select("#radar-chart").selectAll("*").remove();

  const groups = (groupField === "sex")
    ? ["Male","Female"]
    : ["9th grade","10th grade","11th grade","12th grade"];

  const seriesData = computeRadarScores(
    data.filter(d => groups.includes(d[groupField])),
    groupField
  ).filter(s => groups.includes(s.group));

  const W = 460, H = 420;
  const cx = W / 2, cy = H / 2;
  const R = 155;
  const levels = 5;
  const numAxes = RADAR_AXES.length;
  const angleSlice = (Math.PI * 2) / numAxes;

  const svg = d3.select("#radar-chart")
    .append("svg")
    .attr("width", W)
    .attr("height", H);

  const g = svg.append("g").attr("transform", `translate(${cx},${cy})`);

  // Grid circles
  for (let lvl = 1; lvl <= levels; lvl++) {
    const r = (R / levels) * lvl;
    g.append("circle")
      .attr("r", r)
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-dasharray", "3,3");

    g.append("text")
      .attr("x", 4)
      .attr("y", -r)
      .attr("dy", "0.35em")
      .style("font-size", "9px")
      .style("fill", "#888")
      .text(`${(100 / levels * lvl).toFixed(0)}%`);
  }

  // Axis lines and labels
  RADAR_AXES.forEach((ax, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const lx = Math.cos(angle) * R;
    const ly = Math.sin(angle) * R;

    g.append("line")
      .attr("x1", 0).attr("y1", 0)
      .attr("x2", lx).attr("y2", ly)
      .attr("stroke", "#bbb");

    const labelR = R + 22;
    g.append("text")
      .attr("x", Math.cos(angle) * labelR)
      .attr("y", Math.sin(angle) * labelR)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "11px")
      .style("fill", "#333")
      .text(ax.label);
  });

  // Radar paths
  const radarLine = d3.lineRadial()
    .radius(d => (d.value / 100) * R)
    .angle((_d, i) => i * angleSlice)
    .curve(d3.curveLinearClosed);

  seriesData.forEach((series, si) => {
    const pathData = RADAR_AXES.map(ax => ({ value: series.scores[ax.key] }));
    const col = colorFor(series.group, si);

    g.append("path")
      .datum(pathData)
      .attr("d", radarLine)
      .attr("fill", col)
      .attr("fill-opacity", 0.15)
      .attr("stroke", col)
      .attr("stroke-width", 2);

    // Dots
    pathData.forEach((pt, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      g.append("circle")
        .attr("cx", Math.cos(angle) * (pt.value / 100) * R)
        .attr("cy", Math.sin(angle) * (pt.value / 100) * R)
        .attr("r", 4)
        .attr("fill", col)
        .append("title")
        .text(`${series.group} — ${RADAR_AXES[i].label}: ${pt.value}%`);
    });
  });

  // Legend
  const legend = svg.append("g").attr("transform", `translate(${W - 130}, 20)`);
  seriesData.forEach((s, i) => {
    const col = colorFor(s.group, i);
    legend.append("rect").attr("x", 0).attr("y", i * 20).attr("width", 12).attr("height", 12).attr("fill", col);
    legend.append("text").attr("x", 16).attr("y", i * 20 + 10).style("font-size", "12px").text(s.group);
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

const GROUP_ORDERS = {
  sex:   ["Male","Female"],
  grade: ["9th grade","10th grade","11th grade","12th grade"],
  race:  null,
};

function drawBarChart(data, indicatorKey, groupField) {
  d3.select("#bar-chart").selectAll("*").remove();

  const indicator = INDICATORS[indicatorKey];
  const groups = GROUP_ORDERS[groupField]
    ?? Array.from(new Set(data.map(d => d[groupField]).filter(Boolean)))
         .sort((a, b) => data.filter(r => r[groupField] === b).length - data.filter(r => r[groupField] === a).length)
         .slice(0, 8);

  const barData = groups.map(g => {
    const subset = data.filter(d => d[groupField] === g);
    return { group: g, pct: subset.length ? +(subset.filter(indicator.fn).length / subset.length * 100).toFixed(1) : 0 };
  });

  const margin = { top: 30, right: 20, bottom: 80, left: 55 };
  const W = Math.max(400, groups.length * 70 + margin.left + margin.right);
  const H = 320;
  const iw = W - margin.left - margin.right;
  const ih = H - margin.top - margin.bottom;

  const svg = d3.select("#bar-chart")
    .append("svg").attr("width", W).attr("height", H);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().domain(groups).range([0, iw]).padding(0.3);
  const y = d3.scaleLinear().domain([0, Math.min(100, d3.max(barData, d => d.pct) * 1.15)]).nice().range([ih, 0]);

  g.selectAll("rect")
    .data(barData)
    .join("rect")
    .attr("x", d => x(d.group))
    .attr("y", d => y(d.pct))
    .attr("width", x.bandwidth())
    .attr("height", d => ih - y(d.pct))
    .attr("fill", (d, i) => colorFor(d.group, i))
    .attr("rx", 3);

  // Value labels
  g.selectAll(".bar-label")
    .data(barData)
    .join("text")
    .attr("class", "bar-label")
    .attr("x", d => x(d.group) + x.bandwidth() / 2)
    .attr("y", d => y(d.pct) - 5)
    .attr("text-anchor", "middle")
    .style("font-size", "11px")
    .style("fill", "#444")
    .text(d => `${d.pct}%`);

  g.append("g").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x))
    .selectAll("text").attr("transform", "rotate(-30)").style("text-anchor", "end").style("font-size", "11px");

  g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`));

  // Y-axis label
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -ih / 2).attr("y", -45)
    .attr("text-anchor", "middle")
    .style("font-size", "11px")
    .style("fill", "#555")
    .text(indicator.label);
}

// ═══════════════════════════════════════════════════════════
// SECTION 4 — Heatmap: phone wellbeing by addiction group
// ═══════════════════════════════════════════════════════════
function drawHeatmap(data) {
  d3.select("#heatmap-chart").selectAll("*").remove();

  function addictionGroup(v) {
    if (v <= 3) return "Low (1–3)";
    if (v <= 6) return "Medium (4–6)";
    return "High (7–10)";
  }

  const rows = ["Low (1–3)", "Medium (4–6)", "High (7–10)"];
  const cols = [
    { key: "Sleep_Hours",      label: "Sleep (hrs)",      higherBetter: true  },
    { key: "Anxiety_Level",    label: "Anxiety",          higherBetter: false },
    { key: "Depression_Level", label: "Depression",       higherBetter: false },
    { key: "Self_Esteem",      label: "Self-Esteem",      higherBetter: true  },
    { key: "Exercise_Hours",   label: "Exercise (hrs)",   higherBetter: true  },
    { key: "Phone_Checks_Per_Day", label: "Phone Checks/Day", higherBetter: false },
  ];

  // Aggregate
  const cellData = [];
  rows.forEach(row => {
    const subset = data.filter(d => addictionGroup(d.Addiction_Level) === row);
    cols.forEach(col => {
      cellData.push({ row, col: col.label, val: d3.mean(subset, d => d[col.key]), higherBetter: col.higherBetter });
    });
  });

  // Per-column min/max for normalisation
  const colExtent = {};
  cols.forEach(col => {
    const vals = cellData.filter(c => c.col === col.label).map(c => c.val);
    colExtent[col.label] = d3.extent(vals);
  });

  const margin = { top: 40, right: 20, bottom: 60, left: 100 };
  const cellW = 90, cellH = 55;
  const W = margin.left + cols.length * cellW + margin.right;
  const H = margin.top + rows.length * cellH + margin.bottom;

  const svg = d3.select("#heatmap-chart")
    .append("svg").attr("width", W).attr("height", H);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // Colour: green = good, red = bad
  function cellColor(d) {
    const [mn, mx] = colExtent[d.col];
    const t = mx === mn ? 0.5 : (d.val - mn) / (mx - mn); // 0 = min, 1 = max
    const goodT = d.higherBetter ? t : 1 - t;
    return d3.interpolateRdYlGn(0.1 + goodT * 0.8);
  }

  // Cells
  cellData.forEach(d => {
    const xi = cols.findIndex(c => c.label === d.col);
    const yi = rows.indexOf(d.row);

    g.append("rect")
      .attr("x", xi * cellW).attr("y", yi * cellH)
      .attr("width", cellW - 2).attr("height", cellH - 2)
      .attr("fill", cellColor(d))
      .attr("rx", 4)
      .append("title")
      .text(`${d.row} / ${d.col}: ${d.val.toFixed(2)}`);

    g.append("text")
      .attr("x", xi * cellW + cellW / 2)
      .attr("y", yi * cellH + cellH / 2)
      .attr("text-anchor", "middle").attr("dy", "0.35em")
      .style("font-size", "12px").style("font-weight", "600")
      .style("fill", "#222")
      .text(d.val.toFixed(1));
  });

  // Row labels
  rows.forEach((r, i) => {
    g.append("text")
      .attr("x", -8).attr("y", i * cellH + cellH / 2)
      .attr("text-anchor", "end").attr("dy", "0.35em")
      .style("font-size", "12px").text(r);
  });

  // Col labels
  cols.forEach((c, i) => {
    g.append("text")
      .attr("x", i * cellW + cellW / 2)
      .attr("y", rows.length * cellH + 18)
      .attr("text-anchor", "middle")
      .style("font-size", "11px").text(c.label);
  });

  // Title annotation
  svg.append("text")
    .attr("x", margin.left).attr("y", 18)
    .style("font-size", "11px").style("fill", "#666")
    .text("Green = better outcome  |  Red = worse outcome  (per-column normalisation)");
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
