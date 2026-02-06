
import { Agent, ToolResult, A2AContext } from "../a2a/core";
import { CampaignGenerationTool, CampaignGenerationInput, CampaignGenerationOutput } from "../tools/campaign-tool";

export class CampaignAgent implements Agent<CampaignGenerationInput, CampaignGenerationOutput> {
    name = "campaign-agent";
    description = "Agent responsible for generating holistic ad campaign strategies and creative.";

    async run(input: CampaignGenerationInput, context?: A2AContext): Promise<ToolResult<CampaignGenerationOutput>> {
        const tool = new CampaignGenerationTool();
        console.log(`[CampaignAgent] Generating campaign for product: ${input.productName}`);
        return await tool.execute(input, context);
    }
}
