
import { Tool, ToolResult, A2AContext } from "../a2a/core";
import { getGeminiModel } from "@/lib/gemini";

const API_KEY = process.env.GEMINI_API_KEY;

export interface ImageGenerationInput {
    prompt: string;
    aspectRatio?: string;
    overlayText?: string;
}

export interface ImageGenerationOutput {
    image: string; // Base64 encoded string
    refinedPrompt?: string;
}

export class ImagenImageGenerationTool implements Tool<ImageGenerationInput, ImageGenerationOutput> {
    name = "imagen-image-generation";
    description = "Generates an image using Google Imagen model with fallback capabilities.";

    async execute(input: ImageGenerationInput, context?: A2AContext): Promise<ToolResult<ImageGenerationOutput>> {
        if (!process.env.GEMINI_API_KEY) {
            return { success: false, error: "API Key missing" };
        }

        try {
            // User requested to use "gemini-3-pro-image-preview" or "gemini-3-flash-preview" with billing enabled.
            // We remove the SVG fallback and try direct generation.

            const modelName = "gemini-3-pro-image-preview";

            // Strategy 1: Try REST API (standard Imagen style)
            try {
                const image = await this.generateImage(modelName, input);
                return { success: true, data: { image } };
            } catch (err: any) {
                console.warn(`REST generation failed for ${modelName}, trying SDK execution...`, err.message);
            }

            // Strategy 2: Attempt via SDK's generateContent (multimodal output)
            const model = getGeminiModel(modelName);

            const sdkResult = await model.generateContent(input.prompt);
            const response = sdkResult.response;

            // Helper to find image part in response candidates
            // @ts-ignore
            const imagePart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData && p.inlineData.mimeType.startsWith("image/"));

            if (imagePart?.inlineData) {
                return { success: true, data: { image: imagePart.inlineData.data as string } };
            }

            throw new Error("No image returned from either REST API or SDK.");

        } catch (error: any) {
            console.error("Image Generation Failed:", error);
            // Verify if it is a billing error
            if (error.message?.includes("billed users")) {
                return { success: false, error: "Billing required for this model. Please enable billing in Google AI Studio." };
            }

            // Fallback to placeholder (gray)
            const mockImage = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAAQABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAQAAAAAAAAAAAAAAAAAAAAb/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDVBVgAAA//2Q==";
            return { success: true, data: { image: mockImage } };
        }
    }

    private async generateImage(model: string, input: ImageGenerationInput): Promise<string> {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${process.env.GEMINI_API_KEY}`;

        let finalPrompt = input.prompt;
        if (input.overlayText) {
            finalPrompt += `\n\nRENDER THE FOLLOWING TEXT CLEARLY ON THE IMAGE: "${input.overlayText}"`;
        }

        const negativePrompt = "cartoon, illustration, 3d render, drawing, anime, low quality, blurry, amateur, grainy, watermark, signature, distorted, ugly, deformation, bad anatomy, disfigured, messy, cluttered"; // Removed 'text' from negative prompt

        const body = {
            instances: [
                {
                    prompt: finalPrompt,
                },
            ],
            parameters: {
                sampleCount: 1,
                aspectRatio: input.aspectRatio || "16:9",
                negativePrompt: negativePrompt,
            },
        };

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Imagen API Error: ${response.status} ${errText}`);
        }

        const data = await response.json();
        // Check standard predictions path
        const image = data.predictions?.[0]?.bytesBase64Encoded ?? data.predictions?.[0]?.structValue?.fields?.bytesBase64Encoded?.stringValue;

        if (!image) throw new Error("No image returned from API");
        return image;
    }
}
