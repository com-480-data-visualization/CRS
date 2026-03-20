#!/usr/bin/env python3
from __future__ import annotations

import argparse
from html import escape
from pathlib import Path

from teen_health_profile_analysis import INDICATORS, compute_binary_stat, read_rows


DOMAIN_COLORS = {
    "Mental / Emotional": "#D1495B",
    "Physical Habits / Outcomes": "#2A9D8F",
    "Safety / Support": "#E9A03B",
    "Substance Use": "#457B9D",
}


def parse_args() -> argparse.Namespace:
    script_dir = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(
        description="Generate a simple SVG overview plot from the teen health YRBS summary."
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
        default=script_dir / "teen_health_profile_scorecard.svg",
        help="Path to the SVG plot to generate (default: teen_health_profile_scorecard.svg next to this script).",
    )
    return parser.parse_args()
def render_svg(stats: list[tuple[str, str, float]]) -> str:
    width = 1040
    left_margin = 36
    bar_x = 360
    bar_width = 520
    value_x = 930
    title_y = 42
    subtitle_y = 68
    top_y = 130
    row_height = 28
    bar_height = 16
    domain_header_height = 24
    section_gap = 18
    footer_height = 44

    domain_order: list[str] = []
    for domain, _, _ in stats:
        if domain not in domain_order:
            domain_order.append(domain)

    rows_by_domain: dict[str, list[tuple[str, float]]] = {domain: [] for domain in domain_order}
    for domain, label, value in stats:
        rows_by_domain[domain].append((label, value))

    current_y = top_y
    layout_rows: list[tuple[str, str, float, float]] = []
    for domain in domain_order:
        layout_rows.append((domain, "__header__", 0.0, current_y))
        current_y += domain_header_height
        for label, value in rows_by_domain[domain]:
            layout_rows.append((domain, label, value, current_y))
            current_y += row_height
        current_y += section_gap

    chart_bottom = current_y - section_gap
    height = int(chart_bottom + footer_height)

    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title desc">',
        '  <title id="title">Teen Health Profile Snapshot</title>',
        '  <desc id="desc">Weighted Yes prevalence for twelve adolescent health indicators from the 2023 national Youth Risk Behavior Survey.</desc>',
        f'  <rect x="0" y="0" width="{width}" height="{height}" fill="#FBFAF7"/>',
        f'  <text x="{left_margin}" y="{title_y}" font-family="Helvetica, Arial, sans-serif" font-size="28" font-weight="700" fill="#1F2933">Teen Health Profile Snapshot</text>',
        f'  <text x="{left_margin}" y="{subtitle_y}" font-family="Helvetica, Arial, sans-serif" font-size="15" fill="#52606D">2023 national YRBS. Bars show weighted % of students answering Yes to each binary indicator. Higher is not always better.</text>',
    ]

    axis_y = top_y - 18
    parts.append(
        f'  <line x1="{bar_x}" y1="{axis_y}" x2="{bar_x + bar_width}" y2="{axis_y}" stroke="#9AA5B1" stroke-width="1"/>'
    )
    for tick in range(0, 101, 25):
        tick_x = bar_x + bar_width * tick / 100
        parts.append(
            f'  <line x1="{tick_x:.2f}" y1="{axis_y}" x2="{tick_x:.2f}" y2="{chart_bottom}" stroke="#E4E7EB" stroke-width="1"/>'
        )
        parts.append(
            f'  <text x="{tick_x:.2f}" y="{axis_y - 8}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="11" fill="#7B8794">{tick}%</text>'
        )

    for domain, label, value, y in layout_rows:
        color = DOMAIN_COLORS[domain]
        if label == "__header__":
            parts.append(
                f'  <text x="{left_margin}" y="{y}" font-family="Helvetica, Arial, sans-serif" font-size="14" font-weight="700" fill="{color}">{escape(domain)}</text>'
            )
            continue

        bar_y = y - bar_height + 1
        bar_value_width = bar_width * value / 100
        parts.append(
            f'  <text x="{left_margin}" y="{y}" font-family="Helvetica, Arial, sans-serif" font-size="13" fill="#1F2933">{escape(label)}</text>'
        )
        parts.append(
            f'  <rect x="{bar_x}" y="{bar_y}" width="{bar_width}" height="{bar_height}" rx="7" fill="#E8ECF1"/>'
        )
        parts.append(
            f'  <rect x="{bar_x}" y="{bar_y}" width="{bar_value_width:.2f}" height="{bar_height}" rx="7" fill="{color}"/>'
        )
        parts.append(
            f'  <text x="{value_x}" y="{y}" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="#1F2933">{value:.2f}%</text>'
        )

    parts.append(
        f'  <text x="{left_margin}" y="{height - 18}" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#7B8794">Source: yrbs2023_readable.csv via teen_health_profile_analysis.py and survey weights in WEIGHT.</text>'
    )
    parts.append("</svg>")
    return "\n".join(parts) + "\n"


def main() -> None:
    args = parse_args()
    rows = read_rows(args.input)
    stats = [
        (indicator.domain, indicator.label, compute_binary_stat(rows, indicator.field).weighted_yes_pct)
        for indicator in INDICATORS
    ]
    svg = render_svg(stats)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(svg, encoding="utf-8")


if __name__ == "__main__":
    main()
