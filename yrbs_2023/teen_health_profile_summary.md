# Teen Health Profile: YRBS 2023

This summary broadens the project scope from a single social-media relationship to a multi-domain profile of adolescent health in the 2023 national YRBS.

## Dataset And Method Notes

- Source: readable 2023 YRBS CSV generated in this repository (20,103 student rows).
- Headline prevalences are weighted with `WEIGHT` and use CDC-derived binary indicators where `1 = Yes` and `2 = No`.
- Valid `n` values are unweighted counts of rows with a non-missing indicator and non-missing survey weight.
- Missing percentages count all rows not included in the weighted denominator, so missing values are never folded into the `No` category.
- Main subgroup cuts: sex (`Q2_label`), grade (`Q3_label`), and race/ethnicity (`RACEETH_label`).
- The main grade comparison excludes `Ungraded or other grade` (raw n=48).
- The main race/ethnicity comparison excludes `Native Hawaiian/Other PI` because the raw subgroup is small (raw n=105).

- Sex counts: Female=9,884, Male=10,061
- Grade counts: 9th grade=5,680, 10th grade=5,410, 11th grade=4,811, 12th grade=3,961, Ungraded or other grade=48
- Race/ethnicity counts: White=9,700, Black or African American=1,791, Hispanic/Latino=1,208, Asian=995, Multiple - Hispanic=2,786, Multiple - Non-Hispanic=1,814, Am Indian/Alaska Native=1,334, Native Hawaiian/Other PI=105

## Core Scorecard

| Domain | Indicator | `Yes` means | Weighted yes % | Valid n | Missing % |
| --- | --- | --- | ---: | ---: | ---: |
| Mental / Emotional | Sad or hopeless | felt sad or hopeless | 39.72% | 19,863 | 1.19% |
| Mental / Emotional | Poor current mental health | reported poor current mental health | 28.54% | 15,705 | 21.88% |
| Physical Habits / Outcomes | Physically active 5+ days | were physically active at least 60 minutes per day on 5 or more days | 46.32% | 18,876 | 6.10% |
| Physical Habits / Outcomes | Sleep 8+ hours | got 8 or more hours of sleep | 23.20% | 17,441 | 13.24% |
| Physical Habits / Outcomes | Breakfast all 7 days | ate breakfast on all 7 days | 27.44% | 14,268 | 29.03% |
| Physical Habits / Outcomes | Obesity | had obesity | 15.95% | 17,814 | 11.39% |
| Safety / Support | Bullied at school | were bullied on school property | 19.24% | 19,902 | 1.00% |
| Safety / Support | Unstable housing | experienced unstable housing | 3.30% | 14,541 | 27.67% |
| Safety / Support | Basic needs met | reported that an adult in the household usually met their basic needs | 86.28% | 15,750 | 21.65% |
| Substance Use | Current tobacco or EVP use | currently used cigarettes, cigars, smokeless tobacco, or electronic vapor products | 17.94% | 17,824 | 11.34% |
| Substance Use | Current alcohol use | currently drank alcohol | 22.10% | 19,202 | 4.48% |
| Substance Use | Current marijuana use | currently used marijuana | 16.99% | 19,600 | 2.50% |

## Subgroup Comparisons

The subgroup tables use a smaller cross-domain set of indicators to keep the main comparison view readable.

### Sex

| Indicator | Group | Weighted yes % | Valid n | Missing % |
| --- | --- | ---: | ---: | ---: |
| Poor current mental health | Female | 38.76% | 7,760 | 21.49% |
| Poor current mental health | Male | 18.83% | 7,860 | 21.88% |
| Physically active 5+ days | Female | 36.04% | 9,320 | 5.71% |
| Physically active 5+ days | Male | 56.02% | 9,431 | 6.26% |
| Sleep 8+ hours | Female | 21.70% | 8,614 | 12.85% |
| Sleep 8+ hours | Male | 24.56% | 8,718 | 13.35% |
| Breakfast all 7 days | Female | 22.41% | 6,983 | 29.35% |
| Breakfast all 7 days | Male | 32.16% | 7,204 | 28.40% |
| Bullied at school | Female | 21.91% | 9,791 | 0.94% |
| Bullied at school | Male | 16.64% | 9,974 | 0.86% |
| School connectedness | Female | 49.85% | 5,494 | 44.42% |
| School connectedness | Male | 60.38% | 5,635 | 43.99% |
| Current tobacco or EVP use | Female | 20.53% | 8,767 | 11.30% |
| Current tobacco or EVP use | Male | 15.56% | 8,950 | 11.04% |
| Current marijuana use | Female | 18.61% | 9,657 | 2.30% |
| Current marijuana use | Male | 15.38% | 9,797 | 2.62% |

