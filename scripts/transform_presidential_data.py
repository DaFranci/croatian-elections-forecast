"""
Transform DIP presidential election results to JSON for the application.

Each election has two rounds, and each round its own output file:
    public/data/elections/<year>-presidential-<round>.json

Input is DIP's per-polling-station results, one file per round:
    public/data/elections/csvs/presidential/<year>/<round>_krug.(csv|xlsx)
Source: https://www.izbori.hr/arhiva-izbora/data/predsjednik/<year>/zip/rezultati.zip
2005-2014 are CSV (cp1250, ';'), 2019 and 2024 only xlsx.

Usage:
    python scripts/transform_presidential_data.py [year ...]
"""

import csv
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path

from transform_election_data import municipality_id, parse_votes

SOURCE_DIR = Path('public/data/elections/csvs/presidential')
OUTPUT_DIR = Path('public/data/elections')

ELECTIONS = {
    '2005': ('2005-01-02', '2005-01-16'),
    '2009': ('2009-12-27', '2010-01-10'),
    '2014': ('2014-12-28', '2015-01-11'),
    '2019': ('2019-12-22', '2020-01-05'),
    '2024': ('2024-12-29', '2025-01-12'),
}

# Party that nominated or backed each candidate (parties.json ID, for the map colour),
# or a colour of their own; label is shown under the name. Unlisted candidates are drawn
# in the 'Other' colour.
INDEPENDENT = 'Nezavisni kandidat'
CANDIDATES = {
    '2005': {
        'MESIĆ': {'party': 'HNS', 'label': 'Uz potporu SDP-a, HNS-a, HSS-a, IDS-a i drugih'},
        'KOSOR': {'party': 'HDZ', 'label': 'HDZ'},
        'MIKŠIĆ': {'color': '#0EA5E9', 'label': INDEPENDENT},
        'ADLEŠIĆ': {'party': 'HSLS', 'label': 'HSLS'},
        'LETICA': {'color': '#64748B', 'label': INDEPENDENT},
        'PAŠALIĆ': {'color': '#7C2D12', 'label': 'Hrvatski blok'},
    },
    '2009': {
        'JOSIPOVIĆ': {'party': 'SDP', 'label': 'SDP'},
        'BANDIĆ': {'color': '#F59E0B', 'label': INDEPENDENT},
        'HEBRANG': {'party': 'HDZ', 'label': 'HDZ'},
        'VIDOŠEVIĆ': {'color': '#0D9488', 'label': INDEPENDENT},
        'PUSIĆ': {'party': 'HNS', 'label': 'HNS'},
        'PRIMORAC': {'color': '#60A5FA', 'label': INDEPENDENT},
        'TUĐMAN': {'color': '#64748B', 'label': INDEPENDENT},
        'KAJIN': {'color': '#FACC15'},
        'MIKŠIĆ': {'color': '#0EA5E9'},
    },
    '2014': {
        'GRABAR-KITAROVIĆ': {'party': 'HDZ', 'label': 'HDZ'},
        'JOSIPOVIĆ': {'party': 'SDP', 'label': 'SDP'},
        'SINČIĆ': {'party': 'ŽIVI ZID', 'label': 'Živi zid'},
        'KUJUNDŽIĆ': {'color': '#334155'},
    },
    '2019': {
        'MILANOVIĆ': {'party': 'SDP', 'label': 'SDP'},
        'GRABAR-KITAROVIĆ': {'party': 'HDZ', 'label': 'HDZ'},
        'ŠKORO': {'party': 'DP', 'label': INDEPENDENT},
        'KOLAKUŠIĆ': {'party': 'KOLAKUŠIĆ MISLAV', 'label': INDEPENDENT},
        'JURIČAN': {'color': '#0EA5E9', 'label': INDEPENDENT},
        'OREŠKOVIĆ': {'party': 'STRANKA S IMENOM I PREZIMENOM', 'label': 'Stranka s imenom i prezimenom'},
        'PERNAR': {'party': 'STRANKA IVANA PERNARA', 'label': 'Stranka Ivana Pernara'},
        'PEOVIĆ': {'party': 'RF', 'label': 'Radnička fronta'},
        'KOVAČ': {'party': 'HSLS', 'label': 'HSLS'},
    },
    '2024': {
        'MILANOVIĆ': {'party': 'SDP', 'label': 'SDP'},
        'PRIMORAC': {'party': 'HDZ', 'label': 'HDZ'},
        'SELAK RASPUDIĆ': {'color': '#14B8A6', 'label': INDEPENDENT},
        'KEKIN': {'party': 'POLITIČKA PLATFORMA', 'label': 'Možemo!'},
        'JONJIĆ': {'color': '#475569'},
        'BULJ': {'party': 'MOST', 'label': 'Most'},
        'LOZO': {'color': '#7C3AED', 'label': 'DOMiNO'},
    },
}


