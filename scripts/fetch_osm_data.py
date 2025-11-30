"""
Fetch Croatian administrative boundaries from OpenStreetMap via Overpass API.

This script downloads:
1. Counties (admin_level=4) - 20 counties + Zagreb
2. Municipalities (admin_level=7) - 556 municipalities
3. Zagreb city districts (admin_level=10) - 17 districts

Data is saved as GeoJSON files in public/data/geospatial/
"""

import requests
import json
import time
from pathlib import Path

# Overpass API endpoint
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Output directory
OUTPUT_DIR = Path("public/data/geospatial")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def fetch_osm_data(query, output_file, description):
    """Fetch data from Overpass API and save as GeoJSON."""
    print(f"\n{'='*60}")
    print(f"Fetching: {description}")
    print(f"{'='*60}")
    
    try:
        print("Sending request to Overpass API...")
        response = requests.post(
            OVERPASS_URL,
            data={"data": query},
            timeout=300  # 5 minute timeout
        )
        response.raise_for_status()
        
        print(f"✓ Received response ({len(response.content)} bytes)")
        
        # Parse OSM JSON
        osm_data = response.json()
        
        # Convert to GeoJSON
        print("Converting to GeoJSON...")
        geojson = convert_to_geojson(osm_data)
        
        # Save to file
        output_path = OUTPUT_DIR / output_file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(geojson, f, ensure_ascii=False, indent=2)
        
        feature_count = len(geojson['features'])
        print(f"✓ Saved {feature_count} features to {output_path}")
        
        return geojson
        
    except requests.exceptions.Timeout:
        print(f"✗ Request timed out. Try again later or reduce query scope.")
        return None
    except requests.exceptions.RequestException as e:
        print(f"✗ Request failed: {e}")
        return None
    except Exception as e:
        print(f"✗ Error: {e}")
        return None

def convert_to_geojson(osm_data):
    """Convert OSM JSON to GeoJSON format."""
    features = []
    
    # Build node lookup for way geometry
    nodes = {}
    for element in osm_data.get('elements', []):
        if element['type'] == 'node':
            nodes[element['id']] = [element['lon'], element['lat']]
    
    # Process relations and ways
    for element in osm_data.get('elements', []):
        if element['type'] in ['relation', 'way']:
            feature = create_feature(element, nodes, osm_data.get('elements', []))
            if feature:
                features.append(feature)
    
    return {
        "type": "FeatureCollection",
        "features": features
    }

def create_feature(element, nodes, all_elements):
    """Create a GeoJSON feature from an OSM element."""
    tags = element.get('tags', {})
    
    # Extract properties
    properties = {
        'id': tags.get('ref:HR:county_code') or tags.get('name:en', '').lower().replace(' ', '-'),
        'name': tags.get('name', 'Unknown'),
        'name_en': tags.get('name:en', tags.get('name', '')),
        'admin_level': int(tags.get('admin_level', 0)),
        'population': tags.get('population'),
        'osm_id': element['id'],
        'osm_type': element['type']
    }
    
    # Get geometry
    geometry = None
    
    if element['type'] == 'way':
        # Simple polygon from way
        coords = [nodes.get(node_id) for node_id in element.get('nodes', [])]
        coords = [c for c in coords if c]  # Filter out missing nodes
        
        if len(coords) >= 3:
            geometry = {
                "type": "Polygon",
                "coordinates": [coords]
            }
    
    elif element['type'] == 'relation':
        # Complex polygon from relation (multipolygon)
        geometry = build_multipolygon(element, nodes, all_elements)
    
    if geometry:
        return {
            "type": "Feature",
            "properties": properties,
            "geometry": geometry
        }
    
    return None

def build_multipolygon(relation, nodes, all_elements):
    """Build a MultiPolygon geometry from an OSM relation."""
    # This is a simplified version - full implementation would handle
    # complex multipolygons with holes
    
    ways = {}
    for elem in all_elements:
        if elem['type'] == 'way':
            ways[elem['id']] = elem
    
    outer_rings = []
    
    for member in relation.get('members', []):
        if member.get('role') == 'outer' and member['type'] == 'way':
            way = ways.get(member['ref'])
            if way:
                coords = [nodes.get(node_id) for node_id in way.get('nodes', [])]
                coords = [c for c in coords if c]
                if len(coords) >= 3:
                    outer_rings.append(coords)
    
    if len(outer_rings) == 1:
        return {
            "type": "Polygon",
            "coordinates": outer_rings
        }
    elif len(outer_rings) > 1:
        return {
            "type": "MultiPolygon",
            "coordinates": [[ring] for ring in outer_rings]
        }
    
    return None

# Overpass QL queries
QUERIES = {
    "counties": """
        [out:json][timeout:300];
        area["ISO3166-2"="HR"]->.croatia;
        (
          relation["admin_level"="4"]["boundary"="administrative"](area.croatia);
          relation["admin_level"="6"]["name"="Grad Zagreb"](area.croatia);
        );
        out geom;
    """,
    
    "municipalities": """
        [out:json][timeout:300];
        area["ISO3166-2"="HR"]->.croatia;
        (
          relation["admin_level"="7"]["boundary"="administrative"](area.croatia);
        );
        out geom;
    """,
    
    "zagreb_districts": """
        [out:json][timeout:300];
        area["name"="Grad Zagreb"]->.zagreb;
        (
          relation["admin_level"="10"]["boundary"="administrative"](area.zagreb);
        );
        out geom;
    """
}

def main():
    """Main execution function."""
    print("\n" + "="*60)
    print("Croatian Administrative Boundaries Downloader")
    print("Data Source: OpenStreetMap via Overpass API")
    print("="*60)
    
    datasets = [
        ("counties", "counties.geojson", "Croatian Counties (admin_level=4)"),
        ("municipalities", "municipalities.geojson", "Croatian Municipalities (admin_level=7)"),
        ("zagreb_districts", "zagreb_districts.geojson", "Zagreb City Districts (admin_level=10)")
    ]
    
    results = {}
    
    for query_key, output_file, description in datasets:
        query = QUERIES[query_key]
        result = fetch_osm_data(query, output_file, description)
        results[query_key] = result
        
        # Be nice to the Overpass API - wait between requests
        if result:
            print("Waiting 10 seconds before next request...")
            time.sleep(10)
    
    # Summary
    print("\n" + "="*60)
    print("DOWNLOAD SUMMARY")
    print("="*60)
    
    for query_key, output_file, description in datasets:
        result = results.get(query_key)
        if result:
            count = len(result['features'])
            print(f"✓ {description}: {count} features")
        else:
            print(f"✗ {description}: Failed")
    
    print("\n" + "="*60)
    print("Note: The Overpass API may be slow or rate-limited.")
    print("If downloads fail, try again later or use smaller queries.")
    print("="*60)

if __name__ == "__main__":
    main()
