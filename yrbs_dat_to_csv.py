#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import re
import sys
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from pathlib import Path


INPUT_LINE_RE = re.compile(r"^@(?P<start>\d+)\s+(?P<name>\w+)\s+(?P<spec>[^;\s]+)$")
FORMAT_BLOCK_RE = re.compile(r'^value\s+(\$?\w+)\s*$', re.IGNORECASE)
FORMAT_ASSIGNMENT_RE = re.compile(r"([A-Za-z][A-Za-z0-9_]*)\s+([\$A-Za-z0-9]+)\.")
FORMAT_VALUE_RE = re.compile(r'^"((?:[^"]|"")*)"\s*=\s*"((?:[^"]|"")*)"\s*$')
FORMAT_OTHER_RE = re.compile(r'^other\s*=\s*"((?:[^"]|"")*)"\s*$', re.IGNORECASE)


@dataclass(frozen=True)
class FieldSpec:
    name: str
    start: int
    width: int
    is_char: bool
    decimals: int

    @property
    def end(self) -> int:
        return self.start + self.width - 1


@dataclass(frozen=True)
class ValueFormat:
    name: str
    values: dict[str, str]
    other: str | None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert YRBS fixed-width DAT data to a readable CSV using SAS layout files."
    )
    parser.add_argument("--dat", required=True, type=Path, help="Path to the fixed-width .dat file.")
    parser.add_argument(
        "--input-sas",
        required=True,
        type=Path,
        help="Path to the SAS input program that defines field positions.",
    )
    parser.add_argument(
        "--formats-sas",
        required=True,
        type=Path,
        help="Path to the SAS formats program that defines categorical labels.",
    )
    parser.add_argument("--output", required=True, type=Path, help="Path to the output CSV.")
    parser.add_argument(
        "--decode-mode",
        default="both",
        choices=("both", "raw", "labels"),
        help="Output raw values only, decoded labels only, or both (default: both).",
    )
    return parser.parse_args()


def require_file(path: Path, description: str) -> Path:
    if not path.exists():
        raise FileNotFoundError(f"Missing {description}: {path}")
    if not path.is_file():
        raise FileNotFoundError(f"{description} is not a file: {path}")
    return path


def parse_field_token(token: str) -> tuple[int, bool, int]:
    match = re.fullmatch(r"(?P<char>\$)?(?P<width>\d+)(?:\.(?P<decimals>\d*))?\.?", token)
    if match is None:
        raise ValueError(f"Unsupported field token: {token}")

    width = int(match.group("width"))
    is_char = match.group("char") is not None
    decimals_text = match.group("decimals")
    decimals = int(decimals_text) if decimals_text else 0
    return width, is_char, decimals


def parse_input_fields(path: Path) -> list[FieldSpec]:
    lines = path.read_text(encoding="utf-8").splitlines()
    in_block = False
    fields: list[FieldSpec] = []

    for raw_line in lines:
        stripped = raw_line.strip()
        if not in_block:
            if stripped.lower() == "input":
                in_block = True
            continue

        if stripped == ";":
            break
        if not stripped:
            continue

        match = INPUT_LINE_RE.match(stripped)
        if match is None:
            raise ValueError(f"Malformed input field line in {path}: {raw_line.rstrip()}")

        width, is_char, decimals = parse_field_token(match.group("spec"))
        fields.append(
            FieldSpec(
                name=match.group("name").upper(),
                start=int(match.group("start")),
                width=width,
                is_char=is_char,
                decimals=decimals,
            )
        )

    if not fields:
        raise ValueError(f"Could not find an Input block in {path}")

    return sorted(fields, key=lambda field: (field.start, field.name))


def unescape_sas_text(value: str) -> str:
    return value.replace('""', '"')


def parse_value_formats(path: Path) -> dict[str, ValueFormat]:
    formats: dict[str, ValueFormat] = {}
    current_name: str | None = None
    current_lines: list[str] = []

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        stripped = raw_line.strip()
        if not current_name:
            match = FORMAT_BLOCK_RE.match(stripped)
            if match:
                current_name = match.group(1).upper()
                current_lines = []
            continue

        current_lines.append(stripped)
        if not stripped.endswith(";"):
            continue

        values: dict[str, str] = {}
        other: str | None = None
        for line in current_lines:
            candidate = line.rstrip(";").strip()
            if not candidate:
                continue

            other_match = FORMAT_OTHER_RE.match(candidate)
            if other_match:
                other = unescape_sas_text(other_match.group(1))
                continue

            value_match = FORMAT_VALUE_RE.match(candidate)
            if value_match:
                key = unescape_sas_text(value_match.group(1))
                value = unescape_sas_text(value_match.group(2))
                values[key] = value
                continue

            raise ValueError(f"Malformed format line in {path} for {current_name}: {line}")

        formats[current_name] = ValueFormat(name=current_name, values=values, other=other)
        current_name = None
        current_lines = []

    if current_name is not None:
        raise ValueError(f"Unterminated format block in {path}: {current_name}")
    if not formats:
        raise ValueError(f"Could not find any SAS value formats in {path}")

    return formats


