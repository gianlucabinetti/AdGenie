
const fs = require('fs');
const path = require('path');

async function testVeo() {
    let apiKey;
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/GEMINI_API_KEY=(.*)/);
            if (match) {
                apiKey = match[1].trim();
                apiKey = apiKey.replace(/^["'](.*)["']$/, '$1');
            }
        } else {
            // Try .env
            const envPath2 = path.resolve(__dirname, '../.env');
            if (fs.existsSync(envPath2)) {
                const envContent = fs.readFileSync(envPath2, 'utf8');
                const match = envContent.match(/GEMINI_API_KEY=(.*)/);
                if (match) {
                    apiKey = match[1].trim();
                    apiKey = apiKey.replace(/^["'](.*)["']$/, '$1');
                }
            }
        }
    } catch (err) {
        console.error("Error reading .env:", err.message);
    }

    if (!apiKey) {
        console.error("No API key found in .env or .env.local");
        return;
    }

    const model = "veo-3.1-generate-preview";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predictLongRunning?key=${apiKey}`;

    const body = {
        instances: [
            {
                prompt: "A cinematic drone shot of a futuristic city at sunset, cyberpunk style, neon lights."
            }
        ]
    };

    console.log(`Starting Video Generation with ${model}...`);
    try {
        const startResponse = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!startResponse.ok) {
            const err = await startResponse.text();
            throw new Error(`Veo Start Error: ${err}`);
        }

        const startData = await startResponse.json();
        const operationName = startData.name;
        console.log("Operation started:", operationName);

        // Poll
        let attempts = 0;
        while (attempts < 60) {
            await new Promise(r => setTimeout(r, 2000));
            attempts++;

            const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`;
            const pollRes = await fetch(pollUrl);
            const pollData = await pollRes.json();

            console.log(`Polling attempt ${attempts}: ${pollData.done ? "Done" : "Running"}...`);

            if (pollData.done) {
                console.log("FINAL RESPONSE STRUCTURE:");
                console.log(JSON.stringify(pollData, null, 2));
                break;
            }
        }

    } catch (error) {
        console.error(error);
    }
}

testVeo();
