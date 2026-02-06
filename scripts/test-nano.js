
const fs = require('fs');
const path = require('path');

async function testNano() {
    let apiKey;
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/GEMINI_API_KEY=(.*)/);
            if (match) apiKey = match[1].trim().replace(/^["'](.*)["']$/, '$1');
        }
    } catch (err) { console.error(err); }

    if (!apiKey) { console.error("No API Key"); return; }

    const model = "gemini-2.5-flash-image"; // From the list
    const urlGen = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const bodyGen = {
        contents: [{ parts: [{ text: "Generate an image of a futuristic city" }] }]
    };

    console.log(`Testing ${model} with :generateContent...`);
    try {
        const res = await fetch(urlGen, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyGen)
        });

        if (res.ok) {
            console.log("GenerateContent Success!");
            const data = await res.json();
            console.log(JSON.stringify(data).substring(0, 500));
        } else {
            console.error("GenerateContent Failed:", res.status, await res.text());
        }
    } catch (e) { console.error(e); }
}

testNano();
