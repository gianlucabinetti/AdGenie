const fs = require('fs');
const path = require('path');

async function testImageGen() {
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

    // Try the specific image generation model found in the list
    const model = "gemini-2.0-flash";
    // Note: Gemini 2.0 Flash often handles image generation via the standard generateContent endpoint
    // but we need to ask it to generate an image.
    // However, the list showed 'gemini-2.0-flash-exp-image-generation', let's try that first as strict fallback.

    // Actually, let's try the key 'imagen-3.0-generate-001' failed.
    // Let's try to query the "image generation" capability of Gemini 2.0.

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;

    // For Gemini 2.0, we might need the standard generateContent endpoint asking for an image
    // BUT 'imagen' style endpoints are usually: models/imagen-3.0-generate-001:predict

    // Let's try the specific one listed:
    const targetModel = "gemini-2.0-flash-exp-image-generation"; // Corrected model name from list
    const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

    const body = {
        contents: [
            {
                parts: [
                    { text: "Generate a photorealistic image of a futuristic city with neon lights." }
                ]
            }
        ],
        // If this model supports native image generation, it might return it in the response
        // OR we might need to use the specific Imagen endpoint if Gemini 2.0 doesn't do it directly yet via this API.
    };

    console.log(`Testing Image Gen with ${targetModel} (generateContent)...`);
    try {
        const response = await fetch(genUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Error:", JSON.stringify(data));
        } else {
            console.log("Response received.");
            // Check if we got an image
            // Usually Gemini API returns text unless tools are used OR it's a specific image model.
            // If we must use 'imagen', and 'imagen-3.0' failed, strict 404...
            console.log(JSON.stringify(data, null, 2).substring(0, 500));
        }

    } catch (e) {
        console.error(e);
    }
}

testImageGen();
