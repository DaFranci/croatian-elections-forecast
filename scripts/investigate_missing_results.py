import json
from pathlib import Path

def investigate_missing():
    geojson_path = Path("public/data/geospatial/municipalities.geojson")
    election_path = Path("public/data/elections/2024-parliamentary.json")
    
    targets = ["MaliBukovec", "DonjiKukuruzari", "Blaca", "Susak", "Unije", "Ilovik", "Premantura"]
    
    print("Loading data...")
    with open(geojson_path, 'r', encoding='utf-8') as f:
        geo_data = json.load(f)
    
    with open(election_path, 'r', encoding='utf-8') as f:
        election_data = json.load(f)
        
    election_keys = list(election_data['results'].keys())
    geo_features = geo_data['features']
    
    print("\n--- 1. Checking GeoJSON for targets ---")
    for t in targets:
        found = False
        for f in geo_features:
            props = f['properties']
            if t.lower() in props.get('name', '').lower() or t.lower() in props.get('id', '').lower():
                print(f"Found in GeoJSON: ID={props.get('id')}, Name={props.get('name')}, County={props.get('county')}")
                found = True
        if not found:
            print(f"NOT FOUND in GeoJSON: {t}")

    print("\n--- 2. Checking Election Data for targets (exact & fuzzy) ---")
    for t in targets:
        # Exact/normalized check
        normalized_t = t.lower().replace(" ", "").replace("-", "")
        
        matches = []
        for k in election_keys:
            normalized_k = k.lower().replace(" ", "").replace("-", "")
            if normalized_t in normalized_k or normalized_k in normalized_t:
                matches.append(k)
        
        if matches:
            print(f"Potential matches in Election Data for '{t}': {matches}")
        else:
            print(f"NO matches in Election Data for '{t}'")

if __name__ == "__main__":
    investigate_missing()
