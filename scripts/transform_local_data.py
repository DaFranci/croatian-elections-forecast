"""
Transform DIP local election results to JSON for the application.

The map shows municipal and city councils (Zagreb: the City Assembly), which are
elected from party lists. Mayors are elected by name only, without their party, so
they are listed per municipality, with every round held.

Input is DIP's results archive, downloaded once into a temporary cache (the raw
files are about 30 MB per election, so they are not kept in the repository):
    https://www.izbori.hr/arhiva-izbora/data/lokalni/<year>/zip/rezultati.zip
2013-2021 have a CSV per municipality and race (cp1250, ';'); 2025 an xlsx per
municipality with a sheet per race. County races (assembly, prefect) are skipped.

Output: public/data/elections/<year>-local.json

Usage:
    python scripts/transform_local_data.py [year ...]
"""

import csv
import io
import json
import re
import sys
import tempfile
import urllib.request
import zipfile
from collections import defaultdict
from pathlib import Path

from transform_election_data import clean_party_name, extract_lead_party_id, lead_party_name, municipality_id
from transform_eu_data import ID_OVERRIDES, list_name
from transform_presidential_data import candidate_name, municipality_name, parse_count, read_xlsx_sheets

SOURCE_URL = 'https://www.izbori.hr/arhiva-izbora/data/lokalni/{year}/zip/rezultati.zip'
CACHE_DIR = Path(tempfile.gettempdir()) / 'izbori-cache'
OUTPUT_DIR = Path('public/data/elections')
PARTIES_PATH = Path('public/data/elections/parties.json')

ELECTIONS = {
    '2013': '2013-05-19',
    '2017': '2017-05-21',
    '2021': '2021-05-16',
    '2025': '2025-05-18',
}

# Lead party abbreviations that local ballots spell differently from parties.json
LOCAL_ID_OVERRIDES = {
    'MOŽEMO': 'POLITIČKA PLATFORMA',  # 2025: 'MOŽEMO! - POLITIČKA PLATFORMA - MOŽEMO!'
    'LABURISTI': 'HRVATSKI LABURISTI-STRANKA RADA',
    '365 STRANKA RADA I SOLIDARNOSTI': 'STRANKA RADA I SOLIDARNOSTI',
    'DALIJA OREŠKOVIĆ I LJUDI S IMENOM I PREZIMENOM': 'STRANKA S IMENOM I PREZIMENOM',  # 'DO i SIP'
}

# Round folders inside the archives: '2013/krug-1', '2017/rezultati2krug', '2021/3_krug_rezultati'
ROUND_PATTERN = re.compile(r'(?:krug-(\d)|rezultati(\d)krug|(\d)_krug_rezultati)')


def source_zip(year):
    path = CACHE_DIR / f'lokalni-{year}.zip'
    if not path.exists():
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        print(f'Downloading {SOURCE_URL.format(year=year)}')
        urllib.request.urlretrieve(SOURCE_URL.format(year=year), path)
    return path


def race(name, round_no):
    """'council', 'mayor' or None (county races, minority deputy mayors) from a file or sheet name"""
    name = name.lower()
    if 'zamjen' in name:
        return None
    if 'vije' in name or ('skup' in name and ('zagreb' in name or 'gradsk' in name)):
        return 'council'
    if 'elnik' in name:  # before 'skup': 'BISKUPIJA_načelnik'
        return 'mayor'
    if 'skup' in name or 'upan' in name:
        return None
    # 2021's third round (a repeated mayoral runoff) is named after the municipality only
    return 'mayor' if round_no > 1 else None


def tables(year):
    """Yield (round, race, rows) for every municipal race in the archive."""
    seen = set()
    with zipfile.ZipFile(source_zip(year)) as z:
        for info in z.infolist():
            match = ROUND_PATTERN.search(info.filename)
            if info.is_dir() or not match:
                continue
            round_no = int(next(g for g in match.groups() if g))
            filename = info.filename.rsplit('/', 1)[-1]
            if filename.lower().endswith('.csv'):
                kind = race(filename, round_no)
                if not kind:
                    continue
                rows = list(csv.reader(io.StringIO(z.read(info).decode('cp1250')), delimiter=';'))
                sheets = [(kind, rows)]
            elif filename.lower().endswith('.xlsx') and year == '2025':
                sheets = [(race(name, round_no), rows) for name, rows in read_xlsx_sheets(io.BytesIO(z.read(info)))]
            else:
                continue
            for kind, rows in sheets:
                if not kind:
                    continue
                header_row = next((i for i, row in enumerate(rows) if any('važeć' in c.lower() for c in row)), None)
                if header_row is None:
                    continue
                # 2017's second round has Zagreb's mayor twice
                key = (round_no, kind, tuple(rows[header_row + 1][:4]) if len(rows) > header_row + 1 else ())
                if key in seen:
                    continue
                seen.add(key)
                yield round_no, kind, rows[header_row:]


