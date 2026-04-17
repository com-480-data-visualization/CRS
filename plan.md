# Plan

Build Milestone 2 as a guided discovery of teen health, not a dashboard inventory. The reader should move from "who is in the survey?" to "what are the obvious health signals?" to "what did I not expect?" Each section should teach one clear idea and make the next section feel necessary.

## Scope

- In:
  - YRBS-first story about adolescent health in the United States.
  - A deliberate narrative climb from demographics to shallow profile to deeper findings.
  - Core domains: mental health, sleep/routines, activity, bullying/safety, school support, substance use, relationship safety, and sexual health.
  - Sexual health framed through safety, consent, prevention, testing, and agency.
  - Weighted percentages, valid `n`, denominator notes, and missingness caveats where interpretation depends on them.
  - Phone/social-media context only as a secondary comparison.

- Out:
  - Causal claims.
  - A generic "many charts" dashboard.
  - Treating sexual activity itself as a risk.
  - Stigmatizing subgroup comparisons.
  - Sensitive subgroup claims without enough sample-size and missingness caution.
  - Letting the phone dataset become the main explanation for teen health.

## Narrative Spine

The core story should feel like this:

1. The survey is broad and nationally weighted.
2. Teen health has several obvious pressure points: mental health, sleep, activity, substance use, safety, and support.
3. Those pressure points do not distribute evenly across sex, grade, and race/ethnicity.
4. Grade is not just a demographic label; the profile changes as students move through high school.
5. Some factors separate poor mental health much more than others.
6. The most important pattern is accumulation: risks stack.
7. Sexual health belongs in the story when it is about safety, consent, protection, and care.
8. Phones matter, but teen health is bigger than a phone story.

## Story Ladder

### 1. Orientation: Who Are We Looking At?

**Question:** Who is in the YRBS dataset, and how should readers interpret the survey?

**Reader level:** Basic orientation.

**Good message:** This is not a random web poll. It is a large, structured survey of high-school students, and weighted estimates should be read as population-level prevalence rather than raw sample counts.

Use:
- Age: `Q1`
- Sex: `Q2`
- Grade: `Q3`
- Race/ethnicity: `RACEETH`
- Weight: `WEIGHT`

Visualization:
- Survey passport plus demographic association flow.
- Small note explaining weighted estimates.

Design role:
- Establish trust.
- Prevent readers from jumping directly into interpretation without knowing the denominator.

### 2. Shallow Profile: What Are The Obvious Teen-Health Signals?

**Question:** What does teen health look like nationally if we scan the main domains?

**Reader level:** Shallow but necessary.

**Good message:** Teen health is not one issue. Mental health is prominent, but sleep, activity, safety, support, substance use, and relationship safety are also visible parts of the profile.

Use:
- Mental health: `Q26`, `Q84`, `QN26`, `QN84`
- Sleep/routines: `Q85`, `Q76`, `Q97`
- Bullying/safety: `Q14`, `Q24`, `Q25`
- Substance use: `Q42`, `Q48`, `QNTB4`
- Support: `Q86`, `Q99`, `Q103`, `Q104`
- Sexual/relationship safety: `Q19-Q22`

Visualization:
- National weighted scorecard or grouped bar profile.

What readers learn:
- Rough prevalence levels.
- Which indicators are common enough to matter.
- Why a multi-domain profile is more useful than one isolated chart.

### 3. First Comparison: Whose Profile Looks Different?

**Question:** How do these health signals vary across demographic groups?

**Reader level:** Familiar subgroup comparison.

**Good message:** Subgroups do not simply rank from "healthy" to "unhealthy." A group can have higher mental-health burden while also having a different pattern of activity, sleep, bullying, or substance use.

Use:
- Sex: `Q2`
- Grade: `Q3`
- Race/ethnicity: `RACEETH`
- Optional age: `Q1`
- Reuse selected indicators from the national scorecard.

Visualization:
- Subgroup dot plot across selected indicators.
- Dropdown or segmented control for sex, grade, race/ethnicity, and age.

What readers learn:
- The profile has shape, not just level.
- Sex and grade differences are visible but should be interpreted descriptively.

### 4. Profile Shift: How Does Health Change Across High School?

**Question:** What changes from 9th to 12th grade?

**Reader level:** More interpretive.

**Good message:** Grade does not simply make teen health better or worse. The profile shifts: sleep declines, some substance-use indicators rise, and school/safety indicators may move differently.

Use:
- Sleep: `Q85`, `QN85`
- Bullying: `Q24`, `QN24`
- School connectedness: `Q103`, `QN103`
- Tobacco/e-vapor: `QNTB4`
- Alcohol: `QN42`
- Marijuana: `QN48`
- Poor current mental health: `QN84`

Visualization:
- Grade profile line chart, slope chart, or small multiples.

What readers learn:
- Grade is a developmental axis.
- The surprising part is not "older students are worse"; it is that different parts of health move in different directions.

### 5. Individual Risk Role: Which Factors Separate Mental Health Most?

**Question:** Which risks or contexts are most associated with poor current mental health?

**Reader level:** Insightful comparison.

**Good message:** The most visible teen-health topic is not always the strongest mental-health separator. Bullying, relationship safety, school belonging, sleep, and substance use can show very different gaps.

