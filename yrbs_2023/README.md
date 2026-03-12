# YRBS 2023 Workspace

This directory contains the 2023 YRBS source files, conversion script, and generated CSV outputs.

## Contents

- `XXH2023_YRBS_Data.dat`: fixed-width YRBS dataset
- `2023XXH-SAS-Input-Program.sas`: field layout and variable labels
- `2023XXH-Formats-Program.sas`: value-to-label mappings
- `2023XXH-SPSS.sps`: SPSS import syntax
- `2023_National_YRBS_Data_Users_Guide508.pdf`: source documentation
- `yrbs_dat_to_csv.py`: converter script
- `yrbs2023_raw.csv`: raw coded export
- `yrbs2023_readable.csv`: readable export with `*_label` columns

## Usage

Run from this directory:

```bash
python3 yrbs_dat_to_csv.py \
  --dat XXH2023_YRBS_Data.dat \
  --input-sas 2023XXH-SAS-Input-Program.sas \
  --formats-sas 2023XXH-Formats-Program.sas \
  --output yrbs2023_raw.csv \
  --readable-output yrbs2023_readable.csv \
  --labels-output yrbs2023_value_labels.csv
```

If you do not need the lookup table, omit `--labels-output`.

## Outputs

- `yrbs2023_raw.csv`: preserves original survey codes
- `yrbs2023_readable.csv`: keeps raw values and adds decoded label columns where mappings exist
- `yrbs2023_value_labels.csv`: optional lookup table for coded variables

## Notes

- The converter uses only Python's standard library.
- Paths in the command above are relative to this directory.
- Generated caches and CSV artifacts are covered by the local `.gitignore`.
