import os

main_js_path = '/Users/sujansubedi/Documents/GitHub/soundengg-website/assets/js/main.js'
ad_manager_path = '/Users/sujansubedi/Documents/GitHub/soundengg-website/assets/js/utils/adManager.js'

with open(main_js_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find start and end of ad manager
start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if '// ==========================================' in line and 'AD MANAGER SYSTEM' in lines[i+1]:
        start_idx = i
        break

if start_idx != -1:
    # Find end of initAdManager function
    # It ends with '}' at the root level before '// --- TOOL HELP MODAL SYSTEM ---'
    for i in range(start_idx, len(lines)):
        if '// --- TOOL HELP MODAL SYSTEM ---' in lines[i]:
            # The function ends before this comment
            end_idx = i - 1
            break

if start_idx != -1 and end_idx != -1:
    # Extract the block
    ad_block = lines[start_idx:end_idx]
    
    # Save to adManager.js
    with open(ad_manager_path, 'w', encoding='utf-8') as f:
        f.writelines(ad_block)
        
    # Remove from main.js
    new_lines = lines[:start_idx] + lines[end_idx:]
    with open(main_js_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
        
    print(f"Extracted {len(ad_block)} lines to {ad_manager_path}")
    print(f"Removed from {main_js_path}")
else:
    print("Could not find start or end index.")
