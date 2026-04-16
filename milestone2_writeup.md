# Milestone 2 Write-up
## Teen Health Profile: From Survey Orientation To Deeper YRBS Patterns

- **Team:** Rui Yang (294952), Shuli Cecile Jia (316620), Christos Konstantinidis (347437)
- **Course:** COM-480 Data Visualization
- **Deadline:** Friday 17 April 2026, 5 pm

## Project Goal

We are building an interactive web visualization that profiles adolescent health in the United States using the 2023 CDC Youth Risk Behavior Survey (YRBS, 20,103 student rows) as the primary dataset. The central question is:

**What portrait of teen health appears when mental wellbeing, daily routines, school support, substance use, and relationship safety are viewed together instead of one issue at a time?**

The intended reader is a classmate, instructor, educator, public-health reader, or general audience member who wants a compact but nuanced picture of teen health. The story is descriptive, not causal. We do not claim that one factor causes another; we show which concerns are common, which profiles differ across groups, and which risks most clearly separate poor current mental health.

The final design is organized as a guided discovery. It starts with demographics and simple national signals, then moves toward more interpretive findings: grade shifts, individual mental-health gaps, risk accumulation, and relationship-safety patterns. The Teen Phone Addiction dataset remains a secondary context layer so the project does not collapse teen health into a phone-use story.

## Narrative And Findings

The website follows a ladder from shallow to more insightful:

| Step | Reader question | Main message |
| --- | --- | --- |
| 1. Orientation | Who is in the survey? | YRBS is a large structured survey; later percentages use survey weights. |
| 2. National scan | What are the obvious signals? | Mental health is prominent, but sleep, activity, safety, support, substance use, and relationship safety also matter. |
| 3. First comparison | Whose profile differs? | Subgroups differ by profile shape, not a single healthy/unhealthy ranking. |
| 4. Grade shift | What changes across high school? | Grade is a developmental axis: sleep declines while some substance-use indicators rise. |
| 5. Risk role | Which factors separate mental health most? | Bullying and relationship-safety harms are stronger separators than some more visible lifestyle indicators. |
| 6. Risk stack | What happens when problems accumulate? | Poor current mental health rises sharply as selected risks stack together. |
| 7. Sexual health | How does it fit responsibly? | Sexual health belongs when framed through safety, consent, prevention, testing, and care. |
| 8. Phone context | Is teen health just a phone story? | Phones matter, but YRBS shows a broader teen-health profile. |

Headline weighted findings from the YRBS data support this sequence: 39.72% of students felt sad or hopeless, 28.54% reported poor current mental health, only 23.20% got 8 or more hours of sleep, and 46.32% were active on at least 5 days. Sex differences are large on some indicators, such as poor current mental health among female students (38.76%) versus male students (18.83%). Across grade, sleep of 8+ hours falls from 30.99% in 9th grade to 18.09% in 12th grade, while current marijuana use rises from 10.83% to 24.53%.

The deeper findings are about separation and accumulation. Among the five risks used in the stack, the one-at-a-time poor-mental-health gaps are largest for being bullied at school (+21.8 percentage points), current substance use (+15.9 pp), low school connectedness (+15.1 pp), insufficient sleep (+13.8 pp), and physical inactivity (+7.0 pp). When all five selected risk fields are complete, poor current mental health rises from 8.28% among students with zero selected risks to 72.08% among students with all five. School connectedness has high missingness, so the prototype reports complete-case denominators for this view.

Sexual health is included as relationship safety and prevention, not as moral judgment. We avoid treating sexual activity itself as a risk. Instead, sexual activity defines denominators for prevention/agency indicators, while violence, coercion, and substance-linked sex are shown as safety concerns. For example, 11.37% reported sexual violence at least once, and sexual dating violence has a +33.0 pp poor-mental-health gap.

## Visualization Sketches, Tools, And Lectures

### 1. Orientation: Who Are We Looking At?

```text
YRBS sample composition

Age     [bar chart]
Sex     [bar chart]
Grade   [bar chart]
Race    [bar chart]

Note: health percentages use WEIGHT, not raw bar counts.
```

- **Purpose:** Establish the survey population before making health claims.
- **Tool:** D3.js bar charts with a lightweight cross-filter.
- **Relevant lectures:** Marks and channels; data and scales; interaction.

### 2. Shallow Profile: National Teen-Health Signals

```text
National weighted profile

Mental health        Poor current mental health     28.54%
Daily routines       Sleep 8+ hours                 23.20%
Activity             Active 5+ days                 46.32%
Safety               Bullied at school              19.24%
Substance use        Current alcohol                22.10%
Relationship safety  Sexual violence                11.37%
```

- **Purpose:** Give readers the obvious national baseline before asking them to interpret group differences.
- **Tool:** D3.js or static scorecard cards backed by weighted YRBS aggregation.
- **Relevant lectures:** Marks and channels; data and scales; color.

### 3. First Comparison: Whose Profile Looks Different?

```text
Higher value = more common concern

                       Female     Male
Poor mental health       o---------o
Insufficient sleep       o----o
Inactive <5 days         o----------------o
Bullied at school        o------o
Current tobacco/EVP      o----o
Current marijuana        o---o
```

- **Purpose:** Show that subgroup differences have shape across domains rather than a single ranking.
- **Tool:** D3.js dot plot with a demographic selector.
- **Relevant lectures:** Data and scales; visual comparison; color; interaction.

### 4. Profile Shift: How Health Changes Across High School

