#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
from collections import Counter
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class IndicatorDefinition:
    field: str
    domain: str
    label: str
    yes_meaning: str


@dataclass(frozen=True)
class BinaryStat:
    valid_n: int
    missing_n: int
    missing_pct: float
    weighted_yes_pct: float


@dataclass(frozen=True)
class ContextStat:
    comparator: IndicatorDefinition
    yes_group_n: int
    yes_group_poor_mental_health_pct: float
    no_group_n: int
    no_group_poor_mental_health_pct: float
    pair_missing_pct: float


INDICATORS: list[IndicatorDefinition] = [
    IndicatorDefinition("QN26", "Mental / Emotional", "Sad or hopeless", "felt sad or hopeless"),
    IndicatorDefinition(
        "QN84",
        "Mental / Emotional",
        "Poor current mental health",
        "reported poor current mental health",
    ),
    IndicatorDefinition(
        "QN76",
        "Physical Habits / Outcomes",
        "Physically active 5+ days",
        "were physically active at least 60 minutes per day on 5 or more days",
    ),
    IndicatorDefinition(
        "QN85",
        "Physical Habits / Outcomes",
        "Sleep 8+ hours",
        "got 8 or more hours of sleep",
    ),
    IndicatorDefinition(
        "QNBK7DAY",
        "Physical Habits / Outcomes",
        "Breakfast all 7 days",
        "ate breakfast on all 7 days",
    ),
    IndicatorDefinition(
        "QNOBESE",
        "Physical Habits / Outcomes",
        "Obesity",
        "had obesity",
    ),
    IndicatorDefinition(
        "QN24",
        "Safety / Support",
        "Bullied at school",
        "were bullied on school property",
    ),
    IndicatorDefinition(
        "QN86",
        "Safety / Support",
        "Unstable housing",
        "experienced unstable housing",
    ),
    IndicatorDefinition(
        "QN99",
        "Safety / Support",
        "Basic needs met",
        "reported that an adult in the household usually met their basic needs",
    ),
    IndicatorDefinition(
        "QNTB4",
        "Substance Use",
        "Current tobacco or EVP use",
        "currently used cigarettes, cigars, smokeless tobacco, or electronic vapor products",
    ),
    IndicatorDefinition(
        "QN42",
        "Substance Use",
        "Current alcohol use",
        "currently drank alcohol",
    ),
    IndicatorDefinition(
        "QN48",
        "Substance Use",
        "Current marijuana use",
        "currently used marijuana",
    ),
]

SUBGROUP_INDICATOR_FIELDS = [
    "QN84",
    "QN76",
    "QN85",
    "QNBK7DAY",
    "QN24",
    "QN103",
    "QNTB4",
    "QN48",
]

CONTEXT_COMPARATORS = [
    IndicatorDefinition("QN24", "Safety / Support", "Bullied at school", "were bullied on school property"),
    IndicatorDefinition(
        "QN76",
        "Physical Habits / Outcomes",
        "Physically active 5+ days",
        "were physically active at least 60 minutes per day on 5 or more days",
    ),
    IndicatorDefinition(
        "QN85",
        "Physical Habits / Outcomes",
        "Sleep 8+ hours",
        "got 8 or more hours of sleep",
    ),
    IndicatorDefinition("QN86", "Safety / Support", "Unstable housing", "experienced unstable housing"),
    IndicatorDefinition(
        "QN103",
        "Safety / Support",
        "School connectedness",
        "agreed or strongly agreed that they feel close to people at school",
    ),
]

INDICATOR_MAP = {indicator.field: indicator for indicator in INDICATORS}
INDICATOR_MAP["QN103"] = IndicatorDefinition(
    "QN103",
    "Safety / Support",
    "School connectedness",
    "agreed or strongly agreed that they feel close to people at school",
)

SEX_ORDER = ["Female", "Male"]
GRADE_ORDER = ["9th grade", "10th grade", "11th grade", "12th grade"]
RACE_ORDER = [
    "White",
    "Black or African American",
    "Hispanic/Latino",
    "Asian",
    "Multiple - Hispanic",
    "Multiple - Non-Hispanic",
]


def parse_args() -> argparse.Namespace:
    script_dir = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(
        description="Compute a weighted teen health profile summary for the 2023 YRBS dataset."
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=script_dir / "yrbs2023_readable.csv",
        help="Path to the readable YRBS CSV (default: yrbs2023_readable.csv next to this script).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=script_dir / "teen_health_profile_summary.md",
        help="Path to the markdown summary to generate (default: teen_health_profile_summary.md next to this script).",
    )
    return parser.parse_args()


