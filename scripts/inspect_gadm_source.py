import json
from pathlib import Path

def inspect_source_data():
    """Inspect municipalities.json for anomalous entries."""
    
    input_file = Path("public/data/geospatial/municipalities.json")
    
    print(f"Reading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Found {len(data['features'])} features")
    
    unknown_count = 0
    osjecko_count = 0
    
    print("\n--- Anomalous Features ---")
    
    for i, feature in enumerate(data['features']):
        props = feature['properties']
        name_2 = props.get('NAME_2')
        name_1 = props.get('NAME_1')
        
        # Check for missing or Unknown name
        if not name_2 or name_2 == 'Unknown' or name_2 == 'NA':
            unknown_count += 1
            print(f"\n[Index {i}] Missing/Unknown NAME_2")
            print(f"  GID_2: {props.get('GID_2')}")
            print(f"  NAME_1 (County): {name_1}")
            print(f"  NAME_2: {name_2}")
            print(f"  TYPE_2: {props.get('TYPE_2')}")
            
        # Check for Osjecko-Baranjska as municipality name
        if name_2 == 'Osjecko-Baranjska' or name_2 == 'Osječko-Baranjska':
            osjecko_count += 1
            print(f"\n[Index {i}] Osjecko-Baranjska as NAME_2")
            print(f"  GID_2: {props.get('GID_2')}")
            print(f"  NAME_1 (County): {name_1}")
            print(f"  NAME_2: {name_2}")
            
    print(f"\nTotal features with missing/Unknown NAME_2: {unknown_count}")
    print(f"Total features with Osjecko-Baranjska as NAME_2: {osjecko_count}")

if __name__ == "__main__":
    inspect_source_data()
