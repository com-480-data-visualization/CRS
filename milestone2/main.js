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

const YES = "1";
const NO = "2";

function weightOf(d) {
  const value = Number(d.WEIGHT);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function isBinary(d, field) {
  return d[field] === YES || d[field] === NO;
}

function hasBinaryFields(fields) {
  return d => fields.every(field => isBinary(d, field));
}

function weightedPercent(rows, hitFn, validFn) {
  let numerator = 0;
  let denominator = 0;

  rows.forEach(d => {
    const weight = weightOf(d);
    if (!weight || !validFn(d)) return;
    denominator += weight;
    if (hitFn(d)) numerator += weight;
  });

  return denominator ? +(numerator / denominator * 100).toFixed(1) : 0;
}

function weightedStat(rows, hitFn, validFn) {
  let numerator = 0;
  let denominator = 0;
  let validN = 0;

  rows.forEach(d => {
    const weight = weightOf(d);
    if (!weight || !validFn(d)) return;
    validN += 1;
    denominator += weight;
    if (hitFn(d)) numerator += weight;
  });

  return {
    pct: denominator ? +(numerator / denominator * 100).toFixed(1) : 0,
    validN,
    missingPct: rows.length ? +((rows.length - validN) / rows.length * 100).toFixed(1) : 0,
  };
}

function hasCodes(field, codes) {
  return d => codes.includes(d[field]);
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

  drawDemographics(raw);

  // Filter out rows with missing key demographics for the analytic views.
  const data = raw.filter(d => d.sex && d.grade);

  drawDotPlot(data, "sex");
  drawGradeShift(data);
  initRiskProfiler(data);
  drawSexualHealth(raw);

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
    d.Academic_Performance = +d.Academic_Performance;
    d.Anxiety_Level       = +d.Anxiety_Level;
    d.Depression_Level    = +d.Depression_Level;
    d.Self_Esteem         = +d.Self_Esteem;
    d.Exercise_Hours      = +d.Exercise_Hours;
    d.Addiction_Level     = +d.Addiction_Level;
    d.Phone_Checks_Per_Day = +d.Phone_Checks_Per_Day;
    d.Time_on_Social_Media = +d.Time_on_Social_Media;
    d.Weekend_Usage_Hours = +d.Weekend_Usage_Hours;
  });

  drawCorrelationChart(data);
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

const MOSAIC_UNIT = 50;
let mosaicColorField = "grade";

const MOSAIC_DIMENSIONS = [
  {
    field: "grade",
    label: "Grade",
    order: ["9th grade", "10th grade", "11th grade", "12th grade", "Ungraded or other grade"],
  },
  {
    field: "sex",
    label: "Sex",
    order: ["Male", "Female"],
  },
  {
    field: "race",
    label: "Race / Ethnicity",
    order: ["White", "Multiple - Hispanic", "Black or African American",
            "Multiple - Non-Hispanic", "Am Indian/Alaska Native",
            "Hispanic/Latino", "Asian", "Native Hawaiian/Other PI"],
  },
  {
    field: "age",
    label: "Age",
    order: ["12 years old or younger", "13 years old", "14 years old",
            "15 years old", "16 years old", "17 years old", "18 years old or older"],
  },
];

function mosaicDimension(field) {
  return MOSAIC_DIMENSIONS.find(d => d.field === field) ?? MOSAIC_DIMENSIONS[0];
}

function orderedMosaicCategories(data, dimension) {
  const counts = d3.rollups(
    data.filter(d => d[dimension.field]),
    v => v.length,
    d => d[dimension.field]
  );
  const countMap = new Map(counts);
  const orderedKeys = [
    ...dimension.order.filter(key => countMap.has(key)),
    ...counts.map(([key]) => key).filter(key => !dimension.order.includes(key)).sort(d3.ascending),
  ];

  return orderedKeys.map((key, i) => ({
    key,
    count: countMap.get(key),
    color: colorFor(key, i),
  }));
}

function renderSurveyPassport(data) {
  const rowsWithWeight = data.filter(d => weightOf(d)).length;
  const gradeRows = data.filter(d => d.grade && d.grade !== "Ungraded or other grade").length;

  d3.select("#survey-passport").html(`
    <div class="passport-label">Dataset Passport</div>
    <div class="passport-title">CDC YRBS 2023</div>
    <div class="passport-metrics">
      <div class="passport-metric">
        <span class="passport-value">${data.length.toLocaleString()}</span>
        <span class="passport-caption">student rows</span>
      </div>
      <div class="passport-metric">
        <span class="passport-value">${gradeRows.toLocaleString()}</span>
        <span class="passport-caption">rows in grades 9-12</span>
      </div>
      <div class="passport-metric">
        <span class="passport-value">${rowsWithWeight.toLocaleString()}</span>
        <span class="passport-caption">rows with survey weight</span>
      </div>
      <div class="passport-metric">
        <span class="passport-value">250</span>
        <span class="passport-caption">variables after conversion</span>
      </div>
    </div>
    <p class="passport-note">One mosaic dot represents about ${MOSAIC_UNIT} student rows. Health estimates below use weighted percentages.</p>
  `);
}

function renderMosaicControls(data) {
  const controls = d3.select("#mosaic-controls");
  controls.selectAll("*").remove();

  MOSAIC_DIMENSIONS.forEach(dimension => {
    controls.append("button")
      .attr("type", "button")
      .attr("class", `segment-button${dimension.field === mosaicColorField ? " active" : ""}`)
      .text(dimension.label)
      .on("click", () => {
        mosaicColorField = dimension.field;
        renderMosaicControls(data);
        drawStudentMosaic(data);
      });
  });
}