def require_file(path: Path) -> Path:
    resolved = path.resolve()
    if not resolved.exists() or not resolved.is_file():
        raise FileNotFoundError(f"Input CSV not found: {path}")
    return resolved


def pct(numerator: float, denominator: float) -> float:
    if denominator == 0:
        return 0.0
    return round(100.0 * numerator / denominator, 2)


def fmt_int(value: int) -> str:
    return f"{value:,}"


def fmt_pct(value: float) -> str:
    return f"{value:.2f}%"


def parse_weight(value: str) -> float | None:
    if not value:
        return None
    try:
        return float(value)
    except ValueError:
        return None


def read_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        return list(reader)


def count_labels(rows: list[dict[str, str]], field: str) -> Counter[str]:
    counts: Counter[str] = Counter()
    for row in rows:
        label = row.get(field, "")
        if label:
            counts[label] += 1
    return counts


def format_count_summary(counter: Counter[str], order: list[str] | None = None) -> str:
    labels = order or [label for label, _ in counter.most_common()]
    parts: list[str] = []
    for label in labels:
        count = counter.get(label)
        if count:
            parts.append(f"{label}={fmt_int(count)}")
    return ", ".join(parts)


def compute_binary_stat(
    rows: list[dict[str, str]],
    field: str,
    group_field: str | None = None,
    group_value: str | None = None,
) -> BinaryStat:
    total_rows = 0
    valid_n = 0
    yes_weight = 0.0
    total_weight = 0.0

    for row in rows:
        if group_field is not None and row.get(group_field, "") != group_value:
            continue

        total_rows += 1
        code = row.get(field, "")
        weight = parse_weight(row.get("WEIGHT", ""))
        if code not in {"1", "2"} or weight is None:
            continue

        valid_n += 1
        total_weight += weight
        if code == "1":
            yes_weight += weight

    missing_n = total_rows - valid_n
    return BinaryStat(
        valid_n=valid_n,
        missing_n=missing_n,
        missing_pct=pct(missing_n, total_rows),
        weighted_yes_pct=pct(yes_weight, total_weight),
    )


def compute_context_stat(
    rows: list[dict[str, str]],
    outcome_field: str,
    comparator: IndicatorDefinition,
) -> ContextStat:
    total_rows = 0
    pair_valid_n = 0
    yes_group_n = 0
    no_group_n = 0
    yes_group_outcome_weight = 0.0
    yes_group_total_weight = 0.0
    no_group_outcome_weight = 0.0
    no_group_total_weight = 0.0

    for row in rows:
        total_rows += 1
        outcome = row.get(outcome_field, "")
        comparison = row.get(comparator.field, "")
        weight = parse_weight(row.get("WEIGHT", ""))
        if outcome not in {"1", "2"} or comparison not in {"1", "2"} or weight is None:
            continue

        pair_valid_n += 1
        if comparison == "1":
            yes_group_n += 1
            yes_group_total_weight += weight
            if outcome == "1":
                yes_group_outcome_weight += weight
        else:
            no_group_n += 1
            no_group_total_weight += weight
            if outcome == "1":
                no_group_outcome_weight += weight

    return ContextStat(
        comparator=comparator,
        yes_group_n=yes_group_n,
        yes_group_poor_mental_health_pct=pct(yes_group_outcome_weight, yes_group_total_weight),
        no_group_n=no_group_n,
        no_group_poor_mental_health_pct=pct(no_group_outcome_weight, no_group_total_weight),
        pair_missing_pct=pct(total_rows - pair_valid_n, total_rows),
    )


def format_scorecard_table(
    definitions: list[IndicatorDefinition],
    stats: dict[str, BinaryStat],
) -> list[str]:
    lines = [
        "| Domain | Indicator | `Yes` means | Weighted yes % | Valid n | Missing % |",
        "| --- | --- | --- | ---: | ---: | ---: |",
    ]
    for definition in definitions:
        stat = stats[definition.field]
        lines.append(
            f"| {definition.domain} | {definition.label} | {definition.yes_meaning} | {fmt_pct(stat.weighted_yes_pct)} | {fmt_int(stat.valid_n)} | {fmt_pct(stat.missing_pct)} |"
        )
    return lines


