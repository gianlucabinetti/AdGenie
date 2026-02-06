const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Simple .env parser
let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/GEMINI_API_KEY=(.*)/);
        if (match) {
            apiKey = match[1].trim();
        }
    } catch (e) {
        console.log('Could not read .env.local');
    }
}

if (!apiKey) {
    console.error('No API key found');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function run() {
    try {
        console.log("Testing gemini-2.0-flash...");
        const result = await model.generateContent("Explain why free tier models are useful for developers in one sentence.");
        console.log("Response:", result.response.text());
        console.log("SUCCESS: Model works!");
    } catch (error) {
        console.error("FAILURE:", error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("StatusText:", error.response.statusText);
        }
    }
}

run();
