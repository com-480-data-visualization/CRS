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
// SECTION 1 — Demographics (interactive association flow)
// ═══════════════════════════════════════════════════════════

const flowTooltip = d3.select("body").append("div").attr("class", "flow-tooltip dot-tooltip");

let flowLeftField = "grade";
let flowRightField = "sex";
let flowFocus = null;

const DEMOGRAPHIC_DIMENSIONS = [
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

function demographicDimension(field) {
  return DEMOGRAPHIC_DIMENSIONS.find(d => d.field === field) ?? DEMOGRAPHIC_DIMENSIONS[0];
}

function orderedDemographicCategories(data, dimension) {
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
    <p class="passport-note">The flow view uses raw survey rows to show survey composition. Later prevalence estimates use CDC survey weights.</p>
  `);
}

function renderFlowControls(data) {
  const left = d3.select("#flow-left-select");
  const right = d3.select("#flow-right-select");

  [left, right].forEach(select => {
    select.selectAll("*").remove();
    select.selectAll("option")
      .data(DEMOGRAPHIC_DIMENSIONS)
      .join("option")
      .attr("value", d => d.field)
      .text(d => d.label);
  });

  left.property("value", flowLeftField);
  right.property("value", flowRightField);

  left.on("change", function () {
    flowLeftField = this.value;
    if (flowLeftField === flowRightField) {
      flowRightField = DEMOGRAPHIC_DIMENSIONS.find(d => d.field !== flowLeftField).field;
    }
    normalizeFlowFocus();
    renderFlowControls(data);
    drawDemographicFlow(data);
  });

  right.on("change", function () {
    flowRightField = this.value;
    if (flowRightField === flowLeftField) {
      flowLeftField = DEMOGRAPHIC_DIMENSIONS.find(d => d.field !== flowRightField).field;
    }
    normalizeFlowFocus();
    renderFlowControls(data);
    drawDemographicFlow(data);
  });

  d3.select("#flow-swap").on("click", () => {
    [flowLeftField, flowRightField] = [flowRightField, flowLeftField];
    normalizeFlowFocus();
    renderFlowControls(data);
    drawDemographicFlow(data);
  });
}

function flowPath(flow, x0, x1) {
  const mid = (x0 + x1) / 2;
  return [
    `M${x0},${flow.leftY0}`,
    `C${mid},${flow.leftY0} ${mid},${flow.rightY0} ${x1},${flow.rightY0}`,
    `L${x1},${flow.rightY1}`,
    `C${mid},${flow.rightY1} ${mid},${flow.leftY1} ${x0},${flow.leftY1}`,
    "Z",
  ].join(" ");
}

function normalizeFlowFocus() {
  if (flowFocus && flowFocus.field !== flowLeftField && flowFocus.field !== flowRightField) {
    flowFocus = null;
  }
}

function computeFlowNodes(categories, x, scale, gap) {
  let y = 0;

  return categories.map(category => {
    const nodeHeight = Math.max(3, category.count * scale);
    const node = {
      ...category,
      x,
      y0: y,
      y1: y + nodeHeight,
    };
    y += nodeHeight + gap;
    return node;
  });
}

function shortFlowLabel(value) {
  return value.length > 26 ? `${value.slice(0, 23)}...` : value;
}

function drawDemographicFlow(data) {
  d3.select("#demographic-flow-chart").selectAll("*").remove();

  normalizeFlowFocus();

  const leftDimension = demographicDimension(flowLeftField);
  const rightDimension = demographicDimension(flowRightField);
  const rows = data.filter(d => d[leftDimension.field] && d[rightDimension.field]);
  const leftCategories = orderedDemographicCategories(rows, leftDimension);
  const rightCategories = orderedDemographicCategories(rows, rightDimension);
  const leftIndex = new Map(leftCategories.map((d, i) => [d.key, i]));
  const rightIndex = new Map(rightCategories.map((d, i) => [d.key, i]));
  const total = rows.length;

  if (!total) {
    d3.select("#flow-summary").text("No rows for this demographic pairing.");
    d3.select("#demographic-flow-chart").html(`<div class="loading-panel">No demographic associations available.</div>`);
    return;
  }

  const focusedRows = flowFocus
    ? rows.filter(d => d[flowFocus.field] === flowFocus.key).length
    : null;

  d3.select("#flow-summary").html(`
    <span>${flowFocus
      ? `${focusedRows.toLocaleString()} of ${total.toLocaleString()} rows match ${flowFocus.key}`
      : `${total.toLocaleString()} rows with known ${leftDimension.label.toLowerCase()} and ${rightDimension.label.toLowerCase()}`}</span>
  `);

  const margin = { top: 42, right: 220, bottom: 34, left: 210 };
  const W = 980;
  const H = Math.max(420, Math.max(leftCategories.length, rightCategories.length) * 48 + margin.top + margin.bottom);
  const iw = W - margin.left - margin.right;
  const ih = H - margin.top - margin.bottom;
  const nodeWidth = 16;
  const nodeGap = 8;
  const leftX = 0;
  const rightX = iw - nodeWidth;
  const maxCategoryCount = Math.max(leftCategories.length, rightCategories.length);
  const scale = (ih - nodeGap * Math.max(0, maxCategoryCount - 1)) / total;
  const leftNodes = computeFlowNodes(leftCategories, leftX, scale, nodeGap);
  const rightNodes = computeFlowNodes(rightCategories, rightX, scale, nodeGap);
  const leftNodeMap = new Map(leftNodes.map(node => [node.key, node]));
  const rightNodeMap = new Map(rightNodes.map(node => [node.key, node]));
  const leftOffsets = new Map(leftNodes.map(node => [node.key, node.y0]));
  const rightOffsets = new Map(rightNodes.map(node => [node.key, node.y0]));

  const pairCounts = d3.rollups(
    rows,
    v => v.length,
    d => d[leftDimension.field],
    d => d[rightDimension.field]
  );

  const pairRows = [];
  pairCounts.forEach(([leftKey, children]) => {
    children.forEach(([rightKey, count]) => {
      pairRows.push({ leftKey, rightKey, count });
    });
  });

  pairRows.sort((a, b) =>
    d3.ascending(leftIndex.get(a.leftKey), leftIndex.get(b.leftKey)) ||
    d3.ascending(rightIndex.get(a.rightKey), rightIndex.get(b.rightKey))
  );

  const flows = [];
  pairRows.forEach(({ leftKey, rightKey, count }) => {
    const leftNode = leftNodeMap.get(leftKey);
    const rightNode = rightNodeMap.get(rightKey);
    if (!leftNode || !rightNode) return;

    const thickness = Math.max(1.5, count * scale);
    const leftY0 = leftOffsets.get(leftKey);
    const rightY0 = rightOffsets.get(rightKey);
    leftOffsets.set(leftKey, leftY0 + thickness);
    rightOffsets.set(rightKey, rightY0 + thickness);
    flows.push({
      leftKey,
      rightKey,
      count,
      color: colorFor(leftKey, leftIndex.get(leftKey) ?? 0),
      leftY0,
      leftY1: leftY0 + thickness,
      rightY0,
      rightY1: rightY0 + thickness,
    });
  });

  const flowMatchesFocus = flow => {
    if (!flowFocus) return true;
    return (flowFocus.field === leftDimension.field && flow.leftKey === flowFocus.key) ||
      (flowFocus.field === rightDimension.field && flow.rightKey === flowFocus.key);
  };

  const focusOpacity = flow => flowFocus ? (flowMatchesFocus(flow) ? 0.64 : 0.05) : 0.32;

  const svg = d3.select("#demographic-flow-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .style("max-width", "980px")
    .style("display", "block");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  svg.append("text")
    .attr("x", margin.left)
    .attr("y", 20)
    .style("font-size", "12px")
    .style("font-weight", "700")
    .style("fill", "#5c6472")
    .text(`${leftDimension.label} associated with ${rightDimension.label}`);

  const ribbon = g.append("g")
    .attr("class", "flow-ribbons")
    .selectAll("path")
    .data(flows)
    .join("path")
    .attr("class", "flow-ribbon")
    .attr("d", d => flowPath(d, leftX + nodeWidth, rightX))
    .attr("fill", d => d.color)
    .attr("fill-opacity", d => focusOpacity(d))
    .attr("stroke", "none")
    .on("mouseover", (_event, d) => {
      ribbon.attr("fill-opacity", f => f === d ? 0.76 : (flowMatchesFocus(f) ? 0.22 : 0.04));
      const pct = total ? (d.count / total * 100).toFixed(1) : "0.0";
      flowTooltip
        .style("opacity", 1)
        .html(`<strong>${d.leftKey} -> ${d.rightKey}</strong><br>${d.count.toLocaleString()} rows<br>${pct}% of shown rows`);
    })
    .on("mousemove", event => {
      flowTooltip
        .style("left", (event.pageX + 14) + "px")
        .style("top", (event.pageY - 46) + "px");
    })
    .on("mouseout", () => {
      ribbon.attr("fill-opacity", d => focusOpacity(d));
      flowTooltip.style("opacity", 0);
    });

  function drawNodes(nodes, side, dimension) {
    const nodeG = g.append("g").attr("class", `flow-nodes flow-nodes-${side}`);
    const isLeft = side === "left";
    const node = nodeG.selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "flow-node")
      .style("cursor", "pointer")
      .on("click", (_event, d) => {
        const isSameFocus = flowFocus &&
          flowFocus.field === dimension.field &&
          flowFocus.key === d.key;
        flowFocus = isSameFocus ? null : { field: dimension.field, key: d.key };
        drawDemographicFlow(data);
      })
      .on("mouseover", (event, d) => {
        const pct = total ? (d.count / total * 100).toFixed(1) : "0.0";
        flowTooltip
          .style("opacity", 1)
          .style("left", (event.pageX + 14) + "px")
          .style("top", (event.pageY - 46) + "px")
          .html(`<strong>${dimension.label}: ${d.key}</strong><br>${d.count.toLocaleString()} rows<br>${pct}% of shown rows`);
      })
      .on("mousemove", event => {
        flowTooltip
          .style("left", (event.pageX + 14) + "px")
          .style("top", (event.pageY - 46) + "px");
      })
      .on("mouseout", () => flowTooltip.style("opacity", 0));

    node.append("rect")
      .attr("x", d => d.x)
      .attr("y", d => d.y0)
      .attr("width", nodeWidth)
      .attr("height", d => d.y1 - d.y0)
      .attr("rx", 4)
      .attr("fill", d => isLeft ? colorFor(d.key, leftIndex.get(d.key) ?? 0) : "#8d97a8")
      .attr("fill-opacity", d => {
        if (!flowFocus) return 0.92;
        return flowFocus.field === dimension.field && flowFocus.key === d.key ? 1 : 0.36;
      })
      .attr("stroke", d => flowFocus && flowFocus.field === dimension.field && flowFocus.key === d.key ? "#20283a" : "none")
      .attr("stroke-width", 2);

    node.append("text")
      .attr("x", d => isLeft ? d.x - 10 : d.x + nodeWidth + 10)
      .attr("y", d => (d.y0 + d.y1) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", isLeft ? "end" : "start")
      .style("font-size", "11px")
      .style("font-weight", "700")
      .style("fill", "#303849")
      .text(d => {
        const pct = total ? (d.count / total * 100).toFixed(1) : "0.0";
        return `${shortFlowLabel(d.key)} ${pct}%`;
      });

    svg.append("text")
      .attr("x", margin.left + (isLeft ? 0 : rightX + nodeWidth))
      .attr("y", 36)
      .attr("text-anchor", isLeft ? "start" : "start")
      .style("font-size", "11px")
      .style("font-weight", "800")
      .style("letter-spacing", "0.06em")
      .style("text-transform", "uppercase")
      .style("fill", "#4e79a7")
      .text(dimension.label);
  }

  drawNodes(leftNodes, "left", leftDimension);
  drawNodes(rightNodes, "right", rightDimension);
}

function drawDemographics(allData) {
  renderSurveyPassport(allData);
  renderFlowControls(allData);
  drawDemographicFlow(allData);
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

// ─────────────────────────────────────────────
// SOCIAL MEDIA ADDICTION DATASET — SHARED HELPERS
// ─────────────────────────────────────────────
const SMA_PLATFORM_META = {
  "Instagram": { slug: "instagram", color: "#E4405F" },
  "TikTok":    { slug: "tiktok",    color: "#000000" },
  "Facebook":  { slug: "facebook",  color: "#1877F2" },
  "WhatsApp":  { slug: "whatsapp",  color: "#25D366" },
  "Twitter":   { slug: "x",         color: "#000000", letter: "X" },
  "LinkedIn":  { slug: "linkedin", color: "#0A66C2" },
  "WeChat":    { slug: "wechat",    color: "#07C160" },
  "Snapchat":  { slug: "snapchat",  color: "#FFFC00" },
  "LINE":      { slug: "line",      color: "#00C300" },
  "KakaoTalk": { slug: "kakaotalk", color: "#FFCD00", logoColor: "black" },
  "VKontakte": { slug: "vk",        color: "#0077FF" },
  "YouTube":   { slug: "youtube",   color: "#FF0000" }
};

function smaPlatformOf(p) {
  return SMA_PLATFORM_META[p] || { slug: null, color: "#888", letter: (p || "?").charAt(0).toUpperCase() };
}

function smaLogoUrl(meta, platform) {
  if (platform === "LinkedIn") return "LinkedIn_logo.png";
  if (!meta.slug) return null;
  const color = meta.logoColor || "white";
  return `https://cdn.simpleicons.org/${meta.slug}/${color}`;
}

// ─────────────────────────────────────────────
// SMA ORIENTATION: DEMOGRAPHIC FLOW
// ─────────────────────────────────────────────
const SMA_FLOW_DIMENSIONS = {
  Gender: {
    label: "Gender",
    categories: ["Female", "Male"],
    read: r => r.Gender?.trim() || null
  },
  Age: {
    label: "Age",
    categories: ["18", "19", "20", "21", "22", "23", "24"],
    read: r => r.Age ? String(+r.Age) : null
  },
  Academic_Level: {
    label: "Academic level",
    categories: ["High School", "Undergraduate", "Graduate"],
    read: r => r.Academic_Level?.trim() || null
  },
  Relationship_Status: {
    label: "Relationship",
    categories: ["Single", "In Relationship", "Complicated"],
    read: r => r.Relationship_Status?.trim() || null
  }
};

function drawSmaDemographicFlow(data) {
  const leftSelect  = document.getElementById("sma-flow-left");
  const rightSelect = document.getElementById("sma-flow-right");
  const swapButton  = document.getElementById("sma-flow-swap");
  if (!leftSelect || !rightSelect) return;

  fillDimensionSelect(leftSelect,  "Gender");
  fillDimensionSelect(rightSelect, "Academic_Level");

  const render = () => renderSmaFlow(data, leftSelect.value, rightSelect.value);
  leftSelect.addEventListener("change", render);
  rightSelect.addEventListener("change", render);
  swapButton?.addEventListener("click", () => {
    [leftSelect.value, rightSelect.value] = [rightSelect.value, leftSelect.value];
    render();
  });

  render();
  window.addEventListener("resize", render);
}

function fillDimensionSelect(select, defaultKey) {
  select.innerHTML = "";
  for (const [key, { label }] of Object.entries(SMA_FLOW_DIMENSIONS)) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = label;
    if (key === defaultKey) opt.selected = true;
    select.appendChild(opt);
  }
}