### Grade

| Indicator | Group | Weighted yes % | Valid n | Missing % |
| --- | --- | ---: | ---: | ---: |
| Poor current mental health | 9th grade | 27.10% | 4,075 | 28.26% |
| Poor current mental health | 10th grade | 29.43% | 4,299 | 20.54% |
| Poor current mental health | 11th grade | 29.69% | 3,872 | 19.52% |
| Poor current mental health | 12th grade | 27.89% | 3,278 | 17.24% |
| Physically active 5+ days | 9th grade | 48.46% | 5,314 | 6.44% |
| Physically active 5+ days | 10th grade | 48.84% | 5,124 | 5.29% |
| Physically active 5+ days | 11th grade | 44.59% | 4,514 | 6.17% |
| Physically active 5+ days | 12th grade | 43.31% | 3,741 | 5.55% |
| Sleep 8+ hours | 9th grade | 30.99% | 4,842 | 14.75% |
| Sleep 8+ hours | 10th grade | 22.03% | 4,703 | 13.07% |
| Sleep 8+ hours | 11th grade | 20.76% | 4,233 | 12.01% |
| Sleep 8+ hours | 12th grade | 18.09% | 3,501 | 11.61% |
| Breakfast all 7 days | 9th grade | 28.96% | 4,081 | 28.15% |
| Breakfast all 7 days | 10th grade | 27.62% | 3,752 | 30.65% |
| Breakfast all 7 days | 11th grade | 25.07% | 3,360 | 30.16% |
| Breakfast all 7 days | 12th grade | 27.89% | 3,002 | 24.21% |
| Bullied at school | 9th grade | 24.65% | 5,603 | 1.36% |
| Bullied at school | 10th grade | 20.20% | 5,379 | 0.57% |
| Bullied at school | 11th grade | 17.59% | 4,782 | 0.60% |
| Bullied at school | 12th grade | 14.00% | 3,928 | 0.83% |
| School connectedness | 9th grade | 59.27% | 2,887 | 49.17% |
| School connectedness | 10th grade | 56.21% | 2,984 | 44.84% |
| School connectedness | 11th grade | 54.30% | 2,694 | 44.00% |
| School connectedness | 12th grade | 51.49% | 2,565 | 35.24% |
| Current tobacco or EVP use | 9th grade | 12.75% | 5,039 | 11.29% |
| Current tobacco or EVP use | 10th grade | 15.73% | 4,845 | 10.44% |
| Current tobacco or EVP use | 11th grade | 20.32% | 4,258 | 11.49% |
| Current tobacco or EVP use | 12th grade | 23.16% | 3,534 | 10.78% |
| Current marijuana use | 9th grade | 10.83% | 5,548 | 2.32% |
| Current marijuana use | 10th grade | 14.31% | 5,273 | 2.53% |
| Current marijuana use | 11th grade | 18.96% | 4,691 | 2.49% |
| Current marijuana use | 12th grade | 24.53% | 3,870 | 2.30% |

### Race / Ethnicity

