import os

filepath = 'assets/js/main.js'
with open(filepath, 'r') as f:
    lines = f.readlines()

# Extract Premium Logic (lines 403 to 525, which is index 402 to 525)
# Wait, let's search for exact indices to be safe.
def find_index(prefix):
    for i, l in enumerate(lines):
        if l.startswith(prefix):
            return i
    return -1

idx_premium_start = find_index("window.isPremiumActive = function(featureKey) {")
idx_premium_end = find_index("};") # We need the specific one ending updatePremiumUI

# Actually, exact line numbers are known because we just viewed them.
# premium: 403 to 525 (inclusive) -> indices 402 to 525
# syncSubscriptionStatus: 528 to 961 -> indices 527 to 961
# auth block inside initAuthAndCore: 190 to 390 -> indices 189 to 390

auth_inner = lines[189:390]
sync_func = lines[527:961]
premium_funcs = lines[400:525] # Includes globalUnitSystem and isUserPro? Wait, let's keep globalUnitSystem in main.js, so premium starts at 401.

with open('assets/js/modules/auth.js', 'w') as f:
    f.write("function initAuthSystem() {\n")
    f.writelines(auth_inner)
    f.write("}\n\n")
    f.writelines(sync_func)
    f.write("\nwindow.initAuthSystem = initAuthSystem;\nwindow.syncSubscriptionStatus = syncSubscriptionStatus;\n")

# Now modify main.js
# We must delete in reverse order to not mess up indices!
del lines[527:961] # delete syncSubscriptionStatus
del lines[400:525] # delete premium logic (isUserPro, isPremiumActive, updatePremiumUI)
del lines[189:390] # delete auth inner block

# Insert `safeInit(initAuthSystem, 'initAuthSystem');` at index 189
lines.insert(189, "    safeInit(initAuthSystem, 'initAuthSystem');\n")

with open(filepath, 'w') as f:
    f.writelines(lines)

print("Phase 2 extraction complete!")
