import json
import re

def modify_spells_data(spells_data):
    """
    Modifies the spell data in-memory.
    - Adds 'damage' tag if spell deals damage.
    - Adds 'needs_save' tag if spell requires a saving throw.
    - Adds 'damage | [damage of the spell]' to contents array.
    Returns the modified spells_data.
    """
    # Regex to find damage descriptions
    # Captures dice, optional static bonus, and text up to "damage", case insensitive
    damage_regex = re.compile(r"(\d+d\d+(?:\s*\+\s*\d+)?\s*[^.,;]*?damage\b)", re.IGNORECASE)
    # More specific regex for flagging a spell as "deals_damage"
    specific_damage_dice_regex = re.compile(r"\b\d+d\d+(?:\s*\+\s*\d+)?(?:\s+\w+)?\s*damage\b", re.IGNORECASE)

    for spell in spells_data:
        deals_damage_flag = False
        needs_save_flag = False
        extracted_damage_phrase_for_content = None

        # Ensure 'tags' and 'contents' exist and are lists
        if "tags" not in spell or not isinstance(spell.get("tags"), list):
            spell["tags"] = []
        if "contents" not in spell or not isinstance(spell.get("contents"), list):
            spell["contents"] = [] 
        
        # Work on a copy of contents for modification
        new_contents = list(spell["contents"])
        # Remove any pre-existing "damage | ..." lines to prevent duplicates
        new_contents = [line for line in new_contents if not (isinstance(line, str) and line.startswith("damage | "))]

        text_lines_to_analyze = []
        # Analyze original contents to find damage and save info
        for content_line in spell.get("contents", []): 
            if not isinstance(content_line, str):
                continue
            # Consider "text |" for primary description and "description |" for e.g. cantrip upgrades
            if content_line.lower().startswith("text |"):
                text_lines_to_analyze.append(content_line[len("text |"):].strip())
            elif content_line.lower().startswith("description |"):
                text_lines_to_analyze.append(content_line[len("description |"):].strip())

        first_damage_phrase_found = False
        for text_part_to_check in text_lines_to_analyze:
            # Check for specific damage dice for the 'damage' tag
            if specific_damage_dice_regex.search(text_part_to_check):
                deals_damage_flag = True

            # Attempt to extract the damage phrase for the 'damage | ...' content entry
            if not first_damage_phrase_found:
                damage_match = damage_regex.search(text_part_to_check)
                if damage_match:
                    potential_damage_text = damage_match.group(1).strip()
                    # Avoid using "half as much damage" as primary, unless it contains its own dice
                    if not potential_damage_text.lower().startswith("half as much") or \
                       specific_damage_dice_regex.search(potential_damage_text):
                        # Clean up to get just the damage part (e.g., "12d8 necrotic damage")
                        cleaned_phrase = potential_damage_text.split(",")[0].split(" on a")[0].strip()
                        if cleaned_phrase.lower().startswith("extra "): # Remove "extra " prefix
                            cleaned_phrase = cleaned_phrase[len("extra "):]
                        
                        extracted_damage_phrase_for_content = cleaned_phrase
                        deals_damage_flag = True 
                        first_damage_phrase_found = True # Found phrase for content line

            # Check for saving throw keyword
            if "saving throw" in text_part_to_check.lower():
                needs_save_flag = True
        
        # Add tags based on flags
        if deals_damage_flag and "damage" not in spell["tags"]:
            spell["tags"].append("damage")
        
        if needs_save_flag and "needs_save" not in spell["tags"]:
            spell["tags"].append("needs_save")

        # Add the "damage | [damage of the spell]" line to contents
        if extracted_damage_phrase_for_content:
            damage_info_line = f"damage | {extracted_damage_phrase_for_content}"
            
            insert_index = len(new_contents) # Default to appending at the end
            last_desc_line_idx = -1
            # Find the last line that is part of the main spell description text or bullets
            for i in range(len(new_contents) - 1, -1, -1):
                line = new_contents[i]
                if isinstance(line, str) and (line.startswith("text |") or line.startswith("bullet |")):
                    last_desc_line_idx = i
                    break
            
            if last_desc_line_idx != -1:
                insert_index = last_desc_line_idx + 1
            
            # Insert the damage info line, ensuring not to duplicate if it somehow got there
            if damage_info_line not in new_contents:
                 new_contents.insert(insert_index, damage_info_line)
        
        spell["contents"] = new_contents
        
    return spells_data

def main():
    input_filename = "spells.json"  # Make sure this file is in the same directory, or provide the full path
    output_filename = "modified_spells.json"

    try:
        with open(input_filename, 'r', encoding='utf-8') as f:
            spells_data = json.load(f)
        print(f"Successfully loaded '{input_filename}'")
    except FileNotFoundError:
        print(f"Error: The file '{input_filename}' was not found in the current directory.")
        return
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from '{input_filename}'. Please check the file format.")
        return
    except Exception as e:
        print(f"An unexpected error occurred while loading '{input_filename}': {e}")
        return

    modified_data = modify_spells_data(spells_data)

    try:
        with open(output_filename, 'w', encoding='utf-8') as outfile:
            json.dump(modified_data, outfile, indent=4, ensure_ascii=False)
        print(f"Successfully processed spells and saved the modified data to '{output_filename}'")
    except Exception as e:
        print(f"An error occurred while saving '{output_filename}': {e}")

if __name__ == "__main__":
    main()