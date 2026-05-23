import re

main_js_path = '/Users/sujansubedi/Documents/GitHub/soundengg-website/assets/js/main.js'

with open(main_js_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Extract PINOUT logic
# From '// --- PINOUT COMPONENT LOGIC ---' to the end of 'window.togglePinout = function(hdrEl) { ... }'
start_pinout = code.find('// --- PINOUT COMPONENT LOGIC ---')
if start_pinout != -1:
    # Find the end of window.togglePinout
    pattern = re.compile(r'window\.togglePinout\s*=\s*function\s*\([^)]*\)\s*\{')
    match = pattern.search(code, start_pinout)
    if match:
        start_idx = match.start()
        brace_count = 0
        end_idx = -1
        in_string = False
        string_char = ''
        escape = False
        
        for i in range(match.end() - 1, len(code)):
            char = code[i]
            if escape:
                escape = False
                continue
            if char == '\\':
                escape = True
                continue
            if in_string:
                if char == string_char:
                    in_string = False
                continue
            if char in ("'", '"', '`'):
                in_string = True
                string_char = char
                continue
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_idx = i + 1
                    break
        
        if end_idx != -1:
            pinout_code = code[start_pinout:end_idx]
            with open('/Users/sujansubedi/Documents/GitHub/soundengg-website/assets/js/components/pinouts.js', 'w', encoding='utf-8') as f:
                f.write(pinout_code)
            code = code[:start_pinout] + code[end_idx:]

# 2. Extract GLOBALS/Search/Blog/Other UI components
# Actually, let's just extract initBlog and initGlobalSearch via the standard function extractor

def extract_function(c, func_name):
    pattern = re.compile(r'function\s+' + func_name + r'\s*\([^)]*\)\s*\{')
    match = pattern.search(c)
    if not match:
        return c, None
    start_idx = match.start()
    brace_count = 0
    end_idx = -1
    in_string = False
    string_char = ''
    escape = False
    for i in range(match.end() - 1, len(c)):
        char = c[i]
        if escape:
            escape = False
            continue
        if char == '\\':
            escape = True
            continue
        if in_string:
            if char == string_char:
                in_string = False
            continue
        if char in ("'", '"', '`'):
            in_string = True
            string_char = char
            continue
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0:
                end_idx = i + 1
                break
    if end_idx != -1:
        extracted = c[start_idx:end_idx]
        new_code = c[:start_idx] + c[end_idx:]
        return new_code, extracted
    return c, None

code, initBlog = extract_function(code, 'initBlog')
if initBlog:
    with open('/Users/sujansubedi/Documents/GitHub/soundengg-website/assets/js/components/blogEngine.js', 'w', encoding='utf-8') as f:
        f.write(initBlog)

# Write back main.js
with open(main_js_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Pinouts and Blog extracted!")
