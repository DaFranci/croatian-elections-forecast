"""
Transform DIP CSV election data to JSON format for the application.

This script processes Croatian election CSV files from DIP (Državno izborno povjerenstvo)
and transforms them into the JSON format expected by our application.

The DIP CSV files are organized by electoral districts and use semicolon delimiters
with cp1250/windows-1250 encoding for Croatian characters.

Usage:
    python scripts/transform_election_data.py <year>

Example:
    python scripts/transform_election_data.py 2024
"""

import csv
import json
import sys
from pathlib import Path
from collections import defaultdict
import re

# Election metadata
ELECTION_METADATA = {
    '2024': {
        'election_id': '2024-parliamentary',
        'date': '2024-04-17',
        'type': 'parliamentary'
    },
    '2020': {
        'election_id': '2020-parliamentary',
        'date': '2020-07-05',
        'type': 'parliamentary'
    },
    '2016': {
        'election_id': '2016-parliamentary',
        'date': '2016-09-11',
        'type': 'parliamentary'
    }
}

def normalize_municipality_name(name):
    """
    Normalize municipality name to create URL-friendly ID.
    
    Examples:
        "ZAGREB-SESVETE" -> "zagreb-sesvete"
        "VELIKA GORICA" -> "velika-gorica"
    """
    if not name:
        return None
    
    # Convert to lowercase
    name = name.lower()
    
    # Replace Croatian special characters
    replacements = {
        'č': 'c', 'ć': 'c', 'đ': 'd', 'š': 's', 'ž': 'z',
        'Č': 'c', 'Ć': 'c', 'Đ': 'd', 'Š': 's', 'Ž': 'z'
    }
    for old, new in replacements.items():
        name = name.replace(old, new)
    
    # Remove extra spaces and normalize
    name = ' '.join(name.split())
    # Replace spaces with hyphens
    name = name.replace(' ', '-')
    # Remove any non-alphanumeric characters except hyphens
    name = re.sub(r'[^a-z0-9-]', '', name)
    # Remove multiple consecutive hyphens
    name = re.sub(r'-+', '-', name)
    # Remove leading/trailing hyphens
    name = name.strip('-')
    
    return name

def try_read_csv(filepath):
    """Try to read CSV with different encodings."""
    encodings = ['cp1250', 'windows-1250', 'iso-8859-2', 'utf-8', 'utf-8-sig']
    
    for encoding in encodings:
        try:
            with open(filepath, 'r', encoding=encoding) as f:
                reader = csv.DictReader(f, delimiter=';')
                # Try to read first row to verify encoding works
                first_row = next(reader, None)
                if first_row:
                    return encoding
        except (UnicodeDecodeError, Exception):
            continue
    
    return None

def clean_party_name(party_name):
    """Clean up party/coalition name."""
    if not party_name:
        return None
    
    # Remove extra whitespace
    party_name = ' '.join(party_name.split())
    
    # Skip if it's a candidate name (usually shorter and has specific patterns)
    if len(party_name) < 5:
        return None
    
    return party_name

def parse_coalition_name(coalition_name):
    """
    Parse coalition name to extract lead party.
    """
    if not coalition_name:
        return None
    
    # Split by comma to get individual parties
    parties = [p.strip() for p in coalition_name.split(',')]
    
    # Get first party (lead party)
    lead_party_full = parties[0]
    
    # Try to extract abbreviation after hyphen
    # Pattern: "FULL NAME - ABBR" or just "FULL NAME"
    if ' - ' in lead_party_full:
        parts = lead_party_full.split(' - ')
        
        # Iterate from end to find the best candidate for ID
        # We want an uppercase abbreviation, not a mixed-case candidate name
        best_part = parts[-1].strip()
        
        # If the last part looks like a name (mixed case) and we have other parts, try previous
        # e.g. "... - HSP - Dražen Keleminec" -> want "HSP", not "Dražen Keleminec"
        if not best_part.isupper() and len(parts) > 1:
            # Check second to last
            second_last = parts[-2].strip()
            if second_last.isupper():
                best_part = second_last
        
        lead_party = best_part
    else:
        # No abbreviation, use the full name
        lead_party = lead_party_full.strip()
    
    return lead_party

