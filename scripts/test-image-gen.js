
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

async function testImageGen() {
    let apiKey;
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/GEMINI_API_KEY=(.*)/);
        if (match) apiKey = match[1].trim().replace(/^["'](.*)["']$/, '$1');
    } catch (err) { return; }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Helper to test a model
    async function testModel(modelName) {
        console.log(`\nTesting ${modelName}...`);
        try {
            // Attempt standard generation first
            const model = genAI.getGenerativeModel({ model: modelName });
            const prompt = "Generate an image of a cat";
            // Note: Standard generateContent doesn't usually return image bytes directly for text models
            // But for multimodal models it might return a 'part' that is an image if prompted correctly?
            // Actually, usually you need a specific tool or endpoint.

            const result = await model.generateContent(prompt);
            const response = await result.response;
            console.log("Success (Text)?", response.text().substring(0, 50));
        } catch (e) {
            console.log(`Failed (Standard): ${e.message}`);
        }

        // Attempt REST predict (Imagen style)
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict?key=${apiKey}`;
            const body = { instances: [{ prompt: "A cat" }], parameters: { sampleCount: 1 } };
            const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            if (res.ok) console.log("Success (Predict)!");
            else console.log(`Failed (Predict) ${res.status}: ${await res.text()}`);
        } catch (e) { console.log("Failed (Predict Fetch)", e.message); }
    }

    // List of models to test in order (matches tool fallback chain)
    const models = [
        "imagen-4.0-fast-generate-001",
        "imagen-4.0-generate-001",
        "imagen-4.0-generate-preview-06-06"
    ];

    for (const model of models) {
        // We only test the 'predict' method as that is what the tool uses
        console.log(`\nTesting ${model}...`);
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;
            const body = { instances: [{ prompt: "A cat" }], parameters: { sampleCount: 1 } };
            const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            if (res.ok) {
                console.log(`Success (Predict) with ${model}!`);
            } else {
                const errText = await res.text();
                console.log(`Failed (Predict) with ${model}: ${res.status} ${res.statusText} - ${errText}`);
            }
        } catch (e) { console.log(`Failed (Predict Fetch) with ${model}`, e.message); }
    }
}

testImageGen();
