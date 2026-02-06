
import { Tool, ToolResult, A2AContext } from "../a2a/core";
import { getGeminiModel, generateContentWithRetry } from "@/lib/gemini";

export interface CampaignGenerationInput {
    productName: string;
    productDescription: string;
    targetAudience: string;
    tone: string;
    platform: string;
    brandColors: string;
    secondaryBrandColors?: string;
    trustIdentifiers?: string;
}

export interface CampaignGenerationOutput {
    strategy: {
        painPoints: string[];
        targetPersona: string;
        personaDetails: {
            demographics: string[];
            keyInterests: string[];
            buyingBehavior: string[];
        };
        emotionalHook: string;
        platformBestPractices: string;
        contentPillars: string[];
        hashtags: string[];
        effectiveFont: string;
    };
    creative: {
        mainConcept: string;
        assets: Array<{
            id: string; // "asset_1", "asset_2"
            headline: string;
            tagline: string;
            visualDescription: string;
            placement: string; // e.g. "Instagram Story", "LinkedIn Feed"
            imagePrompt: string;
        }>;
        rationale: string;
    };
}

export class CampaignGenerationTool implements Tool<CampaignGenerationInput, CampaignGenerationOutput> {
    name = "campaign-generation";
    description = "Generates a detailed ad campaign strategy and visual concepts based on product info.";