def extract_lead_party_id(coalition_name):
    """
    Extract and normalize lead party ID from coalition name.
    """
    lead_party = parse_coalition_name(coalition_name)
    if not lead_party:
        return None
    
    # Normalize the party ID
    # Remove quotes and special characters
    party_id = lead_party.replace('"', '').replace('!', '').strip()
    
    # Keep it mostly as-is for readability, just clean up
    party_id = ' '.join(party_id.split())
    
    return party_id

    return party_id

def identify_party_columns(headers):
    """
    Identify which columns contain party vote totals.
    Party columns are followed by 14 candidate columns.
    Pattern: Party column at index i, candidates at i+1 to i+14, next party at i+15
    """
    party_columns = []
    
    # Start from column 15 (index 15, which is the 16th column)
    # Columns 0-14 are metadata (Rbr IJ, Naziv IJ, ..., Važeći listići, Nevažeći listići)
    i = 15
    
    while i < len(headers):
        header = headers[i].strip()
        
        # Skip if empty
        if not header:
            i += 1
            continue
            
        # Check if this looks like a party name
        # It shouldn't be a candidate name (candidates are usually Name Surname)
        # Parties usually have uppercase, hyphens, or specific keywords
        
        # Add to list
        party_columns.append((i, header))
        
        # Skip the next 14 columns (candidates) and move to next party
        i += 15
    
    return party_columns

def extract_party_votes(row, party_columns, headers):
    """
    Extract party votes from the CSV row using identified columns.
    Returns a dict: { party_id: {'votes': count, 'coalition_name': name} }
    """
    parties = {}
    
    for col_idx, party_name in party_columns:
        # Get header name from headers list to be safe
        if col_idx >= len(headers):
            continue
            
        header = headers[col_idx]
        
        # Get vote count from row
        # row is a dict, so we need to access by header name
        votes_str = row.get(header, '0').strip()
        if not votes_str or votes_str == '':
            votes_str = '0'
        
        try:
            votes = int(votes_str)
            if votes > 0:  # Only include parties with votes
                # Clean up party name
                clean_name = clean_party_name(party_name)
                if clean_name:
                    party_id = extract_lead_party_id(clean_name)
                    if party_id:
                        parties[party_id] = {
                            'votes': votes,
                            'coalition_name': clean_name
                        }
        except ValueError:
            continue
    
    return parties

