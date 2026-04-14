// YRBS dataset
d3.csv("data/yrbs2023_readable.csv").then(data => {

    console.log("YRBS:", data);

    data.forEach(d => {
        d.sex = d.Q2_label;
        d.age = d.Q1_label;
        d.race = d.RACEETH_label;
    });

    drawSummary(data);
    drawBarChart(data, "sex");

    d3.select("#group-select").on("change", function() {
        let group = this.value;
        updateCharts(data, group);
    });

});

// Teen phone addiction dataset
d3.csv("data/teen_phone_addiction_dataset.csv").then(data => {

    console.log("Phone dataset:", data);

    drawSummaryPhone(data);
    drawBarChartPhone(data, "A");

    d3.select("#phone-option").on("change", function() {
        drawBarChartPhone(data, this.value);
    });

});

// YRBS functions
// function drawSummary(data) {

//     const total = data.length;

//     const maleCount = data.filter(d => d.sex === "Male").length;
//     const femaleCount = data.filter(d => d.sex === "Female").length;

//     d3.select("#summary")
//         .html(`
//             <p>Total students: ${total}</p>
//             <p>Male: ${maleCount}</p>
//             <p>Female: ${femaleCount}</p>
//         `);
// }

function drawBarChart(data, group) {

    d3.select("#bar-chart").selectAll("*").remove();

    const svg = d3.select("#bar-chart")
        .append("svg")
        .attr("width", 400)
        .attr("height", 300);

    const counts = d3.rollups(
        data,
        v => v.length,
        d => d[group]
    );

    const x = d3.scaleBand()
        .domain(counts.map(d => d[0]))
        .range([40, 380])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(counts, d => d[1])])
        .range([260, 20]);

    svg.selectAll("rect")
        .data(counts)
        .enter()
        .append("rect")
        .attr("x", d => x(d[0]))
        .attr("y", d => y(d[1]))
        .attr("width", x.bandwidth())
        .attr("height", d => 260 - y(d[1]));

    svg.append("g")
        .attr("transform", "translate(0,260)")
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("transform", "translate(40,0)")
        .call(d3.axisLeft(y));
}

function updateCharts(data, group) {
    drawBarChart(data, group);
}

// Teen phone addiction functions
function drawSummaryPhone(data) {

    const n = data.length;

    const avgUsage = d3.mean(data, d => +d.Daily_Usage_Hours);
    const avgSleep = d3.mean(data, d => +d.Sleep_Hours);
    const avgAnxiety = d3.mean(data, d => +d.Anxiety_Level);
    const avgDepression = d3.mean(data, d => +d.Depression_Level);
    const avgSelfEsteem = d3.mean(data, d => +d.Self_Esteem);
    const avgExercise = d3.mean(data, d => +d.Exercise_Hours);
    const avgAddiction = d3.mean(data, d => +d.Addiction_Level);
    const avgChecks = d3.mean(data, d => +d.Phone_Checks_Per_Day);

    const highUsers = data.filter(d => +d.Daily_Usage_Hours >= 5).length;
    const highUserPct = (highUsers / n * 100).toFixed(1);

    const lowSleep = data.filter(d => +d.Sleep_Hours < 6).length;
    const lowSleepPct = (lowSleep / n * 100).toFixed(1);

    d3.select("#summary-phone")
      .html(`
        <h3>📱 Phone Usage Dataset Overview</h3>

        <p><b>Total Students:</b> ${n}</p>

        <hr>

        <p><b>📊 Key Averages</b></p>
        <p>Daily Usage: ${avgUsage.toFixed(2)} hrs</p>
        <p>Sleep: ${avgSleep.toFixed(2)} hrs</p>
        <p>Phone Checks: ${avgChecks.toFixed(1)} / day</p>
        <p>Exercise: ${avgExercise.toFixed(2)} hrs</p>

        <hr>

        <p><b>🧠 Mental Health Indicators</b></p>
        <p>Anxiety: ${avgAnxiety.toFixed(2)}</p>
        <p>Depression: ${avgDepression.toFixed(2)}</p>
        <p>Self-Esteem: ${avgSelfEsteem.toFixed(2)}</p>
        <p>Addiction Level: ${avgAddiction.toFixed(2)}</p>

        <hr>

        <p><b>⚠️ Risk Indicators</b></p>
        <p>High phone users (≥5h/day): ${highUserPct}%</p>
        <p>Low sleep (<6h): ${lowSleepPct}%</p>
      `);
}

function getUsageGroup(d) {
    const u = +d.Daily_Usage_Hours;

    if (u < 2) return "Low";
    if (u < 5) return "Medium";
    return "High";
}

function drawBarChartPhone(data, option = "A") {

    d3.select("#bar-chart-phone").selectAll("*").remove();

    const width = 400;
    const height = 350;   // increased height

    const svg = d3.select("#bar-chart-phone")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    let counts;

    // Addiction Level vs Avg Daily Usage
    if (option === "A") {

        counts = d3.rollups(
            data,
            v => d3.mean(v, d => +d.Daily_Usage_Hours),
            d => d.Addiction_Level
        );
    }

    // Usage Group vs Avg Anxiety
    else if (option === "B") {

        counts = d3.rollups(
            data,
            v => d3.mean(v, d => +d.Anxiety_Level),
            d => getUsageGroup(d)
        );
    }

    const x = d3.scaleBand()
        .domain(counts.map(d => d[0]))
        .range([50, 380])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(counts, d => d[1])])
        .nice()
        .range([300, 20]); 

    // Bars
    svg.selectAll("rect")
        .data(counts)
        .enter()
        .append("rect")
        .attr("x", d => x(d[0]))
        .attr("y", d => y(d[1]))
        .attr("width", x.bandwidth())
        .attr("height", d => 300 - y(d[1]))
        .attr("fill", "#000000");

    svg.append("g")
        .attr("transform", "translate(0,300)")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-40)")
        .style("text-anchor", "end")
        .style("font-size", "11px");

    svg.append("g")
        .attr("transform", "translate(50,0)")
        .call(d3.axisLeft(y));
}