function drawStudentMosaic(data) {
  d3.select("#student-mosaic").selectAll("*").remove();
  d3.select("#mosaic-legend").selectAll("*").remove();

  const dimension = mosaicDimension(mosaicColorField);
  const categories = orderedMosaicCategories(data, dimension);
  const totalForDimension = d3.sum(categories, d => d.count);
  const dots = categories.flatMap(category => {
    const count = Math.max(1, Math.round(category.count / MOSAIC_UNIT));
    return d3.range(count).map(() => ({ ...category, totalForDimension }));
  });

  const columns = 34;
  const cell = 16;
  const radius = 5.5;
  const margin = { top: 20, right: 20, bottom: 22, left: 20 };
  const W = columns * cell + margin.left + margin.right;
  const H = Math.ceil(dots.length / columns) * cell + margin.top + margin.bottom;

  const svg = d3.select("#student-mosaic")
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .style("max-width", "760px")
    .style("display", "block");

  svg.append("text")
    .attr("x", margin.left)
    .attr("y", 12)
    .style("font-size", "11px")
    .style("font-weight", "700")
    .style("fill", "#5c6472")
    .text(`${dots.length.toLocaleString()} dots, about ${MOSAIC_UNIT} rows per dot`);

  svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .selectAll("circle")
    .data(dots)
    .join("circle")
    .attr("cx", (_d, i) => (i % columns) * cell + cell / 2)
    .attr("cy", (_d, i) => Math.floor(i / columns) * cell + cell / 2)
    .attr("r", radius)
    .attr("fill", d => d.color)
    .attr("fill-opacity", 0.88)
    .attr("stroke", "#fff")
    .attr("stroke-width", 1)
    .on("mouseover", (_event, d) => {
      const pct = d.totalForDimension ? (d.count / d.totalForDimension * 100).toFixed(1) : "0.0";
      demoTooltip
        .style("opacity", 1)
        .html(`<strong>${d.key}</strong><br>${d.count.toLocaleString()} rows<br>${pct}% of known ${dimension.label.toLowerCase()}`);
    })
    .on("mousemove", event => {
      demoTooltip
        .style("left", (event.pageX + 14) + "px")
        .style("top", (event.pageY - 42) + "px");
    })
    .on("mouseout", () => demoTooltip.style("opacity", 0));

  const legend = d3.select("#mosaic-legend");
  categories.forEach(category => {
    const pct = totalForDimension ? (category.count / totalForDimension * 100).toFixed(1) : "0.0";
    const item = legend.append("div").attr("class", "legend-item");
    item.append("span")
      .attr("class", "legend-swatch")
      .style("background", category.color);
    item.append("span")
      .attr("class", "legend-label")
      .text(`${category.key} ${pct}%`);
  });
}

