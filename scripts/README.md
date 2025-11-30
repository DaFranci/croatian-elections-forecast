# Fetch Croatian Administrative Boundaries

This directory contains scripts to acquire real geospatial data for Croatian administrative boundaries.

## Option 1: OpenStreetMap via Overpass API (Recommended for latest data)

The `fetch_osm_data.py` script downloads administrative boundaries directly from OpenStreetMap:

```bash
# Install dependencies
pip install requests

# Run the script
python scripts/fetch_osm_data.py
```

**What it downloads:**
- Counties (admin_level=4): 20 counties + Zagreb City
- Municipalities (admin_level=7): ~556 municipalities  
- Zagreb Districts (admin_level=10): 17 city districts

**Note:** The Overpass API can be slow and may rate-limit requests. The script includes delays between requests to be respectful of the service.

## Option 2: Pre-processed Data Sources

### GADM (Global Administrative Areas)

Download pre-processed Croatian boundaries from GADM:

1. Visit: https://gadm.org/download_country.html
2. Select "Croatia" and format "GeoJSON"
3. Download and extract to `public/data/geospatial/`
4. Rename files:
   - `gadm41_HRV_1.json` → `counties.geojson` (counties)
   - `gadm41_HRV_2.json` → `municipalities.geojson` (municipalities)

### Natural Earth Data

For simplified boundaries (faster rendering):

1. Visit: https://www.naturalearthdata.com/downloads/
2. Download "Admin 1 – States, Provinces" (1:10m scale)
3. Filter for Croatia and convert to GeoJSON

## Option 3: Manual OSM Export

Use the Overpass Turbo web interface for custom queries:

1. Visit: https://overpass-turbo.eu/
2. Paste the query from `fetch_osm_data.py`
3. Click "Run" and then "Export" → "GeoJSON"
4. Save to `public/data/geospatial/`

## Data Format

All GeoJSON files should follow this structure:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "unique-id",
        "name": "Municipality Name",
        "admin_level": 7,
        "population": 12345
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[...]]
      }
    }
  ]
}
```

**Important:** The `id` property must match the municipality IDs used in the election data JSON files.

## Matching Election Data to Geospatial Data

After downloading geospatial data, you'll need to ensure the IDs match:

1. List all municipality IDs from GeoJSON
2. Update election data JSON to use matching IDs
3. Or create a mapping file to translate between different ID systems

## File Sizes

Expected file sizes:
- Counties: ~500 KB - 2 MB
- Municipalities: ~5 MB - 20 MB (depends on detail level)
- Zagreb Districts: ~200 KB - 1 MB

For better performance, consider simplifying geometries using tools like:
- `mapshaper` (https://mapshaper.org/)
- `turf.simplify()` in JavaScript
- QGIS "Simplify geometries" tool

## Next Steps

After acquiring real geospatial data:

1. Update `dataLoader.ts` if file names changed
2. Verify IDs match between election and geospatial data
3. Test map rendering with real boundaries
4. Adjust zoom levels and initial view if needed
5. Consider adding TopoJSON support for smaller file sizes
