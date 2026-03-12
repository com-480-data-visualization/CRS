#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import math
from collections import Counter
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class MissingnessStat:
    field: str
    non_missing: int
    missing: int
    missing_pct: float


@dataclass(frozen=True)
class BinaryAssociation:
    a: int
    b: int
    c: int
    d: int
    n: int
    chi_square: float
    phi: float
    high_social_bad_pct: float
    other_bad_pct: float


def parse_args() -> argparse.Namespace:
    script_dir = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(
        description="Compute a basic social media vs mental health summary for the 2023 YRBS dataset."
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
        default=script_dir / "basic_analysis_summary.md",
        help="Path to the markdown summary to generate (default: basic_analysis_summary.md next to this script).",
    )
    return parser.parse_args()


def require_file(path: Path) -> Path:
    resolved = path.resolve()
    if not resolved.exists() or not resolved.is_file():
        raise FileNotFoundError(f"Input CSV not found: {path}")
    return resolved


def pct(numerator: int, denominator: int) -> float:
    if denominator == 0:
        return 0.0
    return round(100.0 * numerator / denominator, 2)


def fmt_int(value: int) -> str:
    return f"{value:,}"


def read_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        return list(reader)


def compute_missingness(rows: list[dict[str, str]], fields: list[str]) -> list[MissingnessStat]:
    stats: list[MissingnessStat] = []
    total_rows = len(rows)
    for field in fields:
        missing = sum(1 for row in rows if row[field] == "")
        stats.append(
            MissingnessStat(
                field=field,
                non_missing=total_rows - missing,
                missing=missing,
                missing_pct=pct(missing, total_rows),
            )
        )
    return stats


def compute_frequency(rows: list[dict[str, str]], field: str) -> Counter[str]:
    counts: Counter[str] = Counter()
    for row in rows:
        value = row[field]
        if value:
            counts[value] += 1
    return counts


def compute_binary_association(rows: list[dict[str, str]]) -> BinaryAssociation:
    a = b = c = d = 0
    for row in rows:
        qn80 = row["QN80"]
        qn84 = row["QN84"]
        if not qn80 or not qn84:
            continue
        if qn80 == "1" and qn84 == "1":
            a += 1
        elif qn80 == "1" and qn84 == "2":
            b += 1
        elif qn80 == "2" and qn84 == "1":
            c += 1
        elif qn80 == "2" and qn84 == "2":
            d += 1

    n = a + b + c + d
    row1 = a + b
    row2 = c + d
    col1 = a + c
    col2 = b + d
    expected = [
        row1 * col1 / n,
        row1 * col2 / n,
        row2 * col1 / n,
        row2 * col2 / n,
    ]
    observed = [a, b, c, d]
    chi_square = sum((obs - exp) ** 2 / exp for obs, exp in zip(observed, expected) if exp)
    phi = math.sqrt(chi_square / n) if n else 0.0

    return BinaryAssociation(
        a=a,
        b=b,
        c=c,
        d=d,
        n=n,
        chi_square=round(chi_square, 2),
        phi=round(phi, 4),
        high_social_bad_pct=pct(a, row1),
        other_bad_pct=pct(c, row2),
    )


def compute_sex_subgroups(rows: list[dict[str, str]]) -> list[dict[str, str | int | float]]:
    output: list[dict[str, str | int | float]] = []
    for sex in ("Female", "Male"):
        high_total = high_bad = other_total = other_bad = 0
        for row in rows:
            if row["Q2_label"] != sex:
                continue
            qn80 = row["QN80"]
            qn84 = row["QN84"]
            if not qn80 or not qn84:
                continue
            if qn80 == "1":
                high_total += 1
                if qn84 == "1":
                    high_bad += 1
            elif qn80 == "2":
                other_total += 1
                if qn84 == "1":
                    other_bad += 1

        output.append(
            {
                "sex": sex,
                "high_total": high_total,
                "high_bad": high_bad,
                "high_bad_pct": pct(high_bad, high_total),
                "other_total": other_total,
                "other_bad": other_bad,
                "other_bad_pct": pct(other_bad, other_total),
            }
        )
    return output


def format_counter_table(counter: Counter[str], total_rows: int) -> list[str]:
    lines = ["| Category | Count | Percent of all rows |", "| --- | ---: | ---: |"]
    for label, count in counter.most_common():
        lines.append(f"| {label} | {fmt_int(count)} | {pct(count, total_rows):.2f}% |")
    return lines