function renderSmaFlow(data, leftKey, rightKey) {
  const container = document.getElementById("sma-flow-chart");
  if (!container) return;
  const left  = SMA_FLOW_DIMENSIONS[leftKey];
  const right = SMA_FLOW_DIMENSIONS[rightKey];

  d3.select(container).selectAll("*").remove();

  const width  = container.clientWidth || 540;
  const height = 320;
  const svg = d3.select(container).append("svg")
    .attr("width", width).attr("height", height)
    .style("font-family", "Segoe UI, Arial, sans-serif");

  // Cross-tabulate left × right (skip rows that miss either side)
  const counts = d3.rollup(
    data.filter(r => left.read(r) && right.read(r)),
    rows => rows.length,
    r => left.read(r),
    r => right.read(r)
  );

  // Prefix indexes with "L:" / "R:" so the same label on both sides can't collide
  const nodes = [
    ...left.categories.map(label  => ({ side: "L", label })),
    ...right.categories.map(label => ({ side: "R", label }))
  ];
  const indexOf = new Map(nodes.map((n, i) => [`${n.side}:${n.label}`, i]));

  const links = [];
  for (const [lv, byRight] of counts) {
    for (const [rv, value] of byRight) {
      const s = indexOf.get(`L:${lv}`);
      const t = indexOf.get(`R:${rv}`);
      if (s !== undefined && t !== undefined) links.push({ source: s, target: t, value });
    }
  }

  const sankey = d3.sankey()
    .nodeWidth(12)
    .nodePadding(14)
    .extent([[120, 12], [width - 120, height - 12]]);

  // sankey() mutates its inputs, so feed it copies
  const layout = sankey({
    nodes: nodes.map(n => ({ ...n })),
    links: links.map(l => ({ ...l }))
  });

  const color = d3.scaleOrdinal(d3.schemeTableau10).domain(left.categories);

  svg.append("g")
    .attr("fill", "none")
    .selectAll("path")
    .data(layout.links)
    .join("path")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke", l => color(l.source.label))
    .attr("stroke-opacity", 0.35)
    .attr("stroke-width", l => Math.max(1, l.width));

  const node = svg.append("g")
    .selectAll("g")
    .data(layout.nodes)
    .join("g");

  node.append("rect")
    .attr("x", d => d.x0).attr("y", d => d.y0)
    .attr("width",  d => d.x1 - d.x0)
    .attr("height", d => Math.max(1, d.y1 - d.y0))
    .attr("fill", d => d.side === "L" ? color(d.label) : "#7a8398");

  node.append("text")
    .attr("x", d => d.side === "L" ? d.x0 - 8 : d.x1 + 8)
    .attr("y", d => (d.y0 + d.y1) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => d.side === "L" ? "end" : "start")
    .style("font-size", "12px").style("fill", "#1a1a2e")
    .text(d => `${d.label}  (${d.value})`);
}

