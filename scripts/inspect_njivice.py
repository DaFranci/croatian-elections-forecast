import json
from pathlib import Path

def inspect_njivice():
    geojson_path = Path("public/data/geospatial/municipalities.geojson")
    
    targets = ["Njivice", "Omišalj", "Omisalj"]
    
    print("Loading GeoJSON...")
    with open(geojson_path, 'r', encoding='utf-8') as f:
        geo_data = json.load(f)
        
    print("\n--- Inspecting Features ---")
    for f in geo_data['features']:
        props = f['properties']
        name = props.get('name', '')
        fid = props.get('id', '')
        
        for t in targets:
            if t.lower() in name.lower() or t.lower() in fid.lower():
                print(f"Found: Name='{name}', ID='{fid}', County='{props.get('county')}'")

if __name__ == "__main__":
    inspect_njivice()
