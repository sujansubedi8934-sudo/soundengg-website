import re
import os

main_js_path = '/Users/sujansubedi/Documents/GitHub/soundengg-website/assets/js/main.js'

with open(main_js_path, 'r', encoding='utf-8') as f:
    code = f.read()

def extract_function(code, func_name):
    # Find start of function
    pattern = re.compile(r'function\s+' + func_name + r'\s*\([^)]*\)\s*\{')
    match = pattern.search(code)
    if not match:
        return code, None
    
    start_idx = match.start()
    
    # Brace matching
    brace_count = 0
    in_string = False
    string_char = ''
    escape = False
    
    end_idx = -1
    
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
        extracted = code[start_idx:end_idx]
        new_code = code[:start_idx] + code[end_idx:]
        return new_code, extracted
    
    return code, None

def save_to_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# 1. RTA Engine
code, initProfRTA = extract_function(code, 'initProfessionalRTA')
if initProfRTA:
    save_to_file('/Users/sujansubedi/Documents/GitHub/soundengg-website/assets/js/components/rtaEngine.js', initProfRTA)

# 2. Tuner Engine
code, initTuner = extract_function(code, 'initTuner')
if initTuner:
    save_to_file('/Users/sujansubedi/Documents/GitHub/soundengg-website/assets/js/components/tunerEngine.js', initTuner)

# 3. Signal Generator
code, initSigGen = extract_function(code, 'initSignalGenerator')
if initSigGen:
    save_to_file('/Users/sujansubedi/Documents/GitHub/soundengg-website/assets/js/components/signalGenerator.js', initSigGen)

# 4. Sub Calc
code, initSubCalc = extract_function(code, 'initSubCalc')
if initSubCalc:
    save_to_file('/Users/sujansubedi/Documents/GitHub/soundengg-website/assets/js/components/subCalc.js', initSubCalc)

# 5. Delay Calc
code, initDelayCalc = extract_function(code, 'initDelayCalc')
if initDelayCalc:
    save_to_file('/Users/sujansubedi/Documents/GitHub/soundengg-website/assets/js/components/delayCalc.js', initDelayCalc)

# 6. Ear Training
code, initEarTraining = extract_function(code, 'initEarTraining')
if initEarTraining:
    save_to_file('/Users/sujansubedi/Documents/GitHub/soundengg-website/assets/js/components/earTraining.js', initEarTraining)

# 7. Tap Tempo
code, initTapTempoDelay = extract_function(code, 'initTapTempoDelay')
if initTapTempoDelay:
    save_to_file('/Users/sujansubedi/Documents/GitHub/soundengg-website/assets/js/components/tapTempo.js', initTapTempoDelay)

with open(main_js_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Functions extracted successfully!")
