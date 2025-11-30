# Quick Guide: Getting Real Croatian Geospatial Data

## Current Status
The application currently uses **simplified rectangular boundaries** for 15 major Croatian cities. These are placeholders for demonstration purposes.

## Option 1: Download from GADM (Recommended - Easiest)

GADM provides pre-processed, high-quality administrative boundaries:

1. **Visit**: https://gadm.org/download_country.html
2. **Select**: Croatia
3. **Choose format**: GeoJSON
4. **Download**: Level 2 (Municipalities/Cities)
5. **Extract** the downloaded file
6. **Rename**: `gadm41_HRV_2.json` → `municipalities.geojson`
7. **Move** to: `public/data/geospatial/municipalities.geojson`

**Pros**: 
- ✅ High quality, verified boundaries
- ✅ Includes all 556 municipalities
- ✅ Ready to use, no processing needed
- ✅ Fast download (~5-10 MB)

**Cons**:
- ⚠️ May not include latest 2024 redistricting changes
- ⚠️ Property names may need mapping

## Option 2: OpenStreetMap via Overpass Turbo (Interactive)

Use the web interface for custom queries:

1. **Visit**: https://overpass-turbo.eu/
2. **Paste this query**:
```
[out:json][timeout:300];
area["ISO3166-2"="HR"]->.croatia;
(
  relation["admin_level"="7"]["boundary"="administrative"](area.croatia);
);
out geom;
```
3. **Click "Run"** (⏵ button)
4. **Wait** for results (may take 1-2 minutes)
5. **Export** → "GeoJSON"
6. **Save** as `municipalities.geojson`
7. **Move** to: `public/data/geospatial/`

**Pros**:
- ✅ Latest OSM data (includes 2024 changes)
- ✅ Interactive, visual feedback
- ✅ Can customize query easily

**Cons**:
- ⚠️ Slower than GADM
- ⚠️ May timeout for large queries
- ⚠️ Requires manual export

## Option 3: Python Script (Automated)

Run the included Python script:

```bash
# Install dependencies
pip install requests

# Run the script
python scripts/fetch_osm_data.py
```

This will download:
- Counties (`counties.geojson`)
- Municipalities (`municipalities.geojson`)
- Zagreb districts (`zagreb_districts.geojson`)

**Pros**:
- ✅ Fully automated
- ✅ Downloads all levels at once
- ✅ Latest OSM data

**Cons**:
- ⚠️ Requires Python and requests library
- ⚠️ May take 5-10 minutes
- ⚠️ Overpass API can be slow/rate-limited

## After Downloading Real Data

### 1. Verify the GeoJSON Structure

Open the file and check it has this structure:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Zagreb",
        ...
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [...]
      }
    }
  ]
}
```

### 2. Map Municipality IDs

The `id` property in GeoJSON must match election data. You may need to:

1. **List all IDs** from the GeoJSON
2. **Create a mapping** between OSM names and your election data IDs
3. **Update** either the GeoJSON or election JSON files

Example mapping script:
```javascript
// In browser console or Node.js
const geoData = await fetch('/data/geospatial/municipalities.geojson').then(r => r.json());
const ids = geoData.features.map(f => ({
  name: f.properties.name,
  id: f.properties.name.toLowerCase().replace(/\s+/g, '-')
}));
console.table(ids);
```

### 3. Simplify Geometries (Optional)

Large GeoJSON files can slow down rendering. Simplify using:

**Online**: https://mapshaper.org/
- Upload your GeoJSON
- Run: `simplify 10%` (adjust percentage)
- Export as GeoJSON

**Command line** (requires mapshaper):
```bash
npm install -g mapshaper
mapshaper municipalities.geojson -simplify 10% -o municipalities_simplified.geojson
```

### 4. Test in the Application

1. Replace `public/data/geospatial/municipalities.geojson`
2. Refresh the application
3. Check that municipalities render correctly
4. Adjust zoom levels if needed in `ElectionMap.tsx`

## Troubleshooting

### Map is blank after loading real data
- Check browser console for errors
- Verify GeoJSON is valid: https://geojsonlint.com/
- Ensure coordinates are in [longitude, latitude] order

### IDs don't match
- Add `id` property to each feature based on `name`
- Or update election JSON to use OSM property names

### File is too large (>20 MB)
- Simplify geometries using mapshaper
- Consider using TopoJSON format (smaller)
- Split into multiple files by region

### Rendering is slow
- Reduce geometry complexity
- Use vector tiles instead of GeoJSON
- Implement zoom-based layer visibility

## Recommended Approach

**For quick testing**: Use GADM (Option 1)
**For production**: Use OSM via Overpass Turbo (Option 2) or Python script (Option 3)

## Next Steps

After getting real geospatial data:
1. Add county-level boundaries
2. Add Zagreb city districts for drill-down
3. Implement zoom-based layer switching
4. Add actual polling station locations (points)
