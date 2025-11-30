import json
from pathlib import Path
import re

def find_compound_name_matches():
    """Find and suggest mappings for compound municipality names."""
    
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
        existing_mapping = json.load(f)
    
    # Get unmapped election IDs
    election_ids = {}
    for old_id, data in election_data['results'].items():
        new_id = existing_mapping.get(old_id, old_id)
        if new_id not in geo_ids:
            election_ids[old_id] = data['name']
    
    # Find potential matches
    new_mappings = {}
    
    for election_id, election_name in election_ids.items():
        # Normalize election ID by removing hyphens and converting to lowercase
        election_normalized = election_id.replace('-', '').lower()
        
        # Try to find matching geo ID
        best_match = None
        best_score = 0
        
        for geo_id, geo_name in geo_ids.items():
            geo_normalized = geo_id.replace('-', '').lower()
            
            # Check if they match when hyphens are removed
            if election_normalized == geo_normalized:
                best_match = geo_id
                best_score = 100
                break
            
            # Check if election name contains geo name or vice versa
            election_name_lower = election_name.lower()
            geo_name_lower = geo_name.lower()
            
            if election_name_lower in geo_name_lower or geo_name_lower in election_name_lower:
                # Calculate similarity score
                score = len(set(election_name_lower) & set(geo_name_lower))
                if score > best_score:
                    best_match = geo_id
                    best_score = score
        
        if best_match and best_score >= 10:  # Minimum similarity threshold
            new_mappings[election_id] = best_match
            print(f"Match: {election_id:40s} -> {best_match:40s}")
            print(f"       {election_name:40s} -> {geo_ids[best_match]:40s}")
            print()
    
    # Filter out diaspora entries (foreign countries)
    # These typically have names like country names or "INOZEMSTVO"
    diaspora_keywords = [
        'inozemstvo', 'australia', 'austria', 'belgium', 'canada', 'france', 
        'germany', 'italy', 'netherlands', 'spain', 'switzerland', 'uk', 
        'usa', 'argentina', 'brazil', 'chile', 'china', 'japan', 'south africa',
        'new zealand', 'ireland', 'sweden', 'norway', 'denmark', 'finland'
    ]
    
    filtered_mappings = {}
    diaspora_entries = []
    
    for election_id, geo_id in new_mappings.items():
        is_diaspora = any(keyword in election_id.lower() for keyword in diaspora_keywords)
        is_diaspora = is_diaspora or any(keyword in election_ids[election_id].lower() for keyword in diaspora_keywords)
        
        if not is_diaspora:
            filtered_mappings[election_id] = geo_id
        else:
            diaspora_entries.append((election_id, election_ids[election_id]))
    
    print(f"\n{'='*80}")
    print(f"SUMMARY")
    print(f"{'='*80}")
    print(f"New compound name mappings found: {len(filtered_mappings)}")
    print(f"Diaspora entries identified: {len(diaspora_entries)}")
    
    if diaspora_entries:
        print(f"\nDiaspora entries (will be ignored):")
        for eid, name in diaspora_entries[:10]:
            print(f"  {eid:40s} -> {name}")
        if len(diaspora_entries) > 10:
            print(f"  ... and {len(diaspora_entries) - 10} more")
    
    # Merge with existing mapping
    combined_mapping = {**existing_mapping, **filtered_mappings}
    
    # Save updated mapping
    with open(mapping_path, 'w', encoding='utf-8') as f:
        json.dump(combined_mapping, f, indent=2, ensure_ascii=False)
    
    print(f"\nUpdated mapping file with {len(combined_mapping)} total entries")
    print(f"  - Previous: {len(existing_mapping)}")
    print(f"  - Added: {len(filtered_mappings)}")
    
    return combined_mapping

if __name__ == '__main__':
    find_compound_name_matches()