// ─────────────────────────────────────────────
// SECTION 9: WORLD MAP — SOCIAL MEDIA ADDICTION
// ─────────────────────────────────────────────
function drawWorldMap(addictionData, topoData) {
  const container = document.getElementById("world-map-container");
  const svg = d3.select("#world-map");
  if (!container || svg.empty()) return;

  const width  = Math.max(container.clientWidth, 800);
  const height = 700;
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  const MIN_SAMPLE = 5;

  // Some country names differ between the CSV and the topojson; map both ways.
  const csvToTopo = {
    "USA": "United States of America",
    "UK":  "United Kingdom",
    "Czech Republic": "Czechia",
    "Trinidad": "Trinidad and Tobago"
  };
  const topoToCsv = Object.fromEntries(Object.entries(csvToTopo).map(([k, v]) => [v, k]));

  // ── A. Aggregate by country ──────────────────────────────────────────────
  const countries = new Map(
    Array.from(d3.group(addictionData.filter(d => d.Country?.trim()), d => d.Country.trim()))
      .map(([name, rows]) => {
        const platforms = Array.from(
          d3.rollup(rows, v => v.length, d => d.Most_Used_Platform?.trim() || "Unknown")
        ).sort((a, b) => b[1] - a[1]);
        return [name, {
          mainPlatform: platforms[0]?.[0] ?? "Unknown",
          allPlatforms: platforms,
          avgUsage:     d3.mean(rows, d => +d.Avg_Daily_Usage_Hours) || 0,
          studentCount: rows.length
        }];
      })
  );

  const featureToCsvName = f => topoToCsv[f.properties?.name || f.id] || (f.properties?.name || f.id);
  const featureToData    = f => countries.get(featureToCsvName(f));

  const reliable = Array.from(countries.values()).filter(d => d.studentCount >= MIN_SAMPLE);
  const usageExtent = d3.extent(reliable, d => d.avgUsage);
  const usageColor = d3.scaleLinear()
    .domain(usageExtent.every(Number.isFinite) ? usageExtent : [2, 8])
    .range(["#fff5b1", "#b34700"])
    .interpolate(d3.interpolateRgb);

  // ── B. Geo projection and badge geometry ────────────────────────────────
  const features = topojson.feature(topoData, topoData.objects.countries).features;
  const projection = d3.geoNaturalEarth1()
    .fitSize(
      [width - margin.left - margin.right, height - margin.top - margin.bottom],
      { type: "FeatureCollection", features }
    );
  const path = d3.geoPath(projection);

  // For countries with overseas territories, the geographic centroid lands
  // somewhere unhelpful (e.g. France's centroid sits near French Guiana).
  // Override with a point on the mainland.
  const manualCentroids = {
    "France":                   [2.5, 46.5],
    "United States of America": [-98, 39],
    "Netherlands":              [5.3, 52.1],
    "Spain":                    [-4, 40],
    "United Kingdom":           [-3.5, 54.5],
    "Denmark":                  [9.5, 56],
    "Canada":                   [-102, 60]
  };
  const manualRadii = { "France": 8 };

  const centroidFor = f => projection(manualCentroids[f.properties?.name] ?? d3.geoCentroid(f));

  const radiusFor = f => {
    const override = manualRadii[f.properties?.name];
    if (override != null) return override;
    const [[x0, y0], [x1, y1]] = path.bounds(f);
    if (!Number.isFinite(x0)) return 8;
    const minDim = Math.min(x1 - x0, y1 - y0);
    return Math.max(6, Math.min(14, minDim * 0.10));
  };

  // ── C. Build the static SVG structure ────────────────────────────────────
  svg.selectAll("*").remove();
  svg.attr("width", width).attr("height", height);

  // Hatch pattern reserved for low-confidence (n < 5) countries
  const pattern = svg.append("defs").append("pattern")
    .attr("id", "low-sample-pattern")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 6).attr("height", 6)
    .attr("patternTransform", "rotate(45)");
  pattern.append("rect").attr("width", 6).attr("height", 6).attr("fill", "#ececec");
  pattern.append("line").attr("y2", 6).attr("stroke", "#c4c4c4").attr("stroke-width", 1.5);

  const tooltip = d3.select("body").selectAll(".map-tooltip").data([1])
    .join("div").attr("class", "map-tooltip dot-tooltip");

  function moveTooltip(event) {
    tooltip.style("left", (event.pageX + 12) + "px")
           .style("top",  (event.pageY - 32) + "px");
  }

  function showCountryTooltip(event, csvName, data) {
    if (!data) return;
    const platformsHtml = data.allPlatforms
      .map(([p, c]) => `${p}: ${c} (${(c / data.studentCount * 100).toFixed(1)}%)`)
      .join("<br>");
    const note = data.studentCount < MIN_SAMPLE
      ? `<br><em style="color: #f5a623;">Low confidence (n=${data.studentCount})</em>` : "";
    tooltip.style("opacity", 1)
      .html(`<strong>${csvName}</strong><br>
             <strong style="font-size:11px;color:#ccc;">Platforms Used:</strong><br>${platformsHtml}<br>
             <strong style="font-size:11px;color:#ccc;">Avg Daily Usage:</strong> ${data.avgUsage.toFixed(1)} h<br>
             <strong style="font-size:11px;color:#ccc;">Students:</strong> ${data.studentCount}${note}`);
    moveTooltip(event);
  }

  const zoomG = svg.append("g").attr("class", "zoom-group");
  const g = zoomG.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // ── D. Country paths ─────────────────────────────────────────────────────
  // Fill rule depends on view mode: by default countries are coloured by their
  // average daily usage; when a platform is selected, they're coloured by that
  // platform's share of users.
  let view = { mode: "usage", platform: null, scale: null, percentages: null };

  function fillFor(feature) {
    const data = featureToData(feature);
    if (!data) return "#f4f4f4";
    if (data.studentCount < MIN_SAMPLE) return "url(#low-sample-pattern)";
    if (view.mode === "usage") return usageColor(data.avgUsage);
    return view.scale(view.percentages.get(featureToCsvName(feature)) ?? 0);
  }

  const countryPaths = g.selectAll("path.country")
    .data(features)
    .join("path")
    .attr("class", "country")
    .attr("d", path)
    .attr("fill", fillFor)
    .attr("stroke", "#ccc").attr("stroke-width", 0.5)
    .on("mouseover", function(event, f) {
      d3.select(this).attr("stroke", "#333").attr("stroke-width", 1.5);
      showCountryTooltip(event, featureToCsvName(f), featureToData(f));
    })
    .on("mousemove", moveTooltip)
    .on("mouseout", function() {
      d3.select(this).attr("stroke", "#ccc").attr("stroke-width", 0.5);
      tooltip.style("opacity", 0);
    });

  // ── E. Badges: one per reliable country, with platform logo or letter ────
  const badgeData = features
    .map(f => ({
      csvName:  featureToCsvName(f),
      data:     featureToData(f),
      centroid: centroidFor(f),
      radius:   radiusFor(f),
      feature:  f
    }))
    .filter(b => b.data && b.data.studentCount >= MIN_SAMPLE);

  const badges = g.selectAll("g.country-badge")
    .data(badgeData)
    .join("g")
    .attr("class", "country-badge")
    .attr("transform", b => `translate(${b.centroid[0]},${b.centroid[1]})`)
    .style("pointer-events", "none");

  badges.append("circle")
    .attr("class", "badge-bg")
    .attr("r", b => b.radius)
    .attr("fill", b => smaPlatformOf(b.data.mainPlatform).color)
    .attr("stroke", "#fff").attr("stroke-width", 2);

  badges.each(function(b) {
    const meta = smaPlatformOf(b.data.mainPlatform);
    const r = b.radius;
    const sel = d3.select(this);
    const logoUrl = smaLogoUrl(meta, b.data.mainPlatform);
    if (logoUrl) {
      sel.append("image")
        .attr("class", "badge-logo")
        .attr("xlink:href", logoUrl).attr("href", logoUrl)
        .attr("x", -r * 0.7).attr("y", -r * 0.7)
        .attr("width", r * 1.4).attr("height", r * 1.4);
    } else {
      sel.append("text")
        .attr("class", "badge-letter")
        .attr("text-anchor", "middle").attr("dy", "0.32em")
        .attr("font-size", `${r * 0.95}px`).attr("font-weight", 800).attr("fill", "#fff")
        .text(meta.letter);
    }
  });

  // ── F. Zoom (counter-scale badges so they don't grow with the map) ──────
  svg.call(d3.zoom()
    .scaleExtent([1, 8])
    .translateExtent([[-100, -100], [width + 100, height + 100]])
    .on("zoom", event => {
      const k = event.transform.k;
      zoomG.attr("transform", event.transform);
      zoomG.selectAll("circle.badge-bg")
        .attr("r", b => b.radius / k).attr("stroke-width", 2 / k);
      zoomG.selectAll("image.badge-logo")
        .attr("x", b => -b.radius * 0.7 / k).attr("y", b => -b.radius * 0.7 / k)
        .attr("width", b => b.radius * 1.4 / k).attr("height", b => b.radius * 1.4 / k);
      zoomG.selectAll("text.badge-letter")
        .attr("font-size", b => `${b.radius * 0.95 / k}px`);
      zoomG.selectAll(".country").attr("stroke-width", 0.5 / k);
    })
  );

  // ── G. Legend ────────────────────────────────────────────────────────────
  const legend = d3.select("#addiction-legend");
  legend.html("");

  const platformsInData = Array.from(new Set(
    addictionData.map(d => d.Most_Used_Platform?.trim()).filter(Boolean)
  )).sort();

  buildPlatformLegend(platformsInData);
  drawScaleLegend();

  function buildPlatformLegend(platforms) {
    const section = legend.append("div").style("margin-bottom", "16px");
    section.append("p")
      .style("margin", "0 0 8px").style("font-size", "0.88rem").style("color", "#333")
      .html("<strong>Platform</strong> <span style='font-weight:400;color:#888;font-size:0.78rem;'>click to show percentage</span>");

    const grid = section.append("div")
      .style("display", "grid")
      .style("grid-template-columns", "repeat(auto-fill, minmax(150px, 1fr))")
      .style("gap", "6px");

    const items = grid.selectAll("div.platform-legend-item")
      .data(platforms)
      .join("div")
      .attr("class", "platform-legend-item")
      .style("display", "flex").style("align-items", "center").style("gap", "8px")
      .style("padding", "4px 8px").style("border-radius", "6px")
      .style("cursor", "pointer").style("user-select", "none")
      .style("font-size", "0.82rem")
      .style("transition", "background 0.15s")
      .on("mouseover", function(_, p) {
        if (view.platform !== p) d3.select(this).style("background", "#eef1f6");
      })
      .on("mouseout", function(_, p) {
        d3.select(this).style("background", view.platform === p ? "#dee5f1" : "");
      })
      .on("click", (_, p) => togglePlatform(p, items));

    items.each(function(p) {
      const meta = smaPlatformOf(p);
      const swatch = d3.select(this).append("span")
        .style("width", "26px").style("height", "26px")
        .style("border-radius", "50%").style("background", meta.color)
        .style("border", "2px solid #fff").style("box-shadow", "0 1px 3px rgba(0,0,0,0.18)")
        .style("display", "flex").style("align-items", "center").style("justify-content", "center")
        .style("flex-shrink", 0);
      const logoUrl = smaLogoUrl(meta, p);
      if (logoUrl) {
        swatch.append("img").attr("src", logoUrl).attr("alt", p)
          .style("width", "15px").style("height", "15px");
      } else {
        swatch.style("color", "#fff").style("font-weight", 800).style("font-size", "13px")
          .text(meta.letter);
      }
      d3.select(this).append("span").text(p);
    });
  }

  function togglePlatform(p, items) {
    const next = view.platform === p ? null : p;

    if (next) {
      const percentages = new Map(
        Array.from(countries, ([name, data]) => {
          const count = data.allPlatforms.find(([pp]) => pp === next)?.[1] || 0;
          return [name, (count / data.studentCount) * 100];
        })
      );
      const maxPct = d3.max(percentages.values()) || 100;
      view = {
        mode: "platform",
        platform: next,
        scale: d3.scaleLinear().domain([0, maxPct]).range(["#ffffff", smaPlatformOf(next).color]),
        percentages
      };

      countryPaths.transition().duration(220).attr("fill", fillFor);
      badges.transition().duration(220).style("opacity", 0);

      g.selectAll("text.percentage-label")
        .data(badgeData)
        .join("text")
        .attr("class", "percentage-label")
        .attr("transform", b => `translate(${b.centroid[0]},${b.centroid[1]})`)
        .attr("text-anchor", "middle").attr("dy", "0.32em")
        .attr("font-size", "12px").attr("font-weight", 800).attr("fill", "#333")
        .attr("pointer-events", "none")
        .text(b => {
          const pct = percentages.get(b.csvName) ?? 0;
          return pct > 0 ? `${pct.toFixed(0)}%` : "—";
        });
    } else {
      view = { mode: "usage", platform: null, scale: null, percentages: null };
      countryPaths.transition().duration(220).attr("fill", fillFor);
      badges.transition().duration(220).style("opacity", 1);
      g.selectAll("text.percentage-label").remove();
    }

    items.style("background", d => d === view.platform ? "#dee5f1" : "");
    drawScaleLegend();
  }

  function drawScaleLegend() {
    legend.selectAll("div.legend-section").remove();
    const section = legend.append("div")
      .attr("class", "legend-section")
      .style("margin-bottom", "16px");

    if (view.mode === "platform") {
      section.append("p")
        .style("margin", "0 0 8px").style("font-size", "0.88rem").style("color", "#333")
        .html(`<strong>${view.platform} %</strong> <span style='font-weight:400;color:#888;font-size:0.78rem;'>country coverage</span>`);
      appendScaleRow(section, [0, 25, 50, 75, 100], view.scale, d => `${d}%`);
    } else {
      section.append("p")
        .style("margin", "0 0 8px").style("font-size", "0.88rem").style("color", "#333")
        .html("<strong>Avg Daily Usage (h)</strong> <span style='font-weight:400;color:#888;font-size:0.78rem;'>country fill</span>");
      const row = appendScaleRow(section, [3, 4, 5, 6, 7], usageColor, d => `${d} h`);
      row.append("div").style("display", "flex").style("align-items", "center").style("gap", "6px")
        .html(`<div style="width:22px;height:14px;background-image:repeating-linear-gradient(45deg,#ececec 0,#ececec 3px,#c4c4c4 3px,#c4c4c4 4px);border:1px solid #ccc;"></div>
               <span style="font-size:0.82rem;color:#666;">n &lt; 5</span>`);
    }
  }

  function appendScaleRow(parent, values, scale, format) {
    const row = parent.append("div")
      .style("display", "flex").style("gap", "14px")
      .style("flex-wrap", "wrap").style("align-items", "center");
    values.forEach(v => {
      row.append("div")
        .style("display", "flex").style("align-items", "center").style("gap", "6px")
        .html(`<div style="width:22px;height:14px;background-color:${scale(v)};border:1px solid #ccc;"></div>
               <span style="font-size:0.82rem;">${format(v)}</span>`);
    });
    return row;
  }
}

