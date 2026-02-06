const fs = require('fs');
const path = require('path');
const https = require('https');

// Simple .env parser to avoid dependencies
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
    console.error('No API key found in .env.local');
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error('Error fetching models:', json.error);
            } else {
                console.log('Available Models:');
                const models = json.models || [];
                const veoModels = models.filter(m => m.name.includes('veo') || m.name.includes('video'));
                console.log('--- Veo/Video Models ---');
                veoModels.forEach(m => console.log(`- ${m.name} (${m.displayName})`));

                console.log('\n--- All Models (Names only) ---');
                models.forEach(m => console.log(m.name));
            }
        } catch (e) {
            console.error('Error parsing JSON:', e);
        }
    });

}).on('error', (e) => {
    console.error('Request error:', e);
});
