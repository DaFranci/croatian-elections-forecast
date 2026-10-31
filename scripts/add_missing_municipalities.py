"""
Add municipalities missing from the GADM boundaries using OpenStreetMap.

GADM's Croatian data predates several municipalities created from parts of
existing ones (e.g. Tribunj from Vodice, Kolan from Pag). This script fetches
their boundaries from OSM via the Overpass API, clips them to the GADM land
area, cuts them out of the GADM municipalities they overlap, and adds them to
municipalities.geojson. Already present IDs are skipped, so it is safe to rerun.

Requires: shapely

Usage:
    python scripts/add_missing_municipalities.py
"""

import json
import urllib.parse
import urllib.request
from pathlib import Path

from shapely import set_precision
from shapely.geometry import LineString, mapping, shape
from shapely.ops import polygonize, unary_union

GEOJSON_PATH = Path("public/data/geospatial/municipalities.geojson")

# OSM name -> GeoJSON ID (matches the election data ID, or municipality_mapping.json)
MISSING = {
    'Kamanje': 'kamanje',
    'Kolan': 'kolan',
    'Štitar': 'stitar',
    'Tribunj': 'tribunj',
    'Vrsi': 'vrsi',
    'Funtana': 'funtana',
    'Tar-Vabriga': 'tar-vabriga',
}

OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

# GADM coordinates have 4 decimals (~10 m); snap changed geometry to the same grid
GRID_SIZE = 1e-4


def fetch_osm_relations(names):
    """Fetch admin_level=7 boundary relations named 'Općina <name>' with member geometry."""
    pattern = '|'.join(names)
    query = f'''[out:json][timeout:120][bbox:42.3,13.4,46.6,19.5];
rel["boundary"="administrative"]["admin_level"="7"]["name"~"^Općina ({pattern})$"];
out geom;'''
    req = urllib.request.Request(
        OVERPASS_URL,
        data=urllib.parse.urlencode({'data': query}).encode(),
        headers={'User-Agent': 'croatian-election-visualization'},
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        return json.load(resp)['elements']


def relation_to_geometry(relation):
    """Assemble a multipolygon relation's member ways into a shapely geometry."""
    def rings(role):
        lines = [LineString([(p['lon'], p['lat']) for p in m['geometry']])
                 for m in relation['members']
                 if m['type'] == 'way' and m.get('role', 'outer') == role and len(m.get('geometry', [])) > 1]
        return unary_union(list(polygonize(lines)))

    geom = rings('outer')
    inner = rings('inner')
    if not inner.is_empty:
        geom = geom.difference(inner)
    return geom


def main():
    with open(GEOJSON_PATH, encoding='utf-8') as f:
        data = json.load(f)

    existing_ids = {feat['properties']['id'] for feat in data['features']}
    todo = {name: muni_id for name, muni_id in MISSING.items() if muni_id not in existing_ids}
    if not todo:
        print("All municipalities already present")
        return

    print(f"Fetching {len(todo)} boundaries from OSM...")
    relations = fetch_osm_relations(todo.keys())

    geoms = [shape(feat['geometry']) for feat in data['features']]
    land = unary_union(geoms)

    for relation in relations:
        name = relation['tags']['name'].removeprefix('Općina ')
        muni_id = todo.get(name)
        if not muni_id:
            continue

        # Clip to GADM land so coastal municipalities don't extend into the sea
        new_geom = set_precision(relation_to_geometry(relation).intersection(land), GRID_SIZE)

        # Cut the new municipality out of the GADM municipalities it overlaps
        parent = None
        largest_overlap = 0
        for i, feat in enumerate(data['features']):
            overlap = geoms[i].intersection(new_geom).area
            if overlap == 0:
                continue
            if overlap > largest_overlap:
                parent, largest_overlap = feat, overlap
            geoms[i] = set_precision(geoms[i].difference(new_geom), GRID_SIZE)
            feat['geometry'] = mapping(geoms[i])

        data['features'].append({
            'type': 'Feature',
            'properties': {
                'id': muni_id,
                'name': name,
                'admin_level': 7,
                'type': 'Općina',
                'county': parent['properties']['county'],
                'gadm_id': None,
                'osm_id': relation['id'],
            },
            'geometry': mapping(new_geom),
        })
        geoms.append(new_geom)
        print(f"  Added {name} ({muni_id}), cut from {parent['properties']['name']}")

    missing = set(todo) - {r['tags']['name'].removeprefix('Općina ') for r in relations}
    if missing:
        print(f"  Not found in OSM: {', '.join(sorted(missing))}")

    with open(GEOJSON_PATH, 'w', encoding='utf-8') as f:
        f.write(json.dumps(data))
    print(f"Saved {len(data['features'])} municipalities to {GEOJSON_PATH}")


if __name__ == '__main__':
    main()