def read_xlsx_sheets(path):
    """
    All sheets as [(sheet name, rows)], rows as lists of strings (cells by column
    letter, gaps kept). Assumes sheetN.xml are in workbook order, as in DIP's files.
    """
    ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    with zipfile.ZipFile(path) as z:
        shared = []
        if 'xl/sharedStrings.xml' in z.namelist():
            for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', ns):
                shared.append(''.join(t.text or '' for t in si.iter(f'{{{ns["m"]}}}t')))
        names = [s.get('name') for s in ET.fromstring(z.read('xl/workbook.xml')).iter(f'{{{ns["m"]}}}sheet')]
        sheet_files = sorted((n for n in z.namelist() if re.fullmatch(r'xl/worksheets/sheet\d+\.xml', n)),
                             key=lambda n: int(re.search(r'\d+', n.rsplit('/', 1)[1]).group()))
        roots = [ET.fromstring(z.read(n)) for n in sheet_files]

    def column(ref):
        index = 0
        for ch in re.match(r'[A-Z]+', ref).group():
            index = index * 26 + ord(ch) - 64
        return index - 1

    sheets = []
    for name, root in zip(names, roots):
        rows = []
        for row in root.iter(f'{{{ns["m"]}}}row'):
            cells = {}
            for c in row.findall('m:c', ns):
                value = c.find('m:v', ns)
                inline = c.find('m:is', ns)
                if c.get('t') == 's' and value is not None:
                    text = shared[int(value.text)]
                elif inline is not None:
                    text = ''.join(t.text or '' for t in inline.iter(f'{{{ns["m"]}}}t'))
                else:
                    text = value.text if value is not None else ''
                cells[column(c.get('r'))] = text
            if cells:
                rows.append([cells.get(i, '') for i in range(max(cells) + 1)])
        sheets.append((name, rows))
    return sheets


def read_xlsx(path):
    """Rows of the first sheet"""
    return read_xlsx_sheets(path)[0][1]


def read_table(path):
    path = str(path)
    if path.endswith('.xlsx'):
        return read_xlsx(path)
    with open(path, encoding='cp1250', newline='') as f:
        return list(csv.reader(f, delimiter=';'))


def parse_count(value):
    """'1.159' (2005, 2009 thousands separator), '349', '' -> int"""
    value = (value or '').strip().replace('.', '')
    return int(value) if value.isdigit() else 0


def candidate_name(header):
    """
    'prof.dr.sc. IVO JOSIPOVIĆ' -> 'Ivo Josipović', 'KOLINDA GRABAR-, KITAROVIĆ' -> 'Kolinda Grabar-Kitarović',
    'Ljubo Ćesić, dipl.ing.prometa' -> 'Ljubo Ćesić'. Header cells wrap with ', '.
    """
    name = re.sub(r'-,\s*', '-', header)
    name = re.sub(r',\s*,', ',', name)
    name = name.split(',')[0] if re.search(r',\s*(?:[a-z]+\.)+', name) else name.replace(',', ' ')
    words = [w for w in name.split() if not re.fullmatch(r'(?:[a-z]+\.)+[a-z]*', w)]
    return ' '.join(w if w != w.upper() else w.title() for w in words)


def candidate_id(name):
    """Surname(s) in capitals: 'Marija Selak Raspudić' -> 'SELAK RASPUDIĆ'"""
    return ' '.join(name.split()[1:]).upper()


def municipality_name(name):
    """'GRAD DUGO SELO' (2005) -> 'DUGO SELO'; Zagreb keeps its name"""
    name = ' '.join(name.split())
    if name.upper() != 'GRAD ZAGREB':
        name = re.sub(r'^(GRAD|OPĆINA)\s+', '', name, flags=re.I)
    return name