def parse_format_assignments(path: Path, available_formats: set[str]) -> dict[str, str]:
    lines = path.read_text(encoding="utf-8").splitlines()
    in_block = False
    block_lines: list[str] = []

    for raw_line in lines:
        stripped = raw_line.strip()
        if not in_block:
            if stripped.lower() == "format":
                in_block = True
            continue

        block_lines.append(stripped)
        if stripped == ";":
            break

    if not block_lines or block_lines[-1] != ";":
        raise ValueError(f"Could not find a complete format assignment block in {path}")

    block_text = " ".join(line for line in block_lines[:-1] if line)
    assignments: dict[str, str] = {}
    for variable, format_name in FORMAT_ASSIGNMENT_RE.findall(block_text):
        variable_name = variable.upper()
        normalized_format = format_name.upper()
        if normalized_format in available_formats:
            assignments[variable_name] = normalized_format

    if not assignments:
        raise ValueError(f"Could not match any format assignments in {path}")

    return assignments


def parse_numeric_value(raw_value: str, decimals: int, field_name: str, line_number: int) -> str:
    stripped = raw_value.strip()
    if not stripped or stripped == ".":
        return ""
    if stripped.startswith(".") and stripped[1:].isalpha():
        return ""

    if "." not in stripped and decimals > 0:
        sign = ""
        digits = stripped
        if digits[0] in "+-":
            sign = digits[0]
            digits = digits[1:]
        if not digits.isdigit():
            raise ValueError(
                f"Invalid numeric value for {field_name} on line {line_number}: {raw_value!r}"
            )
        if len(digits) <= decimals:
            digits = digits.zfill(decimals + 1)
        stripped = f"{sign}{digits[:-decimals]}.{digits[-decimals:]}"

    try:
        Decimal(stripped)
    except InvalidOperation as exc:
        raise ValueError(
            f"Invalid numeric value for {field_name} on line {line_number}: {raw_value!r}"
        ) from exc

    return stripped


def parse_raw_value(record: str, field: FieldSpec, line_number: int) -> str:
    raw_value = record[field.start - 1 : field.end]
    if field.is_char:
        return raw_value.strip()
    return parse_numeric_value(raw_value, field.decimals, field.name, line_number)


def decode_value(raw_value: str, value_format: ValueFormat) -> str:
    if raw_value == "":
        return ""
    if raw_value in value_format.values:
        return value_format.values[raw_value]
    return value_format.other or ""


def build_header(
    fields: list[FieldSpec],
    format_assignments: dict[str, str],
    decode_mode: str,
) -> list[str]:
    headers: list[str] = []

    for field in fields:
        has_label = field.name in format_assignments
        if decode_mode == "raw":
            headers.append(field.name)
            continue

        if decode_mode == "labels":
            headers.append(field.name)
            continue

        headers.append(field.name)
        if has_label:
            headers.append(f"{field.name}_label")

    return headers


def build_row(
    record: str,
    fields: list[FieldSpec],
    line_number: int,
    decode_mode: str,
    format_assignments: dict[str, str],
    formats: dict[str, ValueFormat],
) -> list[str]:
    row: list[str] = []
    for field in fields:
        raw_value = parse_raw_value(record, field, line_number)
        format_name = format_assignments.get(field.name)
        label_value = decode_value(raw_value, formats[format_name]) if format_name else ""

        if decode_mode == "raw":
            row.append(raw_value)
            continue

        if decode_mode == "labels":
            row.append(label_value if format_name else raw_value)
            continue

        row.append(raw_value)
        if format_name:
            row.append(label_value)

    return row


def convert_dat_to_csv(
    dat_path: Path,
    input_sas_path: Path,
    formats_sas_path: Path,
    output_path: Path,
    decode_mode: str,
) -> tuple[int, int, int]:
    fields = parse_input_fields(input_sas_path)
    formats = parse_value_formats(formats_sas_path)
    format_assignments = parse_format_assignments(input_sas_path, set(formats))
    expected_record_length = max(field.end for field in fields)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    row_count = 0

    with dat_path.open("r", encoding="utf-8", errors="replace", newline="") as dat_file:
        with output_path.open("w", encoding="utf-8", newline="") as output_file:
            writer = csv.writer(output_file)
            writer.writerow(build_header(fields, format_assignments, decode_mode))

            for line_number, raw_line in enumerate(dat_file, start=1):
                record = raw_line.rstrip("\r\n")
                if len(record) < expected_record_length:
                    raise ValueError(
                        f"Record on line {line_number} is shorter than expected "
                        f"({len(record)} < {expected_record_length})"
                    )
                writer.writerow(
                    build_row(
                        record=record[:expected_record_length],
                        fields=fields,
                        line_number=line_number,
                        decode_mode=decode_mode,
                        format_assignments=format_assignments,
                        formats=formats,
                    )
                )
                row_count += 1

    return row_count, len(fields), len(format_assignments)


def main() -> int:
    args = parse_args()

    try:
        dat_path = require_file(args.dat, "DAT input")
        input_sas_path = require_file(args.input_sas, "SAS input program")
        formats_sas_path = require_file(args.formats_sas, "SAS formats program")
        row_count, field_count, decode_count = convert_dat_to_csv(
            dat_path=dat_path,
            input_sas_path=input_sas_path,
            formats_sas_path=formats_sas_path,
            output_path=args.output,
            decode_mode=args.decode_mode,
        )
    except (FileNotFoundError, OSError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    print(
        f"Wrote {row_count} rows with {field_count} fields "
        f"and {decode_count} decoded columns to {args.output}",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
