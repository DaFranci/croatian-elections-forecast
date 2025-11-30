import json
from pathlib import Path

def find_mismatches():
    """Find municipalities in GeoJSON that are missing from election data."""
    
    # Load GeoJSON
    geojson_path = Path('public/data/geospatial/municipalities.geojson')
    with open(geojson_path, 'r', encoding='utf-8') as f:
        geo_data = json.load(f)
    
    # Extract municipality IDs from GeoJSON
    geo_ids = set()
    geo_names = {}
    for feature in geo_data['features']:
        muni_id = feature['properties']['id']
        muni_name = feature['properties']['name']
        geo_ids.add(muni_id)
        geo_names[muni_id] = muni_name
    
    print(f"GeoJSON municipalities: {len(geo_ids)}")
    
    # Load election data for 2024
    election_path = Path('public/data/elections/2024-parliamentary.json')
    with open(election_path, 'r', encoding='utf-8') as f:
        election_data = json.load(f)
    
    # Extract municipality IDs from election data
    election_ids = set(election_data['results'].keys())
    election_names = {k: v['name'] for k, v in election_data['results'].items()}
    
    print(f"Election data municipalities: {len(election_ids)}")
    
    # Find mismatches
    in_geo_not_election = geo_ids - election_ids
    in_election_not_geo = election_ids - geo_ids
    
    print(f"\n{'='*80}")
    print(f"MUNICIPALITIES IN GEOJSON BUT NOT IN ELECTION DATA: {len(in_geo_not_election)}")
    print(f"{'='*80}")
    
    if in_geo_not_election:
        for muni_id in sorted(in_geo_not_election):
            print(f"  ID: {muni_id:30s} Name: {geo_names[muni_id]}")
    else:
        print("  None")
    
    print(f"\n{'='*80}")
    print(f"MUNICIPALITIES IN ELECTION DATA BUT NOT IN GEOJSON: {len(in_election_not_geo)}")
    print(f"{'='*80}")
    
    if in_election_not_geo:
        for muni_id in sorted(in_election_not_geo):
            print(f"  ID: {muni_id:30s} Name: {election_names[muni_id]}")
    else:
        print("  None")
    
    # Try to find potential matches based on name similarity
    if in_geo_not_election and in_election_not_geo:
        print(f"\n{'='*80}")
        print("POTENTIAL MATCHES (based on name similarity)")
        print(f"{'='*80}")
        
        for geo_id in sorted(in_geo_not_election):
            geo_name = geo_names[geo_id].lower()
            for election_id in sorted(in_election_not_geo):
                election_name = election_names[election_id].lower()
                
                # Check if names are similar
                if geo_name in election_name or election_name in geo_name:
                    print(f"\nGeoJSON:  {geo_id:30s} -> {geo_names[geo_id]}")
                    print(f"Election: {election_id:30s} -> {election_names[election_id]}")

if __name__ == '__main__':
    find_mismatches()
