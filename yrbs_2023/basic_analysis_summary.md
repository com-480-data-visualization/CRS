# Basic Analysis: Social Media and Mental Health in YRBS 2023

This summary uses the readable 2023 YRBS CSV generated in this repository. All results below are descriptive and unweighted.

## Dataset Snapshot

- Total rows: 20,103
- Main exposure fields: `Q80` / `QN80` (social media use)
- Main outcome fields: `Q84` / `QN84` (current mental health)
- Subgroup fields: `Q2` (sex) and `Q3` (grade)

## Missingness

| Field | Non-missing | Missing | Missing % |
| --- | ---: | ---: | ---: |
| Q80 | 15,203 | 4,900 | 24.37% |
| Q84 | 15,705 | 4,398 | 21.88% |
| QN80 | 15,203 | 4,900 | 24.37% |
| QN84 | 15,705 | 4,398 | 21.88% |
| Q2 | 19,945 | 158 | 0.79% |
| Q3 | 19,910 | 193 | 0.96% |

## Social Media Distribution (`Q80`)

| Category | Count | Percent of all rows |
| --- | ---: | ---: |
| Several times a day | 5,888 | 29.29% |
| More than once an hour | 4,803 | 23.89% |
| About once an hour | 1,181 | 5.87% |
| I do not use social media | 1,082 | 5.38% |
| About once a day | 904 | 4.50% |
| A few times a week | 708 | 3.52% |
| A few times a month | 406 | 2.02% |
| About once a week | 231 | 1.15% |

## Mental Health Distribution (`Q84`)

| Category | Count | Percent of all rows |
| --- | ---: | ---: |
| Sometimes | 4,751 | 23.63% |
| Most of the time | 3,377 | 16.80% |
| Rarely | 3,308 | 16.46% |
| Never | 2,838 | 14.12% |
| Always | 1,431 | 7.12% |

## Sample Composition

- Sex counts: Male=10,061, Female=9,884
- Grade counts: 9th grade=5,680, 10th grade=5,410, 11th grade=4,811, 12th grade=3,961, Ungraded or other grade=48

## Binary Association Using CDC-Derived Indicators

- `QN80 = 1` means the student used social media several times a day.
- `QN84 = 1` means the student reported poor mental health most of the time or always.
- Valid rows with non-missing `QN80` and `QN84`: 11,602
- Poor mental health among frequent social-media users: 32.56%
- Poor mental health among less frequent users: 22.45%
- Chi-square statistic: 94.16
- Phi effect size: 0.0901

| Group | Poor mental health | Not poor mental health | Total |
| --- | ---: | ---: | ---: |
| Frequent social media users (`QN80=1`) | 2,971 | 6,154 | 9,125 |
| Other users (`QN80=2`) | 556 | 1,921 | 2,477 |

## Sex Subgroups

| Sex | Frequent social media n | Poor mental health among frequent users | Other users n | Poor mental health among other users |
| --- | ---: | ---: | ---: | ---: |
| Female | 4,758 | 43.15% | 938 | 30.49% |
| Male | 4,340 | 20.88% | 1,518 | 17.26% |

## Takeaways

- Frequent social media use is common in this sample, with the largest categories being `Several times a day` and `More than once an hour`.
- In this first-pass descriptive analysis, frequent social-media users report poor mental health more often than other users.
- The difference is present for both female and male students, and the absolute levels are higher among female students.
- This script is intended for milestone feasibility and EDA only; it does not apply survey weights or support causal claims.
