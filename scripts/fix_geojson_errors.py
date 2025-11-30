import json
from pathlib import Path

def analyze_and_fix():
    input_file = Path("public/data/geospatial/municipalities.geojson")
    output_file = Path("public/data/geospatial/municipalities_fixed.py_temp.geojson")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    features = data['features']
    
    # 1. Find target features (ALL occurrences)
    unknown1_list = [f for f in features if f['properties']['id'] == 'unknown1']
    unknown2 = next((f for f in features if f['properties']['id'] == 'unknown2'), None)
    unknown3 = next((f for f in features if f['properties']['id'] == 'unknown3'), None)
    osjecko = next((f for f in features if f['properties']['name'] == 'Osjecko-Baranjska'), None)
    gornja_vrba = next((f for f in features if f['properties']['name'] == 'GornjaVrba'), None)
    bukovlje = next((f for f in features if f['properties']['name'] == 'Bukovlje'), None)
    draz = next((f for f in features if f['properties']['name'] == 'Draž'), None)
    dakovo = next((f for f in features if f['properties']['name'] == 'Đakovo'), None)
    
    print("--- Analysis ---")
    print(f"Found {len(unknown1_list)} features with id 'unknown1'")
    for i, u1 in enumerate(unknown1_list):
        # Calculate centroid
        if u1['geometry']['type'] == 'MultiPolygon':
            # Just take first poly for approx
            coords = u1['geometry']['coordinates'][0][0]
        elif u1['geometry']['type'] == 'Polygon':
            coords = u1['geometry']['coordinates'][0]
        
        lons = [p[0] for p in coords]
        avg_lon = sum(lons) / len(lons)
        u1['properties']['_avg_lon'] = avg_lon # Store for sorting
        print(f"  Unknown1 #{i}: avg_lon={avg_lon}")

    # 2. Apply Fixes
    
    # Fix 1: Unknown_2 -> Šodolovci
    if unknown2:
        print("Fixing Unknown_2 -> Šodolovci")
        unknown2['properties']['name'] = 'Šodolovci'
        unknown2['properties']['id'] = 'sodolovci' 
    
    # Fix 2: Osjecko-Baranjska -> Šodolovci
    if osjecko:
        print("Fixing Osjecko-Baranjska -> Šodolovci")
        # Check if we need to merge with unknown2 (now sodolovci)
        if unknown2:
             print("  Merging Osjecko-Baranjska geometry into Šodolovci (was Unknown_2)")
             # Merge logic
             if unknown2['geometry']['type'] == 'Polygon':
                 unknown2['geometry']['type'] = 'MultiPolygon'
                 unknown2['geometry']['coordinates'] = [unknown2['geometry']['coordinates']]
             
             if osjecko['geometry']['type'] == 'Polygon':
                 unknown2['geometry']['coordinates'].append(osjecko['geometry']['coordinates'])
             elif osjecko['geometry']['type'] == 'MultiPolygon':
                 unknown2['geometry']['coordinates'].extend(osjecko['geometry']['coordinates'])
             
             features.remove(osjecko)
        else:
             osjecko['properties']['name'] = 'Šodolovci'
             osjecko['properties']['id'] = 'sodolovci'

    # Fix 3: GornjaVrba -> Klakar
    if gornja_vrba:
        print("Fixing GornjaVrba -> Klakar")
        gornja_vrba['properties']['name'] = 'Klakar'
        gornja_vrba['properties']['id'] = 'klakar'

    # Fix 4: Bukovlje -> Gornja Vrba
    if bukovlje:
        print("Fixing Bukovlje -> Gornja Vrba")
        bukovlje['properties']['name'] = 'Gornja Vrba'
        bukovlje['properties']['id'] = 'gornjavrba'

    # Fix 5: Unknown_3 -> Draž
    if unknown3:
        print("Fixing Unknown_3 -> Draž")
        if draz:
            print("  Merging Unknown_3 geometry into Draž")
            if draz['geometry']['type'] == 'Polygon':
                draz['geometry']['type'] = 'MultiPolygon'
                draz['geometry']['coordinates'] = [draz['geometry']['coordinates']]
            
            if unknown3['geometry']['type'] == 'Polygon':
                draz['geometry']['coordinates'].append(unknown3['geometry']['coordinates'])
            elif unknown3['geometry']['type'] == 'MultiPolygon':
                draz['geometry']['coordinates'].extend(unknown3['geometry']['coordinates'])
            
            features.remove(unknown3)
        else:
            print("  Renaming Unknown_3 to Draž")
            unknown3['properties']['name'] = 'Draž'
            unknown3['properties']['id'] = 'draz'

    # Fix 6: Unknown_1 -> Split
    if len(unknown1_list) >= 1:
        # Sort by longitude
        unknown1_list.sort(key=lambda x: x['properties']['_avg_lon'])
        
        # Western-most is Bukovlje
        western_u1 = unknown1_list[0]
        print(f"  Western Unknown_1 (lon={western_u1['properties']['_avg_lon']:.2f}) -> Bukovlje")
        
        # We need to create/find the "Bukovlje" feature.
        # Note: The OLD Bukovlje was renamed to Gornja Vrba.
        # So we are creating a NEW Bukovlje feature from this Unknown_1.
        western_u1['properties']['name'] = 'Bukovlje'
        western_u1['properties']['id'] = 'bukovlje'
        del western_u1['properties']['_avg_lon']

        # Eastern-most (if exists) is Đakovo
        if len(unknown1_list) > 1:
            eastern_u1 = unknown1_list[1]
            print(f"  Eastern Unknown_1 (lon={eastern_u1['properties']['_avg_lon']:.2f}) -> Merging into Đakovo")
            
            if dakovo:
                if dakovo['geometry']['type'] == 'Polygon':
                    dakovo['geometry']['type'] = 'MultiPolygon'
                    dakovo['geometry']['coordinates'] = [dakovo['geometry']['coordinates']]
                
                if eastern_u1['geometry']['type'] == 'Polygon':
                    dakovo['geometry']['coordinates'].append(eastern_u1['geometry']['coordinates'])
                elif eastern_u1['geometry']['type'] == 'MultiPolygon':
                    dakovo['geometry']['coordinates'].extend(eastern_u1['geometry']['coordinates'])
                
                features.remove(eastern_u1)
            else:
                print("    Đakovo not found, renaming Eastern Unknown_1 to Đakovo")
                eastern_u1['properties']['name'] = 'Đakovo'
                eastern_u1['properties']['id'] = 'dakovo'
                del eastern_u1['properties']['_avg_lon']

    # Save
    print(f"Saving to {input_file}...")
    with open(input_file, 'w', encoding='utf-8') as f:
        json.dump(data, f)

if __name__ == "__main__":
    analyze_and_fix()
