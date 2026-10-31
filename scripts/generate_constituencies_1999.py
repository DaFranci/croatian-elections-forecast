"""
Generate constituency boundaries used from 2000 to 2020 (law of 1999, NN 116/99).

Constituencies I-X were made up of whole municipalities, except the City of
Zagreb, which was split between I, II, VI and VII. Municipalities are assigned
using the 2015 election data; Zagreb is split by city district.

The law split Zagreb by local committee (mjesni odbor), not by city district,
so the Zagreb borders are approximate: a few committees lie across district
lines (e.g. Peščenica belonged to I, Jakuševac to VII).

Requires: shapely

Usage:
    python scripts/generate_constituencies_1999.py
"""

import json
from pathlib import Path

from shapely import set_precision
from shapely.geometry import mapping, shape
from shapely.ops import unary_union

MUNICIPALITIES_PATH = Path('public/data/geospatial/municipalities.geojson')
ZAGREB_DISTRICTS_PATH = Path('public/data/geospatial/zagreb_districts.geojson')
ELECTION_PATH = Path('public/data/elections/2015-parliamentary.json')
MAPPING_PATH = Path('public/data/elections/municipality_mapping.json')
OUTPUT_PATH = Path('public/data/geospatial/constituencies-1999.geojson')

# Zagreb city districts (gradske četvrti) by constituency, approximating NN 116/99
ZAGREB_DISTRICTS = {
    'I': ['Donji grad', 'Gornji grad - Medveščak', 'Trnje', 'Maksimir', 'Podsljeme',
          'Podsused - Vrapče', 'Črnomerec', 'Trešnjevka - sjever'],
    'II': ['Sesvete', 'Gornja Dubrava', 'Donja Dubrava'],
    'VI': ['Peščenica - Žitnjak', 'Novi Zagreb - istok'],
    'VII': ['Stenjevec', 'Trešnjevka - jug', 'Novi Zagreb - zapad', 'Brezovica'],
}

ROMAN_ORDER = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

# Same grid as municipalities.geojson (4 decimals)
GRID_SIZE = 1e-4


def load_json(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def split_zagreb(zagreb_geom):
    """Split the Zagreb municipality polygon into constituency parts by city district."""
    districts = {f['properties']['JMS_IME']: shape(f['geometry'])
                 for f in load_json(ZAGREB_DISTRICTS_PATH)['features']}

    assigned = {name for names in ZAGREB_DISTRICTS.values() for name in names}
    if assigned != set(districts):
        raise ValueError(f"District names don't match: {assigned ^ set(districts)}")

    # District boundaries (OSM) don't line up exactly with the GADM city border,
    # so clip each part to the GADM polygon
    parts = {const: unary_union([districts[n] for n in names]).intersection(zagreb_geom)
             for const, names in ZAGREB_DISTRICTS.items()}

    # Give slivers of the GADM polygon not covered by any district to the nearest part
    leftover = zagreb_geom.difference(unary_union(list(parts.values())))
    for piece in getattr(leftover, 'geoms', [leftover]):
        if piece.is_empty:
            continue
        nearest = min(parts, key=lambda c: parts[c].distance(piece))
        parts[nearest] = parts[nearest].union(piece)

    return parts


def main():
    municipalities = load_json(MUNICIPALITIES_PATH)['features']
    results = load_json(ELECTION_PATH)['results']
    id_mapping = load_json(MAPPING_PATH)

    # GeoJSON ID -> constituency, from the election data
    geo_constituency = {}
    for muni_id, result in results.items():
        const = result['constituency'].split('.')[0].strip()
        if const in ROMAN_ORDER:
            geo_constituency[id_mapping.get(muni_id, muni_id)] = const

    pieces = {const: [] for const in ROMAN_ORDER}
    missing = []
    for feat in municipalities:
        geo_id = feat['properties']['id']
        geom = shape(feat['geometry'])
        if geo_id == 'zagreb':
            for const, part in split_zagreb(geom).items():
                pieces[const].append(part)
        elif geo_id in geo_constituency:
            pieces[geo_constituency[geo_id]].append(geom)
        else:
            missing.append(geo_id)

    if missing:
        print(f"WARNING: no constituency for {', '.join(sorted(missing))}")

    features = []
    for const in ROMAN_ORDER:
        geom = set_precision(unary_union(pieces[const]), GRID_SIZE)
        features.append({
            'type': 'Feature',
            'properties': {'name': f'{const}. IZBORNA JEDINICA', 'id': const},
            'geometry': mapping(geom),
        })
        print(f"{const}: {len(pieces[const])} municipalities")

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(json.dumps({'type': 'FeatureCollection', 'features': features}))
    print(f"Saved {OUTPUT_PATH}")


if __name__ == '__main__':
    main()
