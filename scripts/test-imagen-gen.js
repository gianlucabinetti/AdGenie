const fs = require('fs');
const path = require('path');

async function testImagen() {
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

    const model = "imagen-3.0-generate-001";
    // Imagen 3.0 uses the 'predict' method, not long running
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;

    const body = {
        instances: [
            {
                prompt: "A futuristic city skyline with neon lights, cinematic, 8k resolution."
            }
        ],
        parameters: {
            sampleCount: 1
        }
    };

    console.log(`Testing Image Generation with ${model}...`);
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Imagen Error: ${err}`);
        }

        const data = await response.json();

        // Log keys to see structure
        console.log("Success! Response keys:", Object.keys(data));

        if (data.predictions && data.predictions.length > 0) {
            console.log("Image generated successfully.");
            // usually data.predictions[0].bytesBase64Encoded or similar
            const firstPred = data.predictions[0];
            if (firstPred.bytesBase64Encoded) {
                console.log("Received Base64 Image Data.");
            } else if (firstPred.mimeType) {
                console.log("Received Image Data with Mime:", firstPred.mimeType);
            } else {
                console.log("Prediction structure:", JSON.stringify(firstPred).substring(0, 100));
            }
        } else {
            console.log("Full Response:", JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error(error);
    }
}

testImagen();
