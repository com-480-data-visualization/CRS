# Project of Data Visualization (COM-480)

| Student's name | SCIPER |
| -------------- | ------ |
|Rui Yang | 294952 |
|Shuli Cécile Jia | 316620 |
|Christos Konstantinidis | 347437 |

[Milestone 1](#milestone-1) • [Milestone 2](#milestone-2) • [Milestone 3](#milestone-3)

## Milestone 1 (20th March, 5pm)

**10% of the final grade**

This is a preliminary milestone to let you set up goals for your final project and assess the feasibility of your ideas.
Please, fill the following sections about your project.

*(max. 2000 characters per section)*

### Dataset

> Find a dataset (or multiple) that you will explore. Assess the quality of the data it contains and how much preprocessing / data-cleaning it will require before tackling visualization. We recommend using a standard dataset as this course is not about scraping nor data processing.
>
> Hint: some good pointers for finding quality publicly available datasets ([Google dataset search](https://datasetsearch.research.google.com/), [Kaggle](https://www.kaggle.com/datasets), [OpenSwissData](https://opendata.swiss/en/), [SNAP](https://snap.stanford.edu/data/) and [FiveThirtyEight](https://data.fivethirtyeight.com/)).

We will use the 2023 national Youth Risk Behavior Survey (YRBS) from the CDC as our first dataset for Milestone 1. YRBS is a standardized, school-based survey of U.S. high school students and is well documented, making it a good fit for a data visualization project. In our local workflow, we converted the official ASCII release into raw and readable CSV files, giving us a working table with 20,103 student records and 250 raw variables.

The data quality is strong because the survey instrument, variable labels, and value labels are all provided by CDC. Preprocessing is manageable: the main work was converting the fixed-width file into CSV and preserving the codebook. For the first milestone, we focus on social media use (`Q80` and the derived binary `QN80`) and mental health (`Q84` and the derived binary `QN84`), while using sex (`Q2`) and grade (`Q3`) for subgroup checks. Missingness is moderate for the focal questions (`Q80`: 24.37%, `Q84`: 21.88%) but very low for sex and grade (below 1%), so the dataset is still feasible for a first descriptive analysis.

### Problematic

> Frame the general topic of your visualization and the main axis that you want to develop.
> - What am I trying to show with my visualization?
> - Think of an overview for the project, your motivation, and the target audience.

Our project investigates the relationship between social media use and mental health among U.S. high school students. More specifically, we want to show whether students who report very frequent social media use are also more likely to report poor mental health, and whether that pattern looks different across subgroups such as sex and grade.

The motivation is that adolescent mental health and social media are both highly visible public debates, but the discussion is often broad and anecdotal. We want to turn the YRBS data into a more concrete visual story: how common intense social media use is, how it co-occurs with poor self-reported mental health, and where the strongest differences appear. Our target audience is broad: classmates, instructors, and general readers interested in youth well-being, education, or public health. The goal is explanatory and exploratory rather than causal. We do not aim to prove that social media causes poor mental health; we aim to communicate the strength and shape of the association visible in this dataset.

### Exploratory Data Analysis

> Pre-processing of the data set you chose
> - Show some basic statistics and get insights about the data

We added a simple standard-library analysis script at [yrbs_2023/basic_social_media_mental_health_analysis.py](yrbs_2023/basic_social_media_mental_health_analysis.py), which reads the readable CSV and writes a markdown summary to [yrbs_2023/basic_analysis_summary.md](yrbs_2023/basic_analysis_summary.md). The script reports missingness, category frequencies for social media and mental health, a `QN80 x QN84` contingency table, subgroup summaries by sex, and a simple chi-square / phi effect-size summary.

The first descriptive results already suggest that the topic is promising for visualization. Social media use is very common: the two largest categories are `Several times a day` (5,888 students) and `More than once an hour` (4,803 students). Using the CDC-derived binary indicators, 11,602 students have valid values on both `QN80` and `QN84`. Among frequent social media users, 32.56% report poor mental health, compared with 22.45% among other users. The gap is present for both female students (43.15% vs 30.49%) and male students (20.88% vs 17.26%). These numbers are descriptive and unweighted, so they are useful for feasibility and exploration, but they should not yet be interpreted as causal evidence or final population estimates.

### Related work


> - What others have already done with the data?
> - Why is your approach original?
> - What source of inspiration do you take? Visualizations that you found on other websites or magazines (might be unrelated to your data).
> - In case you are using a dataset that you have already explored in another context (ML or ADA course, semester project...), you are required to share the report of that work to outline the differences with the submission for this class.

There is already substantial public-health and academic work around this topic. CDC provides a [2023 YRBS results overview](https://www.cdc.gov/yrbs/results/2023-yrbs-results.html), the [YRBS Explorer and analysis tooling](https://www.cdc.gov/yrbs), and a dedicated 2024 MMWR article on [frequent social media use, sadness or hopelessness, bullying, and suicide risk](https://www.cdc.gov/mmwr/volumes/73/su/su7304a3.htm). At the policy level, the U.S. Surgeon General's [Social Media and Youth Mental Health advisory](https://www.hhs.gov/surgeongeneral/reports-and-publications/youth-mental-health/social-media/index.html) gives broader context for why this question matters. In academic research, recent work includes a 2024 JAMA Pediatrics [systematic review and meta-analysis](https://jamanetwork.com/journals/jamapediatrics/fullarticle/2819781) and a 2025 JAMA Network Open study on [social media use and depressive symptoms during early adolescence](https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2834349).

Our approach is still original in the context of this project because we are not trying to build another general-purpose dashboard or repeat a national report. Instead, we want to craft a focused visualization narrative around one interpretable relationship inside YRBS: frequent social media use and poor mental health, with subgroup comparisons that make the pattern easier to read. As inspiration, we take cues from CDC's YRBS Explorer for clarity and public-health accessibility, but we want a more coherent storytelling experience centered on one question rather than a broad survey portal.

## Milestone 2 (17th April, 5pm)

**10% of the final grade**


## Milestone 3 (29th May, 5pm)

**80% of the final grade**


## Late policy

- < 24h: 80% of the grade for the milestone
- < 48h: 70% of the grade for the milestone
