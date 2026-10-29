"""
Convert pre-2015 DIP polling station CSVs (2007, 2011) to the modern layout.

DIP's archive files for 2007 and 2011 differ from 2015+ ones: party columns are
named "LIST, Nositelj liste: NAME", there is a second header row of list numbers,
there is no county column, and 2007 has no constituency column. This script
rewrites the regular polling station files (constituencies I-XI) into the
2015+ layout so transform_election_data.py can process them unchanged.

Input:  public/data/elections/csvs/<year>/source/*_Redovita_BM.csv (as unzipped from DIP)
Output: public/data/elections/csvs/<year>/<NN>_00_rezultati.csv

Usage:
    python scripts/convert_legacy_csv.py <year>

Example:
    python scripts/convert_legacy_csv.py 2011
"""

import csv
import re
import sys
from pathlib import Path

CSV_ROOT = Path("public/data/elections/csvs")

# County reference: constituency borders were unchanged 1999-2023, so 2015 data
# gives the county for every (constituency, municipality) pair
COUNTY_REFERENCE_YEAR = '2015'

ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']

MODERN_HEADERS = [
    'Rbr IJ', 'Naziv izborne jedinice', 'Rbr.županije', 'Županija', 'Oznaka Gr/Op/Dr',
    'Grad/općina/država', 'Rbr BM', 'Naziv BM', 'Lokacija BM', 'Adresa BM',
    'Ukupno birača', 'Glasovalo birača', 'Glasovalo birača (po listićima)',
    'Važeći listići', 'Nevažeći listići',
]

# transform_election_data.py expects each party column to be followed by 14 candidate columns
CANDIDATE_COLUMNS = 14


def name_keys(name):
    """Keys for matching a municipality name across years, most specific first.

    Handles bilingual Istrian names ('BALE - VALLE' vs 'BALE'), spacing and
    punctuation differences ('ZLATAR-BISTRICA' vs 'ZLATAR BISTRICA') and
    qualifiers ('OTOK (VINKOVCI)').
    """
    def letters(s):
        return re.sub(r'[^A-ZČĆŽŠĐ]', '', s.upper())

    keys = [letters(name), letters(re.split(r' - |\(', name)[0]), letters(name.split()[0] if name.split() else '')]
    return [k for k in dict.fromkeys(keys) if k]


def load_county_lookup():
    """Map (constituency number, municipality name key) -> county from reference year CSVs."""
    lookup = {}
    for f in sorted((CSV_ROOT / COUNTY_REFERENCE_YEAR).glob('*_rezultati.csv')):
        with open(f, encoding='cp1250', newline='') as fh:
            for row in csv.DictReader(fh, delimiter=';'):
                const = row['Naziv izborne jedinice'].split('.')[0].strip()
                muni = row['Grad/općina/država']
                if const and muni:
                    for key in name_keys(muni):
                        lookup.setdefault((const, key), row['Županija'])
    return lookup


def find_county(lookup, const, muni):
    for key in name_keys(muni):
        if (const, key) in lookup:
            return lookup[(const, key)]
    return ''


def clean_party_header(header):
    """'HDZ - HRVATSKA ..., Nositelj liste: IVO SANADER' -> 'HDZ - HRVATSKA ...'"""
    header = re.split(r',?\s*Nositelj liste\s*:', header, flags=re.IGNORECASE)[0]
    return ' '.join(header.split()).rstrip(' ,')


def parse_int(value):
    """Parse a vote count, allowing '12.636' style thousands separators."""
    value = value.strip().replace('.', '').replace(' ', '')
    return int(value) if value.isdigit() else 0


def find_column(headers, *candidates):
    for i, h in enumerate(headers):
        h_lower = ' '.join(h.lower().split())
        if any(c in h_lower for c in candidates):
            return i
    return None


def convert_file(src, const_num, county_lookup):
    """Convert one regular polling station file. Returns (rows, unmatched municipality names)."""
    roman = ROMAN[const_num - 1]
    with open(src, encoding='cp1250', newline='') as fh:
        rows = list(csv.reader(fh, delimiter=';'))

    headers = rows[0]
    muni_col = find_column(headers, 'grad / opć', 'grad/opć', 'država')
    bm_col = find_column(headers, 'bm rbr', 'redni broj')
    bm_name_col = find_column(headers, 'bm naziv')
    bm_loc_col = find_column(headers, 'bm lokacija')
    bm_addr_col = find_column(headers, 'bm adresa')
    voters_col = find_column(headers, 'ukupno birača')
    cast_col = find_column(headers, 'glasovalo ukupno')
    ballots_col = find_column(headers, 'glasovalo (prema')
    valid_col = find_column(headers, 'listići važeći')
    invalid_col = find_column(headers, 'listići nevažeći')

    party_cols = [(i, clean_party_header(h)) for i, h in enumerate(headers)
                  if i > invalid_col and h.strip()]

    out_headers = list(MODERN_HEADERS)
    for _, party in party_cols:
        out_headers.append(party)
        out_headers.extend([''] * CANDIDATE_COLUMNS)

    def cell(row, i):
        return row[i].strip() if i is not None and i < len(row) else ''

    out_rows = []
    unmatched = set()
    for row in rows[1:]:
        muni = ' '.join(cell(row, muni_col).split())
        if not muni:
            continue  # list number row and blank separator rows
        if re.search(r'\bZA [IVX]+\. ?IJ', muni):
            continue  # 2007 per-constituency total rows ("UKUPNO ZA I. IJ", "POSEBNA BM ZA I. IJ")

        county = find_county(county_lookup, roman, muni)
        if not county and roman != 'XI':
            unmatched.add(muni)

        out = [
            f'{const_num:03d}', f'{roman}. IZBORNA JEDINICA', '', county, '', muni,
            cell(row, bm_col), cell(row, bm_name_col), cell(row, bm_loc_col), cell(row, bm_addr_col),
            parse_int(cell(row, voters_col)), parse_int(cell(row, cast_col)),
            parse_int(cell(row, ballots_col)), parse_int(cell(row, valid_col)),
            parse_int(cell(row, invalid_col)),
        ]
        for i, _ in party_cols:
            out.append(parse_int(cell(row, i)))
            out.extend([''] * CANDIDATE_COLUMNS)
        out_rows.append(out)

    return [out_headers] + out_rows, unmatched


def main():
    if len(sys.argv) < 2:
        print("Usage: python convert_legacy_csv.py <year>")
        sys.exit(1)

    year = sys.argv[1]
    source_dir = CSV_ROOT / year / 'source'
    out_dir = CSV_ROOT / year

    county_lookup = load_county_lookup()

    for src in sorted(source_dir.glob('*.csv')):
        # Regular polling stations of constituencies I-XI: "01_I_izborna_jedinica_Redovita_BM.csv"
        match = re.match(r'(\d{2})_[IVX]+_izborna_jedinica_redovita_bm\.csv$', src.name, re.IGNORECASE)
        if not match or int(match.group(1)) > 11:
            continue

        const_num = int(match.group(1))
        rows, unmatched = convert_file(src, const_num, county_lookup)

        out_file = out_dir / f'{const_num:02d}_00_rezultati.csv'
        with open(out_file, 'w', encoding='cp1250', newline='') as fh:
            csv.writer(fh, delimiter=';').writerows(rows)

        print(f"{src.name} -> {out_file.name}: {len(rows) - 1} polling stations")
        if unmatched:
            print(f"  No county found for: {', '.join(sorted(unmatched))}")


if __name__ == '__main__':
    main()
