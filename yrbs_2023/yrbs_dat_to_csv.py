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
VARIABLE_LABEL_RE = re.compile(r'^(\w+)="((?:[^"]|"")*)"$')


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
        description="Convert YRBS fixed-width DAT data into raw and readable CSV exports."
    )
    parser.add_argument("--dat", required=True, type=Path, help="Path to the fixed-width .dat file.")
    parser.add_argument(
        "--input-sas",
        required=True,
        type=Path,
        help="Path to the SAS input program that defines field positions and variable labels.",
    )
    parser.add_argument(
        "--formats-sas",
        required=True,
        type=Path,
        help="Path to the SAS formats program that defines categorical value labels.",
    )
    parser.add_argument("--output", required=True, type=Path, help="Path to the raw data CSV.")
    parser.add_argument(
        "--readable-output",
        required=True,
        type=Path,
        help="Path to the readable CSV with decoded label columns.",
    )
    parser.add_argument(
        "--labels-output",
        type=Path,
        help="Optional path to the long-form value-label lookup CSV.",
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


def parse_variable_labels(path: Path) -> dict[str, str]:
    lines = path.read_text(encoding="utf-8").splitlines()
    in_block = False
    labels: dict[str, str] = {}

    for raw_line in lines:
        stripped = raw_line.strip()
        if not in_block:
            if stripped.lower() == "label":
                in_block = True
            continue

        if stripped == ";":
            break
        if not stripped:
            continue

        match = VARIABLE_LABEL_RE.match(stripped)
        if match is None:
            raise ValueError(f"Malformed variable label line in {path}: {raw_line.rstrip()}")

        labels[match.group(1).upper()] = unescape_sas_text(match.group(2))

    if not labels:
        raise ValueError(f"Could not find a variable label block in {path}")

    return labels


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


def build_raw_header(fields: list[FieldSpec]) -> list[str]:
    return [field.name for field in fields]


def build_raw_row(record: str, fields: list[FieldSpec], line_number: int) -> list[str]:
    return [parse_raw_value(record, field, line_number) for field in fields]


def build_readable_header(
    fields: list[FieldSpec],
    format_assignments: dict[str, str],
) -> list[str]:
    header: list[str] = []
    for field in fields:
        header.append(field.name)
        if field.name in format_assignments:
            header.append(f"{field.name}_label")
    return header


def build_readable_row(
    record: str,
    fields: list[FieldSpec],
    line_number: int,
    format_assignments: dict[str, str],
    formats: dict[str, ValueFormat],
) -> list[str]:
    row: list[str] = []
    for field in fields:
        raw_value = parse_raw_value(record, field, line_number)
        row.append(raw_value)
        format_name = format_assignments.get(field.name)
        if format_name:
            value_label = formats[format_name].values.get(raw_value, "")
            row.append(value_label)
    return row


def write_raw_data_csv(dat_path: Path, fields: list[FieldSpec], output_path: Path) -> int:
    expected_record_length = max(field.end for field in fields)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    row_count = 0

    with dat_path.open("r", encoding="utf-8", errors="replace", newline="") as dat_file:
        with output_path.open("w", encoding="utf-8", newline="") as output_file:
            writer = csv.writer(output_file)
            writer.writerow(build_raw_header(fields))

            for line_number, raw_line in enumerate(dat_file, start=1):
                record = raw_line.rstrip("\r\n")
                if len(record) < expected_record_length:
                    raise ValueError(
                        f"Record on line {line_number} is shorter than expected "
                        f"({len(record)} < {expected_record_length})"
                    )
                writer.writerow(build_raw_row(record[:expected_record_length], fields, line_number))
                row_count += 1

    return row_count


def write_readable_data_csv(
    dat_path: Path,
    fields: list[FieldSpec],
    format_assignments: dict[str, str],
    formats: dict[str, ValueFormat],
    output_path: Path,
) -> int:
    expected_record_length = max(field.end for field in fields)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    row_count = 0

    with dat_path.open("r", encoding="utf-8", errors="replace", newline="") as dat_file:
        with output_path.open("w", encoding="utf-8", newline="") as output_file:
            writer = csv.writer(output_file)
            writer.writerow(build_readable_header(fields, format_assignments))

            for line_number, raw_line in enumerate(dat_file, start=1):
                record = raw_line.rstrip("\r\n")
                if len(record) < expected_record_length:
                    raise ValueError(
                        f"Record on line {line_number} is shorter than expected "
                        f"({len(record)} < {expected_record_length})"
                    )
                writer.writerow(
                    build_readable_row(
                        record=record[:expected_record_length],
                        fields=fields,
                        line_number=line_number,
                        format_assignments=format_assignments,
                        formats=formats,
                    )
                )
                row_count += 1

    return row_count


def write_labels_lookup_csv(
    fields: list[FieldSpec],
    format_assignments: dict[str, str],
    formats: dict[str, ValueFormat],
    variable_labels: dict[str, str],
    output_path: Path,
) -> int:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    lookup_count = 0

    with output_path.open("w", encoding="utf-8", newline="") as output_file:
        writer = csv.writer(output_file)
        writer.writerow(["variable", "question_label", "format_name", "raw_value", "value_label"])

        for field in fields:
            format_name = format_assignments.get(field.name)
            if not format_name:
                continue

            question_label = variable_labels.get(field.name)
            if question_label is None:
                raise ValueError(f"Missing variable label for formatted field {field.name}")

            for raw_value, value_label in formats[format_name].values.items():
                writer.writerow([field.name, question_label, format_name, raw_value, value_label])
                lookup_count += 1

    return lookup_count


def export_yrbs(
    dat_path: Path,
    input_sas_path: Path,
    formats_sas_path: Path,
    output_path: Path,
    readable_output_path: Path,
    labels_output_path: Path | None,
) -> tuple[int, int, int, int, int]:
    fields = parse_input_fields(input_sas_path)
    formats = parse_value_formats(formats_sas_path)
    format_assignments = parse_format_assignments(input_sas_path, set(formats))
    variable_labels = parse_variable_labels(input_sas_path)

    raw_row_count = write_raw_data_csv(dat_path, fields, output_path)
    readable_row_count = write_readable_data_csv(
        dat_path=dat_path,
        fields=fields,
        format_assignments=format_assignments,
        formats=formats,
        output_path=readable_output_path,
    )
    lookup_row_count = 0
    if labels_output_path is not None:
        lookup_row_count = write_labels_lookup_csv(
            fields=fields,
            format_assignments=format_assignments,
            formats=formats,
            variable_labels=variable_labels,
            output_path=labels_output_path,
        )

    return raw_row_count, readable_row_count, len(fields), len(format_assignments), lookup_row_count


def main() -> int:
    args = parse_args()

    try:
        dat_path = require_file(args.dat, "DAT input")
        input_sas_path = require_file(args.input_sas, "SAS input program")
        formats_sas_path = require_file(args.formats_sas, "SAS formats program")
        output_paths = [args.output.resolve(), args.readable_output.resolve()]
        if args.labels_output is not None:
            output_paths.append(args.labels_output.resolve())
        if len(output_paths) != len(set(output_paths)):
            raise ValueError("Output paths must all be different files")

        raw_row_count, readable_row_count, field_count, formatted_field_count, lookup_row_count = export_yrbs(
            dat_path=dat_path,
            input_sas_path=input_sas_path,
            formats_sas_path=formats_sas_path,
            output_path=args.output,
            readable_output_path=args.readable_output,
            labels_output_path=args.labels_output,
        )
    except (FileNotFoundError, OSError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    print(
        f"Wrote {raw_row_count} raw rows to {args.output} and "
        f"{readable_row_count} readable rows across {field_count} fields to {args.readable_output}",
        file=sys.stderr,
    )
    if args.labels_output is not None:
        print(
            f"Wrote {lookup_row_count} lookup rows for {formatted_field_count} formatted fields "
            f"to {args.labels_output}",
            file=sys.stderr,
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
