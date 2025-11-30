import json
from pathlib import Path

def fix_rab_losinj():
    geojson_path = Path("public/data/geospatial/municipalities.geojson")
    
    print("Loading GeoJSON...")
    with open(geojson_path, 'r', encoding='utf-8') as f:
        geo_data = json.load(f)
        
    features = geo_data['features']
    
    # 1. Fix Srakane -> Mali Lošinj
    srakane_ids = ['malesrakane', 'velesrakane']
    for f in features:
        if f['properties']['id'] in srakane_ids:
            print(f"Remapping {f['properties']['name']} ({f['properties']['id']}) -> Mali Lošinj")
            f['properties']['id'] = 'malilosinj'
            # Optional: Update name? Maybe keep original for tooltip.
            
    # 2. Fix Lopar/SupetarskaDraga -> Rab
    # User said "Lopar/SupetarskaDraga should be divided into Lopar and Rab".
    # Since 'Lopar' already exists as a feature, we assume 'Lopar/SupetarskaDraga' 
    # represents the 'Rab' part (Supetarska Draga is in Rab).
    # We will rename it to Rab.
    
    target_id = 'loparsupetarskadraga'
    found_target = False
    for f in features:
        if f['properties']['id'] == target_id:
            print(f"Renaming {f['properties']['name']} ({f['properties']['id']}) -> Rab")
            f['properties']['id'] = 'rab'
            f['properties']['name'] = 'Rab'
            found_target = True
            break
            
    if not found_target:
        print(f"Warning: Feature {target_id} not found.")
        
    print("Saving GeoJSON...")
    with open(geojson_path, 'w', encoding='utf-8') as f:
        json.dump(geo_data, f)
    print("Done.")

if __name__ == "__main__":
    fix_rab_losinj()
