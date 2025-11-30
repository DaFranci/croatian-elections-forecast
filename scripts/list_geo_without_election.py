import json
from pathlib import Path

def list_geo_without_election():
    """List municipalities in GeoJSON that don't have election data."""
    
    # Load GeoJSON
    geojson_path = Path('public/data/geospatial/municipalities.geojson')
    with open(geojson_path, 'r', encoding='utf-8') as f:
        geo_data = json.load(f)
    
    geo_ids = {}
    for feature in geo_data['features']:
        muni_id = feature['properties']['id']
        muni_name = feature['properties']['name']
        geo_ids[muni_id] = muni_name
    
    # Load election data
    election_path = Path('public/data/elections/2024-parliamentary.json')
    with open(election_path, 'r', encoding='utf-8') as f:
        election_data = json.load(f)
    
    # Load mapping
    mapping_path = Path('public/data/elections/municipality_mapping.json')
    with open(mapping_path, 'r', encoding='utf-8') as f:
        mapping = json.load(f)
    
    # Apply mapping to election IDs
    election_mapped = set()
    for old_id in election_data['results'].keys():
        new_id = mapping.get(old_id, old_id)
        election_mapped.add(new_id)
    
    # Find municipalities in GeoJSON but not in election
    in_geo_not_election = set(geo_ids.keys()) - election_mapped
    
    print(f"Municipalities in GeoJSON but NOT in election data: {len(in_geo_not_election)}\n")
    print(f"{'ID':<40s} {'Name':<50s}")
    print("=" * 90)
    
    for muni_id in sorted(in_geo_not_election):
        print(f"{muni_id:<40s} {geo_ids[muni_id]:<50s}")

if __name__ == '__main__':
    list_geo_without_election()
