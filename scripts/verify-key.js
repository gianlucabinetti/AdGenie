const fs = require('fs');
const path = require('path');
const https = require('https');

// Simple .env parser
let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/GEMINI_API_KEY=(.*)/);
        if (match) {
            apiKey = match[1].trim().replace(/^["'](.*)["']$/, '$1');
        }
    } catch (e) { }
}

if (!apiKey) {
    console.error("No API Key found.");
    process.exit(1);
}

console.log(`Using API Key: ${apiKey.substring(0, 10)}...`);

// Test Gemini 2.0 Flash (Text)
const model = "gemini-2.0-flash";
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
const body = {
    contents: [{
        parts: [{ text: "Hello, are you working?" }]
    }]
};

console.log(`\nTesting ${model} (Text Generation)...`);
const req = https.request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
}, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (res.statusCode === 200 && !json.error) {
                console.log("SUCCESS: Text generation worked.");
                console.log("Response:", json.candidates?.[0]?.content?.parts?.[0]?.text || "No text");
            } else {
                console.log(`FAILURE: ${res.statusCode}`);
                console.log(JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.log("Error parsing response:", data);
        }
    });
});

req.on('error', (e) => console.error(e));
req.write(JSON.stringify(body));
req.end();
