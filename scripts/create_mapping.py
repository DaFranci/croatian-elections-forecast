import json
from pathlib import Path

def create_comprehensive_mapping():
    """Create a comprehensive mapping file for all mismatches."""
    
    # Load GeoJSON
    geojson_path = Path('public/data/geospatial/municipalities.geojson')
    with open(geojson_path, 'r', encoding='utf-8') as f:
        geo_data = json.load(f)
    
    geo_ids = set()
    geo_names = {}
    for feature in geo_data['features']:
        muni_id = feature['properties']['id']
        muni_name = feature['properties']['name']
        geo_ids.add(muni_id)
        geo_names[muni_id] = muni_name
    
    # Load election data
    election_path = Path('public/data/elections/2024-parliamentary.json')
    with open(election_path, 'r', encoding='utf-8') as f:
        election_data = json.load(f)
    
    election_ids = set(election_data['results'].keys())
    election_names = {k: v['name'] for k, v in election_data['results'].items()}
    
    # Find mismatches
    in_geo_not_election = geo_ids - election_ids
    in_election_not_geo = election_ids - geo_ids
    
    # Create mapping dictionary
    mapping = {}
    
    # Auto-match based on name similarity
    for geo_id in sorted(in_geo_not_election):
        geo_name = geo_names[geo_id].lower()
        
        for election_id in sorted(in_election_not_geo):
            election_name = election_names[election_id].lower()
            
            # Check if the geo name is a substring of the election name
            # This handles bilingual names like "vodnjan" -> "vodnjan - dignano"
            if geo_name in election_name or election_name.startswith(geo_name):
                mapping[election_id] = geo_id
                print(f"Matched: {election_id:35s} -> {geo_id:35s} ({election_names[election_id]} -> {geo_names[geo_id]})")
                break
    
    # Save mapping to JSON file
    mapping_path = Path('public/data/elections/municipality_mapping.json')
    with open(mapping_path, 'w', encoding='utf-8') as f:
        json.dump(mapping, f, indent=2, ensure_ascii=False)
    
    print(f"\n\nCreated mapping file with {len(mapping)} entries")
    print(f"Saved to: {mapping_path}")
    
    # Report unmatched
    unmatched_election = in_election_not_geo - set(mapping.keys())
    unmatched_geo = in_geo_not_election - set(mapping.values())
    
    if unmatched_election:
        print(f"\n\nStill unmatched in election data ({len(unmatched_election)}):")
        for eid in sorted(unmatched_election):
            print(f"  {eid:35s} -> {election_names[eid]}")
    
    if unmatched_geo:
        print(f"\n\nStill unmatched in GeoJSON ({len(unmatched_geo)}):")
        for gid in sorted(unmatched_geo):
            print(f"  {gid:35s} -> {geo_names[gid]}")

if __name__ == '__main__':
    create_comprehensive_mapping()
