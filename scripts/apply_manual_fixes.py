import json
from pathlib import Path

def apply_manual_fixes():
    """Apply manual fixes for remaining municipality mismatches."""
    
    mapping_path = Path('public/data/elections/municipality_mapping.json')
    with open(mapping_path, 'r', encoding='utf-8') as f:
        mapping = json.load(f)
    
    # Manual fixes identified
    manual_fixes = {
        "opatija": "opatijaveprinac",
        "povljana": "povljane",
        "sveta-marija": "svetamarijanamuri",
        "veliki-bukovec": "velikibukovec",
        "spisic-bukovica": "spisicbukovica",
        "nova-bukovica": "novabukovica",
        "vela-luka": "velaluka",
        "lopar": "loparsupetarskadraga" # Assuming Lopar corresponds to this
    }
    
    # Check if Lopar exists in election data
    election_path = Path('public/data/elections/2024-parliamentary.json')
    with open(election_path, 'r', encoding='utf-8') as f:
        election_data = json.load(f)
        
    if "lopar" not in election_data['results']:
        print("Warning: 'lopar' not found in election data, skipping mapping.")
        del manual_fixes["lopar"]
    
    # Update mapping
    for election_id, geo_id in manual_fixes.items():
        if election_id in mapping:
            print(f"Updating existing mapping: {election_id} -> {mapping[election_id]} to {geo_id}")
        else:
            print(f"Adding new mapping: {election_id} -> {geo_id}")
        mapping[election_id] = geo_id
        
    # Save updated mapping
    with open(mapping_path, 'w', encoding='utf-8') as f:
        json.dump(mapping, f, indent=2, ensure_ascii=False)
        
    print(f"\nUpdated mapping file with {len(mapping)} entries.")

if __name__ == '__main__':
    apply_manual_fixes()