def transform(year, round_no):
    source = next(SOURCE_DIR.glob(f'{year}/{round_no}_krug.*'))
    rows = read_table(source)
    header_row = next(i for i, row in enumerate(rows) if any('važeć' in c.lower() for c in row))
    headers = [' '.join(h.split()) for h in rows[header_row]]

    def find(*names):
        return next(i for i, h in enumerate(headers) if h in names)

    county_col = 1
    name_col = find('Grad / općina / država', 'Grad/općina/Država', 'Grad/općina/država')
    voters_col = find('Upisano birača', 'Ukupno birača')
    votes_col = find('Glasovalo birača (prema listićima)', 'Glasovalo birača')
    invalid_col = find('Broj nevažećih listića', 'Nevažećih listića', 'Nevažeći listići')

    candidates = {}  # col -> (id, name)
    for i in range(invalid_col + 1, len(headers)):
        if headers[i] and '%' not in headers[i]:
            name = candidate_name(headers[i])
            candidates[i] = (candidate_id(name), name)

    municipalities = defaultdict(lambda: {'name': '', 'county': '', 'total_voters': 0, 'votes_cast': 0, 'parties': {}})
    for row in rows[header_row + 1:]:
        row = row + [''] * (len(headers) - len(row))
        raw_name = ' '.join(row[name_col].split())
        if not raw_name or raw_name.endswith('Total') or raw_name.upper().startswith('UKUPNO'):
            continue
        county = ' '.join(row[county_col].split())
        if county.upper() in ('INOZEMSTVO', 'DIJASPORA U RH'):
            # Abroad: one entry per country, like the European elections
            county = 'inozemstvo'
            if row[county_col].strip().upper() == 'DIJASPORA U RH':
                raw_name = 'DIJASPORA U RH'
            muni_name = raw_name
            muni_id = municipality_id(muni_name, county)
        else:
            muni_name = municipality_name(raw_name)
            muni_id = municipality_id(muni_name, county.lower())

        muni = municipalities[muni_id]
        muni['name'] = muni_name
        muni['county'] = county
        muni['total_voters'] += parse_count(row[voters_col])
        muni['votes_cast'] += parse_count(row[votes_col])
        for col, (cand_id, name) in candidates.items():
            votes = parse_count(row[col])
            if votes:
                cand = muni['parties'].setdefault(cand_id, {'votes': 0, 'coalition_name': name})
                cand['votes'] += votes

    results = {}
    for muni_id, muni in municipalities.items():
        muni['turnout'] = round(muni['votes_cast'] / muni['total_voters'], 4) if muni['total_voters'] else 0
        results[muni_id] = muni

    total_voters = sum(m['total_voters'] for m in results.values())
    votes_cast = sum(m['votes_cast'] for m in results.values())
    return {
        'election_id': f'{year}-presidential-{round_no}',
        'date': ELECTIONS[year][round_no - 1],
        'type': 'presidential',
        'round': round_no,
        'turnout_national': round(votes_cast / total_voters, 4),
        'candidates': {cand_id: {'name': name, **CANDIDATES.get(year, {}).get(cand_id, {})}
                       for cand_id, name in candidates.values()},
        'results': results,
    }


def print_summary(data):
    totals = defaultdict(int)
    for muni in data['results'].values():
        for cand_id, cand in muni['parties'].items():
            totals[cand_id] += cand['votes']
    valid = sum(totals.values())
    abroad = sum(1 for m in data['results'].values() if m['county'] == 'inozemstvo')
    print(f"{data['election_id']}: {len(data['results']) - abroad} municipalities, {abroad} abroad, "
          f"turnout {data['turnout_national'] * 100:.2f}%, {valid:,} valid votes")
    for cand_id, votes in sorted(totals.items(), key=lambda x: -x[1]):
        print(f"  {votes / valid * 100:6.2f}%  {votes:>9,}  {data['candidates'][cand_id]['name']}")


def main():
    years = sys.argv[1:] or list(ELECTIONS)
    for year in years:
        if year not in ELECTIONS:
            print(f"Usage: python scripts/transform_presidential_data.py [year ...]  ({', '.join(ELECTIONS)})")
            sys.exit(1)
        for round_no in (1, 2):
            data = transform(year, round_no)
            output = OUTPUT_DIR / f'{data["election_id"]}.json'
            with open(output, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print_summary(data)


if __name__ == '__main__':
    main()
