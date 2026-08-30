#!/usr/bin/env python3
"""
NVIDIA Nemotron 3 Ultra 550B Reasoning CLI & Runner
Model: nvidia/nemotron-3-ultra-550b-a55b
Features: Real-time streaming of internal thinking/reasoning and completion text.
"""

import sys
import os
import json
import urllib.request
import urllib.error

def get_api_key():
    if os.environ.get("NVIDIA_API_KEY"):
        return os.environ.get("NVIDIA_API_KEY")
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip().startswith("NVIDIA_API_KEY"):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None

API_KEY = get_api_key()
BASE_URL = "https://integrate.api.nvidia.com/v1"
MODEL = "nvidia/nemotron-3-ultra-550b-a55b"

def stream_nemotron_ultra(prompt, temperature=0.7, max_tokens=16384):
    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "system",
                "content": "You are NVIDIA Nemotron 3 Ultra, an expert AI software architect and senior programming assistant pair-programming inside Google Antigravity."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": temperature,
        "top_p": 0.95,
        "max_tokens": max_tokens,
        "chat_template_kwargs": {
            "enable_thinking": True
        },
        "stream": True
    }

    req = urllib.request.Request(
        BASE_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "Accept": "text/event-stream"
        }
    )

    in_reasoning = False
    try:
        with urllib.request.urlopen(req) as response:
            for line in response:
                decoded = line.decode("utf-8").strip()
                if not decoded or not decoded.startswith("data:"):
                    continue
                data_str = decoded[5:].strip()
                if data_str == "[DONE]":
                    break
                try:
                    chunk = json.loads(data_str)
                    choice = chunk.get("choices", [{}])[0]
                    delta = choice.get("delta", {})

                    reasoning = delta.get("reasoning_content") or delta.get("reasoning")
                    content = delta.get("content")

                    if reasoning:
                        if not in_reasoning:
                            print("\033[36m🧠 [Nemotron Ultra Thinking]:\033[0m\n", flush=True)
                            in_reasoning = True
                        print(f"\033[90m{reasoning}\033[0m", end="", flush=True)

                    if content:
                        if in_reasoning:
                            print("\n\n\033[32m💡 [Nemotron Ultra Output]:\033[0m\n", flush=True)
                            in_reasoning = False
                        print(content, end="", flush=True)
                except json.JSONDecodeError:
                    continue
        print("\n", flush=True)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"\n\033[31m❌ HTTP Error {e.code}:\033[0m {err_body}", file=sys.stderr)
    except Exception as e:
        print(f"\n\033[31m❌ Error:\033[0m {e}", file=sys.stderr)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        prompt = "Write a limerick about the wonders of GPU computing."
    else:
        prompt = " ".join(sys.argv[1:]).strip()

    print(f"\033[1;35m⚡ Querying NVIDIA Nemotron 3 Ultra (550B)...\033[0m\n")
    stream_nemotron_ultra(prompt)
