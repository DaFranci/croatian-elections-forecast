import json
from pathlib import Path

def analyze_orphans():
    geojson_path = Path("public/data/geospatial/municipalities.geojson")
    
    targets = ["Blaca", "Susak", "Unije", "Ilovik", "Premantura"]
    
    with open(geojson_path, 'r', encoding='utf-8') as f:
        geo_data = json.load(f)
        
    print("--- Analyzing Orphan Features ---")
    for t in targets:
        for f in geo_data['features']:
            props = f['properties']
            if t.lower() in props.get('name', '').lower():
                # Calculate centroid
                if f['geometry']['type'] == 'MultiPolygon':
                    coords = f['geometry']['coordinates'][0][0]
                elif f['geometry']['type'] == 'Polygon':
                    coords = f['geometry']['coordinates'][0]
                
                lons = [p[0] for p in coords]
                lats = [p[1] for p in coords]
                avg_lon = sum(lons) / len(lons)
                avg_lat = sum(lats) / len(lats)
                
                print(f"\nFeature: {props.get('name')} (ID: {props.get('id')})")
                print(f"  County: {props.get('county')}")
                print(f"  Coords: {avg_lat:.4f}, {avg_lon:.4f}")
                
                # Context clues
                if "losinj" in str(props).lower(): print("  Mention of Losinj found")
                if "medulin" in str(props).lower(): print("  Mention of Medulin found")

if __name__ == "__main__":
    analyze_orphans()