def format_subgroup_table(
    rows: list[dict[str, str]],
    group_field: str,
    group_values: list[str],
    indicator_fields: list[str],
) -> list[str]:
    lines = [
        "| Indicator | Group | Weighted yes % | Valid n | Missing % |",
        "| --- | --- | ---: | ---: | ---: |",
    ]
    for indicator_field in indicator_fields:
        indicator = INDICATOR_MAP[indicator_field]
        for group_value in group_values:
            stat = compute_binary_stat(rows, indicator_field, group_field=group_field, group_value=group_value)
            lines.append(
                f"| {indicator.label} | {group_value} | {fmt_pct(stat.weighted_yes_pct)} | {fmt_int(stat.valid_n)} | {fmt_pct(stat.missing_pct)} |"
            )
    return lines


def format_context_table(context_stats: list[ContextStat]) -> list[str]:
    lines = [
        "| Comparator | Poor mental health if comparator = Yes | Yes-group n | Poor mental health if comparator = No | No-group n | Pair missing % |",
        "| --- | ---: | ---: | ---: | ---: | ---: |",
    ]
    for stat in context_stats:
        lines.append(
            f"| {stat.comparator.label} | {fmt_pct(stat.yes_group_poor_mental_health_pct)} | {fmt_int(stat.yes_group_n)} | {fmt_pct(stat.no_group_poor_mental_health_pct)} | {fmt_int(stat.no_group_n)} | {fmt_pct(stat.pair_missing_pct)} |"
        )
    return lines


def subgroup_stat_lookup(
    rows: list[dict[str, str]],
    group_field: str,
    group_value: str,
    indicator_field: str,
) -> BinaryStat:
    return compute_binary_stat(rows, indicator_field, group_field=group_field, group_value=group_value)


def build_takeaways(
    rows: list[dict[str, str]],
    scorecard_stats: dict[str, BinaryStat],
    context_stats: dict[str, ContextStat],
) -> list[str]:
    female_poor_mental_health = subgroup_stat_lookup(rows, "Q2_label", "Female", "QN84").weighted_yes_pct
    male_poor_mental_health = subgroup_stat_lookup(rows, "Q2_label", "Male", "QN84").weighted_yes_pct
    female_activity = subgroup_stat_lookup(rows, "Q2_label", "Female", "QN76").weighted_yes_pct
    male_activity = subgroup_stat_lookup(rows, "Q2_label", "Male", "QN76").weighted_yes_pct
    ninth_grade_marijuana = subgroup_stat_lookup(rows, "Q3_label", "9th grade", "QN48").weighted_yes_pct
    twelfth_grade_marijuana = subgroup_stat_lookup(rows, "Q3_label", "12th grade", "QN48").weighted_yes_pct
    ninth_grade_tobacco = subgroup_stat_lookup(rows, "Q3_label", "9th grade", "QNTB4").weighted_yes_pct
    twelfth_grade_tobacco = subgroup_stat_lookup(rows, "Q3_label", "12th grade", "QNTB4").weighted_yes_pct
    school_bullying = context_stats["QN24"]
    sleep = context_stats["QN85"]
    school_connectedness = context_stats["QN103"]
    unstable_housing = context_stats["QN86"]

    return [
        (
            f"- The weighted headline profile shows {fmt_pct(scorecard_stats['QN26'].weighted_yes_pct)} sad or hopelessness "
            f"and {fmt_pct(scorecard_stats['QN84'].weighted_yes_pct)} poor current mental health."
        ),
        (
            f"- Daily-health benchmarks are relatively low: only {fmt_pct(scorecard_stats['QN85'].weighted_yes_pct)} got "
            f"8+ hours of sleep and {fmt_pct(scorecard_stats['QNBK7DAY'].weighted_yes_pct)} ate breakfast on all 7 days."
        ),
        (
            f"- The sex gap is pronounced: poor current mental health is {fmt_pct(female_poor_mental_health)} among female "
            f"students versus {fmt_pct(male_poor_mental_health)} among male students, while the activity benchmark is "
            f"{fmt_pct(female_activity)} versus {fmt_pct(male_activity)}."
        ),
        (
            f"- Substance use rises with grade in this first profile: current marijuana use increases from "
            f"{fmt_pct(ninth_grade_marijuana)} in 9th grade to {fmt_pct(twelfth_grade_marijuana)} in 12th grade, and "
            f"current tobacco or EVP use rises from {fmt_pct(ninth_grade_tobacco)} to {fmt_pct(twelfth_grade_tobacco)}."
        ),
        (
            f"- The clearest poor-mental-health gaps in this first pass appear around school bullying "
            f"({fmt_pct(school_bullying.yes_group_poor_mental_health_pct)} vs {fmt_pct(school_bullying.no_group_poor_mental_health_pct)}), "
            f"sleep duration ({fmt_pct(sleep.no_group_poor_mental_health_pct)} vs {fmt_pct(sleep.yes_group_poor_mental_health_pct)} for students sleeping less than vs at least 8 hours), "
            f"and school connectedness ({fmt_pct(school_connectedness.yes_group_poor_mental_health_pct)} vs {fmt_pct(school_connectedness.no_group_poor_mental_health_pct)}). "
            f"The unstable-housing comparison is less decisive here because the `Yes` group is small "
            f"(n={fmt_int(unstable_housing.yes_group_n)}) and pair missingness remains {fmt_pct(unstable_housing.pair_missing_pct)}."
        ),
    ]


