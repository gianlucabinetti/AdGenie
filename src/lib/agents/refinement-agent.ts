
import { Agent, ToolResult, A2AContext } from "../a2a/core";
import { RefinementTool, RefinementInput, RefinementOutput } from "../tools/refinement-tool";

export class RefinementAgent implements Agent<RefinementInput, RefinementOutput> {
    name = "refinement-agent";
    description = "Agent responsible for refining campaigns based on feedback.";

    async run(input: RefinementInput, context?: A2AContext): Promise<ToolResult<RefinementOutput>> {
        const tool = new RefinementTool();
        console.log(`[RefinementAgent] Refining campaign with feedback: "${input.feedback}"`);
        return await tool.execute(input, context);
    }
}
