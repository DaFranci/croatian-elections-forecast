"""
Generate municipality boundaries for the 2005 presidential election.

Of the seven municipalities merged into their parents for 2003 (see
generate_municipalities_2003.py), Kamanje already existed in January 2005.
So the 2005 map is the 2003 map with Žakanje and Kamanje as they are today.

Usage:
    python scripts/generate_municipalities_2005.py
"""

import json
from pathlib import Path

MUNICIPALITIES_PATH = Path('public/data/geospatial/municipalities.geojson')
MUNICIPALITIES_2003_PATH = Path('public/data/geospatial/municipalities-2003.geojson')
OUTPUT_PATH = Path('public/data/geospatial/municipalities-2005.geojson')

# Created after 2003 but before the 2005 election -> municipality it was split from
SPLIT_FROM = {
    'kamanje': 'zakanje',
}


def main():
    with open(MUNICIPALITIES_PATH, encoding='utf-8') as f:
        current = {feat['properties']['id']: feat for feat in json.load(f)['features']}
    with open(MUNICIPALITIES_2003_PATH, encoding='utf-8') as f:
        features = json.load(f)['features']

    restored = set(SPLIT_FROM) | set(SPLIT_FROM.values())
    output = [current[feat['properties']['id']] if feat['properties']['id'] in restored else feat for feat in features]
    output += [current[child] for child in SPLIT_FROM]

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(json.dumps({'type': 'FeatureCollection', 'features': output}))
    print(f"Saved {OUTPUT_PATH} ({len(output)} municipalities)")


if __name__ == '__main__':
    main()
