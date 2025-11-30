import json
from pathlib import Path

def list_missing_municipalities():
    """List municipalities that are in election data but not in GeoJSON."""
    
    # Load GeoJSON
    geojson_path = Path('public/data/geospatial/municipalities.geojson')
    with open(geojson_path, 'r', encoding='utf-8') as f:
        geo_data = json.load(f)
    
    geo_ids = set(feature['properties']['id'] for feature in geo_data['features'])
    geo_names = {feature['properties']['id']: feature['properties']['name'] 
                 for feature in geo_data['features']}
    
    # Load election data
    election_path = Path('public/data/elections/2024-parliamentary.json')
    with open(election_path, 'r', encoding='utf-8') as f:
        election_data = json.load(f)
    
    # Load mapping
    mapping_path = Path('public/data/elections/municipality_mapping.json')
    with open(mapping_path, 'r', encoding='utf-8') as f:
        mapping = json.load(f)
    
    # Apply mapping to election IDs
    election_mapped = {}
    for old_id, data in election_data['results'].items():
        new_id = mapping.get(old_id, old_id)
        election_mapped[new_id] = (old_id, data['name'])
    
    # Find municipalities in election but not in geo
    in_election_not_geo = set(election_mapped.keys()) - geo_ids
    
    print(f"Municipalities in election data but NOT in GeoJSON: {len(in_election_not_geo)}\n")
    print(f"{'ID':<40s} {'Name':<50s} {'Original ID':<40s}")
    print("=" * 130)
    
    for muni_id in sorted(in_election_not_geo):
        orig_id, name = election_mapped[muni_id]
        print(f"{muni_id:<40s} {name:<50s} {orig_id if orig_id != muni_id else '':<40s}")
    
    # Also check the reverse
    in_geo_not_election = geo_ids - set(election_mapped.keys())
    
    print(f"\n\nMunicipalities in GeoJSON but NOT in election data: {len(in_geo_not_election)}\n")
    print(f"{'ID':<40s} {'Name':<50s}")
    print("=" * 90)
    
    for muni_id in sorted(in_geo_not_election):
        print(f"{muni_id:<40s} {geo_names.get(muni_id, 'Unknown'):<50s}")

if __name__ == '__main__':
    list_missing_municipalities()
