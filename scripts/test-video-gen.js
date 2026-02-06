
const fs = require('fs');
const path = require('path');

async function testVideoGen() {
    let apiKey;
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/GEMINI_API_KEY=(.*)/);
        if (match) apiKey = match[1].trim().replace(/^["'](.*)["']$/, '$1');
    } catch (err) { return; }

    // Helper to test Veo
    async function testVeo(modelName) {
        console.log(`\nTesting ${modelName} (Text-to-Video)...`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predictLongRunning?key=${apiKey}`;

        const body = {
            instances: [{ prompt: "A cinematic drone shot of a futuristic city" }]
        };

        try {
            console.log("Starting operation...");
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                console.log(`Failed to Start: ${res.status} - ${await res.text()}`);
                return;
            }

            const data = await res.json();
            const opName = data.name;
            console.log(`Operation Started: ${opName}. Polling...`);

            // Poll once or twice
            for (let i = 0; i < 3; i++) {
                await new Promise(r => setTimeout(r, 3000));
                const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${opName}?key=${apiKey}`;
                const pollRes = await fetch(pollUrl);
                const pollData = await pollRes.json();
                console.log(`Poll ${i + 1}: Done=${pollData.done}`);
                if (pollData.done) {
                    if (pollData.error) console.log("Error Result:", JSON.stringify(pollData.error));
                    else console.log("Success! Result:", JSON.stringify(pollData.response).substring(0, 100) + "...");
                    break;
                }
            }
        } catch (e) { console.log(`Exception: ${e.message}`); }
    }

    // List of models to test in order (matches tool fallback chain)
    const models = [
        "veo-3.1-fast-generate-preview",
        "veo-3.1-generate-preview",
        "veo-3.0-fast-generate-001",
        "veo-3.0-generate-001",
        "veo-2.0-generate-001"
    ];

    for (const model of models) {
        console.log(`LOOP_CHECK: Testing model ${model}`);
        await testVeo(model);
    }
}

testVideoGen();