function drawDemographics(allData) {
  _allDemoData = allData;
  renderSurveyPassport(allData);
  renderMosaicControls(allData);
  drawStudentMosaic(allData);
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
  { key: "mentalHealth", label: "Not poor mental health" },
  { key: "sleep",        label: "Sleep 8+ hrs" },
  { key: "active",       label: "Active 5+ days" },
  { key: "noBullying",   label: "No school bullying" },
  { key: "noSubstance",  label: "No current substance" },
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
    // Map back to original palette index for consistent colours
    const paletteIdx = radarGroupsFor(allData, groupField).indexOf(grp);
    return {
      group: grp,
      color: colorFor(grp, paletteIdx === -1 ? si : paletteIdx),
      scores: {
        mentalHealth: weightedPercent(subset, d => d.QN84 === NO, hasBinaryFields(["QN84"])),
        sleep:        weightedPercent(subset, d => d.QN85 === YES, hasBinaryFields(["QN85"])),
        active:       weightedPercent(subset, d => d.QN76 === YES, hasBinaryFields(["QN76"])),
        noBullying:   weightedPercent(subset, d => d.QN24 === NO, hasBinaryFields(["QN24"])),
        noSubstance:  weightedPercent(
          subset,
          d => d.QNTB4 === NO && d.QN42 === NO && d.QN48 === NO,
          hasBinaryFields(["QNTB4", "QN42", "QN48"])
        ),
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
// SECTION 3 — Risk indicator dot plot
// ═══════════════════════════════════════════════════════════
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
  { key: "poorMental", label: "Poor mental health",      fields: ["QN84"],  fn: d => d.QN84 === YES },
  { key: "lowSleep",   label: "Insufficient sleep",      fields: ["QN85"],  fn: d => d.QN85 === NO },
  { key: "inactive",   label: "Inactive <5 days/wk",     fields: ["QN76"],  fn: d => d.QN76 === NO },
  { key: "bullied",    label: "Bullied at school",       fields: ["QN24"],  fn: d => d.QN24 === YES },
  { key: "tobacco",    label: "Current tobacco / EVP",   fields: ["QNTB4"], fn: d => d.QNTB4 === YES },
  { key: "marijuana",  label: "Current marijuana use",   fields: ["QN48"],  fn: d => d.QN48 === YES },
];

function drawDotPlot(data, groupField) {
  d3.select("#bar-chart").selectAll("*").remove();

  const groups = DOT_GROUP_ORDERS[groupField]
    .filter(g => data.some(d => d[groupField] === g));

  // Compute % per indicator × group
  const rows = DOT_INDICATORS.map(ind => {
    const pts = groups.map((g, gi) => {
      const subset = data.filter(d => d[groupField] === g);
      const pct = weightedPercent(subset, ind.fn, hasBinaryFields(ind.fields));
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
// SECTION 4 — Grade profile shift
// ═══════════════════════════════════════════════════════════
const GRADE_ORDER = ["9th grade", "10th grade", "11th grade", "12th grade"];

const GRADE_SHIFT_METRICS = [
  {
    key: "sleep",
    label: "Sleep 8+ hours",
    fields: ["QN85"],
    fn: d => d.QN85 === YES,
    color: "#4e79a7",
  },
  {
    key: "poorMental",
    label: "Poor mental health",
    fields: ["QN84"],
    fn: d => d.QN84 === YES,
    color: "#e15759",
  },
  {
    key: "bullied",
    label: "Bullied at school",
    fields: ["QN24"],
    fn: d => d.QN24 === YES,
    color: "#f28e2b",
  },
  {
    key: "connected",
    label: "School connectedness",
    fields: ["QN103"],
    fn: d => d.QN103 === YES,
    color: "#59a14f",
  },
  {
    key: "tobacco",
    label: "Current tobacco / EVP",
    fields: ["QNTB4"],
    fn: d => d.QNTB4 === YES,
    color: "#b07aa1",
  },
  {
    key: "marijuana",
    label: "Current marijuana",
    fields: ["QN48"],
    fn: d => d.QN48 === YES,
    color: "#9c755f",
  },
];

function computeGradeShiftRows(data) {
  return GRADE_SHIFT_METRICS.map(metric => ({
    ...metric,
    values: GRADE_ORDER.map(grade => {
      const subset = data.filter(d => d.grade === grade);
      const stat = weightedStat(subset, metric.fn, hasBinaryFields(metric.fields));
      return { grade, ...stat };
    }),
  }));
}

function gradeMetricValue(rows, metricKey, grade) {
  const metric = rows.find(d => d.key === metricKey);
  return metric?.values.find(d => d.grade === grade)?.pct ?? 0;
}

function drawGradeShift(data) {
  const rows = computeGradeShiftRows(data);

  d3.select("#grade-shift-summary").html(`
    <div class="grade-summary-card">
      <span class="grade-summary-value">${gradeMetricValue(rows, "sleep", "9th grade")}% -> ${gradeMetricValue(rows, "sleep", "12th grade")}%</span>
      <span class="grade-summary-label">sleep 8+ hours from 9th to 12th grade</span>
    </div>
    <div class="grade-summary-card">
      <span class="grade-summary-value">${gradeMetricValue(rows, "marijuana", "9th grade")}% -> ${gradeMetricValue(rows, "marijuana", "12th grade")}%</span>
      <span class="grade-summary-label">current marijuana use from 9th to 12th grade</span>
    </div>
    <div class="grade-summary-card">
      <span class="grade-summary-value">${gradeMetricValue(rows, "bullied", "9th grade")}% -> ${gradeMetricValue(rows, "bullied", "12th grade")}%</span>
      <span class="grade-summary-label">school bullying from 9th to 12th grade</span>
    </div>
  `);

  d3.select("#grade-shift-chart").selectAll("*").remove();

  const margin = { top: 28, right: 170, bottom: 58, left: 62 };
  const W = 760, H = 420;
  const iw = W - margin.left - margin.right;
  const ih = H - margin.top - margin.bottom;
  const allValues = rows.flatMap(metric => metric.values.map(d => d.pct));

  const svg = d3.select("#grade-shift-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .style("max-width", "880px")
    .style("display", "block")
    .style("overflow", "visible");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const x = d3.scalePoint().domain(GRADE_ORDER).range([0, iw]).padding(0.35);
  const y = d3.scaleLinear()
    .domain([0, Math.max(65, d3.max(allValues) || 0)])
    .nice()
    .range([ih, 0]);
  const line = d3.line()
    .x(d => x(d.grade))
    .y(d => y(d.pct))
    .curve(d3.curveMonotoneX);
  const tip = d3.select("body").selectAll(".grade-shift-tooltip").data([1])
    .join("div").attr("class", "grade-shift-tooltip dot-tooltip");

  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y).ticks(5).tickSize(-iw).tickFormat(""))
    .selectAll("line").style("stroke", "#eceff4");
  g.select(".grid .domain").remove();

  g.append("g")
    .attr("transform", `translate(0,${ih})`)
    .call(d3.axisBottom(x))
    .selectAll("text").style("font-size", "12px");
  g.append("g")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
    .selectAll("text").style("font-size", "12px");
  g.selectAll(".domain").style("display", "none");

  const labelPositions = new Map();
  const labelRows = [...rows].sort((a, b) =>
    y(a.values[a.values.length - 1].pct) - y(b.values[b.values.length - 1].pct)
  );
  let nextLabelY = -Infinity;
  labelRows.forEach(row => {
    const desiredY = y(row.values[row.values.length - 1].pct);
    const placedY = Math.max(desiredY, nextLabelY + 17);
    labelPositions.set(row.key, placedY);
    nextLabelY = placedY;
  });
  const overflow = nextLabelY - ih;
  if (overflow > 0) {
    labelPositions.forEach((value, key) => {
      labelPositions.set(key, value - overflow);
    });
  }

  const series = g.selectAll(".grade-series")
    .data(rows, d => d.key)
    .join("g")
    .attr("class", "grade-series");

  series.append("path")
    .attr("d", d => line(d.values))
    .attr("fill", "none")
    .attr("stroke", d => d.color)
    .attr("stroke-width", 2.5);

  series.selectAll("circle")
    .data(d => d.values.map(value => ({ ...value, metric: d })))
    .join("circle")
    .attr("cx", d => x(d.grade))
    .attr("cy", d => y(d.pct))
    .attr("r", 4.5)
    .attr("fill", d => d.metric.color)
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .on("mouseover", (_event, d) => {
      tip.style("opacity", 1)
        .html(`<strong>${d.metric.label}</strong><br>${d.grade}: ${d.pct}%<br>Valid n: ${d.validN.toLocaleString()}<br>Missing: ${d.missingPct}%`);
    })
    .on("mousemove", event => {
      tip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 46) + "px");
    })
    .on("mouseout", () => tip.style("opacity", 0));

  series.append("line")
    .attr("x1", d => x(GRADE_ORDER[GRADE_ORDER.length - 1]) + 5)
    .attr("x2", iw + 8)
    .attr("y1", d => y(d.values[d.values.length - 1].pct))
    .attr("y2", d => labelPositions.get(d.key))
    .attr("stroke", d => d.color)
    .attr("stroke-width", 1)
    .attr("stroke-opacity", 0.55);

  series.append("text")
    .attr("x", iw + 12)
    .attr("y", d => labelPositions.get(d.key))
    .attr("dy", "0.35em")
    .style("font-size", "12px")
    .style("font-weight", "700")
    .style("fill", d => d.color)
    .text(d => d.label);

  g.append("text")
    .attr("x", iw / 2)
    .attr("y", ih + 42)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#555")
    .text("Grade");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -ih / 2)
    .attr("y", -44)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#555")
    .text("Weighted percent");
}

// ═══════════════════════════════════════════════════════════
// SECTIONS 5-6 — Risk role, risk stack, and poor current mental health
// ═══════════════════════════════════════════════════════════
const RISK_FACTORS = [
  {
    key: "sleep",
    label: "Insufficient sleep",
    fields: ["QN85"],
    isRisk: d => d.QN85 === NO,
  },
  {
    key: "activity",
    label: "Physical inactivity",
    fields: ["QN76"],
    isRisk: d => d.QN76 === NO,
  },
  {
    key: "bullying",
    label: "Bullied at school",
    fields: ["QN24"],
    isRisk: d => d.QN24 === YES,
  },
  {
    key: "substance",
    label: "Current substance use",
    fields: ["QNTB4", "QN42", "QN48"],
    isRisk: d => d.QNTB4 === YES || d.QN42 === YES || d.QN48 === YES,
  },
  {
    key: "connection",
    label: "Low school connectedness",
    fields: ["QN103"],
    isRisk: d => d.QN103 === NO,
  },
];

const riskSelected = new Set(RISK_FACTORS.map(d => d.key));

function selectedRiskFactors() {
  return RISK_FACTORS.filter(factor => riskSelected.has(factor.key));
}

function riskCount(d, factors) {
  return factors.reduce((count, factor) => count + (factor.isRisk(d) ? 1 : 0), 0);
}

function riskFields(factors) {
  return Array.from(new Set(["QN84", ...factors.flatMap(factor => factor.fields)]));
}

function initRiskProfiler(data) {
  renderRiskSelector(data);
  drawRiskStack(data);
  drawRiskRole(data);
}

function updateRiskProfiler(data) {
  drawRiskStack(data);
  drawRiskRole(data);
}

function renderRiskSelector(data) {
  const selector = d3.select("#risk-selector");
  selector.selectAll("*").remove();

  RISK_FACTORS.forEach(factor => {
    const item = selector.append("label").attr("class", "risk-toggle");
    item.append("input")
      .attr("type", "checkbox")
      .attr("checked", riskSelected.has(factor.key) ? true : null)
      .on("change", function () {
        if (this.checked) {
          riskSelected.add(factor.key);
        } else if (riskSelected.size > 1) {
          riskSelected.delete(factor.key);
        } else {
          this.checked = true;
          return;
        }
        updateRiskProfiler(data);
      });
    item.append("span").text(factor.label);
  });

  selector.append("button")
    .attr("class", "risk-reset")
    .text("All risks")
    .on("click", () => {
      riskSelected.clear();
      RISK_FACTORS.forEach(factor => riskSelected.add(factor.key));
      renderRiskSelector(data);
      updateRiskProfiler(data);
    });
}

function drawRiskStack(data) {
  d3.select("#risk-stack-chart").selectAll("*").remove();

  const factors = selectedRiskFactors();
  const fields = riskFields(factors);
  const validRows = data.filter(hasBinaryFields(fields));
  const buckets = d3.range(0, factors.length + 1).map(count => {
    const subset = validRows.filter(d => riskCount(d, factors) === count);
    return {
      count,
      n: subset.length,
      poorMentalHealth: weightedPercent(subset, d => d.QN84 === YES, hasBinaryFields(["QN84"])),
      share: weightedPercent(validRows, d => riskCount(d, factors) === count, () => true),
    };
  });

  const margin = { top: 26, right: 120, bottom: 58, left: 60 };
  const W = 680, H = 380;
  const iw = W - margin.left - margin.right;
  const ih = H - margin.top - margin.bottom;

  const svg = d3.select("#risk-stack-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .style("max-width", "760px")
    .style("display", "block")
    .style("overflow", "visible");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(buckets.map(d => String(d.count)))
    .range([0, iw])
    .padding(0.32);

  const y = d3.scaleLinear()
    .domain([0, Math.max(80, d3.max(buckets, d => d.poorMentalHealth) || 0)])
    .nice()
    .range([ih, 0]);

  const tip = d3.select("body").selectAll(".risk-profile-tooltip").data([1])
    .join("div").attr("class", "risk-profile-tooltip dot-tooltip");

  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y).ticks(5).tickSize(-iw).tickFormat(""))
    .selectAll("line").style("stroke", "#eceff4");
  g.select(".grid .domain").remove();

  g.append("g")
    .attr("transform", `translate(0,${ih})`)
    .call(d3.axisBottom(x))
    .selectAll("text").style("font-size", "13px");

  g.append("g")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
    .selectAll("text").style("font-size", "12px");
  g.selectAll(".domain").style("display", "none");

  const line = d3.line()
    .x(d => x(String(d.count)) + x.bandwidth() / 2)
    .y(d => y(d.poorMentalHealth))
    .curve(d3.curveMonotoneX);

  g.append("path")
    .datum(buckets)
    .attr("d", line)
    .attr("fill", "none")
    .attr("stroke", "#4e79a7")
    .attr("stroke-width", 3);

  const bars = g.selectAll(".risk-stack-bar")
    .data(buckets)
    .join("g")
    .attr("class", "risk-stack-bar")
    .attr("transform", d => `translate(${x(String(d.count))},0)`);

  bars.append("rect")
    .attr("x", 0)
    .attr("y", d => y(d.poorMentalHealth))
    .attr("width", x.bandwidth())
    .attr("height", d => ih - y(d.poorMentalHealth))
    .attr("fill", "#4e79a7")
    .attr("fill-opacity", 0.22)
    .attr("rx", 4);

  bars.append("circle")
    .attr("cx", x.bandwidth() / 2)
    .attr("cy", d => y(d.poorMentalHealth))
    .attr("r", 6)
    .attr("fill", "#4e79a7")
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .on("mouseover", (_event, d) => {
      tip.style("opacity", 1)
        .html(`<strong>${d.count} selected risks</strong><br>Poor mental health: <strong>${d.poorMentalHealth}%</strong><br>Weighted share: ${d.share}%<br>Valid n: ${d.n.toLocaleString()}`);
    })
    .on("mousemove", event => {
      tip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 42) + "px");
    })
    .on("mouseout", () => tip.style("opacity", 0));

  bars.append("text")
    .attr("x", x.bandwidth() / 2)
    .attr("y", d => y(d.poorMentalHealth) - 12)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("font-weight", "700")
    .style("fill", "#26364d")
    .text(d => `${d.poorMentalHealth}%`);

  g.append("text")
    .attr("x", iw / 2)
    .attr("y", ih + 42)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#555")
    .text("Number of selected risks");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -ih / 2)
    .attr("y", -44)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#555")
    .text("Poor current mental health");

  const note = svg.append("g").attr("transform", `translate(${margin.left + iw + 18}, ${margin.top + 22})`);
  note.append("text")
    .style("font-size", "11px")
    .style("font-weight", "700")
    .style("fill", "#333")
    .text("Complete-case view");
  note.append("text")
    .attr("y", 18)
    .style("font-size", "11px")
    .style("fill", "#666")
    .text(`${validRows.length.toLocaleString()} valid rows`);
  note.append("text")
    .attr("y", 36)
    .style("font-size", "11px")
    .style("fill", "#666")
    .text(`${factors.length} active risks`);
}

