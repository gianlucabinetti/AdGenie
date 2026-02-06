
import { Agent, ToolResult, A2AContext } from "../a2a/core";
import { ImagenImageGenerationTool, ImageGenerationInput, ImageGenerationOutput } from "../tools/imagen-image-tool";
import { getGeminiModel, generateContentWithRetry } from "@/lib/gemini";

export interface ImageAgentInput extends ImageGenerationInput {
    campaignContext?: any; // Strategy, Creative, etc.
}

export class ImageAgent implements Agent<ImageAgentInput, ImageGenerationOutput> {
    name = "image-agent";
    description = "Agent responsible for generating images from prompts.";

    async run(input: ImageAgentInput, context?: A2AContext): Promise<ToolResult<ImageGenerationOutput>> {
        const imageTool = new ImagenImageGenerationTool();

        let finalPrompt = input.prompt;

        // 1. Contextual Refinement
        if (input.campaignContext) {
            try {
                console.log("[ImageAgent] Refinement Step: Enhancing prompt with campaign context...");
                finalPrompt = await this.refinePromptWithContext(input.prompt, input.campaignContext, input.overlayText, input.aspectRatio);
                console.log(`[ImageAgent] Refined Prompt: "${finalPrompt.substring(0, 100)}..."`);
            } catch (e) {
                console.warn("[ImageAgent] Refinement failed, using original prompt.", e);
            }
        }

        console.log(`[ImageAgent] Generating image for prompt: "${finalPrompt.substring(0, 50)}..."`);

        const result = await imageTool.execute({
            ...input,
            prompt: finalPrompt
        }, context);

        if (result.success && result.data) {
            return {
                ...result,
                data: {
                    ...result.data,
                    refinedPrompt: finalPrompt
                }
            };
        }
        return result;
    }

    private async refinePromptWithContext(basePrompt: string, context: any, overlayText?: string, aspectRatio: string = "16:9"): Promise<string> {
        const model = getGeminiModel("gemini-2.5-flash-lite-preview-09-2025");

        let brandingText = "";

        if (context.logo) {
            brandingText += "\nIMPORTANT: REFER TO THE ATTACHED LOGO IMAGE. The generated image MUST harmonize with this brand identity (colors, style, vibe).";
        }

        const textPrompt = `
          You are a world-class CGI Artist and Commercial Photographer (Rolex/Apple/Nike level).
          
          INPUT DATA - SOURCE OF TRUTH:
          ---------------------------------------------------------
          PRODUCT NAME: ${context.productName}
          PRODUCT DESC: ${context.productDescription} (Use this to define the physical look of the object)
          BRAND COLORS: ${context.brandColors}
          TARGET PERSONA: ${context.strategy?.targetPersona}
          PAIN POINTS: ${context.strategy?.painPoints?.join(", ")}
          EMOTIONS: ${context.strategy?.emotionalHook}
          OVERLAY TEXT TO INCLUDE: "${overlayText || 'None'}"
          TARGET ASPECT RATIO: ${aspectRatio}
          ---------------------------------------------------------

          ORIGINAL CONCEPT:
          "${basePrompt}"

          MISSION:
          Write a HYPER-REALISTIC, FINAL IMAGE GENERATION PROMPT (150+ words).
          Do NOT just "enhance" the original concept. REBUILD IT using the "INPUT DATA" above to ensure the product is accurately represented.

          MANDATORY PROMPT STRUCTURE:
          1. **Subject**: "A hyper-realistic commercial shot of [PRODUCT NAME]..." (Describe the product physically based on PRODUCT DESC).
          2. **Composition**: "Ensure the scene composition perfectly fits a ${aspectRatio} frame. Keep main subjects within the safe zone."
          3. **Action/Scene**: Visualize the product *in action* or in a setting that appeals to the [TARGET PERSONA].
          3. **Visual Solution**: Subtly hint at solving [PAIN POINTS] (e.g., if pain is 'clutter', show 'perfect organization').
          4. **Lighting**: "[EMOTIONS] lighting" (Translate emotion to light, e.g., 'Safe' -> Warm Golden Hour; 'Fast' -> Neon Streaks).
          5. **Tech Specs**: "Shot on Phase One IQ4, 100MP, 85mm lens, f/5.6".
          6. **Style**: "8k, Unsplash Wallpapers, Octane Render, Ray Tracing, Ultra-Detailed Textures".
          7. **Branding**: "Prominent [BRAND COLORS] accents/lighting".
          ${overlayText ? `8. **Typography**: "Ensure the text '${overlayText}' is clearly legible, integrated into the scene composition (e.g., on a billboard, neon sign, or floating holographic text), matching the brand font style."` : ''}

          NEGATIVE PROMPT INSTRUCTIONS (Embed these in your thought process - keep the final prompt positive but specific):
          - NO generic "AI bottles" or random objects.
          - NO text overlays (UNLESS specifically requested in "OVERLAY TEXT").
          - NO cartoon/illustration styles.
          
          OUTPUT:
          Return ONLY the final prompt string. Do not include labels like "Subject:". Just the raw prompt text.
        `;

        const parts: any[] = [textPrompt];

        if (context.logo) {
            try {
                // context.logo is "data:image/png;base64,..."
                const matches = context.logo.match(/^data:(.+);base64,(.+)$/);
                if (matches) {
                    parts.push({
                        inlineData: {
                            mimeType: matches[1],
                            data: matches[2]
                        }
                    });
                    console.log("[ImageAgent] Attached logo to refinement prompt.");
                }
            } catch (e) {
                console.warn("[ImageAgent] Failed to attach logo:", e);
            }
        }

        try {
            const result = await generateContentWithRetry(model, parts);
            return result.response.text().trim();
        } catch (error) {
            console.error("Prompt Refinement Error:", error);
            return basePrompt;
        }
    }
}
