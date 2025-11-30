"""
Analyze the actual structure of DIP CSV files to identify:
1. Municipality column names
2. Party columns (followed by 14 candidate columns)
3. Vote count columns
"""

import csv
from pathlib import Path

def analyze_csv_detailed(csv_file):
    """Analyze CSV structure in detail."""
    encodings = ['cp1250', 'windows-1250', 'iso-8859-2']
    
    for encoding in encodings:
        try:
            with open(csv_file, 'r', encoding=encoding) as f:
                reader = csv.DictReader(f, delimiter=';')
                headers = reader.fieldnames
                
                print(f"Successfully read with encoding: {encoding}")
                print(f"\nTotal columns: {len(headers)}")
                print(f"\nAll column headers:")
                for i, header in enumerate(headers, 1):
                    print(f"  {i:3d}. '{header}'")
                
                # Read first few rows
                print(f"\nFirst 3 data rows:")
                for row_num, row in enumerate(reader, 1):
                    if row_num > 3:
                        break
                    print(f"\n  Row {row_num}:")
                    # Show first 15 columns
                    for i, (key, value) in enumerate(list(row.items())[:15], 1):
                        print(f"    {i:2d}. {key}: {value}")
                
                return True
                
        except Exception as e:
            continue
    
    return False

def main():
    """Analyze a sample CSV file."""
    csv_file = Path("public/data/elections/csvs/2024/02_01_rezultati.csv")
    
    if not csv_file.exists():
        print(f"File not found: {csv_file}")
        return
    
    print("="*70)
    print(f"Analyzing: {csv_file.name}")
    print("="*70)
    
    if not analyze_csv_detailed(csv_file):
        print("ERROR: Could not read file with any encoding")

if __name__ == "__main__":
    main()