// ─────────────────────────────────────────────
// SECTION 10: PLATFORM PROFILE RADAR
// ─────────────────────────────────────────────
function drawPlatformRadar(addictionData) {
  const container = document.getElementById("platform-radar-chart");
  if (!container) return;

  // Each metric reads one field from a row. `inverted: true` flips the axis so
  // "higher = worse" stays consistent across the radar (sleep, where more is
  // better, gets inverted so its outer ring still means "bad outcome").
  const metrics = [
    { label: "Daily Usage Hours",                read: r => +r.Avg_Daily_Usage_Hours,                                            max: 10 },
    { label: "Addiction Score",                  read: r => +r.Addicted_Score,                                                   max: 10 },
    { label: "Mental Health",                    read: r => 10 - +r.Mental_Health_Score,                                         max: 10 },
    { label: "Conflicts",                        read: r => +r.Conflicts_Over_Social_Media,                                      max: 5  },
    { label: "Daily Sleep Hours (inverted axis)",read: r => +r.Sleep_Hours_Per_Night,                                            max: 10, inverted: true },
    { label: "Academic Performance Affected",    read: r => r.Affects_Academic_Performance?.trim() === "Yes" ? 100 : 0,          max: 100 }
  ];

  // Aggregate per platform, dropping anything with fewer than 5 students
  const MIN_SAMPLE = 5;
  const profiles = Array.from(d3.group(addictionData, d => d.Most_Used_Platform?.trim()))
    .filter(([platform, rows]) => platform && rows.length >= MIN_SAMPLE)
    .map(([platform, rows]) => ({
      platform,
      n: rows.length,
      values: metrics.map(m => d3.mean(rows, m.read))
    }))
    .sort((a, b) => b.n - a.n);

  // Layout — keep enough margin around the circle so the "0 – N" range
  // subtitle under each axis label sits inside the SVG, not clipped below it.
  const width  = Math.min(720, container.clientWidth || 720);
  const height = 540;
  const radius = (Math.min(width, height) - 120) / 2;
  const cx     = width / 2;
  const cy     = height / 2 + 10;

  d3.select("#platform-radar-chart").selectAll("*").remove();
  const svg = d3.select("#platform-radar-chart").append("svg")
    .attr("width", width).attr("height", height);
  const g = svg.append("g").attr("transform", `translate(${cx},${cy})`);

  const angle = i => -Math.PI / 2 + i * (2 * Math.PI / metrics.length);

  // Project a profile's raw values into [x, y] points on the radar
  const project = profile => profile.values.map((v, i) => {
    let norm = Math.min(1, v / metrics[i].max);
    if (metrics[i].inverted) norm = 1 - norm;
    return [Math.cos(angle(i)) * radius * norm, Math.sin(angle(i)) * radius * norm];
  });

  // Concentric guide polygons
  for (let lvl = 1; lvl <= 5; lvl++) {
    const r = (radius * lvl) / 5;
    const pts = metrics.map((_, i) => `${Math.cos(angle(i)) * r},${Math.sin(angle(i)) * r}`).join(" ");
    g.append("polygon")
      .attr("points", pts)
      .attr("fill", "none").attr("stroke", "#dde2eb").attr("stroke-width", 1);
  }

  // Axis spokes and labels
  metrics.forEach((m, i) => {
    const a = angle(i);
    g.append("line")
      .attr("x2", Math.cos(a) * radius).attr("y2", Math.sin(a) * radius)
      .attr("stroke", "#bcc4d1");
    const lx = Math.cos(a) * (radius + 18);
    const ly = Math.sin(a) * (radius + 18);
    g.append("text").attr("x", lx).attr("y", ly)
      .attr("text-anchor", "middle").attr("dy", "0.35em")
      .style("font-size", "12px").style("font-weight", "600").style("fill", "#1a1a2e")
      .text(m.label);
    g.append("text").attr("x", lx).attr("y", ly + 17)
      .attr("text-anchor", "middle")
      .style("font-size", "10px").style("fill", "#888")
      .text(`0 – ${m.max}`);
  });

  const visible = new Set(["TikTok", "Instagram", "Facebook"]);
  const tooltip = d3.select("body").selectAll(".radar-tooltip").data([1])
    .join("div").attr("class", "radar-tooltip");

  function render() {
    g.selectAll(".radar-poly, .radar-point").remove();
    profiles.forEach(profile => {
      if (!visible.has(profile.platform)) return;
      const { color } = smaPlatformOf(profile.platform);
      const pts = project(profile);

      g.append("polygon")
        .attr("class", "radar-poly")
        .attr("points", pts.map(p => p.join(",")).join(" "))
        .attr("fill", color).attr("fill-opacity", 0.18)
        .attr("stroke", color).attr("stroke-width", 2.2);

      g.selectAll(null)
        .data(pts.map((p, i) => ({ p, metric: metrics[i], value: profile.values[i] })))
        .enter().append("circle")
        .attr("class", "radar-point")
        .attr("cx", d => d.p[0]).attr("cy", d => d.p[1])
        .attr("r", 4)
        .attr("fill", color).attr("stroke", "#fff").attr("stroke-width", 1.5)
        .on("mouseover", (event, d) => {
          tooltip.style("opacity", 1)
            .html(`<strong>${profile.platform}</strong><br>${d.metric.label}: ${d.value.toFixed(2)}<br>n = ${profile.n}`);
          moveTooltip(event);
        })
        .on("mousemove", moveTooltip)
        .on("mouseout", () => tooltip.style("opacity", 0));
    });
  }

  function moveTooltip(event) {
    tooltip.style("left", (event.pageX + 12) + "px")
           .style("top",  (event.pageY - 32) + "px");
  }

  render();

  // Toggle pills below the chart
  const toggles = d3.select("#platform-radar-toggles");
  toggles.html("");
  toggles.selectAll("button.radar-pill")
    .data(profiles)
    .join("button")
    .attr("class", "radar-pill")
    .attr("data-platform", d => d.platform)
    .style("--pill-color", d => smaPlatformOf(d.platform).color)
    .classed("active", d => visible.has(d.platform))
    .on("click", function(_, d) {
      visible.has(d.platform) ? visible.delete(d.platform) : visible.add(d.platform);
      d3.select(this).classed("active", visible.has(d.platform));
      render();
    })
    .each(function(d) {
      const sel = d3.select(this);
      const meta = smaPlatformOf(d.platform);
      const logoUrl = smaLogoUrl(meta, d.platform);
      if (logoUrl) {
        sel.append("img").attr("src", logoUrl).style("width", "14px").style("height", "14px");
      }
      sel.append("span").text(`${d.platform} (n=${d.n})`);
    });
}

