import json
from pathlib import Path

def update_mapping_sveta_nedelja():
    mapping_path = Path("public/data/elections/municipality_mapping.json")
    
    print("Updating Mapping File...")
    with open(mapping_path, 'r', encoding='utf-8') as f:
        mapping_data = json.load(f)
        
    # Remove old mapping if exists
    if "sveta-nedelja" in mapping_data:
        print("Removing old mapping 'sveta-nedelja'")
        del mapping_data["sveta-nedelja"]
        
    # Add new mappings
    new_mappings = {
        "sveta-nedelja-istarska": "svetanedeljaistarska",
        "sveta-nedelja-zagreb": "svetanedeljazagreb"
    }
    
    for k, v in new_mappings.items():
        print(f"Adding mapping: {k} -> {v}")
        mapping_data[k] = v
            
    with open(mapping_path, 'w', encoding='utf-8') as f:
        json.dump(mapping_data, f, indent=2)
    print("Saved municipality_mapping.json")

if __name__ == "__main__":
    update_mapping_sveta_nedelja()
