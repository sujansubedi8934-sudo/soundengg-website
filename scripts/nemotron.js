#!/usr/bin/env node

/**
 * NVIDIA Nemotron 3 Reasoning Connector for Antigravity
 * Model: nvidia/nemotron-3-nano-omni-30b-a3b-reasoning
 * Features: Deep reasoning trace extraction, auto-retry on busy worker limits, and CLI tools.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Read API Key from environment or local .env
function getApiKey() {
    if (process.env.NVIDIA_API_KEY) return process.env.NVIDIA_API_KEY;
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/NVIDIA_API_KEY\s*=\s*(.+)/);
        if (match) return match[1].trim().replace(/["']/g, '');
    }
    throw new Error('NVIDIA_API_KEY is not set in environment or .env file.');
}

/**
 * Query NVIDIA Nemotron with retry backoff
 * @param {string} prompt - The prompt or code to evaluate
 * @param {object} options - Options
 * @param {number} retries - Number of retries on 429 / worker limit
 * @returns {Promise<{content: string, reasoning: string, usage: object}>}
 */
async function queryNemotron(prompt, options = {}, retries = 3) {
    const apiKey = getApiKey();
    const model = options.model || 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning';
    const temperature = options.temperature !== undefined ? options.temperature : 0.2;
    const maxTokens = options.maxTokens || 4096;

    const payload = JSON.stringify({
        model: model,
        messages: [
            {
                role: 'system',
                content: options.systemPrompt || 'You are NVIDIA Nemotron 3, an expert software architect and senior AI engineering assistant inside Google Antigravity.'
            },
            {
                role: 'user',
                content: prompt
            }
        ],
        temperature: temperature,
        max_tokens: maxTokens
    });

    try {
        return await new Promise((resolve, reject) => {
            const req = https.request('https://integrate.api.nvidia.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                }
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        if (json.error || json.status === 404) {
                            const errMsg = json.error?.message || json.detail || JSON.stringify(json);
                            return reject(new Error(errMsg));
                        }
                        const choice = json.choices && json.choices[0];
                        const content = choice?.message?.content || '';
                        const reasoning = choice?.message?.reasoning_content || '';
                        resolve({
                            content,
                            reasoning,
                            usage: json.usage,
                            model: json.model
                        });
                    } catch (e) {
                        reject(new Error(`Failed to parse response: ${data}`));
                    }
                });
            });

            req.on('error', (err) => reject(err));
            req.write(payload);
            req.end();
        });
    } catch (err) {
        if (retries > 0 && err.message.includes('request limit reached')) {
            await new Promise(r => setTimeout(r, 1500));
            return queryNemotron(prompt, options, retries - 1);
        }
        throw err;
    }
}

// CLI Mode
if (require.main === module) {
    const args = process.argv.slice(2);
    const prompt = args.join(' ').trim();

    if (!prompt) {
        console.log(`
======================================================
  ⚡ NVIDIA Nemotron 3 Reasoning CLI for Antigravity
======================================================
Usage:
  node scripts/nemotron.js "Write a Web Audio API low-pass filter algorithm"
  node scripts/nemotron.js --reasoning "Explain DSP FFT windowing in real-time analyzers"
`);
        process.exit(0);
    }

    const showReasoning = args.includes('--reasoning');
    const cleanPrompt = prompt.replace('--reasoning', '').trim();

    console.log('⚡ Querying NVIDIA Nemotron 3 Nano Omni Reasoning Engine...\n');

    queryNemotron(cleanPrompt)
        .then((res) => {
            if (showReasoning && res.reasoning) {
                console.log('\x1b[36m🧠 [Nemotron Internal Chain of Thought / Reasoning]:\x1b[0m');
                console.log(res.reasoning);
                console.log('\n--------------------------------------------------\n');
            }
            console.log('\x1b[32m💡 [Nemotron Output]:\x1b[0m\n');
            console.log(res.content);
            console.log('\n\x1b[90m📊 Tokens (Prompt: ' + (res.usage?.prompt_tokens || 0) + ' | Completion: ' + (res.usage?.completion_tokens || 0) + ' | Total: ' + (res.usage?.total_tokens || 0) + ')\x1b[0m');
        })
        .catch((err) => {
            console.error('\x1b[31m❌ Error:\x1b[0m', err.message);
            process.exit(1);
        });
}

module.exports = { queryNemotron };