def format_missingness_table(stats: list[MissingnessStat]) -> list[str]:
    lines = ["| Field | Non-missing | Missing | Missing % |", "| --- | ---: | ---: | ---: |"]
    for stat in stats:
        lines.append(
            f"| {stat.field} | {fmt_int(stat.non_missing)} | {fmt_int(stat.missing)} | {stat.missing_pct:.2f}% |"
        )
    return lines


def format_subgroup_table(rows: list[dict[str, str | int | float]]) -> list[str]:
    lines = [
        "| Sex | Frequent social media n | Poor mental health among frequent users | Other users n | Poor mental health among other users |",
        "| --- | ---: | ---: | ---: | ---: |",
    ]
    for row in rows:
        lines.append(
            f"| {row['sex']} | {fmt_int(int(row['high_total']))} | {row['high_bad_pct']:.2f}% | {fmt_int(int(row['other_total']))} | {row['other_bad_pct']:.2f}% |"
        )
    return lines


def build_markdown(rows: list[dict[str, str]]) -> str:
    total_rows = len(rows)
    missingness = compute_missingness(
        rows,
        ["Q80", "Q84", "QN80", "QN84", "Q2", "Q3"],
    )
    q80_counts = compute_frequency(rows, "Q80_label")
    q84_counts = compute_frequency(rows, "Q84_label")
    sex_counts = compute_frequency(rows, "Q2_label")
    grade_counts = compute_frequency(rows, "Q3_label")
    assoc = compute_binary_association(rows)
    subgroup_rows = compute_sex_subgroups(rows)

    lines = [
        "# Basic Analysis: Social Media and Mental Health in YRBS 2023",
        "",
        "This summary uses the readable 2023 YRBS CSV generated in this repository. All results below are descriptive and unweighted.",
        "",
        "## Dataset Snapshot",
        "",
        f"- Total rows: {fmt_int(total_rows)}",
        "- Main exposure fields: `Q80` / `QN80` (social media use)",
        "- Main outcome fields: `Q84` / `QN84` (current mental health)",
        "- Subgroup fields: `Q2` (sex) and `Q3` (grade)",
        "",
        "## Missingness",
        "",
        *format_missingness_table(missingness),
        "",
        "## Social Media Distribution (`Q80`)",
        "",
        *format_counter_table(q80_counts, total_rows),
        "",
        "## Mental Health Distribution (`Q84`)",
        "",
        *format_counter_table(q84_counts, total_rows),
        "",
        "## Sample Composition",
        "",
        f"- Sex counts: {', '.join(f'{label}={fmt_int(count)}' for label, count in sex_counts.most_common())}",
        f"- Grade counts: {', '.join(f'{label}={fmt_int(count)}' for label, count in grade_counts.most_common())}",
        "",
        "## Binary Association Using CDC-Derived Indicators",
        "",
        "- `QN80 = 1` means the student used social media several times a day.",
        "- `QN84 = 1` means the student reported poor mental health most of the time or always.",
        f"- Valid rows with non-missing `QN80` and `QN84`: {fmt_int(assoc.n)}",
        f"- Poor mental health among frequent social-media users: {assoc.high_social_bad_pct:.2f}%",
        f"- Poor mental health among less frequent users: {assoc.other_bad_pct:.2f}%",
        f"- Chi-square statistic: {assoc.chi_square:.2f}",
        f"- Phi effect size: {assoc.phi:.4f}",
        "",
        "| Group | Poor mental health | Not poor mental health | Total |",
        "| --- | ---: | ---: | ---: |",
        f"| Frequent social media users (`QN80=1`) | {fmt_int(assoc.a)} | {fmt_int(assoc.b)} | {fmt_int(assoc.a + assoc.b)} |",
        f"| Other users (`QN80=2`) | {fmt_int(assoc.c)} | {fmt_int(assoc.d)} | {fmt_int(assoc.c + assoc.d)} |",
        "",
        "## Sex Subgroups",
        "",
        *format_subgroup_table(subgroup_rows),
        "",
        "## Takeaways",
        "",
        "- Frequent social media use is common in this sample, with the largest categories being `Several times a day` and `More than once an hour`.",
        "- In this first-pass descriptive analysis, frequent social-media users report poor mental health more often than other users.",
        "- The difference is present for both female and male students, and the absolute levels are higher among female students.",
        "- This script is intended for milestone feasibility and EDA only; it does not apply survey weights or support causal claims.",
    ]
    return "\n".join(lines) + "\n"


def main() -> int:
    args = parse_args()
    input_path = require_file(args.input)
    rows = read_rows(input_path)

    output_path = args.output.resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(build_markdown(rows), encoding="utf-8")
    print(f"Wrote analysis summary to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
