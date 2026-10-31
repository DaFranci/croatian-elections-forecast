"""
Generate municipality boundaries for the 2003 election.

Seven municipalities were created between the 2003 and 2007 elections. In 2003
their areas still belonged to the municipality they were split from, so they
are merged back into it. Parents were checked by matching polling stations
(voter counts) between the 2003 and 2007 results.

Requires: shapely

Usage:
    python scripts/generate_municipalities_2003.py
"""

import json
from pathlib import Path

from shapely import set_precision
from shapely.geometry import mapping, shape
from shapely.ops import unary_union

MUNICIPALITIES_PATH = Path('public/data/geospatial/municipalities.geojson')
OUTPUT_PATH = Path('public/data/geospatial/municipalities-2003.geojson')

# Municipality created after 2003 -> municipality it was part of in 2003
MERGED_INTO = {
    'vrsi': 'nin',
    'tribunj': 'vodice',
    'funtana': 'vrsar',
    'tar-vabriga': 'porec',
    'stitar': 'zupanja',
    'kamanje': 'zakanje',
    'lopar': 'rab',
}

# Same grid as municipalities.geojson (4 decimals)
GRID_SIZE = 1e-4


def main():
    with open(MUNICIPALITIES_PATH, encoding='utf-8') as f:
        features = json.load(f)['features']

    by_id = {feat['properties']['id']: feat for feat in features}
    missing = (set(MERGED_INTO) | set(MERGED_INTO.values())) - set(by_id)
    if missing:
        raise ValueError(f"Not in {MUNICIPALITIES_PATH}: {', '.join(sorted(missing))}")

    children = {}
    for child, parent in MERGED_INTO.items():
        children.setdefault(parent, []).append(child)

    output = []
    for feat in features:
        geo_id = feat['properties']['id']
        if geo_id in MERGED_INTO:
            continue
        if geo_id in children:
            parts = [shape(feat['geometry'])] + [shape(by_id[c]['geometry']) for c in children[geo_id]]
            feat = {**feat, 'geometry': mapping(set_precision(unary_union(parts), GRID_SIZE))}
            print(f"{geo_id}: merged {', '.join(children[geo_id])}")
        output.append(feat)

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(json.dumps({'type': 'FeatureCollection', 'features': output}))
    print(f"Saved {OUTPUT_PATH} ({len(output)} municipalities)")


if __name__ == '__main__':
    main()
