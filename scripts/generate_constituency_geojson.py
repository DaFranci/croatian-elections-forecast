import json
from shapely.geometry import shape, mapping
from shapely.ops import unary_union
import os

def generate_constituency_geojson():
    """
    Generate a GeoJSON file with merged constituency polygons.
    Merges municipality polygons that belong to the same constituency.
    """
    
    # Load municipality GeoJSON
    muni_path = 'public/data/geospatial/municipalities.geojson'
    with open(muni_path, 'r', encoding='utf-8') as f:
        muni_data = json.load(f)
    
    # Load election data to get constituency mappings
    election_path = 'public/data/elections/2024-parliamentary.json'
    with open(election_path, 'r', encoding='utf-8') as f:
        election_data = json.load(f)

    # Load municipality mapping
    mapping_path = 'public/data/elections/municipality_mapping.json'
    with open(mapping_path, 'r', encoding='utf-8') as f:
        # The mapping file maps Election ID -> GeoJSON ID
        # We need GeoJSON ID -> Election ID, so we invert it
        raw_mapping = json.load(f)
        id_mapping = {v: k for k, v in raw_mapping.items()}
    
    print(f"Loaded {len(muni_data['features'])} municipalities")
    print(f"Loaded {len(election_data['results'])} election results")
    print(f"Loaded {len(id_mapping)} ID mappings")
    
    # Group municipalities by constituency
    constituencies = {}
    missing_municipalities = []
    mapped_count = 0
    
    for feature in muni_data['features']:
        original_id = feature['properties'].get('id')
        
        # Apply mapping if exists
        muni_id = id_mapping.get(original_id, original_id)
        if muni_id != original_id:
            mapped_count += 1
            
        if muni_id and muni_id in election_data['results']:
            const_name = election_data['results'][muni_id].get('constituency')
            if const_name:
                # Extract constituency ID (e.g., "I" from "I. IZBORNA JEDINICA")
                const_id = const_name.split('.')[0].strip()
                
                if const_id not in constituencies:
                    constituencies[const_id] = {
                        'name': const_name,
                        'polygons': []
                    }
                
                # Add municipality polygon to constituency
                # Fix topology with buffer(0)
                poly = shape(feature['geometry'])
                if not poly.is_valid:
                    poly = poly.buffer(0)
                
                # Buffer by a larger amount (approx 100m) to ensure overlap and close larger gaps
                # We will unbuffer the final result to restore the approximate original boundary
                poly = poly.buffer(0.001)
                
                constituencies[const_id]['polygons'].append(poly)
            else:
                missing_municipalities.append(f"{original_id} (No constituency)")
        else:
            missing_municipalities.append(f"{original_id} (Not in election data)")
    
    print(f"Applied {mapped_count} ID mappings")
    
    if missing_municipalities:
        print(f"\nWARNING: {len(missing_municipalities)} municipalities could not be assigned to a constituency:")
        for m in missing_municipalities[:10]:
            print(f"  - {m}")
        if len(missing_municipalities) > 10:
            print(f"  ... and {len(missing_municipalities) - 10} more")
    
    print(f"\nFound {len(constituencies)} constituencies:")
    for const_id, data in constituencies.items():
        print(f"  {const_id}: {len(data['polygons'])} municipalities")
    
    # Merge polygons for each constituency
    constituency_features = []
    for const_id, data in sorted(constituencies.items()):
        print(f"\nMerging constituency {const_id}...")
        # Union the buffered polygons
        merged = unary_union(data['polygons'])
        
        # Unbuffer by the same amount to restore original size, but keep holes closed
        # Also apply buffer(0) to fix any topology issues from the operation
        merged = merged.buffer(-0.001).buffer(0)
        
        constituency_features.append({
            'type': 'Feature',
            'properties': {
                'id': const_id,
                'name': data['name']
            },
            'geometry': mapping(merged)
        })
        print(f"  ✓ Merged {len(data['polygons'])} municipalities into 1 polygon")
    
    # Create output GeoJSON
    output = {
        'type': 'FeatureCollection',
        'features': constituency_features
    }
    
    # Save constituency GeoJSON
    output_path = 'public/data/geospatial/constituencies.geojson'
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ Successfully created {output_path}")
    print(f"  Total constituencies: {len(constituency_features)}")

if __name__ == '__main__':
    generate_constituency_geojson()
