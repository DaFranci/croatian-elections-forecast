"""
Validate election data JSON files.

This script checks:
- Municipality IDs match GeoJSON
- Vote totals are correct
- Turnout calculations are accurate
- No negative values
- Party names exist in parties.json
"""

import json
from pathlib import Path

def load_geojson_ids():
    """Load all municipality IDs from GeoJSON."""
    geojson_file = Path("public/data/geospatial/municipalities.geojson")
    
    if not geojson_file.exists():
        print("Warning: municipalities.geojson not found")
        return set()
    
    with open(geojson_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    return {feature['properties']['id'] for feature in data['features']}

def load_party_ids():
    """Load all party IDs from parties.json."""
    parties_file = Path("public/data/elections/parties.json")
    
    if not parties_file.exists():
        print("Warning: parties.json not found")
        return set()
    
    with open(parties_file, 'r', encoding='utf-8') as f:
        parties = json.load(f)
    
    return {party['id'] for party in parties}

def validate_election_file(election_file, geojson_ids, party_ids):
    """Validate a single election JSON file."""
    print(f"\nValidating {election_file.name}...")
    print("="*60)
    
    with open(election_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    errors = []
    warnings = []
    
    # Check required fields
    required_fields = ['election_id', 'date', 'type', 'turnout_national', 'results']
    for field in required_fields:
        if field not in data:
            errors.append(f"Missing required field: {field}")
    
    if 'results' not in data:
        return errors, warnings
    
    # Validate each municipality
    total_voters_sum = 0
    total_votes_sum = 0
    
    for muni_id, result in data['results'].items():
        # Check if municipality exists in GeoJSON
        if geojson_ids and muni_id not in geojson_ids:
            warnings.append(f"Municipality '{muni_id}' not found in GeoJSON")
        
        # Check required municipality fields
        required_muni_fields = ['name', 'total_voters', 'votes_cast', 'turnout', 'parties']
        for field in required_muni_fields:
            if field not in result:
                errors.append(f"Municipality '{muni_id}' missing field: {field}")
                continue
        
        # Validate numbers
        total_voters = result.get('total_voters', 0)
        votes_cast = result.get('votes_cast', 0)
        turnout = result.get('turnout', 0)
        
        if total_voters < 0:
            errors.append(f"Municipality '{muni_id}' has negative total_voters")
        if votes_cast < 0:
            errors.append(f"Municipality '{muni_id}' has negative votes_cast")
        if turnout < 0 or turnout > 1:
            errors.append(f"Municipality '{muni_id}' has invalid turnout: {turnout}")
        
        # Check turnout calculation
        if total_voters > 0:
            calculated_turnout = votes_cast / total_voters
            if abs(calculated_turnout - turnout) > 0.001:
                warnings.append(
                    f"Municipality '{muni_id}' turnout mismatch: "
                    f"stated={turnout:.4f}, calculated={calculated_turnout:.4f}"
                )
        
        # Validate party votes
        parties = result.get('parties', {})
        party_votes_sum = sum(parties.values())
        
        for party_id, votes in parties.items():
            if votes < 0:
                errors.append(f"Municipality '{muni_id}', party '{party_id}' has negative votes")
            
            if party_ids and party_id not in party_ids:
                warnings.append(f"Party '{party_id}' not found in parties.json")
        
        # Check if party votes sum matches votes_cast
        if abs(party_votes_sum - votes_cast) > 1:  # Allow small rounding errors
            warnings.append(
                f"Municipality '{muni_id}' vote mismatch: "
                f"votes_cast={votes_cast}, party_sum={party_votes_sum}"
            )
        
        total_voters_sum += total_voters
        total_votes_sum += votes_cast
    
    # Validate national turnout
    if total_voters_sum > 0:
        calculated_national_turnout = total_votes_sum / total_voters_sum
        stated_turnout = data.get('turnout_national', 0)
        
        if abs(calculated_national_turnout - stated_turnout) > 0.001:
            warnings.append(
                f"National turnout mismatch: "
                f"stated={stated_turnout:.4f}, calculated={calculated_national_turnout:.4f}"
            )
    
    return errors, warnings

def main():
    """Main validation."""
    print("="*60)
    print("Election Data Validator")
    print("="*60)
    
    # Load reference data
    print("\nLoading reference data...")
    geojson_ids = load_geojson_ids()
    party_ids = load_party_ids()
    
    print(f"Found {len(geojson_ids)} municipalities in GeoJSON")
    print(f"Found {len(party_ids)} parties in parties.json")
    
    # Find all election JSON files
    elections_dir = Path("public/data/elections")
    election_files = list(elections_dir.glob("*-parliamentary.json"))
    
    if not election_files:
        print("\nNo election files found!")
        return
    
    print(f"\nFound {len(election_files)} election files to validate")
    
    # Validate each file
    all_errors = []
    all_warnings = []
    
    for election_file in sorted(election_files):
        errors, warnings = validate_election_file(election_file, geojson_ids, party_ids)
        all_errors.extend([(election_file.name, e) for e in errors])
        all_warnings.extend([(election_file.name, w) for w in warnings])
    
    # Print results
    print("\n" + "="*60)
    print("VALIDATION RESULTS")
    print("="*60)
    
    if all_errors:
        print(f"\n❌ ERRORS ({len(all_errors)}):")
        for filename, error in all_errors:
            print(f"  [{filename}] {error}")
    else:
        print("\n✅ No errors found!")
    
    if all_warnings:
        print(f"\n⚠️  WARNINGS ({len(all_warnings)}):")
        for filename, warning in all_warnings:
            print(f"  [{filename}] {warning}")
    else:
        print("\n✅ No warnings!")
    
    print("\n" + "="*60)
    if all_errors:
        print("FAILED - Please fix errors before using the data")
    elif all_warnings:
        print("PASSED with warnings - Review warnings and decide if they're acceptable")
    else:
        print("PASSED - All validation checks successful!")
    print("="*60)

if __name__ == "__main__":
    main()
