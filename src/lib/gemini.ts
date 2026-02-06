import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined in environment variables. Generative features will likely fail.");
}

export const genAI = new GoogleGenerativeAI(apiKey || "MOCK_KEY_FOR_BUILD");

// Helper to get the model
export const getGeminiModel = (modelName: string = "gemini-3-pro-image-preview") => {
    return genAI.getGenerativeModel({ model: modelName });
};

// Helper for generating content with retry logic
export const generateContentWithRetry = async (model: any, prompt: string | any[], retries = 3, delay = 5000) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await model.generateContent(prompt);
        } catch (error: any) {
            // Check for 429 or 503
            if ((error.status === 429 || error.status === 503) && i < retries - 1) {
                // Check if error message has a time
                const retryAfterMatch = error.message?.match(/retry in (\d+(\.\d+)?)s/);
                let waitTime = delay;
                if (retryAfterMatch) {
                    waitTime = Math.ceil(parseFloat(retryAfterMatch[1]) * 1000) + 1000; // Add 1s buffer
                }

                console.warn(`Rate limit hit. Retrying in ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                delay *= 2; // Exponential backoff for default delay
            } else {
                throw error;
            }
        }
    }
};
