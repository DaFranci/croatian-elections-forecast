import csv
import sys

filepath = r"c:\Users\FranoMihaljevic\Documents\Personal\Elections\public\data\elections\csvs\2024\02_01_rezultati.csv"
encodings = ['cp1250', 'utf-8']

for enc in encodings:
    try:
        with open(filepath, 'r', encoding=enc) as f:
            reader = csv.DictReader(f, delimiter=';')
            print(f"Successfully opened with {enc}")
            
            # Find the column name for municipality
            muni_col = None
            for h in reader.fieldnames:
                if 'GRAD' in h.upper() and 'OP' in h.upper():
                    muni_col = h
                    break
            
            print(f"Municipality column: {muni_col}")
            
            found_zagreb = False
            for i, row in enumerate(reader):
                if muni_col:
                    val = row.get(muni_col, '')
                    if 'ZAGREB' in val.upper():
                        print(f"Row {i}: {val}")
                        found_zagreb = True
                        if i > 1000: break # Safety break if too many
            
            if not found_zagreb:
                print("No ZAGREB found in municipality column.")
                    
        break
    except Exception as e:
        print(f"Failed with {enc}: {e}")
