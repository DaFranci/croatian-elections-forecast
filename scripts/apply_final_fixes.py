import json
from pathlib import Path

def apply_final_fixes():
    geojson_path = Path("public/data/geospatial/municipalities.geojson")
    mapping_path = Path("public/data/elections/municipality_mapping.json")
    
    # 1. Update GeoJSON (Orphans -> Parents)
    print("Updating GeoJSON...")
    with open(geojson_path, 'r', encoding='utf-8') as f:
        geo_data = json.load(f)
        
    orphan_map = {
        'blaca': 'solin',
        'susak': 'malilosinj',
        'unije': 'malilosinj',
        'ilovik': 'malilosinj',
        'premantura': 'medulin'
    }
    
    modified_count = 0
    for f in geo_data['features']:
        fid = f['properties'].get('id')
        if fid in orphan_map:
            parent_id = orphan_map[fid]
            print(f"  Remapping GeoJSON feature {fid} -> {parent_id}")
            f['properties']['id'] = parent_id
            # Optional: Update name to parent name or keep original? 
            # Keeping original name is better for tooltip ("Susak" is better than "Mali Lošinj" for the island)
            # But for coloring, ID must match.
            modified_count += 1
            
    with open(geojson_path, 'w', encoding='utf-8') as f:
        json.dump(geo_data, f)
    print(f"Saved GeoJSON with {modified_count} updates.")

    # 2. Update Mapping (Name mismatches)
    print("\nUpdating Mapping File...")
    with open(mapping_path, 'r', encoding='utf-8') as f:
        mapping_data = json.load(f)
        
    new_mappings = {
        "mali-bukovec": "malibukovec",
        "donji-kukuruzari": "donjikukuruzari"
    }
    
    for k, v in new_mappings.items():
        if k not in mapping_data:
            print(f"  Adding mapping: {k} -> {v}")
            mapping_data[k] = v
        else:
            print(f"  Mapping already exists: {k} -> {mapping_data[k]}")
            
    with open(mapping_path, 'w', encoding='utf-8') as f:
        json.dump(mapping_data, f, indent=2)
    print("Saved municipality_mapping.json")

if __name__ == "__main__":
    apply_final_fixes()
