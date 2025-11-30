import json
from pathlib import Path

def fix_sveta_nedelja_geojson():
    geojson_path = Path("public/data/geospatial/municipalities.geojson")
    
    print("Loading GeoJSON...")
    with open(geojson_path, 'r', encoding='utf-8') as f:
        geo_data = json.load(f)
        
    count = 0
    for f in geo_data['features']:
        props = f['properties']
        name = props.get('name', '')
        county = props.get('county', '')
        
        if "sveta" in name.lower() and "nedelja" in name.lower():
            if "istarska" in county.lower():
                print(f"Updating Istria Sveta Nedelja: {props['id']} -> svetanedeljaistarska")
                props['id'] = 'svetanedeljaistarska'
                count += 1
            elif "zagreb" in county.lower() or "grad zagreb" in county.lower():
                print(f"Updating Zagreb Sveta Nedelja: {props['id']} -> svetanedeljazagreb")
                props['id'] = 'svetanedeljazagreb'
                count += 1
                
    print(f"Updated {count} features.")
    
    print("Saving GeoJSON...")
    with open(geojson_path, 'w', encoding='utf-8') as f:
        json.dump(geo_data, f)
    print("Done.")

if __name__ == "__main__":
    fix_sveta_nedelja_geojson()
