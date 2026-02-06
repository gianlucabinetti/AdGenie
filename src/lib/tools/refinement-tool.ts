
import { Tool, ToolResult, A2AContext } from "../a2a/core";
import { getGeminiModel, generateContentWithRetry } from "@/lib/gemini";

export interface RefinementInput {
    strategy: any;
    creative: any;
    feedback: string;
}

export interface RefinementOutput {
    strategy: any;
    creative: any;
}

export class RefinementTool implements Tool<RefinementInput, RefinementOutput> {
    name = "campaign-refinement";
    description = "Refines an existing campaign strategy and creative based on user feedback.";

    async execute(input: RefinementInput, context?: A2AContext): Promise<ToolResult<RefinementOutput>> {
        try {
            const model = getGeminiModel("gemini-2.5-flash-lite-preview-09-2025");

            const prompt = `
        Act as a senior creative director. You are reviewing a campaign draft.
        
        CURRENT STRATEGY:
        ${JSON.stringify(input.strategy)}
  
        CURRENT CREATIVE:
        ${JSON.stringify(input.creative)}
  
        USER FEEDBACK / CRITIQUE:
        "${input.feedback}"
  
        TASK:
        Update the Strategy and Creative based on the feedback. 
        - If the feedback is about tone, adjust the strategy and rewrite the script.
        - If the feedback is about specific scenes, update the script/storyboard.
        - Keep unchanged parts consistent.
  
        OUTPUT FORMAT:
        Return a SINGLE valid JSON object with the updated "strategy" and "creative" objects (do NOT use markdown):
        {
          "strategy": { ...same structure as input... },
          "creative": { ...same structure as input... }
        }
      `;

            const result = await generateContentWithRetry(model, prompt);
            const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
            const data = JSON.parse(text);

            return { success: true, data };

        } catch (error: any) {
            console.error("Refinement Tool Error:", error);
            return { success: false, error: error.message };
        }
    }
}
