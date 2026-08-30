#!/usr/bin/env python3
"""
DeepSeek V4 Pro CLI & Runner via NVIDIA NIM
Model: deepseek-ai/deepseek-v4-pro-0813
Features: Ultra-fast code generation, math reasoning, and flexible thinking controls.
"""

import sys
import os
import json
import urllib.request
import urllib.error

def get_api_key():
    if os.environ.get("NVIDIA_DEEPSEEK_KEY"):
        return os.environ.get("NVIDIA_DEEPSEEK_KEY")
    if os.environ.get("NVIDIA_API_KEY"):
        return os.environ.get("NVIDIA_API_KEY")
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip().startswith("NVIDIA_DEEPSEEK_KEY") or line.strip().startswith("NVIDIA_API_KEY"):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None

API_KEY = get_api_key()
BASE_URL = "https://integrate.api.nvidia.com/v1"
MODEL = "deepseek-ai/deepseek-v4-pro-0813"

def query_deepseek_v4(prompt, thinking=False, max_tokens=4096):
    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "system",
                "content": "You are DeepSeek V4 Pro, an expert AI software engineer specialized in DSP audio algorithms, high-performance web development, and game physics."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.7 if not thinking else 1.0,
        "top_p": 0.95,
        "max_tokens": max_tokens,
        "seed": 42,
        "chat_template_kwargs": {
            "thinking": thinking
        },
        "stream": False
    }

    req = urllib.request.Request(
        BASE_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }
    )

    try:
        with urllib.request.urlopen(req) as response:
            res_data = response.read().decode("utf-8")
            data = json.loads(res_data)
            choice = data.get("choices", [{}])[0]
            message = choice.get("message", {})
            
            reasoning = message.get("reasoning_content")
            content = message.get("content", "")

            if reasoning:
                print("\033[36m🧠 [DeepSeek Thinking]:\033[0m\n")
                print(f"\033[90m{reasoning}\033[0m\n")
                print("--------------------------------------------------\n")

            print("\033[32m💡 [DeepSeek V4 Pro Output]:\033[0m\n")
            print(content)
            
            usage = data.get("usage", {})
            print(f"\n\033[90m📊 Tokens (Prompt: {usage.get('prompt_tokens', 0)} | Completion: {usage.get('completion_tokens', 0)} | Total: {usage.get('total_tokens', 0)})\033[0m")
            
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"\033[31m❌ HTTP Error {e.code}:\033[0m {err_body}", file=sys.stderr)
    except Exception as e:
        print(f"\033[31m❌ Error:\033[0m {e}", file=sys.stderr)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        prompt = "Write a limerick about the wonders of GPU computing."
    else:
        prompt = " ".join(sys.argv[1:]).strip()

    thinking = "--thinking" in sys.argv
    prompt = prompt.replace("--thinking", "").strip()

    print(f"\033[1;34m⚡ Querying DeepSeek V4 Pro (0813)...\033[0m\n")
    query_deepseek_v4(prompt, thinking=thinking)
