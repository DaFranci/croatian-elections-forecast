"""
Transform DIP European Parliament election results to JSON for the application.

Croatia elects its MEPs as a single national constituency, so the output has
municipality results only (no constituencies) plus the number of seats, which
the app allocates nationally (D'Hondt, 5% threshold).

Input is DIP's per-polling-station CSV (cp1250, ';'), where each list's votes
are followed by its candidates' preference votes:
    data/elections/csvs/eu/<year>/rezultati_eupa.csv
Source: https://www.izbori.hr/arhiva-izbora/data/euparlament/<year>/zip/rezultati.zip

Usage:
    python scripts/transform_eu_data.py <year>
"""

import csv
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

from transform_election_data import (
    clean_party_name, extract_lead_party_id, lead_party_name, municipality_id, parse_votes,
)

ELECTIONS = {
    '2013': {'date': '2013-04-14', 'seats': 12, 'candidates': 12},
    '2014': {'date': '2014-05-25', 'seats': 11, 'candidates': 11},
    # The 12th seat was taken up after Brexit, but DIP allocated all 12
    '2019': {'date': '2019-05-26', 'seats': 12, 'candidates': 12},
    '2024': {'date': '2024-06-09', 'seats': 12, 'candidates': 12},
}

# IDs used for the same party in parties.json, and short IDs for lists whose
# lead party has no abbreviation ('HRAST - POKRET ZA USPJEŠNU HRVATSKU')
ID_OVERRIDES = {
    'STRANKA RADA': 'HRVATSKI LABURISTI-STRANKA RADA',
    'ORAH': 'ODRŽIVI RAZVOJ HRVATSKE',
    'MOST NEZAVISNIH LISTA': 'MOST',
    'POKRET ZA USPJEŠNU HRVATSKU': 'HRAST',
    'STRANKA ANTIKORUPCIJE': 'START',
    'ZLATKO HASANBEGOVIĆ: NEOVISNI ZA HRVATSKU': 'NHR',
}


def list_columns(headers, candidates):
    """
    Return [(col_idx, list name)]: after the metadata, each list column is followed
    by one preference-vote column per candidate.
    """
    start = headers.index('Nevažeći listići') + 1
    stride = 1 + candidates
    if (len(headers) - start) % stride:
        raise ValueError(f'{len(headers) - start} result columns is not a multiple of {stride}')
    return [(i, list_name(headers[i])) for i in range(start, len(headers), stride)]


def list_name(header):
    """
    Normalise a list header. 2024 separates coalition parties with line breaks instead
    of commas, and independent lists are named like in the parliamentary data.
    """
    name = ', '.join(' '.join(line.split()) for line in header.splitlines() if line.strip())
    independent = re.match(r'kandidacijska lista grupe birača\s*(?:-|, nositelj liste:)\s*(.+)', name, re.I)
    if independent:
        name = f'NEOVISNA LISTA - {independent.group(1).upper()}'
    return name


def party_ids_for(columns):
    """
    ID per list column: the lead party's abbreviation, or the lead party's full name
    when two lists would share it.
    """
    ids = {}
    for col, name in columns:
        party_id = extract_lead_party_id(clean_party_name(name))
        ids[col] = ID_OVERRIDES.get(party_id, party_id)
    counts = defaultdict(int)
    for party_id in ids.values():
        counts[party_id] += 1
    resolved = {col: ids[col] if counts[ids[col]] == 1 else lead_party_name(name) for col, name in columns}
    if len(set(resolved.values())) < len(resolved):
        raise ValueError(f'Lists share an ID: {sorted(resolved.values())}')
    return resolved


def transform(year):
    meta = ELECTIONS[year]
    path = Path(f'data/elections/csvs/eu/{year}/rezultati_eupa.csv')
    with open(path, encoding='cp1250', newline='') as f:
        rows = list(csv.reader(f, delimiter=';'))

    headers = rows[0]
    col = {name: headers.index(name) for name in
           ('Županija', 'Grad/općina' if year == '2013' else 'Grad/općina/država',
            'Ukupno birača', 'Glasovalo birača')}
    county_col, name_col, voters_col, votes_col = col.values()
    columns = list_columns(headers, meta['candidates'])
    party_ids = party_ids_for(columns)

    municipalities = defaultdict(lambda: {'name': '', 'county': '', 'total_voters': 0, 'votes_cast': 0, 'parties': {}})
    for row in rows[1:]:
        muni_name = row[name_col].strip()
        if not muni_name:
            continue
        county = row[county_col].strip()
        muni_id = municipality_id(muni_name, county.lower())

        muni = municipalities[muni_id]
        muni['name'] = muni_name
        muni['county'] = county
        muni['total_voters'] += parse_votes(row[voters_col])
        muni['votes_cast'] += parse_votes(row[votes_col])

        for col_idx, list_name in columns:
            votes = parse_votes(row[col_idx])
            if votes:
                party = muni['parties'].setdefault(party_ids[col_idx], {'votes': 0, 'coalition_name': list_name})
                party['votes'] += votes

    results = {}
    for muni_id, muni in municipalities.items():
        muni['turnout'] = round(muni['votes_cast'] / muni['total_voters'], 4) if muni['total_voters'] else 0
        results[muni_id] = muni

    total_voters = sum(m['total_voters'] for m in results.values())
    votes_cast = sum(m['votes_cast'] for m in results.values())
    return {
        'election_id': f'{year}-eu',
        'date': meta['date'],
        'type': 'eu',
        'seats': meta['seats'],
        'turnout_national': round(votes_cast / total_voters, 4),
        'results': results,
    }


def print_summary(data):
    totals = defaultdict(int)
    names = {}
    for muni in data['results'].values():
        for party_id, party in muni['parties'].items():
            totals[party_id] += party['votes']
            names[party_id] = party['coalition_name']
    valid = sum(totals.values())

    print(f"{data['election_id']}: {len(data['results'])} municipalities/countries, "
          f"turnout {data['turnout_national'] * 100:.2f}%, {len(totals)} lists, {valid:,} valid votes")
    for party_id, votes in sorted(totals.items(), key=lambda x: -x[1])[:8]:
        print(f"  {votes / valid * 100:5.2f}%  {party_id:<12.12}  {names[party_id][:70]}")


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in ELECTIONS:
        print(f"Usage: python scripts/transform_eu_data.py <year>  ({', '.join(ELECTIONS)})")
        sys.exit(1)

    year = sys.argv[1]
    data = transform(year)
    output = Path(f'public/data/elections/{year}-eu.json')
    with open(output, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print_summary(data)
    print(f'Saved {output}')


if __name__ == '__main__':
    main()
