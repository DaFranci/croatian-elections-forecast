"""
Convert pre-2015 DIP polling station CSVs (2003, 2007, 2011) to the modern layout.

DIP's archive files for 2007 and 2011 differ from 2015+ ones: party columns are
named "LIST, Nositelj liste: NAME", there is a second header row of list numbers,
there is no county column, and 2007 has no constituency column. This script
rewrites the polling station files into the 2015+ layout so
transform_election_data.py can process them unchanged:

  constituencies I-XI, regular stations   -> <NN>_00_rezultati.csv
  stations abroad for I-X                 -> <NN>_00_rezultati_inozemstvo.csv
  special stations, diaspora voting in RH -> <NN>_00_rezultati_posebna.csv
  minority constituency XII, group <G>    -> <G>3_12_rezultati.csv (all stations)

2003 has no separate files: each constituency file has one combined row for
diaspora and mixed stations (and V. one for displaced persons), which goes to
the _posebna file.

Input:  data/elections/csvs/<year>/source/ (polling station CSVs from DIP)

Usage:
    python scripts/convert_legacy_csv.py <year>

Example:
    python scripts/convert_legacy_csv.py 2011
"""

import csv
import re
import sys
from pathlib import Path

CSV_ROOT = Path("data/elections/csvs")

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

# Source file kinds -> output file suffix
#   2007: Redovita_BM, Posebna_BM, BM_u_inozemstvu, BM_u_RH (XI voting in Croatia)
#   2011: REDOVITA_BM, POSEBNA_BM, BM_INOZEMSTVO, DIJASPORA_U_RH
#   2003: "I izborna jedinica_IJ01 po BM.csv", "XII izborna jedinica - 1_IJ12-1 po BM.csv"
FILE_KINDS = {
    'redovita_bm': '',
    'posebna_bm': '_posebna',
    'bm_u_inozemstvu': '_inozemstvo',
    'bm_inozemstvo': '_inozemstvo',
    'bm_u_rh': '_posebna',
    'dijaspora_u_rh': '_posebna',
}

# 2003 rows not tied to a municipality: combined diaspora/mixed stations, displaced persons
NON_MUNICIPAL_ROWS = ('DIJASPORA I MJEŠOVITA', 'DIJASPORA  I MJEŠOVITA', 'PROGNANICI')


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
    """Strip the list leader from a party column header.

    2007/2011: 'HRVATSKA ... - HDZ, Nositelj liste: IVO SANADER' -> 'HRVATSKA ... - HDZ'
    2003:      'AKCIJA ... - ASH, IVAN ŠPIKA - Nositelj liste'  -> 'AKCIJA ... - ASH'
    """
    header = ' '.join(header.split())
    if re.search(r'-\s*Nositelj liste\s*$', header, flags=re.IGNORECASE):
        segments = [s.strip() for s in re.sub(r'\s*-\s*Nositelj liste\s*$', '', header,
                                              flags=re.IGNORECASE).split(',')]
        # Drop academic titles after the leader's name ('dipl.ing.', 'dr.med.'), then the name
        while len(segments) > 1 and not has_uppercase_word(segments[-1]):
            segments.pop()
        leader = segments.pop() if len(segments) > 1 else ''
        lists = ', '.join(segments)
    else:
        parts = re.split(r',?\s*Nositelj liste\s*:', header, maxsplit=1, flags=re.IGNORECASE)
        lists = parts[0]
        leader = parts[1].split(',')[0] if len(parts) > 1 else ''

    lists = re.sub(r'^Predlagatelji:\s*', '', lists).strip(' ,')

    # Independent lists differ only by leader; keep it, as 2015+ files do ('NEOVISNA LISTA - IVO IVIĆ')
    if lists in ('NEOVISNA LISTA', 'NEZAVISNA LISTA') and leader:
        name = ' '.join(w for w in leader.split() if not any(c.islower() for c in w))  # drop 'dr.sc.', 'mr.'
        return f'{lists} - {name}'
    return lists


def clean_candidate_header(header):
    """Minority candidate column -> candidate name, as in 2015+ files.

    2007/2011: 'Kandidat: JOVAN AJDUKOVIĆ, dipl. pravnik, Zamjenik: ..., Predlagatelj: ...'
    2003:      'kandidat:   KSENIJA ALEKSIĆ-AMBROZICH, zamjenik: ..., SRPSKA NARODNA STRANKA - SNS'
    """
    match = re.search(r'kandidat:\s*([^,]+)', header, flags=re.IGNORECASE)
    return ' '.join((match.group(1) if match else header).split())


def has_uppercase_word(text):
    """True if text contains an all-caps word, i.e. a name rather than a title like 'dipl.ing.'"""
    return any(w.isupper() and sum(c.isalpha() for c in w) > 1 for w in text.split())


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


