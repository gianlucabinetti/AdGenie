const fs = require('fs');
const path = require('path');
const https = require('https');

async function listModels() {
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
        }
    } catch (err) {
        console.error("Error reading .env:", err.message);
    }

    if (!apiKey) {
        console.error("No API key found.");
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`;

    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                if (response.error) {
                    console.error("API Error:", response.error);
                } else {
                    console.log("Available Models:");
                    const videoModels = response.models.filter(m => m.name.includes("veo") || m.supportedGenerationMethods.includes("predictLongRunning") || m.name.includes("video"));

                    console.log("\n--- VIDEO / LONG RUNNING MODELS ---");
                    videoModels.forEach(m => {
                        console.log(`- ${m.name}`);
                        console.log(`  Version: ${m.version}`);
                        console.log(`  Methods: ${JSON.stringify(m.supportedGenerationMethods)}`);
                    });

                    console.log("\n--- OTHER MODELS (Partial List) ---");
                    response.models.filter(m => !videoModels.includes(m)).slice(0, 10).forEach(m => {
                        console.log(`- ${m.name}`);
                    });
                }
            } catch (e) {
                console.error("Parse Error:", e);
                console.log("Raw Data:", data);
            }
        });
    }).on('error', (e) => {
        console.error("Request Error:", e);
    });
}

listModels();