def process_csv_files(year):
    """Process all CSV files for a given election year."""
    csv_dir = Path(f"public/data/elections/csvs/{year}")
    
    if not csv_dir.exists():
        print(f"ERROR: Directory not found: {csv_dir}")
        return None
    
    # Get all regular result files (exclude inozemstvo and posebna)
    result_files = [f for f in csv_dir.glob('*_rezultati.csv') 
                   if 'inozemstvo' not in f.name and 'posebna' not in f.name]
    
    if not result_files:
        print(f"ERROR: No result files found in {csv_dir}")
        return None
    
    print(f"Found {len(result_files)} result files for {year}")
    
    # Aggregate results by municipality
    municipalities = defaultdict(lambda: {
        'name': '',
        'constituency': '',
        'total_voters': 0,
        'votes_cast': 0,
        'parties': {}  # Changed to regular dict to store structured data
    })
    
    constituencies = defaultdict(lambda: {
        'name': '',
        'total_voters': 0,
        'votes_cast': 0,
        'parties': {}
    })
    
    total_voters_national = 0
    total_votes_national = 0
    
    for csv_file in result_files:
        print(f"Processing: {csv_file.name}")
        
        # Detect encoding
        encoding = try_read_csv(csv_file)
        if not encoding:
            print(f"  WARNING: Could not read {csv_file.name}, skipping")
            continue
        
        try:
            with open(csv_file, 'r', encoding=encoding) as f:
                reader = csv.DictReader(f, delimiter=';')
                headers = reader.fieldnames
                
                # Identify party columns once per file
                party_columns = identify_party_columns(headers)
                
                # Identify constituency column once per file
                const_key = None
                voters_key = None
                votes_key = None
                
                for h in headers:
                    h_clean = h.strip().lstrip('\ufeff').lower()
                    if 'izborn' in h_clean and 'jedinic' in h_clean and 'naziv' in h_clean:
                        const_key = h
                    elif 'ukupno' in h_clean and 'bira' in h_clean:
                        voters_key = h
                    elif ('glasalo' in h_clean or 'glasovalo' in h_clean) and 'bira' in h_clean:
                        votes_key = h
                
                for row in reader:
                    # Extract municipality name
                    # Try different possible column names
                    # Extract municipality name
                    # Try different possible column names using case-insensitive search
                    muni_name = ''
                    for key in row.keys():
                        if not key: continue
                        # Clean key (remove BOM, whitespace)
                        k_clean = key.strip().lstrip('\ufeff')
                        k_lower = k_clean.lower()
                        
                        if k_lower in ['grad/općina', 'grad/opcina', 'grad/općina/država', 'grad/opcina/drzava']:
                             muni_name = row[key]
                             break
                        if k_lower == 'naziv' and not muni_name:
                             muni_name = row[key]
                    
                    muni_name = muni_name.strip()
                    
                    if not muni_name:
                        continue
                    
                    # Create municipality ID
                    muni_id = normalize_municipality_name(muni_name)
                    if not muni_id:
                        continue

                    # Handle Sveta Nedelja collision
                    if muni_id == 'sveta-nedelja':
                        county_name = (row.get('Naziv županije') or row.get('Županija') or '').lower()
                        if 'istarska' in county_name:
                            muni_id = 'sveta-nedelja-istarska'
                        elif 'zagrebačka' in county_name:
                            muni_id = 'sveta-nedelja-zagreb'
                    
                    # Extract vote data
                    try:
                        total_voters = 0
                        votes_cast = 0
                        
                        if voters_key:
                            total_voters = int(row.get(voters_key, '0').strip() or '0')
                        
                        if votes_key:
                            votes_cast = int(row.get(votes_key, '0').strip() or '0')
                            
                        # Fallback if keys not found (try common names)
                        if total_voters == 0:
                             total_voters = int(row.get('Ukupno birača', row.get('Broj birača', '0')).strip() or '0')
                        if votes_cast == 0:
                             votes_cast = int(row.get('Glasalo', row.get('Ukupno glasova', '0')).strip() or '0')
                             
                    except (ValueError, AttributeError):
                        continue
                    
                    if total_voters == 0:
                        continue
                    
                    # Extract constituency name
                    const_name = ''
                    if const_key:
                        const_name = row.get(const_key, '').strip()
                    
                    # Extract party votes
                    party_votes = extract_party_votes(row, party_columns, headers)
                    
                    # Aggregate data - Municipality
                    muni = municipalities[muni_id]
                    muni['name'] = muni_name
                    muni['constituency'] = const_name
                    muni['total_voters'] += total_voters
                    muni['votes_cast'] += votes_cast
                    
                    for party_id, data in party_votes.items():
                        if party_id not in muni['parties']:
                            muni['parties'][party_id] = {
                                'votes': 0,
                                'coalition_name': data['coalition_name']
                            }
                        muni['parties'][party_id]['votes'] += data['votes']

                    # Aggregate data - Constituency
                    if const_name:
                        const = constituencies[const_name]
                        const['name'] = const_name
                        const['total_voters'] += total_voters
                        const['votes_cast'] += votes_cast
                        for party_id, data in party_votes.items():
                            if party_id not in const['parties']:
                                const['parties'][party_id] = {
                                    'votes': 0,
                                    'coalition_name': data['coalition_name']
                                }
                            const['parties'][party_id]['votes'] += data['votes']
                    
                    total_voters_national += total_voters
                    total_votes_national += votes_cast
                    
        except Exception as e:
            print(f"  ERROR processing {csv_file.name}: {e}")
            continue
    
    # Calculate turnout and convert to final format
    results = {}
    for muni_id, muni_data in municipalities.items():
        turnout = muni_data['votes_cast'] / muni_data['total_voters'] if muni_data['total_voters'] > 0 else 0
        
        results[muni_id] = {
            'name': muni_data['name'],
            'constituency': muni_data['constituency'],
            'total_voters': muni_data['total_voters'],
            'votes_cast': muni_data['votes_cast'],
            'turnout': round(turnout, 4),
            'parties': muni_data['parties']
        }
    
    # Process constituency results
    constituency_results = {}
    for const_name, const_data in constituencies.items():
        turnout = const_data['votes_cast'] / const_data['total_voters'] if const_data['total_voters'] > 0 else 0
        # Create a simple ID for constituency (e.g. "I", "II", "X")
        # Extract Roman numeral or number from name
        # Assuming name format "I. IZBORNA JEDINICA"
        const_id = const_name.split('.')[0].strip() if '.' in const_name else const_name
        
        # Calculate winner and margin
        winner = None
        margin = 0
        
        if const_data['parties']:
            # Sort parties by votes
            sorted_parties = sorted(
                const_data['parties'].items(), 
                key=lambda x: x[1]['votes'], 
                reverse=True
            )
            
            if sorted_parties:
                winner = sorted_parties[0][0]
                winner_votes = sorted_parties[0][1]['votes']
                
                if len(sorted_parties) > 1:
                    runner_up_votes = sorted_parties[1][1]['votes']
                    margin = ((winner_votes - runner_up_votes) / const_data['votes_cast']) * 100 if const_data['votes_cast'] > 0 else 0
                else:
                    margin = (winner_votes / const_data['votes_cast']) * 100 if const_data['votes_cast'] > 0 else 0
        
        constituency_results[const_id] = {
            'name': const_data['name'],
            'total_voters': const_data['total_voters'],
            'votes_cast': const_data['votes_cast'],
            'turnout': round(turnout, 4),
            'winner': winner,
            'margin': round(margin, 2),
            'parties': const_data['parties']
        }
    
    # Calculate national turnout
    turnout_national = total_votes_national / total_voters_national if total_voters_national > 0 else 0
    
    # Get election metadata
    metadata = ELECTION_METADATA.get(year, {
        'election_id': f'{year}-parliamentary',
        'date': f'{year}-01-01',
        'type': 'parliamentary'
    })
    
    # Create final output
    output = {
        **metadata,
        'turnout_national': round(turnout_national, 4),
        'results': results,
        'constituencies': constituency_results
    }
    
    return output

