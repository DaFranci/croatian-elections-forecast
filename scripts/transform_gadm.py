"""
Transform GADM GeoJSON to match our application's expected format.

This script:
1. Reads the GADM municipalities.json file
2. Transforms property names to match our app's expectations
3. Creates simplified IDs from municipality names
4. Saves the transformed GeoJSON
"""

import json
from pathlib import Path
import re

def create_id_from_name(name):
    """Create a URL-friendly ID from a municipality name."""
    # Remove special characters and convert to lowercase
    id_str = name.lower()
    # Replace Croatian special characters
    replacements = {
        'č': 'c', 'ć': 'c', 'đ': 'd', 'š': 's', 'ž': 'z',
        ' ': '-', '.': '', ',': ''
    }
    for old, new in replacements.items():
        id_str = id_str.replace(old, new)
    # Remove any remaining non-alphanumeric characters except hyphens
    id_str = re.sub(r'[^a-z0-9-]', '', id_str)
    # Remove multiple consecutive hyphens
    id_str = re.sub(r'-+', '-', id_str)
    # Remove leading/trailing hyphens
    id_str = id_str.strip('-')
    return id_str

def transform_gadm_geojson(input_file, output_file):
    """Transform GADM GeoJSON to our application format."""
    
    print(f"Reading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Found {len(data['features'])} features")
    
    # Transform each feature
    transformed_features = []
    for feature in data['features']:
        props = feature['properties']
        
        # Create new properties matching our app's expectations
        new_props = {
            'id': create_id_from_name(props.get('NAME_2', 'unknown')),
            'name': props.get('NAME_2', 'Unknown'),
            'admin_level': 7,  # Municipality level
            'type': props.get('TYPE_2', 'Unknown'),
            'county': props.get('NAME_1', 'Unknown'),
            # Keep original GADM IDs for reference
            'gadm_id': props.get('GID_2'),
            'osm_id': None  # Will be populated when we get real OSM data
        }
        
        # Create transformed feature
        transformed_feature = {
            'type': 'Feature',
            'properties': new_props,
            'geometry': feature['geometry']
        }
        
        transformed_features.append(transformed_feature)
    
    # Create output GeoJSON
    output_data = {
        'type': 'FeatureCollection',
        'features': transformed_features
    }
    
    # Save transformed data
    print(f"Saving to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f"✓ Transformed {len(transformed_features)} municipalities")
    
    # Print some sample IDs for verification
    print("\nSample municipality IDs:")
    for i, feature in enumerate(transformed_features[:10]):
        props = feature['properties']
        print(f"  {props['name']:30} → {props['id']}")
    
    return output_data

def main():
    """Main execution."""
    input_file = Path("public/data/geospatial/municipalities.json")
    output_file = Path("public/data/geospatial/municipalities.geojson")
    
    if not input_file.exists():
        print(f"Error: {input_file} not found!")
        print("Please ensure the GADM file is named 'municipalities.json'")
        return
    
    transform_gadm_geojson(input_file, output_file)
    
    print("\n" + "="*60)
    print("SUCCESS!")
    print("="*60)
    print(f"Transformed GeoJSON saved to: {output_file}")
    print("\nNext steps:")
    print("1. Refresh your browser to see the real municipality boundaries")
    print("2. The map should now show actual Croatian shapes instead of rectangles")
    print("3. You may need to adjust the initial zoom level in ElectionMap.tsx")

if __name__ == "__main__":
    main()
