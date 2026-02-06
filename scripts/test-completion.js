const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Manually load .env.local
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
    }
} catch (e) {
    console.error("Error loading .env.local", e);
}

async function testGen() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API KEY found");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use the model we just switched to
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-09-2025" });

    try {
        console.log("Attempting generation with gemini-2.5-flash-lite-preview-09-2025...");
        const result = await model.generateContent("Say 'Hello, World!' if you can hear me.");
        console.log("Response:", result.response.text());
        console.log("SUCCESS: Model is working.");
    } catch (error) {
        console.error("Generation failed:", error.message);
        if (error.response) {
            console.error("Error details:", error.response);
        }
    }
}

testGen();