| Indicator | Group | Weighted yes % | Valid n | Missing % |
| --- | --- | ---: | ---: | ---: |
| Poor current mental health | White | 31.40% | 7,633 | 21.31% |
| Poor current mental health | Black or African American | 26.51% | 1,587 | 11.39% |
| Poor current mental health | Hispanic/Latino | 21.83% | 709 | 41.31% |
| Poor current mental health | Asian | 23.02% | 774 | 22.21% |
| Poor current mental health | Multiple - Hispanic | 27.59% | 2,271 | 18.49% |
| Poor current mental health | Multiple - Non-Hispanic | 28.88% | 1,481 | 18.36% |
| Physically active 5+ days | White | 53.35% | 9,084 | 6.35% |
| Physically active 5+ days | Black or African American | 38.86% | 1,691 | 5.58% |
| Physically active 5+ days | Hispanic/Latino | 36.29% | 1,134 | 6.13% |
| Physically active 5+ days | Asian | 37.63% | 965 | 3.02% |
| Physically active 5+ days | Multiple - Hispanic | 41.13% | 2,629 | 5.64% |
| Physically active 5+ days | Multiple - Non-Hispanic | 48.71% | 1,746 | 3.75% |
| Sleep 8+ hours | White | 24.52% | 8,624 | 11.09% |
| Sleep 8+ hours | Black or African American | 19.38% | 1,659 | 7.37% |
| Sleep 8+ hours | Hispanic/Latino | 25.70% | 1,101 | 8.86% |
| Sleep 8+ hours | Asian | 19.14% | 789 | 20.70% |
| Sleep 8+ hours | Multiple - Hispanic | 22.97% | 2,504 | 10.12% |
| Sleep 8+ hours | Multiple - Non-Hispanic | 16.88% | 1,472 | 18.85% |
| Breakfast all 7 days | White | 30.49% | 6,302 | 35.03% |
| Breakfast all 7 days | Black or African American | 23.76% | 1,360 | 24.06% |
| Breakfast all 7 days | Hispanic/Latino | 24.64% | 1,051 | 13.00% |
| Breakfast all 7 days | Asian | 32.14% | 709 | 28.74% |
| Breakfast all 7 days | Multiple - Hispanic | 24.13% | 2,236 | 19.74% |
| Breakfast all 7 days | Multiple - Non-Hispanic | 27.04% | 1,348 | 25.69% |
| Bullied at school | White | 23.18% | 9,627 | 0.75% |
| Bullied at school | Black or African American | 14.18% | 1,773 | 1.01% |
| Bullied at school | Hispanic/Latino | 12.51% | 1,198 | 0.83% |
| Bullied at school | Asian | 11.46% | 983 | 1.21% |
| Bullied at school | Multiple - Hispanic | 17.14% | 2,759 | 0.97% |
| Bullied at school | Multiple - Non-Hispanic | 21.46% | 1,805 | 0.50% |
| School connectedness | White | 59.38% | 4,761 | 50.92% |
| School connectedness | Black or African American | 49.57% | 1,265 | 29.37% |
| School connectedness | Hispanic/Latino | 49.73% | 632 | 47.68% |
| School connectedness | Asian | 55.17% | 434 | 56.38% |
| School connectedness | Multiple - Hispanic | 53.00% | 1,854 | 33.45% |
| School connectedness | Multiple - Non-Hispanic | 54.47% | 1,135 | 37.43% |
| Current tobacco or EVP use | White | 19.62% | 8,739 | 9.91% |
| Current tobacco or EVP use | Black or African American | 16.51% | 1,632 | 8.88% |
| Current tobacco or EVP use | Hispanic/Latino | 12.84% | 1,113 | 7.86% |
| Current tobacco or EVP use | Asian | 7.31% | 805 | 19.10% |
| Current tobacco or EVP use | Multiple - Hispanic | 18.95% | 2,434 | 12.63% |
| Current tobacco or EVP use | Multiple - Non-Hispanic | 19.77% | 1,564 | 13.78% |
| Current marijuana use | White | 17.60% | 9,512 | 1.94% |
| Current marijuana use | Black or African American | 17.56% | 1,742 | 2.74% |
| Current marijuana use | Hispanic/Latino | 11.00% | 1,171 | 3.06% |
| Current marijuana use | Asian | 6.51% | 978 | 1.71% |
| Current marijuana use | Multiple - Hispanic | 19.09% | 2,687 | 3.55% |
| Current marijuana use | Multiple - Non-Hispanic | 20.79% | 1,772 | 2.32% |

## Poor Mental Health Context

- This table shows weighted poor-mental-health prevalence (`QN84`) within each comparison group.
- `QN103` has relatively high missingness in this dataset (44.40%), so interpret the school-connectedness rows with extra caution.

| Comparator | Poor mental health if comparator = Yes | Yes-group n | Poor mental health if comparator = No | No-group n | Pair missing % |
| --- | ---: | ---: | ---: | ---: | ---: |
| Bullied at school | 46.17% | 3,204 | 24.41% | 12,378 | 22.49% |
| Physically active 5+ days | 24.87% | 7,279 | 31.83% | 7,831 | 24.84% |
| Sleep 8+ hours | 18.29% | 3,335 | 32.09% | 11,455 | 26.43% |
| Unstable housing | 27.45% | 484 | 28.21% | 13,833 | 28.78% |
| School connectedness | 21.95% | 5,955 | 37.06% | 5,084 | 45.09% |

## Short Takeaways

- The weighted headline profile shows 39.72% sad or hopelessness and 28.54% poor current mental health.
- Daily-health benchmarks are relatively low: only 23.20% got 8+ hours of sleep and 27.44% ate breakfast on all 7 days.
- The sex gap is pronounced: poor current mental health is 38.76% among female students versus 18.83% among male students, while the activity benchmark is 36.04% versus 56.02%.
- Substance use rises with grade in this first profile: current marijuana use increases from 10.83% in 9th grade to 24.53% in 12th grade, and current tobacco or EVP use rises from 12.75% to 23.16%.
- The clearest poor-mental-health gaps in this first pass appear around school bullying (46.17% vs 24.41%), sleep duration (32.09% vs 18.29% for students sleeping less than vs at least 8 hours), and school connectedness (21.95% vs 37.06%). The unstable-housing comparison is less decisive here because the `Yes` group is small (n=484) and pair missingness remains 28.78%.
