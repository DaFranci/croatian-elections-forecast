import json
from pathlib import Path

def fix_njivice():
    geojson_path = Path("public/data/geospatial/municipalities.geojson")
    
    print("Loading GeoJSON...")
    with open(geojson_path, 'r', encoding='utf-8') as f:
        geo_data = json.load(f)
        
    features = geo_data['features']
    
    target_id = 'njivice'
    parent_id = 'omisalj'
    
    found = False
    for f in features:
        if f['properties']['id'] == target_id:
            print(f"Remapping {f['properties']['name']} ({f['properties']['id']}) -> Omišalj ({parent_id})")
            f['properties']['id'] = parent_id
            # Optional: Update name? Keeping original for tooltip might be better, 
            # but for consistency with other fixes where we merged, maybe we should leave it or change it?
            # The user said "Njivice are part of the Omišalj municipality".
            # In previous fixes (e.g. Susak -> Mali Lošinj), I just changed the ID.
            # I will just change the ID so it picks up the results for Omišalj.
            found = True
            
    if not found:
        print(f"Warning: Feature {target_id} not found.")
    else:
        print("Saving GeoJSON...")
        with open(geojson_path, 'w', encoding='utf-8') as f:
            json.dump(geo_data, f)
        print("Done.")

if __name__ == "__main__":
    fix_njivice()
