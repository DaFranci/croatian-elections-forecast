import json
from pathlib import Path

def inspect_sveta_nedelja():
    geojson_path = Path("public/data/geospatial/municipalities.geojson")
    election_path = Path("public/data/elections/2024-parliamentary.json")
    mapping_path = Path("public/data/elections/municipality_mapping.json")
    
    print("--- 1. GeoJSON Inspection ---")
    with open(geojson_path, 'r', encoding='utf-8') as f:
        geo_data = json.load(f)
        
    for f in geo_data['features']:
        props = f['properties']
        name = props.get('name', '')
        fid = props.get('id', '')
        county = props.get('county', '')
        
        if "sveta" in name.lower() and "nedelja" in name.lower():
            print(f"Found Feature: Name='{name}', ID='{fid}', County='{county}'")

    print("\n--- 2. Election Data Inspection ---")
    with open(election_path, 'r', encoding='utf-8') as f:
        election_data = json.load(f)
        
    keys = election_data['results'].keys()
    for k in keys:
        if "sveta" in k.lower() and "nedelja" in k.lower():
            print(f"Found Election Key: '{k}'")
            
    print("\n--- 3. Mapping Inspection ---")
    with open(mapping_path, 'r', encoding='utf-8') as f:
        mapping_data = json.load(f)
        
    for k, v in mapping_data.items():
        if "sveta" in k.lower() and "nedelja" in k.lower():
            print(f"Found Mapping: '{k}' -> '{v}'")

if __name__ == "__main__":
    inspect_sveta_nedelja()