def save_json(data, year):
    """Save election data to JSON file."""
    output_file = Path(f"public/data/elections/{year}-parliamentary.json")
    
    print(f"\nSaving to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Saved successfully!")
    return output_file

def print_summary(data):
    """Print summary of transformed data."""
    print(f"\n{'='*70}")
    print("TRANSFORMATION SUMMARY")
    print(f"{'='*70}")
    print(f"Election: {data['election_id']}")
    print(f"Date: {data['date']}")
    print(f"National Turnout: {data['turnout_national']*100:.2f}%")
    print(f"Municipalities: {len(data['results'])}")
    
    # Show sample municipalities
    print(f"\nSample municipalities:")
    for i, (muni_id, muni_data) in enumerate(list(data['results'].items())[:5], 1):
        print(f"  {i}. {muni_data['name']} ({muni_id})")
        print(f"     Turnout: {muni_data['turnout']*100:.1f}%, Parties: {len(muni_data['parties'])}")
    
    # Show all unique parties
    all_parties = set()
    for muni_data in data['results'].values():
        all_parties.update(muni_data['parties'].keys())
    
    print(f"\nUnique parties/coalitions found: {len(all_parties)}")
    for party in sorted(all_parties)[:10]:
        print(f"  - {party}")
    if len(all_parties) > 10:
        print(f"  ... and {len(all_parties) - 10} more")

def main():
    """Main execution."""
    if len(sys.argv) < 2:
        print("Usage: python transform_election_data.py <year>")
        print("\nExample:")
        print("  python transform_election_data.py 2024")
        print("\nAvailable years: 2024, 2020, 2016")
        sys.exit(1)
    
    year = sys.argv[1]
    
    print("="*70)
    print("DIP Election Data Transformer")
    print("="*70)
    print(f"Year: {year}\n")
    
    # Process CSV files
    data = process_csv_files(year)
    
    if not data:
        print("\nERROR: Failed to process CSV files")
        sys.exit(1)
    
    # Save to JSON
    output_file = save_json(data, year)
    
    # Print summary
    print_summary(data)
    
    print(f"\n{'='*70}")
    print("SUCCESS!")
    print(f"{'='*70}")
    print(f"\nNext steps:")
    print(f"1. Review the generated file: {output_file}")
    print(f"2. Run validation: python scripts/validate_election_data.py")
    print(f"3. Update parties.json if needed with new party names")
    print(f"4. Refresh your browser to see the data")

if __name__ == "__main__":
    main()