def known_party_ids():
    with open(PARTIES_PATH, encoding='utf-8') as f:
        return {p['id'] for p in json.load(f)}


def list_id(name, known):
    """
    Lead party abbreviation for national parties (as in the other elections). Local parties
    and independent lists are named by their lead party in full, so unrelated local lists
    with the same abbreviation in different municipalities aren't merged.
    """
    party_id = extract_lead_party_id(clean_party_name(name))
    party_id = LOCAL_ID_OVERRIDES.get(party_id, ID_OVERRIDES.get(party_id, party_id))
    return party_id if party_id in known else lead_party_name(name)


def parse_table(rows):
    """Polling station rows -> (municipality name, county, 'grad' or 'općina', voters, votes cast, {column header: votes})"""
    headers = [' '.join(h.split()) for h in rows[0]]
    raw_headers = rows[0]
    invalid_col = next(i for i, h in enumerate(headers) if h.lower().startswith('nevažeć'))
    columns = [i for i in range(invalid_col + 1, len(headers)) if headers[i]]
    name, county, kind, voters, votes_cast = '', '', '', 0, 0
    totals = defaultdict(int)
    for row in rows[1:]:
        row = row + [''] * (len(headers) - len(row))
        if not row[3].strip() or 'ukupno' in row[3].lower() or row[3].strip().endswith('Total'):
            continue
        name, county, kind = ' '.join(row[3].split()), ' '.join(row[1].split()), row[2].strip().lower()
        voters += parse_count(row[8])
        votes_cast += parse_count(row[9])
        for i in columns:
            totals[raw_headers[i]] += parse_count(row[i])
    return name, county, kind, voters, votes_cast, totals


def transform(year):
    known = known_party_ids()
    results = {}
    mayors = defaultdict(dict)  # muni_id -> round -> race result

    for round_no, kind, rows in tables(year):
        name, county, unit, voters, votes_cast, totals = parse_table(rows)
        if not name:
            continue
        muni_name = municipality_name(name)
        muni_id = municipality_id(muni_name, county.lower())

        if kind == 'council':
            parties = {}
            for header, votes in totals.items():
                full_name = list_name(header)
                party = parties.setdefault(list_id(full_name, known), {'votes': 0, 'coalition_name': full_name})
                party['votes'] += votes
            results[muni_id] = {
                'name': 'Grad Zagreb' if muni_id == 'zagreb' else muni_name,
                'county': county,
                'unit': 'grad' if muni_id == 'zagreb' or unit == 'grad' else 'općina',
                'total_voters': voters,
                'votes_cast': votes_cast,
                'turnout': round(votes_cast / voters, 4) if voters else 0,
                'parties': {k: v for k, v in parties.items() if v['votes']},
            }
        else:
            candidates = sorted(({'name': candidate_name(h), 'votes': v} for h, v in totals.items()), key=lambda c: -c['votes'])
            mayors[muni_id][round_no] = {'round': round_no, 'total_voters': voters, 'votes_cast': votes_cast, 'candidates': candidates}

    for muni_id, rounds in mayors.items():
        if muni_id not in results:
            print(f'  mayor without council results: {muni_id}')
            continue
        # The leader of the last round held was elected
        rounds = [rounds[r] for r in sorted(rounds)]
        rounds[-1]['candidates'][0]['elected'] = True
        results[muni_id]['mayor'] = rounds

    total_voters = sum(m['total_voters'] for m in results.values())
    votes_cast = sum(m['votes_cast'] for m in results.values())
    return {
        'election_id': f'{year}-local',
        'date': ELECTIONS[year],
        'type': 'local',
        'turnout_national': round(votes_cast / total_voters, 4),
        'results': results,
    }


def print_summary(data):
    wins = defaultdict(int)
    for muni in data['results'].values():
        if muni['parties']:
            wins[max(muni['parties'], key=lambda p: muni['parties'][p]['votes'])] += 1
    with_mayor = sum(1 for m in data['results'].values() if 'mayor' in m)
    runoffs = sum(1 for m in data['results'].values() if len(m.get('mayor', [])) > 1)
    print(f"{data['election_id']}: {len(data['results'])} councils, {with_mayor} mayors ({runoffs} runoffs), "
          f"turnout {data['turnout_national'] * 100:.2f}%")
    print('  councils won:', ', '.join(f'{p} {n}' for p, n in sorted(wins.items(), key=lambda x: -x[1])[:10]))


def main():
    years = sys.argv[1:] or list(ELECTIONS)
    for year in years:
        if year not in ELECTIONS:
            print(f"Usage: python scripts/transform_local_data.py [year ...]  ({', '.join(ELECTIONS)})")
            sys.exit(1)
        data = transform(year)
        output = OUTPUT_DIR / f'{year}-local.json'
        with open(output, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print_summary(data)


if __name__ == '__main__':
    main()
