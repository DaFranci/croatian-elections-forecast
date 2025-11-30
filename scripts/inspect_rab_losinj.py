import json
from pathlib import Path

def inspect_rab_losinj():
    geojson_path = Path("public/data/geospatial/municipalities.geojson")
    output_path = Path("rab_losinj_info.txt")
    
    targets = ["Srakane", "Lopar", "Supetarska", "Rab"]
    
    with open(geojson_path, 'r', encoding='utf-8') as f:
        geo_data = json.load(f)
        
    with open(output_path, 'w', encoding='utf-8') as out:
        out.write("--- Inspecting Features ---\n")
        for f in geo_data['features']:
            props = f['properties']
            name = props.get('name', '')
            fid = props.get('id', '')
            
            for t in targets:
                if t.lower() in name.lower() or t.lower() in fid.lower():
                    out.write(f"Found: Name='{name}', ID='{fid}', County='{props.get('county')}'\n")
                    # Centroid
                    if f['geometry']['type'] == 'MultiPolygon':
                        coords = f['geometry']['coordinates'][0][0]
                    elif f['geometry']['type'] == 'Polygon':
                        coords = f['geometry']['coordinates'][0]
                    else:
                        continue
                        
                    lons = [p[0] for p in coords]
                    lats = [p[1] for p in coords]
                    avg_lat = sum(lats)/len(lats)
                    avg_lon = sum(lons)/len(lons)
                    out.write(f"  Centroid: {avg_lat:.4f}, {avg_lon:.4f}\n")
                    break # Avoid double printing if multiple targets match

if __name__ == "__main__":
    inspect_rab_losinj()
