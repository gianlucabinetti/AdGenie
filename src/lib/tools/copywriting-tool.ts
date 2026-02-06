
import { Tool, ToolResult, A2AContext } from "../a2a/core";
import { getGeminiModel, generateContentWithRetry } from "@/lib/gemini";

export interface CopywritingInput {
    productName: string;
    productDescription: string;
    strategy: {
        painPoints: string[];
        targetPersona: string;
        emotionalHook: string;
        effectiveFont?: string;
    };
    imageContext?: {
        imageBase64?: string; // If we have the generated image
        imageDescription?: string; // Fallback if we only have the prompt
    };
}

export interface CopywritingOutput {
    headline: string;
    body: string;
    cta: string;
    overlayText?: string[]; // Text to be placed ON the image
    rationale: string;
}

export class CopywritingTool implements Tool<CopywritingInput, CopywritingOutput> {
    name = "copywriting-tool";
    description = "Generates high-converting, emotionally-hooked copy based on product strategy and visual context.";

    async execute(input: CopywritingInput, context?: A2AContext): Promise<ToolResult<CopywritingOutput>> {
        try {
            const model = getGeminiModel("gemini-2.5-flash-lite-preview-09-2025"); // Multimodal model

            const parts: any[] = [];

            // 1. Construct the System Prompt
            let promptText = `
            You are a Conversion Copywriting Expert and Behavioral Psychologist.
            Your goal is to write ad copy that drives IMMEDIATE ACTION (Buying).

            INPUT DATA:
            ----------------
            PRODUCT: ${input.productName}
            DESCRIPTION: ${input.productDescription}
            TARGET PERSONA: ${input.strategy.targetPersona}
            PAIN POINTS: ${input.strategy.painPoints.join(", ")}
            EMOTIONAL HOOK: ${input.strategy.emotionalHook}
            EFFECTIVE FONT STYLE: ${input.strategy.effectiveFont || "Standard Sans-Serif"}
            ----------------

            TASK:
            Write a set of ad copy components.

            GUIDELINES:
            1. **Emotional Hook**: The headline must INSTANTLY grab the persona's attention by hitting the emotional hook or a major pain point.
            2. **Action-Oriented**: The body copy should not just describe features; it must tell the user what they get out of it (Benefits) and tell them what to do.
            3. **Typography Synergy**: The visual strategy suggests a "${input.strategy.effectiveFont || "Standard"}" font. Ensure your copy length and word choice suits this font style (e.g. Impactful fonts needs short, punchy words).
            4. **Visual Synergy**:
            `;

            if (input.imageContext?.imageBase64) {
                promptText += `\n   - I have provided an image of the ad creative.
   - ANALYZE the image: Look for empty spaces (negative space) where text could fit.
   - Match the TONE of the copy to the mood of the image.
   - If the image shows a specific feature (e.g. ingredients), highlight that in the overlay text.`;
            } else if (input.imageContext?.imageDescription) {
                promptText += `\n   - The image will look like: "${input.imageContext.imageDescription}".
   - Write copy that complements this visual description.`;
            }

            promptText += `
            OUTPUT FORMAT:
            Return a SINGLE valid JSON object (no markdown):
            {
                "headline": "Short, punchy, under 10 words",
                "body": "Persuasive text, 2-3 sentences",
                "cta": "Strong Call to Action (e.g. 'Get 50% Off', 'Shop Now')",
                "overlayText": ["Short phrase 1", "Short phrase 2"], // Optional short snippets to put ON the image (like '154 Benefits' or 'No Sugar')
                "rationale": "Brief explanation of why this copy works for this persona"
            }
            `;

            parts.push(promptText);

            // 2. Add Image if available
            if (input.imageContext?.imageBase64) {
                try {
                    const matches = input.imageContext.imageBase64.match(/^data:(.+);base64,(.+)$/);
                    if (matches) {
                        parts.push({
                            inlineData: {
                                mimeType: matches[1],
                                data: matches[2]
                            }
                        });
                    }
                } catch (e) {
                    console.warn("Failed to parse base64 image for CopywritingTool", e);
                }
            }

            // 3. Generate
            const result = await generateContentWithRetry(model, parts);
            const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
            const data = JSON.parse(text);

            return {
                success: true,
                data: data
            };

        } catch (error: any) {
            console.error("CopywritingTool Error:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}