// ─────────────────────────────────────────────
// SECTION 11: AGE TRAJECTORY
// ─────────────────────────────────────────────
function drawAcademicTrajectory(addictionData) {
  const container = document.getElementById("academic-trajectory-chart");
  if (!container) return;

  // Aggregator returns a per-age value. For most metrics it's a mean of a field;
  // for academic impact it's the share of "Yes" responses.
  const meanOf = field => rows => d3.mean(rows, r => +r[field]) || 0;
  const percentAffected = rows =>
    rows.length ? rows.filter(r => r.Affects_Academic_Performance?.trim() === "Yes").length / rows.length * 100 : 0;

  const metrics = [
    { label: "Addiction Score (0–9)",                 aggregate: meanOf("Addicted_Score") },
    { label: "Daily Usage (h)",                       aggregate: meanOf("Avg_Daily_Usage_Hours") },
    { label: "Mental Health Score (0–9)",             aggregate: meanOf("Mental_Health_Score") },
    { label: "Conflicts (0–5)",                       aggregate: meanOf("Conflicts_Over_Social_Media") },
    { label: "Daily Sleep Hours (h)",                 aggregate: meanOf("Sleep_Hours_Per_Night") },
    { label: "Academic Performance Affected (%)",     aggregate: percentAffected }
  ];

  const width      = container.clientWidth || 920;
  const cols       = metrics.length;
  const cellW      = width / cols;
  const cellH      = 360;
  const margin     = { top: 20, right: 12, bottom: 50, left: 45 };
  const innerW     = cellW - margin.left - margin.right;
  const innerH    = cellH - margin.top - margin.bottom;
  const totalH    = cellH + 40;

  d3.select("#academic-trajectory-chart").selectAll("*").remove();
  const svg = d3.select("#academic-trajectory-chart").append("svg")
    .attr("width", width).attr("height", totalH)
    .style("font-family", "Segoe UI, Arial, sans-serif");

  // Group students by age once; every chart reuses the same grouping.
  const byAge = d3.group(
    addictionData.filter(d => d.Age).map(d => ({ ...d, age: +d.Age })),
    d => d.age
  );
  const ages = Array.from(byAge.keys()).sort((a, b) => a - b);

  const tooltip = d3.select("body").selectAll(".trajectory-tooltip").data([1])
    .join("div").attr("class", "trajectory-tooltip dot-tooltip");

  metrics.forEach((metric, i) => {
    const g = svg.append("g")
      .attr("transform", `translate(${i * cellW + margin.left}, ${margin.top})`);

    const points = ages.map(age => {
      const rows = byAge.get(age);
      return { age, value: metric.aggregate(rows), n: rows.length };
    });

    const [vMin, vMax] = d3.extent(points, d => d.value);
    const y = d3.scaleLinear().domain([vMin * 0.85, vMax * 1.15]).range([innerH, 0]);
    const x = d3.scaleLinear().domain([d3.min(ages) - 0.5, d3.max(ages) + 0.5]).range([0, innerW]);
    const r = d3.scaleSqrt().domain([0, d3.max(points, d => d.n)]).range([3, 12]);

    g.append("rect")
      .attr("width", innerW).attr("height", innerH)
      .attr("fill", "#f8f9fb").attr("opacity", 0.5);

    const line = d3.line().x(d => x(d.age)).y(d => y(d.value));
    g.append("path")
      .attr("d", line(points))
      .attr("fill", "none")
      .attr("stroke", "#4e79a7").attr("stroke-width", 2.5).attr("opacity", 0.8);

    g.append("g")
      .selectAll("circle")
      .data(points.filter(d => d.n > 0))
      .join("circle")
      .attr("cx", d => x(d.age))
      .attr("cy", d => y(d.value))
      .attr("r",  d => r(d.n))
      .attr("fill", "#4e79a7")
      .attr("stroke", "#fff").attr("stroke-width", 1.5)
      .style("opacity", 0.85)
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        tooltip.style("opacity", 1)
          .html(`<strong>${metric.label}</strong><br>Age: ${d.age}<br>Value: ${d.value.toFixed(2)}<br>n: ${d.n}`);
        moveTooltip(event);
      })
      .on("mousemove", moveTooltip)
      .on("mouseout", () => tooltip.style("opacity", 0));

    g.append("g").call(d3.axisLeft(y).ticks(3).tickSize(0))
      .selectAll("text").style("font-size", "9px");
    g.append("g").attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickValues(ages).tickSize(0).tickFormat(d3.format("d")))
      .selectAll("text").style("font-size", "9px");

    g.append("text")
      .attr("x", innerW / 2).attr("y", -5).attr("text-anchor", "middle")
      .style("font-size", "12px").style("font-weight", "700").style("fill", "#1a1a2e")
      .text(metric.label);
  });

  function moveTooltip(event) {
    tooltip.style("left", (event.pageX + 12) + "px")
           .style("top",  (event.pageY - 32) + "px");
  }

  svg.append("g")
    .attr("transform", `translate(40, ${totalH - 20})`)
    .append("text")
    .style("font-size", "10px").style("fill", "#888")
    .text("Dot size = sample count at age");
}

