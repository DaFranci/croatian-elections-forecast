import json
from pathlib import Path
import difflib

def analyze_remaining_mismatches():
    """
    Analyze remaining mismatches between GeoJSON and Election data,
    excluding Zagreb, and suggest potential fixes.
    """
    
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
    
    # Load existing mapping
    mapping_path = Path('public/data/elections/municipality_mapping.json')
    with open(mapping_path, 'r', encoding='utf-8') as f:
        mapping = json.load(f)
    
    # Get set of election IDs that are effectively used (mapped or direct)
    mapped_election_ids = set()
    for old_id in election_data['results'].keys():
        new_id = mapping.get(old_id, old_id)
        mapped_election_ids.add(new_id)
        
    # Find GeoJSON IDs that have no corresponding election data
    unmatched_geo_ids = set(geo_ids.keys()) - mapped_election_ids
    
    # Filter out Zagreb
    # Assuming 'zagreb' is the main ID, and potentially districts if they exist
    filtered_unmatched = {
        gid for gid in unmatched_geo_ids 
        if 'zagreb' not in gid.lower() and 'zagreb' not in geo_ids[gid].lower()
    }
    
    print(f"Total GeoJSON municipalities: {len(geo_ids)}")
    print(f"Unmatched GeoJSON IDs (excluding Zagreb): {len(filtered_unmatched)}")
    
    if not filtered_unmatched:
        print("No remaining mismatches found excluding Zagreb!")
        return

    print("\nRemaining Unmatched GeoJSON Municipalities:")
    print(f"{'GeoJSON ID':<30} {'GeoJSON Name':<30}")
    print("-" * 60)
    for gid in sorted(filtered_unmatched):
        print(f"{gid:<30} {geo_ids[gid]:<30}")

    # Try to find candidates in Election data that are NOT mapped to anything yet
    # (i.e. Election IDs that don't appear in the mapped set or are mapped to themselves but don't match a geo id)
    
    # Actually, we want to look at Election IDs that are NOT currently matching a GeoJSON ID.
    # If an election ID maps to 'X', and 'X' is in GeoJSON, it's matched.
    # If an election ID maps to 'Y', and 'Y' is NOT in GeoJSON, it's an unmatched election entry.
    
    unmatched_election_entries = []
    for old_id, data in election_data['results'].items():
        current_mapped_id = mapping.get(old_id, old_id)
        if current_mapped_id not in geo_ids:
            # This election entry is not pointing to a valid GeoJSON feature
            unmatched_election_entries.append((old_id, data['name']))
            
    # Filter diaspora from unmatched election entries for cleaner suggestions
    diaspora_keywords = [
        'inozemstvo', 'australia', 'austria', 'belgium', 'canada', 'france', 
        'germany', 'italy', 'netherlands', 'spain', 'switzerland', 'uk', 
        'usa', 'argentina', 'brazil', 'chile', 'china', 'japan', 'south africa',
        'new zealand', 'ireland', 'sweden', 'norway', 'denmark', 'finland'
    ]
    
    potential_candidates = []
    for eid, ename in unmatched_election_entries:
        if not any(k in eid.lower() or k in ename.lower() for k in diaspora_keywords):
             potential_candidates.append((eid, ename))
             
    print(f"\nUnmatched Election Entries (excluding diaspora): {len(potential_candidates)}")
    
    print("\nPotential Matches (Fuzzy Search):")
    print("-" * 80)
    for gid in sorted(filtered_unmatched):
        gname = geo_ids[gid]
        # Simple fuzzy match against potential candidates
        matches = difflib.get_close_matches(gid, [c[0] for c in potential_candidates], n=3, cutoff=0.5)
        
        if matches:
            print(f"GeoJSON: {gid} ({gname})")
            for match in matches:
                # Find the full name for the match
                match_name = next(n for i, n in potential_candidates if i == match)
                print(f"  ? Election: {match} ({match_name})")
            print()

if __name__ == '__main__':
    analyze_remaining_mismatches()