def convert_file(src, const_num, county_lookup, minority=False, regular=True):
    """
    Convert one polling station file.
    Returns (rows, non-municipal rows, unmatched municipality names). Minority files keep
    every row and have one column per candidate instead of party + candidate columns.
    Only regular stations get a county; special and abroad stations aren't on the map.
    """
    roman = 'XII' if minority else ROMAN[const_num - 1]
    with open(src, encoding='cp1250', newline='') as fh:
        rows = list(csv.reader(fh, delimiter=';'))

    headers = rows[0]
    muni_col = find_column(headers, 'grad / opć', 'grad/opć', 'grad/ opć', 'država')
    bm_col = find_column(headers, 'bm rbr', 'redni broj', 'broj biračkog mjesta')
    bm_name_col = find_column(headers, 'bm naziv')
    bm_loc_col = find_column(headers, 'bm lokacija')
    bm_addr_col = find_column(headers, 'bm adresa')
    voters_col = find_column(headers, 'ukupno birača', 'broj birača')
    cast_col = find_column(headers, 'glasovalo ukupno', 'glasovalo birača')
    ballots_col = find_column(headers, 'glasovalo (prema', 'listići ukupno')
    if ballots_col is None:
        ballots_col = cast_col  # 2003 has no separate ballot count
    valid_col = find_column(headers, 'listići važeći', 'važećih listića')
    invalid_col = find_column(headers, 'listići nevažeći', 'nevažećih listića')

    clean_header = clean_candidate_header if minority else clean_party_header
    padding = 0 if minority else CANDIDATE_COLUMNS
    party_cols = [(i, clean_header(h)) for i, h in enumerate(headers)
                  if i > invalid_col and h.strip()]

    out_headers = list(MODERN_HEADERS)
    for _, party in party_cols:
        out_headers.append(party)
        out_headers.extend([''] * padding)

    def cell(row, i):
        return row[i].strip() if i is not None and i < len(row) else ''

    out_rows = []
    non_municipal = []
    unmatched = set()
    for row in rows[1:]:
        muni = ' '.join(cell(row, muni_col).split())
        if not muni:
            continue  # list number row and blank separator rows
        if muni.upper().startswith('UKUPNO') or re.search(r'\bZA [IVX]+\. ?IJ', muni):
            continue  # total rows ("UKUPNO ZA I. IJ", "UKUPNO INOZEMSTVO ZA I. IJ.")
        if muni.endswith('Total'):
            continue  # 2003 subtotal rows

        is_municipal = not muni.startswith(NON_MUNICIPAL_ROWS)
        needs_county = regular and is_municipal and not minority
        county = find_county(county_lookup, roman, muni) if needs_county else ''
        if needs_county and not county and roman != 'XI':
            unmatched.add(muni)

        out = [
            f'{12 if minority else const_num:03d}', f'{roman}. IZBORNA JEDINICA', '', county, '', muni,
            cell(row, bm_col), cell(row, bm_name_col), cell(row, bm_loc_col), cell(row, bm_addr_col),
            parse_int(cell(row, voters_col)), parse_int(cell(row, cast_col)),
            parse_int(cell(row, ballots_col)), parse_int(cell(row, valid_col)),
            parse_int(cell(row, invalid_col)),
        ]
        for i, _ in party_cols:
            out.append(parse_int(cell(row, i)))
            out.extend([''] * padding)
        (out_rows if is_municipal or minority else non_municipal).append(out)

    return [out_headers] + out_rows, [out_headers] + non_municipal, unmatched


def main():
    if len(sys.argv) < 2:
        print("Usage: python convert_legacy_csv.py <year>")
        sys.exit(1)

    year = sys.argv[1]
    source_dir = CSV_ROOT / year / 'source'
    out_dir = CSV_ROOT / year

    county_lookup = load_county_lookup()

    outputs = {}  # output file name -> rows (special stations can come from several sources)
    for src in sorted(source_dir.glob('*.csv')):
        match = (re.match(r'(\d{2})_[IVX]+_izborna_jedinica_(\w+?)\.csv$', src.name)
                 or re.match(r'12_XII_nm(\d)_izborna_jedinica_(\w+?)\.csv$', src.name)
                 or re.match(r'[IVX]+ izborna jedinica_IJ(\d{2}) po BM\s*\.csv$', src.name)
                 or re.match(r'XII izborna jedinica - (\d)_IJ12-\d po BM\s*\.csv$', src.name))
        if not match:
            continue
        kind = match.group(2).lower() if match.lastindex == 2 else 'redovita_bm'
        if kind not in FILE_KINDS:
            continue  # per-municipality and per-country summaries ("Gradovi-opcine", "DRZAVE")

        minority = src.name.startswith(('12_XII', 'XII '))
        num = int(match.group(1))
        if not minority and num > 11:
            continue
        rows, non_municipal, unmatched = convert_file(src, num, county_lookup, minority, FILE_KINDS[kind] == '')

        if minority:
            # One file per minority group; regular, special and abroad stations all count
            name = f'{num}3_12_rezultati.csv'
        else:
            name = f'{num:02d}_00_rezultati{FILE_KINDS[kind]}.csv'
            if len(non_municipal) > 1:
                outputs.setdefault(f'{num:02d}_00_rezultati_posebna.csv', [non_municipal[0]]).extend(non_municipal[1:])
        outputs.setdefault(name, [rows[0]]).extend(rows[1:])

        print(f"{src.name} -> {name}: {len(rows) - 1} polling stations"
              + (f", {len(non_municipal) - 1} non-municipal rows" if len(non_municipal) > 1 else ''))
        if unmatched:
            print(f"  No county found for: {', '.join(sorted(unmatched))}")

    for name, rows in outputs.items():
        with open(out_dir / name, 'w', encoding='cp1250', newline='') as fh:
            csv.writer(fh, delimiter=';').writerows(rows)


if __name__ == '__main__':
    main()
