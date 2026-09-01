# Fetching Real Croatian Election Data

This guide explains how to obtain real election data from the Croatian State Electoral Commission (Državno izborno povjerenstvo - DIP).

## Official Data Source

**Croatian State Electoral Commission (DIP)**
- Website: https://www.izbori.hr/
- Official results portal: https://www.izbori.hr/rezultati/

## Available Elections

Recent parliamentary elections:
- **2024** - April 17, 2024
- **2020** - July 5, 2020
- **2016** - September 11, 2016
- **2015** - November 8, 2015
- **2011** - December 4, 2011

## Data Access Methods

### Option 1: Official DIP Website (Manual Download)

The DIP website publishes official results after each election:

1. **Visit**: https://www.izbori.hr/
2. **Navigate** to "Rezultati" (Results)
3. **Select** the election year and type (Parliamentary/Sabor)
4. **Download** results in available formats (usually Excel/CSV)

**Pros:**
- ✅ Official, verified data
- ✅ Complete and accurate
- ✅ Includes all municipalities

**Cons:**
- ⚠️ Manual process
- ⚠️ Data format varies by election
- ⚠️ Requires transformation to JSON

### Option 2: DIP API/Data Portal

DIP may provide structured data access:

1. Check https://www.izbori.hr/ for API documentation
2. Look for "Otvoreni podaci" (Open Data) section
3. Download structured data files (CSV, JSON, XML)

**Note:** As of 2024, DIP's API availability varies. Check their website for current options.

### Option 3: Third-Party Data Aggregators

Several organizations aggregate Croatian election data:

1. **Croatian Bureau of Statistics (DZS)**
   - https://www.dzs.hr/
   - May have historical election statistics

2. **News Organizations**
   - Major Croatian news outlets often publish election data
   - May provide CSV/JSON exports

3. **Academic/Research Datasets**
   - Check repositories like Harvard Dataverse
   - Search for "Croatian election data"

## Data Format Requirements

Our application expects election data in this JSON format:

```json
{
  "election_id": "2024-parliamentary",
  "date": "2024-04-17",
  "type": "parliamentary",
  "turnout_national": 0.623,
  "results": {
    "municipality-id": {
      "name": "Municipality Name",
      "total_voters": 100000,
      "votes_cast": 62300,
      "turnout": 0.623,
      "parties": {
        "HDZ": 25000,
        "SDP": 20000,
        "Most": 10000,
        "Mozemo": 5000,
        "DP": 2000,
        "Other": 300
      }
    }
  }
}
```

## Step-by-Step: Getting 2024 Election Data

### Step 1: Download Raw Data

1. Visit https://www.izbori.hr/
2. Navigate to 2024 Parliamentary Election results
3. Download results by municipality (if available as CSV/Excel)
4. Save to `public/data/elections/csvs/2024/` (one CSV per constituency)

### Step 2: Identify Data Structure

Open the downloaded file and note:
- Column names for municipality, party names, vote counts
- How municipalities are identified (name, code, etc.)
- Total voters vs. votes cast columns
- Party/coalition naming conventions

### Step 3: Create Transformation Script

I'll create a Python script to help transform the data:

```python
# See scripts/transform_election_data.py
```

### Step 4: Match Municipality IDs

The trickiest part is matching DIP municipality names to our GeoJSON IDs:

**DIP might use:**
- "Grad Zagreb" or "Zagreb"
- "Općina Berek" or "Berek"
- Official codes (e.g., "01001")

**Our GeoJSON uses:**
- URL-friendly IDs: "zagreb", "berek", "cazma"

You'll need to create a mapping file or use fuzzy matching.

## Common Data Challenges

### 1. Municipality Name Variations

**Problem:** DIP uses "Grad Zagreb", our app uses "zagreb"

**Solution:** Create a mapping file:
```json
{
  "Grad Zagreb": "zagreb",
  "Općina Berek": "berek",
  "Čazma": "cazma"
}
```

### 2. Party Name Changes

**Problem:** Parties form coalitions with different names each election

**Solution:** 
- Normalize party names in `parties.json`
- Map coalition names to primary parties
- Use "Other" category for minor parties

### 3. Administrative Boundary Changes

**Problem:** Municipalities merge, split, or change between elections

**Solution:**
- Use the most recent (2024) municipality boundaries
- Aggregate historical data for merged municipalities
- Note boundary changes in metadata

### 4. Missing Data

**Problem:** Some municipalities may have incomplete data

**Solution:**
- Mark as null/undefined in JSON
- Display differently on map (grey/striped)
- Add data quality indicators

## Automated Data Fetching (Advanced)

If DIP provides an API or structured data portal, you can automate fetching:

```python
# Example: Automated DIP data fetcher
import requests
import json

def fetch_dip_election_data(election_year):
    """
    Fetch election data from DIP API.
    Note: This is a template - actual API endpoints may differ.
    """
    # Check DIP website for actual API endpoint
    api_url = f"https://www.izbori.hr/api/results/{election_year}"
    
    response = requests.get(api_url)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Failed to fetch data: {response.status_code}")
```

## Manual Data Entry (Small Scale)

For testing or small datasets, you can manually enter data:

1. Find official results for your municipalities of interest
2. Copy the template from `public/data/elections/2024-parliamentary.json`
3. Update the vote counts for each party
4. Ensure municipality IDs match your GeoJSON

## Data Validation

After creating election JSON files, validate them:

```python
# See scripts/validate_election_data.py
```

This will check:
- ✓ All municipality IDs exist in GeoJSON
- ✓ Vote totals match votes_cast
- ✓ Turnout calculations are correct
- ✓ No negative values
- ✓ Party names match parties.json

## Recommended Workflow

### For 2024 Election (Most Recent)

1. **Download** official results from DIP website
2. **Transform** using the provided Python script
3. **Validate** the output JSON
4. **Test** in the application
5. **Adjust** party colors in `parties.json` if needed

### For Historical Elections (2020, 2016, etc.)

1. **Research** if data is available in digital format
2. **Consider** using aggregated datasets (academic sources)
3. **Prioritize** major municipalities if full data is unavailable
4. **Document** data sources and any limitations

## Next Steps

I can help you with:

1. **Create a transformation script** once you have the raw DIP data
2. **Build a municipality ID mapping** between DIP and our GeoJSON
3. **Generate sample data** for all 560 municipalities (for testing)
4. **Create a validation script** to check data quality
5. **Set up automated data fetching** if DIP has an API

## Resources

- **DIP Official Site**: https://www.izbori.hr/
- **Croatian Bureau of Statistics**: https://www.dzs.hr/
- **OpenStreetMap Croatia**: https://www.openstreetmap.org/relation/214885
- **Election Data Archive**: Check academic repositories

## Contact DIP

If you need specific data formats or have questions:

**Državno izborno povjerenstvo**
- Email: Check their website for contact information
- Phone: Available on izbori.hr
- Request: Structured data exports (CSV/JSON) for research purposes

---

**Ready to proceed?** Let me know when you have raw election data, and I'll help you transform it into the correct format!