function computeRiskRoleRows(data) {
  return RISK_FACTORS.map(factor => {
    const fields = ["QN84", ...factor.fields];
    const validRows = data.filter(hasBinaryFields(fields));
    const riskRows = validRows.filter(factor.isRisk);
    const otherRows = validRows.filter(d => !factor.isRisk(d));
    const riskPct = weightedPercent(riskRows, d => d.QN84 === YES, hasBinaryFields(["QN84"]));
    const otherPct = weightedPercent(otherRows, d => d.QN84 === YES, hasBinaryFields(["QN84"]));

    return {
      ...factor,
      active: riskSelected.has(factor.key),
      validN: validRows.length,
      riskPct,
      otherPct,
      gap: +(riskPct - otherPct).toFixed(1),
    };
  }).sort((a, b) => b.gap - a.gap);
}

function drawRiskRole(data) {
  d3.select("#risk-role-chart").selectAll("*").remove();

  const rows = computeRiskRoleRows(data);
  const margin = { top: 28, right: 100, bottom: 46, left: 164 };
  const W = 620, H = rows.length * 54 + margin.top + margin.bottom;
  const iw = W - margin.left - margin.right;
  const ih = H - margin.top - margin.bottom;

  const svg = d3.select("#risk-role-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .style("max-width", "700px")
    .style("display", "block")
    .style("overflow", "visible");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const x = d3.scaleLinear()
    .domain([0, Math.max(10, d3.max(rows, d => d.gap) || 0)])
    .nice()
    .range([0, iw]);
  const y = d3.scaleBand()
    .domain(rows.map(d => d.key))
    .range([0, ih])
    .padding(0.36);

  const tip = d3.select("body").selectAll(".risk-role-tooltip").data([1])
    .join("div").attr("class", "risk-role-tooltip dot-tooltip");

  g.append("g")
    .attr("class", "grid")
    .call(d3.axisBottom(x).ticks(5).tickSize(ih).tickFormat(""))
    .selectAll("line").style("stroke", "#eceff4");
  g.select(".grid .domain").remove();

  g.append("g")
    .attr("transform", `translate(0,${ih})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d => `+${d} pp`))
    .selectAll("text").style("font-size", "11px");
  g.selectAll(".domain").style("display", "none");

  const row = g.selectAll(".risk-role-row")
    .data(rows, d => d.key)
    .join("g")
    .attr("class", "risk-role-row")
    .attr("opacity", d => d.active ? 1 : 0.36)
    .attr("transform", d => `translate(0,${y(d.key)})`)
    .style("cursor", "pointer")
    .on("click", (_event, d) => {
      if (riskSelected.has(d.key) && riskSelected.size === 1) return;
      if (riskSelected.has(d.key)) riskSelected.delete(d.key);
      else riskSelected.add(d.key);
      renderRiskSelector(data);
      updateRiskProfiler(data);
    });

  row.append("text")
    .attr("x", -12)
    .attr("y", y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .style("font-size", "13px")
    .style("fill", "#333")
    .text(d => d.label);

  row.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", d => x(Math.max(0, d.gap)))
    .attr("height", y.bandwidth())
    .attr("rx", 4)
    .attr("fill", "#e15759")
    .attr("fill-opacity", 0.72)
    .on("mouseover", (_event, d) => {
      tip.style("opacity", 1)
        .html(`<strong>${d.label}</strong><br>Risk present: ${d.riskPct}%<br>Risk absent: ${d.otherPct}%<br>Gap: +${d.gap} pp<br>Valid n: ${d.validN.toLocaleString()}`);
    })
    .on("mousemove", event => {
      tip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 50) + "px");
    })
    .on("mouseout", () => tip.style("opacity", 0));

  row.append("text")
    .attr("x", d => x(Math.max(0, d.gap)) + 8)
    .attr("y", y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .style("font-size", "12px")
    .style("font-weight", "700")
    .style("fill", "#333")
    .text(d => `+${d.gap} pp`);

  g.append("text")
    .attr("x", iw / 2)
    .attr("y", ih + 38)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#555")
    .text("Poor mental-health gap: risk present minus risk absent");
}

// ═══════════════════════════════════════════════════════════
// SECTION 5 — Relationships, consent, and sexual health
// ═══════════════════════════════════════════════════════════
const SEXUAL_SAFETY_FACTORS = [
  {
    label: "Sexual dating violence",
    denominator: "students who dated",
    valid: d => ["2", "3", "4", "5", "6"].includes(d.Q21),
    isRisk: d => ["3", "4", "5", "6"].includes(d.Q21),
  },
  {
    label: "Ever forced sexual intercourse",
    denominator: "students with valid response",
    valid: hasCodes("Q19", ["1", "2"]),
    isRisk: d => d.Q19 === YES,
  },
  {
    label: "Sexual violence",
    denominator: "students with valid response",
    valid: hasCodes("Q20", ["1", "2", "3", "4", "5"]),
    isRisk: d => ["2", "3", "4", "5"].includes(d.Q20),
  },
  {
    label: "Physical dating violence",
    denominator: "students who dated",
    valid: d => ["2", "3", "4", "5", "6"].includes(d.Q22),
    isRisk: d => ["3", "4", "5", "6"].includes(d.Q22),
  },
  {
    label: "Alcohol/drugs before sex",
    denominator: "students with valid last-sex response",
    valid: hasCodes("Q60", ["2", "3"]),
    isRisk: d => d.Q60 === "2",
  },
];

const SEXUAL_PREVENTION_METRICS = [
  {
    label: "Any birth-control method",
    valid: hasCodes("Q62", ["2", "3", "4", "5", "6", "7", "8"]),
    hit: d => ["3", "4", "5", "6", "7"].includes(d.Q62),
  },
  {
    label: "Consent verbally asked",
    valid: hasCodes("Q94", ["2", "3"]),
    hit: d => d.Q94 === "2",
  },
  {
    label: "No alcohol/drugs before sex",
    valid: hasCodes("Q60", ["2", "3"]),
    hit: d => d.Q60 === "3",
  },
  {
    label: "Condom used",
    valid: hasCodes("Q61", ["2", "3"]),
    hit: d => d.Q61 === "2",
  },
  {
    label: "HIV tested",
    valid: hasCodes("Q81", ["1", "2", "3"]),
    hit: d => d.Q81 === YES,
  },
  {
    label: "STD tested",
    valid: hasCodes("Q82", ["1", "2", "3"]),
    hit: d => d.Q82 === YES,
  },
];

function isCurrentlySexuallyActive(d) {
  return ["3", "4", "5", "6", "7", "8"].includes(d.Q59);
}

function computeSexualGapRows(data) {
  return SEXUAL_SAFETY_FACTORS.map(factor => {
    const validRows = data.filter(d => factor.valid(d) && isBinary(d, "QN84") && weightOf(d));
    const riskRows = validRows.filter(factor.isRisk);
    const otherRows = validRows.filter(d => !factor.isRisk(d));
    const riskPct = weightedPercent(riskRows, d => d.QN84 === YES, hasBinaryFields(["QN84"]));
    const otherPct = weightedPercent(otherRows, d => d.QN84 === YES, hasBinaryFields(["QN84"]));

    return {
      ...factor,
      riskPct,
      otherPct,
      gap: +(riskPct - otherPct).toFixed(1),
      validN: validRows.length,
      riskN: riskRows.length,
    };
  }).sort((a, b) => b.gap - a.gap);
}

function computeSexualPreventionRows(data) {
  const activeRows = data.filter(d => isCurrentlySexuallyActive(d));
  return SEXUAL_PREVENTION_METRICS.map(metric => ({
    ...metric,
    ...weightedStat(activeRows, metric.hit, metric.valid),
  }));
}

function drawSexualHealth(data) {
  const activeStat = weightedStat(data, isCurrentlySexuallyActive, hasCodes("Q59", ["1", "2", "3", "4", "5", "6", "7", "8"]));
  const violenceStat = weightedStat(
    data,
    d => ["2", "3", "4", "5"].includes(d.Q20),
    hasCodes("Q20", ["1", "2", "3", "4", "5"])
  );
  const gapRows = computeSexualGapRows(data);
  const topGap = gapRows[0];

  d3.select("#sexual-summary").html(`
    <div class="sexual-summary-card">
      <span class="sexual-summary-value">${activeStat.pct}%</span>
      <span class="sexual-summary-label">currently sexually active, weighted</span>
    </div>
    <div class="sexual-summary-card">
      <span class="sexual-summary-value">${violenceStat.pct}%</span>
      <span class="sexual-summary-label">reported sexual violence at least once</span>
    </div>
    <div class="sexual-summary-card">
      <span class="sexual-summary-value">+${topGap.gap} pp</span>
      <span class="sexual-summary-label">largest poor-mental-health gap: ${topGap.label}</span>
    </div>
  `);

  drawSexualGapChart(gapRows);
  drawSexualPreventionChart(computeSexualPreventionRows(data));
}

function drawSexualGapChart(rows) {
  d3.select("#sexual-gap-chart").selectAll("*").remove();

  const margin = { top: 24, right: 90, bottom: 50, left: 172 };
  const W = 720, H = rows.length * 50 + margin.top + margin.bottom;
  const iw = W - margin.left - margin.right;
  const ih = H - margin.top - margin.bottom;

  const svg = d3.select("#sexual-gap-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .style("max-width", "780px")
    .style("display", "block")
    .style("overflow", "visible");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const x = d3.scaleLinear()
    .domain([0, Math.max(10, d3.max(rows, d => d.gap) || 0)])
    .nice()
    .range([0, iw]);
  const y = d3.scaleBand()
    .domain(rows.map(d => d.label))
    .range([0, ih])
    .padding(0.36);

  const tip = d3.select("body").selectAll(".sexual-gap-tooltip").data([1])
    .join("div").attr("class", "sexual-gap-tooltip dot-tooltip");

  g.append("g")
    .attr("class", "grid")
    .call(d3.axisBottom(x).ticks(5).tickSize(ih).tickFormat(""))
    .selectAll("line").style("stroke", "#eef1f6");
  g.select(".grid .domain").remove();

  g.append("g")
    .attr("transform", `translate(0,${ih})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d => `+${d} pp`))
    .selectAll("text").style("font-size", "11px");
  g.selectAll(".domain").style("display", "none");

  const row = g.selectAll(".sexual-gap-row")
    .data(rows, d => d.label)
    .join("g")
    .attr("class", "sexual-gap-row")
    .attr("transform", d => `translate(0,${y(d.label)})`);

  row.append("text")
    .attr("x", -12)
    .attr("y", y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .style("font-size", "13px")
    .style("fill", "#333")
    .text(d => d.label);

  row.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", d => x(Math.max(0, d.gap)))
    .attr("height", y.bandwidth())
    .attr("rx", 4)
    .attr("fill", "#b84a62")
    .attr("fill-opacity", 0.78)
    .on("mouseover", (_event, d) => {
      tip.style("opacity", 1)
        .html(`<strong>${d.label}</strong><br>Poor mental health if present: ${d.riskPct}%<br>Absent / comparison: ${d.otherPct}%<br>Gap: +${d.gap} pp<br>Denominator: ${d.denominator}<br>Valid n: ${d.validN.toLocaleString()}`);
    })
    .on("mousemove", event => {
      tip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 60) + "px");
    })
    .on("mouseout", () => tip.style("opacity", 0));

  row.append("text")
    .attr("x", d => x(Math.max(0, d.gap)) + 8)
    .attr("y", y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .style("font-size", "12px")
    .style("font-weight", "700")
    .style("fill", "#333")
    .text(d => `+${d.gap} pp`);

  g.append("text")
    .attr("x", iw / 2)
    .attr("y", ih + 40)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#555")
    .text("Poor mental-health gap: present minus absent / comparison");
}

