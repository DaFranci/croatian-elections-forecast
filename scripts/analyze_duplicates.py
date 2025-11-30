import json
from pathlib import Path
from collections import Counter

def analyze_duplicates():
    """Analyze why election data has more municipalities than GeoJSON."""
    
    # Load election data
    election_path = Path('public/data/elections/2024-parliamentary.json')
    with open(election_path, 'r', encoding='utf-8') as f:
        election_data = json.load(f)
    
    # Load mapping
    mapping_path = Path('public/data/elections/municipality_mapping.json')
    with open(mapping_path, 'r', encoding='utf-8') as f:
        mapping = json.load(f)
    
    # Apply mapping
    mapped_ids = []
    for old_id in election_data['results'].keys():
        new_id = mapping.get(old_id, old_id)
        mapped_ids.append(new_id)
    
    # Find duplicates
    id_counts = Counter(mapped_ids)
    duplicates = {k: v for k, v in id_counts.items() if v > 1}
    
    print(f"Total election entries: {len(election_data['results'])}")
    print(f"Unique IDs after mapping: {len(set(mapped_ids))}")
    print(f"Duplicate IDs: {len(duplicates)}")
    
    if duplicates:
        print(f"\n{'='*80}")
        print("DUPLICATE MUNICIPALITY IDS (after mapping)")
        print(f"{'='*80}")
        for muni_id, count in sorted(duplicates.items(), key=lambda x: -x[1])[:20]:
            print(f"  {muni_id:40s} appears {count} times")
            
            # Show original IDs that map to this
            original_ids = [old_id for old_id, new_id in 
                          [(k, mapping.get(k, k)) for k in election_data['results'].keys()]
                          if new_id == muni_id]
            for orig in original_ids[:5]:
                print(f"    <- {orig}")

if __name__ == '__main__':
    analyze_duplicates()