    async execute(input: CampaignGenerationInput, context?: A2AContext): Promise<ToolResult<CampaignGenerationOutput>> {
        try {
            // STEP 1: GENERATE STRATEGY
            const strategyPrompt = `
        Act as a world-class creative strategist.
        
        INPUT BRIEF:
        Product: ${input.productName}
        Description: ${input.productDescription}
        Target Audience: ${input.targetAudience}
        Tone: ${input.tone}
        Platform: ${input.platform}
        Brand Colors: ${input.brandColors}
        
        TASK:
        Analyze the brief and generate a comprehensive Campaign Strategy.
        
        REQUIREMENTS:
        1. **Deep Dive Persona**: Create a vivid, specific persona. Not just "Moms", but "Overwhelmed Yoga Moms who love organic snacks".
        2. **Pain Points**: Identify 3 specific, visceral pain points this product solves.
        3. **Emotional Hook**: The single strongest emotional driver (e.g., "Relief", "Status", "Comfort").
        4. **Effective Font**: Recommend a font style (e.g., "Bold Sans-Serif", "Elegant Script", "Tech Monospace") that matches the persona and tone.
        5. **Content Pillars**: 3-4 thematic angles for the content.
        
        OUTPUT FORMAT:
        Return a SINGLE valid JOSN object (no markdown):
        {
            "painPoints": ["point1", "point2", "point3"],
            "targetPersona": "Detailed persona description...",
            "effectiveFont": "Boild Impactful Sans-Serif...",
            "personaDetails": {
                "demographics": ["Trait 1", "Trait 2"],
                "keyInterests": ["Interest 1", "Interest 2"],
                "buyingBehavior": ["Behavior 1", "Behavior 2"]
            },
            "emotionalHook": "The core feeling to tap into...",
            "platformBestPractices": "Specific advice for ${input.platform}...",
            "contentPillars": ["Theme 1", "Theme 2", "Theme 3"],
            "hashtags": ["#tag1", "#tag2"]
        }
            `;

            const strategyModel = getGeminiModel("gemini-2.5-flash-lite-preview-09-2025");
            const strategyRes = await generateContentWithRetry(strategyModel, strategyPrompt);
            const strategyText = strategyRes.response.text();
            const strategyData = this.parseJSON(strategyText);

            // STEP 2: GENERATE CREATIVE ASSETS (Using Strategy as Context)
            const creativePrompt = `
        You are a LEGENDARY Creative Director (Ogilvy, Wieden+Kennedy level).
        You are famous for your "High-Fidelity" visual concepts that perfectly blend Strategy with Art.
        
        CONTEXT - STRATEGY (Source of Truth):
        ---------------------------------------
        Target Persona: ${strategyData.targetPersona}
        Pain Points: ${strategyData.painPoints.join(", ")}
        Emotional Hook: ${strategyData.emotionalHook}
        Brand Colors: ${input.brandColors}
        Platform: ${input.platform}
        ---------------------------------------

        CONTEXT - PRODUCT:
        Name: ${input.productName}
        Description: ${input.productDescription}

        TASK:
        Generate 5 DISTINCT, WORLD-CLASS Ad Concepts.
        
        CRITICAL INSTRUCTION - THE "ANTI-GENERIC" RULE:
        - NEVER write short prompts like "A bottle of coffee."
        - ALWAYS write specific, directorial prompts like "A macro 85mm shot of the [Product], condensation beading on the glass, set against a [Color] sunrise..."
        
        VISUAL REFERENCE (Select the best Archetype for each concept):
        
        ARCHETYPE A: "The Dynamic Hero" (Spacegoods Style)
        - **Visual**: Product in dynamic action (pouring/splashing) in center.
        - **Bg**: Solid premium pastel/brand color.
        - **Details**: Floating ingredients/particles exploding subtly.
        
        ARCHETYPE B: "The Split Contrast" (Javy Style)
        - **Visual**: Sharp 50/50 vertical split.
        - **Left**: Beautifully lit product (The Solution).
        - **Right**: Desaturated, messy "Old Way" (The Problem).
        - **Note**: Leave empty vertical columns for text overlays.
        
        ARCHETYPE C: "The Feature Stack" (Huel Style)
        - **Visual**: Product placed off-center (Right side 40%).
        - **Bg**: Clean high-key studio background.
        - **Comp**: Massive negative space on the LEFT (60%) for features list.
        
        OUTPUT REQUIREMENTS:
        For each asset, you must generate:
        1. **Headline**: Max 8 words. Punchy, addressing a specific Pain Point.
        2. **Visual/Image Prompt**: 
           - **MUST BE 250+ WORDS.**
           - **STRUCTURE**:
             - **Subject**: "Commercial product photography of ${input.productName}, ${input.productDescription}..."
             - **Archetype Setup**: "[Describe the specific Archetype layout chose]..."
             - **Lighting/Mood**: "Cinematic lighting inspired by [Emotional Hook]..."
             - **Props/Environment**: "Surrounded by props relevant to [Target Persona]..."
             - **Tech Specs**: "Shot on Phase One IQ4, 150MP, 8k, sharp focus, editorial texture..."
             - **Negative Space**: "Wide composition with specific empty space for text..."

        OUTPUT FORMAT:
        Return a SINGLE valid JSON object (no markdown):
        {
            "mainConcept": "The big idea...",
            "rationale": "Why this works for the persona...",
            "assets": [
               { 
                 "id": "asset_1",
                 "headline": "Punchy headline...", 
                 "tagline": "Body copy...",
                 "visualDescription": "Short description...", 
                 "placement": "Feed / Story",
                 "imagePrompt": "FULL 250+ WORD PHOTOGRAPHY PROMPT..." 
               }
            ]
        }
            `;

            // CRITICAL: Switching to Flash-Exp or Pro to ensure instruction following for long prompts
            // CRITICAL: Switching to Flash-Exp or Pro to ensure instruction following for long prompts
            const creativeModel = getGeminiModel("gemini-2.5-flash-lite-preview-09-2025");
            const creativeRes = await generateContentWithRetry(creativeModel, creativePrompt);
            const creativeText = creativeRes.response.text();

            // Robust Parsing
            const creativeData = this.parseJSON(creativeText);

            return {
                success: true,
                data: {
                    strategy: strategyData,
                    creative: creativeData
                }
            };

        } catch (error: any) {
            console.error("Campaign Generation Tool Error:", error);
            return { success: false, error: error.message };
        }
    }

    private parseJSON(text: string): any {
        try {
            // 1. Try direct parse
            return JSON.parse(text);
        } catch (e) {
            // 2. Try removing markdown code blocks
            const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
            try {
                return JSON.parse(cleanText);
            } catch (e2) {
                // 3. Try finding the first '{' and last '}'
                const firstBrace = text.indexOf('{');
                const lastBrace = text.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1) {
                    const jsonSubstr = text.substring(firstBrace, lastBrace + 1);
                    try {
                        return JSON.parse(jsonSubstr);
                    } catch (e3) {
                        console.error("Failed to parse JSON substring:", jsonSubstr);
                        throw new Error("Failed to parse JSON response");
                    }
                }
                throw new Error("No JSON found in response");
            }
        }
    }
}