function drawSexualPreventionChart(rows) {
  d3.select("#sexual-prevention-chart").selectAll("*").remove();

  const margin = { top: 24, right: 72, bottom: 50, left: 172 };
  const W = 700, H = rows.length * 46 + margin.top + margin.bottom;
  const iw = W - margin.left - margin.right;
  const ih = H - margin.top - margin.bottom;

  const svg = d3.select("#sexual-prevention-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .style("max-width", "760px")
    .style("display", "block")
    .style("overflow", "visible");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const x = d3.scaleLinear().domain([0, 100]).range([0, iw]);
  const y = d3.scaleBand().domain(rows.map(d => d.label)).range([0, ih]).padding(0.32);
  const tip = d3.select("body").selectAll(".sexual-prevention-tooltip").data([1])
    .join("div").attr("class", "sexual-prevention-tooltip dot-tooltip");

  g.append("g")
    .attr("class", "grid")
    .call(d3.axisBottom(x).ticks(5).tickSize(ih).tickFormat(""))
    .selectAll("line").style("stroke", "#eef1f6");
  g.select(".grid .domain").remove();

  g.append("g")
    .attr("transform", `translate(0,${ih})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d => `${d}%`))
    .selectAll("text").style("font-size", "11px");
  g.selectAll(".domain").style("display", "none");

  const row = g.selectAll(".sexual-prevention-row")
    .data(rows, d => d.label)
    .join("g")
    .attr("class", "sexual-prevention-row")
    .attr("transform", d => `translate(0,${y(d.label)})`);

  row.append("text")
    .attr("x", -12)
    .attr("y", y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .style("font-size", "13px")
    .style("fill", "#333")
    .text(d => d.label);

  row.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", d => x(d.pct))
    .attr("height", y.bandwidth())
    .attr("rx", 4)
    .attr("fill", "#4e79a7")
    .attr("fill-opacity", 0.78)
    .on("mouseover", (_event, d) => {
      tip.style("opacity", 1)
        .html(`<strong>${d.label}</strong><br>${d.pct}% among currently sexually active students<br>Valid n: ${d.validN.toLocaleString()}<br>Missing in active denominator: ${d.missingPct}%`);
    })
    .on("mousemove", event => {
      tip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 50) + "px");
    })
    .on("mouseout", () => tip.style("opacity", 0));

  row.append("text")
    .attr("x", d => x(d.pct) + 8)
    .attr("y", y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .style("font-size", "12px")
    .style("font-weight", "700")
    .style("fill", "#333")
    .text(d => `${d.pct}%`);

  g.append("text")
    .attr("x", iw / 2)
    .attr("y", ih + 40)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#555")
    .text("Weighted percent among currently sexually active students");
}

// ═══════════════════════════════════════════════════════════
// SECTION 6 — Correlation bar chart: metrics vs addiction
// ═══════════════════════════════════════════════════════════
const PHONE_METRICS = {
  Daily_Usage_Hours:      { label: "Daily usage (hrs)", higherBad: true },
  Phone_Checks_Per_Day:   { label: "Phone checks / day", higherBad: true },
  Time_on_Social_Media:   { label: "Social media time", higherBad: true },
  Weekend_Usage_Hours:    { label: "Weekend usage (hrs)", higherBad: true },
  Sleep_Hours:            { label: "Sleep (hrs)", higherBad: false },
  Anxiety_Level:          { label: "Anxiety", higherBad: true },
  Depression_Level:       { label: "Depression", higherBad: true },
  Exercise_Hours:         { label: "Exercise (hrs)", higherBad: false },
  Self_Esteem:            { label: "Self-esteem", higherBad: false },
  Academic_Performance:   { label: "Academic performance", higherBad: false },
  Social_Interactions:    { label: "Social interactions", higherBad: false },
};

const PHONE_CORRELATION_KEYS = [
  "Daily_Usage_Hours",
  "Phone_Checks_Per_Day",
  "Time_on_Social_Media",
  "Weekend_Usage_Hours",
  "Sleep_Hours",
  "Anxiety_Level",
  "Depression_Level",
  "Exercise_Hours",
  "Self_Esteem",
  "Academic_Performance",
];

function metricLabel(key) {
  return PHONE_METRICS[key]?.label ?? key;
}

function pearsonR(xs, ys) {
  const pairs = xs.map((x, i) => [x, ys[i]])
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  const cleanXs = pairs.map(d => d[0]);
  const cleanYs = pairs.map(d => d[1]);
  const mx = d3.mean(cleanXs), my = d3.mean(cleanYs);
  const num = d3.sum(cleanXs.map((x, i) => (x - mx) * (cleanYs[i] - my)));
  const den = Math.sqrt(d3.sum(cleanXs.map(x => (x - mx) ** 2)) * d3.sum(cleanYs.map(y => (y - my) ** 2)));
  return den === 0 ? 0 : num / den;
}

function drawCorrelationChart(data) {
  d3.select("#heatmap-chart").selectAll("*").remove();

  const addiction = data.map(d => d.Addiction_Level);

  // Compute r and sort by |r| descending
  const corrs = PHONE_CORRELATION_KEYS.map(key => ({
    key,
    label: metricLabel(key),
    higherBad: PHONE_METRICS[key].higherBad,
    r: pearsonR(addiction, data.map(d => d[key])),
  })).sort((a, b) => Math.abs(b.r) - Math.abs(a.r));

  const strongest = corrs[0];
  const protective = corrs.find(d => d.r < 0 && !d.higherBad) || corrs.find(d => d.r > 0 && d.higherBad);
  d3.select("#phone-corr-summary").html(`
    <div class="phone-summary-card">
      <span class="phone-summary-value">${strongest.label}</span>
      <span class="phone-summary-label">strongest absolute correlation, r = ${strongest.r.toFixed(2)}</span>
    </div>
    <div class="phone-summary-card">
      <span class="phone-summary-value">${protective.label}</span>
      <span class="phone-summary-label">largest concerning direction among displayed metrics</span>
    </div>
  `);

  const margin = { top: 20, right: 118, bottom: 86, left: 174 };
  const W = 760, H = corrs.length * 38 + margin.top + margin.bottom;
  const iw = W - margin.left - margin.right;
  const ih = H - margin.top - margin.bottom;

  const svg = d3.select("#heatmap-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .style("max-width", "880px")
    .style("display", "block")
    .style("overflow", "visible");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const maxAbs = Math.max(0.1, d3.max(corrs, d => Math.abs(d.r)) || 0);
  const x = d3.scaleLinear().domain([-maxAbs * 1.18, maxAbs * 1.18]).nice().range([0, iw]);
  const y = d3.scaleBand().domain(corrs.map(d => d.label)).range([0, ih]).padding(0.3);

  // Zero line
  g.append("line")
    .attr("x1", x(0)).attr("x2", x(0))
    .attr("y1", 0).attr("y2", ih)
    .attr("stroke", "#999").attr("stroke-width", 1.5);

  g.append("g")
    .attr("class", "grid")
    .call(d3.axisBottom(x).ticks(6).tickSize(ih).tickFormat(""))
    .selectAll("line").style("stroke", "#eef1f6");
  g.select(".grid .domain").remove();

  // X-axis
  g.append("g")
    .attr("transform", `translate(0,${ih})`)
    .call(d3.axisBottom(x).ticks(7).tickFormat(d3.format("+.2f")))
    .call(ax => ax.select(".domain").remove())
    .selectAll("text").style("font-size", "12px");

  // Axis label
  g.append("text")
    .attr("x", iw / 2).attr("y", ih + 38)
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
      .attr("fill-opacity", 0.78)
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
  const leg = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top + ih + 58})`);
  [["#e15759","Higher addiction -> worse"], ["#59a14f","Higher addiction -> better"]].forEach(([col, lbl], i) => {
    leg.append("rect").attr("x", i * 245).attr("y", 0).attr("width", 12).attr("height", 12).attr("fill", col).attr("rx", 2);
    leg.append("text").attr("x", i * 245 + 16).attr("y", 10).style("font-size", "11px").style("fill", "#555").text(lbl);
  });
}