Use poor current mental health `QN84` against:
- Bullied at school: `QN24`
- Insufficient sleep: `QN85`
- Physical inactivity: `QN76`
- Current substance use: `QNTB4`, `QN42`, `QN48`
- Low school connectedness: `QN103`
- Sexual violence / dating violence: `Q19-Q22`
- Alcohol/drugs before sex: `Q60`, among valid last-sex responses

Visualization:
- Ranked mental-health gap chart.
- Show `risk present`, `risk absent`, gap in percentage points, and valid `n`.

What readers learn:
- Some risks are much stronger separators than expected.
- Relationship safety is not a side issue; it has large mental-health gaps.

### 6. Risk Stack: What Happens When Problems Accumulate?

**Question:** What happens when multiple risks are present at the same time?

**Reader level:** Main insight.

**Good message:** Teen health problems are not isolated. Poor mental health rises sharply when multiple risks accumulate, even if any single factor is only part of the story.

Use:
- Insufficient sleep
- Physical inactivity
- Bullied at school
- Current tobacco/alcohol/marijuana use
- Low school connectedness

Visualization:
- Interactive risk stack with toggles.
- Companion ranked role chart so readers can see which selected risk contributes more individually.

Important note:
- Use complete cases for selected risk fields.
- Report valid `n` and warn that school connectedness has higher missingness.
- Do not include sexual activity itself as a risk. Relationship-safety harms can be analyzed separately.

What readers learn:
- The surprising pattern is the slope: mental-health prevalence changes dramatically as risks accumulate.
- The interaction should answer "which risk matters more?" and "what if I add/remove this risk?"

### 7. Sexual Health: How Does It Fit Responsibly?

**Question:** How does sexual health belong in a teen-health profile without moralizing sexual activity?

**Reader level:** Sensitive, responsible insight.

**Good message:** Sexual health belongs in teen health when it is framed around safety, consent, prevention, testing, and access to care. The important story is not whether teens are sexually active, but whether relationships are safe, consensual, and protected.

Use:
- Current sexual activity denominator: `Q59`
- Forced sexual intercourse: `Q19`
- Sexual violence: `Q20`
- Sexual dating violence: `Q21`
- Physical dating violence: `Q22`
- Alcohol/drugs before sex: `Q60`
- Condom use: `Q61`
- Birth control: `Q62`
- HIV testing: `Q81`
- STD testing: `Q82`
- Consent verbally asked: `Q94`

Visualization:
- Relationship-safety gap chart against poor current mental health.
- Conditional prevention/agency bars among currently sexually active students.

What readers learn:
- Safety and coercion indicators have large mental-health gaps.
- Prevention and agency indicators tell a different story from violence indicators.
- Low testing can be an access/care insight, not a blame statement.

### 8. Phone Context: Is Teen Health Just A Digital-Behavior Story?

**Question:** Does the phone/addiction dataset explain the teen-health story?

**Reader level:** Context and restraint.

**Good message:** Phone use is relevant, but it should not swallow the project. The YRBS story shows that teen health is broader than digital behavior: sleep, bullying, belonging, substance use, and relationship safety all matter.

Use:
- Teen Phone Addiction dataset correlations.
- Optional YRBS social-media variable: `Q80`, `QN80`
- Poor current mental health: `QN84`

Visualization:
- Small ranked correlation chart.
- Keep it visually secondary to the YRBS story.

What readers learn:
- Digital behavior is one context, not the master explanation.
- This makes the project more responsible and less clickbait-like.

## Action Items

[ ] Rewrite `milestone2_writeup.md` around the story ladder instead of a module list.
[ ] Start the writeup with demographics and survey interpretation before health claims.
[ ] Reframe the scorecard section as the shallow national scan.
[ ] Add a clear transition from subgroup comparison to grade-as-profile-shift.
[ ] Make risk-role ranking and risk-stack accumulation the main "insight" section.
[ ] Keep sexual health as a core section, but frame it through safety, consent, prevention, and care.
[ ] Reduce phone-use language so it reads as context, not the project thesis.
[ ] Add denominator, valid `n`, or missingness notes wherever the reader might overinterpret.
[ ] Verify every headline value against weighted YRBS calculations after final edits.

## MVP Narrative For Milestone 2

The minimum viable story is:

1. **Demographics:** Here is who the survey represents, shown as a survey passport and demographic association flow.
2. **National profile:** Here are the obvious health signals.
3. **Subgroup/grade profile:** Here is how the profile changes across students.
4. **Risk role and risk stack:** Here is the deeper mental-health insight.
5. **Sexual health:** Here is the responsible relationship-safety and prevention story.
6. **Phone context:** Here is why the story is broader than phones.

If we need to cut, keep steps 1-5 and demote phone context further.

## Open Questions

- Should the final prototype make grade shift its own section, or should it be a strong default view inside the subgroup profile?
- Should relationship-safety harms eventually become optional risk-stack toggles, or stay in the standalone sexual-health module for clarity and sensitivity?

## Current Best Narrative

We begin with a simple census-like question: who are these students? Then we scan the obvious national signals: mental health is high, sleep is low, and risks appear across several domains. The story becomes more interesting when the profile changes by subgroup and grade. It becomes genuinely insightful when we compare which risks separate poor mental health most and show that risks stack sharply. Sexual health belongs because safety, consent, protection, and testing are part of teen wellbeing. Phones remain a useful context, but not the whole explanation.