```text
9th grade                         12th grade

Sleep 8+ hours      31.0%  ----------------> 18.1%
Current marijuana   10.8%  ----------------> 24.5%
Current tobacco     12.8%  ----------------> 23.2%
Bullied at school   24.7%  ----------------> 14.0%
```

- **Purpose:** Turn grade from a filter into an insight: the teen-health profile changes as students move through high school.
- **Tool:** D3.js line chart or slope chart over grade.
- **Relevant lectures:** Visual comparison; annotation; data transformation.

### 5. Individual Risk Role Around Mental Health

```text
Poor-current-mental-health gap

Bullied at school            [================] +21.8 pp
Current substance use        [===========     ] +15.9 pp
Low school connectedness     [===========     ] +15.1 pp
Insufficient sleep           [==========      ] +13.8 pp
Physical inactivity          [=====           ]  +7.0 pp
```

- **Purpose:** Answer which selected risks separate poor current mental health most before showing accumulation.
- **Tool:** D3.js ranked gap bars with tooltips for risk-present, risk-absent, gap, and valid `n`.
- **Relevant lectures:** Data transformation; uncertainty and communication; perception.

### 6. Risk Stack: Accumulated Problems

```text
Poor current mental health

75% |                         *
60% |
45% |                    *
30% |              *
15% |    *    *
 0% +----+----+----+----+----+----
      0    1    2    3    4    5
      number of selected risks
```

- **Purpose:** Show the main insight: risks are not isolated, and poor mental health rises sharply when they accumulate.
- **Tool:** D3.js interactive lollipop/bar chart with risk toggles and complete-case notes.
- **Relevant lectures:** Interaction; data transformation; uncertainty and communication.

### 7. Sexual Health: Safety, Consent, Prevention, And Care

```text
Relationship safety and poor mental health

Sexual dating violence       [================] +33.0 pp
Forced sexual intercourse    [==============  ] +29.7 pp
Sexual violence              [=============   ] +27.7 pp
Physical dating violence     [============    ] +25.3 pp
Alcohol/drugs before sex     [========        ] +17.2 pp

Among currently sexually active students

Any birth-control method     [================] 83.4%
Consent verbally asked       [=============== ] 82.2%
No alcohol/drugs before sex  [=============== ] 81.7%
Condom used                  [==========      ] 51.9%
HIV tested                   [===             ] 14.9%
STD tested                   [==              ] 12.6%
```

- **Purpose:** Include sexual health responsibly by focusing on safety, consent, prevention, testing, and access to care.
- **Tool:** D3.js ranked gap bars and conditional prevention bars.
- **Relevant lectures:** Filtering and conditional data; responsible visualization; uncertainty and missingness; color.

### 8. Phone Context

```text
Phone / wellbeing metric      r with addiction level
Phone checks / day            [=======]
Daily usage                   [======]
Sleep                         [---]
Self-esteem                   [----]
```

- **Purpose:** Keep phone use as context while showing that the YRBS teen-health profile is broader.
- **Tool:** D3.js ranked Pearson correlation bars from the Teen Phone Addiction dataset.
- **Relevant lectures:** Correlation caveats; perception; color.

## Independent Implementation Pieces

| # | Piece | Dataset | Chart / feature | Independent? |
|---|-------|---------|-----------------|--------------|
| 1 | Data loading and weighted helpers | YRBS | Shared aggregation utilities | Yes |
| 2 | Demographic orientation | YRBS | Bar charts and cross-filter | Yes |
| 3 | National profile scan | YRBS | Weighted scorecard cards | Yes |
| 4 | Subgroup profile comparison | YRBS | Dot plot with demographic selector | Yes |
| 5 | Grade profile shift | YRBS | Grade line/slope chart | Yes |
| 6 | Individual risk role | YRBS | Ranked mental-health gap chart | Yes |
| 7 | Risk stack | YRBS | Risk-count chart with toggles | Depends on 6 for shared risk definitions |
| 8 | Sexual-health module | YRBS | Safety gap and prevention/agency views | Yes |
| 9 | Phone context | Kaggle phone dataset | Ranked correlation chart | Yes |
| 10 | Cross-chart coordination | Both | Shared filters and highlights | Depends on 2-9 |

## Minimum Viable Product

The MVP for Milestone 3 is the YRBS story through step 7:

1. Demographic orientation and weighted-survey note.
2. National scorecard of obvious teen-health signals.
3. Subgroup and grade profile comparison.
4. Individual risk-role ranking.
5. Interactive risk-stack chart.
6. Sexual-health module framed around safety, consent, prevention, and care.

These pieces answer the main project question even if the phone context, linked brushing, animation, and map ideas are reduced.

## Prototype Status

The current prototype is in `milestone2/index.html` and uses D3.js with local CSV files under `milestone2/data/`. It now follows the planned reader flow: demographics first, then national signals, subgroup comparison, grade shift, risk role, risk accumulation, sexual health, and phone context. YRBS views use weighted percentages when reporting prevalence; the demographic orientation uses raw sample counts to show who is in the survey.

## Stretch Ideas For Milestone 3

- Add linked highlighting so a selected subgroup updates the national profile, dot plot, grade shift, and risk views together.
- Add annotation callouts for the grade shift from sleep/bullying concerns toward substance-use concerns.
- Add stronger missingness or denominator cues for school connectedness and sexual-health conditional views.
- Keep the phone-use dataset as a clearly labeled secondary context story.
- Add a state-level map only if comparable state-level YRBS aggregate data is available.
