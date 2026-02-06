const fs = require('fs');
const path = require('path');

async function testSvgGen() {
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

    const model = "gemini-2.5-flash-lite-preview-09-2025";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const svgPrompt = `
        You are an expert SVG artist.
        Create a simple, modern, cinematic SVG illustration representing this scene: "A futuristic cyberpunk city at night with neon rain".
        Use a 16:9 aspect ratio (viewBox="0 0 1920 1080").
        Use gradients and mood lighting.
        Return ONLY the raw <svg>...</svg> code. No markdown, no json.
    `;

    const body = {
        contents: [{
            parts: [{ text: svgPrompt }]
        }]
    };

    console.log(`Testing SVG Generation with ${model}...`);
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`API Error: ${response.status} ${err}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
            console.log("SVG Generated Successfully!");
            console.log("Length:", text.length);
            console.log("Snippet:", text.substring(0, 100).replace(/\n/g, ' '));
        } else {
            console.log("No text returned.");
            console.log(JSON.stringify(data, null, 2));
        }

    } catch (e) {
        console.error(e);
    }
}

testSvgGen();