function drawHealthHeatmap(addictionData) {
  const container = document.getElementById("health-heatmap-chart");
  if (!container) return;

  const sleepBins = [
    ["Short Sleep",    "< 6 h",   s => s < 6],
    ["Adequate Sleep", "6 – 8 h", s => s >= 6 && s < 8],
    ["Long Sleep",     "≥ 8 h",   s => s >= 8]
  ].map(([label, range, test]) => ({ label, range, test }));

  const usageBins = [
    ["Light Usage",    "< 3 h",   u => u < 3],
    ["Moderate Usage", "3 – 6 h", u => u >= 3 && u < 6],
    ["Heavy Usage",    "≥ 6 h",   u => u >= 6]
  ].map(([label, range, test]) => ({ label, range, test }));

  const summarize = rows => {
    if (!rows.length) return { n: 0, addiction: null, mental: null, affected: null };
    const yes = rows.filter(r => r.Affects_Academic_Performance?.trim() === "Yes").length;
    return {
      n: rows.length,
      addiction: d3.mean(rows, r => +r.Addicted_Score),
      mental:    d3.mean(rows, r => +r.Mental_Health_Score),
      affected:  (yes / rows.length) * 100
    };
  };

  const cells = sleepBins.flatMap((sb, row) =>
    usageBins.map((ub, col) => {
      const rows = addictionData.filter(d => {
        const s = +d.Sleep_Hours_Per_Night, u = +d.Avg_Daily_Usage_Hours;
        return Number.isFinite(s) && Number.isFinite(u) && sb.test(s) && ub.test(u);
      });
      return { row, col, sleep: sb, usage: ub, ...summarize(rows) };
    })
  );

  const width = Math.min(900, container.clientWidth || 900);
  const rowLabelW = 110;
  // headerH covers both the bold category name and the smaller "< 3 h" range
  // line below it; cells start at y = headerH so both must fit above that.
  const headerH = 62;
  const legendH = 80;
  const cellSize = (width - rowLabelW - 20) / 3;
  const height = headerH + cellSize * 3 + legendH + 20;

  d3.select("#health-heatmap-chart").selectAll("*").remove();
  const svg = d3.select("#health-heatmap-chart").append("svg")
    .attr("width", width).attr("height", height)
    .style("font-family", "Segoe UI, Arial, sans-serif");

  const addictionValues = cells.filter(c => c.n > 0).map(c => c.addiction);
  const [aMin, aMax] = d3.extent(addictionValues);
  const color = d3.scaleLinear()
    .domain([aMin, (aMin + aMax) / 2, aMax])
    .range(["#f7f9c6", "#f5a83a", "#b32424"]);

  // Pick readable text colour given the cell background luminance.
  const textOn = bg => {
    const c = d3.color(bg);
    const luma = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b);
    return luma > 150 ? "#1a1a2e" : "#ffffff";
  };

  const tooltip = d3.select("body").selectAll(".heatmap-tooltip").data([1])
    .join("div").attr("class", "heatmap-tooltip");

  const showTooltip = (event, d) => {
    const body = d.n === 0
      ? `<em style="color:#aaa;">No students in this combination</em>`
      : `<span style="color:#aaa;">Sleep ${d.sleep.range} · Usage ${d.usage.range}</span><br><br>
         <strong>Addiction:</strong> ${d.addiction.toFixed(2)}<br>
         <strong>Mental Health:</strong> ${d.mental.toFixed(2)}<br>
         <strong>Academic Affected:</strong> ${d.affected.toFixed(0)}%<br>
         <span style="color:#aaa;">n = ${d.n}</span>`;
    tooltip.style("opacity", 1)
      .html(`<strong>${d.sleep.label} × ${d.usage.label}</strong><br>${body}`)
      .style("left", (event.pageX + 14) + "px")
      .style("top",  (event.pageY - 10) + "px");
  };

  // Column headers — label sits at the top of the header band, range subtitle
  // 14 px below it; both finish above the cells (which start at y = headerH).
  const colHeaders = svg.append("g").attr("transform", `translate(${rowLabelW}, 0)`);
  usageBins.forEach((ub, j) => {
    const g = colHeaders.append("g")
      .attr("transform", `translate(${j * cellSize + cellSize / 2}, ${headerH - 30})`);
    g.append("text").attr("text-anchor", "middle")
      .style("font-size", "13px").style("font-weight", "700").style("fill", "#1a1a2e")
      .text(ub.label);
    g.append("text").attr("text-anchor", "middle").attr("y", 16)
      .style("font-size", "11px").style("fill", "#888")
      .text(ub.range);
  });

  // Row labels
  const rowHeaders = svg.append("g").attr("transform", `translate(0, ${headerH})`);
  sleepBins.forEach((sb, i) => {
    const g = rowHeaders.append("g")
      .attr("transform", `translate(${rowLabelW - 12}, ${i * cellSize + cellSize / 2})`);
    g.append("text").attr("text-anchor", "end").attr("dy", "-0.2em")
      .style("font-size", "13px").style("font-weight", "700").style("fill", "#1a1a2e")
      .text(sb.label);
    g.append("text").attr("text-anchor", "end").attr("dy", "1.1em")
      .style("font-size", "11px").style("fill", "#888")
      .text(sb.range);
  });

  // Cells
  const grid = svg.append("g").attr("transform", `translate(${rowLabelW}, ${headerH})`);
  const cellG = grid.selectAll("g.cell")
    .data(cells)
    .join("g")
    .attr("class", "cell")
    .attr("transform", d => `translate(${d.col * cellSize}, ${d.row * cellSize})`);

  cellG.append("rect")
    .attr("x", 2).attr("y", 2)
    .attr("width",  cellSize - 4)
    .attr("height", cellSize - 4)
    .attr("rx", 8)
    .attr("fill",   d => d.n === 0 ? "#f4f4f6" : color(d.addiction))
    .attr("stroke", d => d.n === 0 ? "#e0e0e6" : "rgba(0,0,0,0.08)")
    .style("cursor", "pointer")
    .on("mouseover", function(event, d) {
      d3.select(this).attr("stroke", "#1a1a2e").attr("stroke-width", 2);
      showTooltip(event, d);
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 14) + "px")
             .style("top",  (event.pageY - 10) + "px");
    })
    .on("mouseout", function(_, d) {
      d3.select(this)
        .attr("stroke", d.n === 0 ? "#e0e0e6" : "rgba(0,0,0,0.08)")
        .attr("stroke-width", 1);
      tooltip.style("opacity", 0);
    });

  // Cell contents
  cellG.each(function(d) {
    const g = d3.select(this);
    const cx = cellSize / 2;

    if (d.n === 0) {
      g.append("text")
        .attr("x", cx).attr("y", cellSize / 2)
        .attr("text-anchor", "middle").attr("dy", "0.32em")
        .style("font-size", "13px").style("fill", "#bbb").style("font-style", "italic")
        .text("no data");
      return;
    }

    const fill = textOn(color(d.addiction));

    const label = (y, text, opts = {}) => g.append("text")
      .attr("x", cx).attr("y", y)
      .attr("text-anchor", "middle")
      .style("font-size", opts.size || "11px")
      .style("font-weight", opts.weight || "600")
      .style("fill", fill)
      .style("opacity", opts.opacity || 1)
      .text(text);

    label(cellSize * 0.30, "Mental Health", { opacity: 0.85 });
    label(cellSize * 0.47, d.mental.toFixed(1), { size: "32px", weight: "800" });

    g.append("line")
      .attr("x1", cx - 30).attr("x2", cx + 30)
      .attr("y1", cellSize * 0.58).attr("y2", cellSize * 0.58)
      .attr("stroke", fill).attr("stroke-opacity", 0.3);

    label(cellSize * 0.68, "Academic Affected", { opacity: 0.85 });
    label(cellSize * 0.82, `${d.affected.toFixed(0)}%`, { size: "20px", weight: "700" });

    g.append("text")
      .attr("x", cellSize - 10).attr("y", cellSize - 10)
      .attr("text-anchor", "end")
      .style("font-size", "10px").style("font-weight", "600")
      .style("fill", fill).style("opacity", 0.7)
      .text(`n = ${d.n}`);
  });

  // Legend
  const legend = svg.append("g")
    .attr("transform", `translate(${rowLabelW}, ${headerH + cellSize * 3 + 24})`);

  legend.append("text")
    .style("font-size", "12px").style("font-weight", "700").style("fill", "#1a1a2e")
    .text("Cell background = average addiction score");

  const gradId = "heatmap-grad";
  const stops = d3.range(0, 11).map(i => i / 10);
  svg.append("defs").append("linearGradient").attr("id", gradId)
    .attr("x1", "0%").attr("x2", "100%")
    .selectAll("stop")
    .data(stops)
    .join("stop")
    .attr("offset",     t => `${t * 100}%`)
    .attr("stop-color", t => color(aMin + (aMax - aMin) * t));

  legend.append("rect")
    .attr("y", 10).attr("width", 260).attr("height", 14)
    .attr("rx", 3)
    .attr("fill", `url(#${gradId})`)
    .attr("stroke", "rgba(0,0,0,0.1)");

  legend.append("text").attr("y", 38)
    .style("font-size", "11px").style("fill", "#666")
    .text(`${aMin.toFixed(1)} (healthy)`);
  legend.append("text").attr("x", 260).attr("y", 38).attr("text-anchor", "end")
    .style("font-size", "11px").style("fill", "#666")
    .text(`${aMax.toFixed(1)} (high addiction)`);

  const guide = svg.append("g")
    .attr("transform", `translate(${rowLabelW + 320}, ${headerH + cellSize * 3 + 24})`);
  guide.append("text")
    .style("font-size", "12px").style("font-weight", "700").style("fill", "#1a1a2e")
    .text("Inside each cell:");
  [
    "• Large number — Mental Health Score (higher = better)",
    "• Bottom percentage — students reporting academic impact",
    "• Corner n = sample size  ·  Hover for full detail"
  ].forEach((line, i) => {
    guide.append("text").attr("y", 18 + i * 15)
      .style("font-size", "11px")
      .style("fill", i === 2 ? "#888" : "#444")
      .text(line);
  });
}


// ─────────────────────────────────────────────
// LOADER: SOCIAL MEDIA ADDICTION CHARTS
// ─────────────────────────────────────────────
const initSocialMediaCharts = () => {
  if (typeof topojson === 'undefined' || typeof d3.sankey !== 'function') {
    setTimeout(initSocialMediaCharts, 100);
    return;
  }

  Promise.all([
    d3.csv("data/social_media_addiction.csv"),
    d3.json("data/countries-110m.json")
  ]).then(([addictionData, topoData]) => {
    drawSmaDemographicFlow(addictionData);
    drawWorldMap(addictionData, topoData);
    drawPlatformRadar(addictionData);
    drawAcademicTrajectory(addictionData);
    drawHealthHeatmap(addictionData);
  }).catch(err => {
    console.error("Error loading social media charts:", err);
    const section = document.getElementById("section-global-addiction");
    if (section) {
      section.innerHTML = '<p style="color: #999; padding: 20px;">Visualizations unavailable: ' + (err.message || "load error") + '</p>';
    }
  });
};

setTimeout(initSocialMediaCharts, 500);
