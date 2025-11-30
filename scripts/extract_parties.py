import json
from pathlib import Path
from collections import defaultdict

def extract_unique_parties():
    """Extract all unique party IDs from election data."""
    parties = set()
    
    # Check all election years
    for year in ['2024', '2020', '2016']:
        json_file = Path(f'public/data/elections/{year}-parliamentary.json')
        
        if not json_file.exists():
            print(f"Skipping {year} - file not found")
            continue
        
        print(f"\nProcessing {year}...")
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for muni_id, muni_data in data['results'].items():
            for party_id in muni_data['parties'].keys():
                parties.add(party_id)
    
    # Sort parties alphabetically
    sorted_parties = sorted(list(parties))
    
    print(f"\n\nFound {len(sorted_parties)} unique parties:")
    for party in sorted_parties:
        print(f"  - {party}")
    
    return sorted_parties

if __name__ == '__main__':
    extract_unique_parties()
