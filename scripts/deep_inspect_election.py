import json
from pathlib import Path

def deep_inspect_election():
    election_path = Path("public/data/elections/2024-parliamentary.json")
    
    with open(election_path, 'r', encoding='utf-8') as f:
        election_data = json.load(f)
        
    keys = election_data['results'].keys()
    print("--- Searching for 'nedelja' in election keys ---")
    for k in keys:
        if "nedelja" in k.lower():
            print(f"Key: '{k}', Name: '{election_data['results'][k]['name']}'")

if __name__ == "__main__":
    deep_inspect_election()