def build_markdown(rows: list[dict[str, str]]) -> str:
    total_rows = len(rows)
    sex_counts = count_labels(rows, "Q2_label")
    grade_counts = count_labels(rows, "Q3_label")
    race_counts = count_labels(rows, "RACEETH_label")

    scorecard_stats = {indicator.field: compute_binary_stat(rows, indicator.field) for indicator in INDICATORS}
    context_stats = {
        comparator.field: compute_context_stat(rows, "QN84", comparator)
        for comparator in CONTEXT_COMPARATORS
    }

    qn103_missing_pct = compute_binary_stat(rows, "QN103").missing_pct

    lines = [
        "# Teen Health Profile: YRBS 2023",
        "",
        "This summary broadens the project scope from a single social-media relationship to a multi-domain profile of adolescent health in the 2023 national YRBS.",
        "",
        "## Dataset And Method Notes",
        "",
        f"- Source: readable 2023 YRBS CSV generated in this repository ({fmt_int(total_rows)} student rows).",
        "- Headline prevalences are weighted with `WEIGHT` and use CDC-derived binary indicators where `1 = Yes` and `2 = No`.",
        "- Valid `n` values are unweighted counts of rows with a non-missing indicator and non-missing survey weight.",
        "- Missing percentages count all rows not included in the weighted denominator, so missing values are never folded into the `No` category.",
        "- Main subgroup cuts: sex (`Q2_label`), grade (`Q3_label`), and race/ethnicity (`RACEETH_label`).",
        f"- The main grade comparison excludes `Ungraded or other grade` (raw n={fmt_int(grade_counts.get('Ungraded or other grade', 0))}).",
        f"- The main race/ethnicity comparison excludes `Native Hawaiian/Other PI` because the raw subgroup is small (raw n={fmt_int(race_counts.get('Native Hawaiian/Other PI', 0))}).",
        "",
        f"- Sex counts: {format_count_summary(sex_counts, SEX_ORDER)}",
        f"- Grade counts: {format_count_summary(grade_counts, GRADE_ORDER + ['Ungraded or other grade'])}",
        f"- Race/ethnicity counts: {format_count_summary(race_counts, RACE_ORDER + ['Am Indian/Alaska Native', 'Native Hawaiian/Other PI'])}",
        "",
        "## Core Scorecard",
        "",
        *format_scorecard_table(INDICATORS, scorecard_stats),
        "",
        "## Subgroup Comparisons",
        "",
        "The subgroup tables use a smaller cross-domain set of indicators to keep the main comparison view readable.",
        "",
        "### Sex",
        "",
        *format_subgroup_table(rows, "Q2_label", SEX_ORDER, SUBGROUP_INDICATOR_FIELDS),
        "",
        "### Grade",
        "",
        *format_subgroup_table(rows, "Q3_label", GRADE_ORDER, SUBGROUP_INDICATOR_FIELDS),
        "",
        "### Race / Ethnicity",
        "",
        *format_subgroup_table(rows, "RACEETH_label", RACE_ORDER, SUBGROUP_INDICATOR_FIELDS),
        "",
        "## Poor Mental Health Context",
        "",
        "- This table shows weighted poor-mental-health prevalence (`QN84`) within each comparison group.",
        f"- `QN103` has relatively high missingness in this dataset ({fmt_pct(qn103_missing_pct)}), so interpret the school-connectedness rows with extra caution.",
        "",
        *format_context_table(list(context_stats.values())),
        "",
        "## Short Takeaways",
        "",
        *build_takeaways(rows, scorecard_stats, context_stats),
    ]
    return "\n".join(lines) + "\n"


def main() -> None:
    args = parse_args()
    input_path = require_file(args.input)
    rows = read_rows(input_path)
    markdown = build_markdown(rows)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(markdown, encoding="utf-8")


if __name__ == "__main__":
    main()
