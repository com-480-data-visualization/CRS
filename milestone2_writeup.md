# Milestone 2 Write-up
## Teen Health Profile Dashboard — COM-480 Data Visualization

**Team:** Rui Yang (294952), Shuli Cécile Jia (316620), Christos Konstantinidis (347437)
**Deadline:** Friday 17 April 2026, 5 pm

---

## Project Goal

We are building an interactive web dashboard that communicates the breadth of adolescent health in the United States, using the 2023 CDC Youth Risk Behavior Survey (YRBS, n = 20,103) as the primary dataset and the Teen Phone Addiction dataset (Kaggle, n = 700) as a supplementary lens on digital behavior. The target audience is anyone interested in youth well-being — classmates, instructors, educators, or general readers — who want to move beyond single-topic health reports and see how mental health, sleep, physical activity, substance use, and safety connect in one coherent profile.

---

## Visualization Sketches and Tools

### 1. Demographic Overview (bar charts)

```
Age distribution          Sex split           Grade distribution
┌─────────────────┐        ┌──────────┐        ┌──────────────────┐
│ ██              │        │  ████    │        │ ████             │
│ ████            │        │  ████    │        │ ████             │
│ █████           │        │  Male    │        │ ████             │
│ █████           │        │  Female  │        │ ████             │
│ ████            │        └──────────┘        │ 9  10  11  12    │
│ 14 15 16 17 18+ │                            └──────────────────┘
└─────────────────┘
```

**Tool:** D3.js — `scaleBand`, `scaleLinear`, `axisBottom`, `axisLeft`.
**Lectures needed:** Lecture 3 (Marks and Channels), Lecture 4 (Data and Scales).

---

### 2. Health Domain Radar Chart (YRBS)

```
          Good mental health
                 *
                /|\
               / | \
    School    /  |  \  Adequate
    safety   *   |   *  sleep
              \  |  /
               \ | /
                \|/
         No      *      Physically
       substance        active
           use
```

Five axes (each 0–100 %): good mental health (Q107), adequate sleep ≥ 8 h (Q85), physically active 7 days/week (Q75), no marijuana/alcohol use (Q47+Q41), school safety — no weapon carried (Q14). A toggle switches between Male, Female, and an overlay of both.

**Tool:** D3.js — custom polar path generator, `scaleLinear` mapped to radius.
**Lectures needed:** Lecture 5 (Perception, pre-attentive features), Lecture 9 (Advanced D3 — custom path generators).

---

### 3. Health Indicator Bar Chart by Subgroup (YRBS)

```
        Sad/hopeless   Poor sleep   No activity  Substance use
 Male   ████
Female  ████████
 9th    ████
12th    ██████
```

A grouped or faceted bar chart showing the percentage of students with a risk indicator, broken down by the selected demographic group (sex, grade, race/ethnicity). A dropdown controls which group to compare.

**Tool:** D3.js — `scaleBand` (outer + inner for grouping), color scale per group.
**Lectures needed:** Lecture 4 (Scales), Lecture 6 (Color).

---

### 4. Phone Usage × Wellbeing Heatmap (Teen Phone Addiction)

```
              Sleep  Anxiety  Depression  Self-Esteem  Exercise
 Low addict  [pale] [pale]   [pale]      [dark]       [pale]
 Med addict  [ .. ] [ .. ]   [ .. ]      [ .. ]       [ .. ]
High addict  [dark] [dark]   [dark]      [pale]       [dark]
```

A matrix heatmap where rows are addiction-level groups (Low 1–3, Medium 4–6, High 7–10) and columns are wellbeing/behavioral metrics (avg sleep hours, avg anxiety, avg depression, avg self-esteem, avg exercise). Color encodes the average value, diverging or sequential depending on the metric direction.

**Tool:** D3.js — `scaleSequential` with `interpolateRdYlGn` (inverted for risk metrics).
**Lectures needed:** Lecture 6 (Color), Lecture 7 (Tabular data).

---

### 5. Scatter Plot: Phone Usage vs. Anxiety (Teen Phone Addiction)

```
Anxiety
  10 |           ·  · ··
   8 |       · ·  ··  ···
   6 |    ·· · ·   ·
   4 | · ·   ·
   2 |·
     └──────────────────
       1  2  3  4  5  6  7  Daily usage (h)
```

Each dot is one student. X-axis: daily phone usage hours. Y-axis: anxiety level. Color: addiction level (Low = blue, Medium = orange, High = red). A brush or hover tooltip shows individual details.

**Tool:** D3.js — `scaleLinear` for both axes, `scaleOrdinal` for color, `voronoi` or `mouseover` for tooltip.
**Lectures needed:** Lecture 8 (Interaction and Brushing), Lecture 5 (Perception).

---

### Stretch / Planned for Milestone 3

- **US state choropleth** — if we obtain CDC state-level YRBS aggregates, map each indicator by state.
- **Brushed timeline / parallel coordinates** — link demographic filter to all charts simultaneously.
- **Animated transition** between subgroup comparisons on the radar chart.

---

## Independent Implementation Pieces

| # | Piece | Dataset | Chart type | Can be built independently |
|---|-------|---------|-----------|---------------------------|
| 1 | Demographic overview | YRBS | Bar (×3) | Yes |
| 2 | Health domain radar | YRBS | Radar | Yes |
| 3 | Subgroup bar chart | YRBS | Grouped bar | Yes (shares data load with #1) |
| 4 | Wellbeing heatmap | Phone | Heatmap | Yes |
| 5 | Usage × anxiety scatter | Phone | Scatter | Yes |
| 6 | Cross-chart filter | Both | Interaction | Depends on #1–5 |

---

## Minimum Viable Product (MVP)

The core MVP is pieces **1, 2, and 5**: a demographic overview, the radar chart comparing Male vs. Female across five health domains, and the scatter plot linking phone usage to anxiety. Together these answer the two central questions of the project — what does the adolescent health profile look like across subgroups, and how does phone use relate to wellbeing — with at least three distinct chart types.

Pieces 3 (grouped bar) and 4 (heatmap) enrich the story but can be dropped without breaking the narrative.

Piece 6 (cross-chart filtering) is a Milestone 3 stretch goal.

---

## Lecture Mapping Summary

| Lecture | Topic | Used in |
|---------|-------|---------|
| Lecture 3 | Marks and channels | All charts |
| Lecture 4 | Data and scales | All charts |
| Lecture 5 | Perception and pre-attentive features | Radar, scatter |
| Lecture 6 | Color | Heatmap, scatter, bar |
| Lecture 7 | Tabular data | Heatmap |
| Lecture 8 | Interaction and brushing | Scatter tooltip, dropdown filter |
| Lecture 9 | Advanced D3 | Radar path generator |
| Lecture 10 | Maps and projections | (Stretch) Choropleth |
