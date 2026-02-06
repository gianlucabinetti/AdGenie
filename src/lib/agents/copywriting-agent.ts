
import { Agent, ToolResult, A2AContext } from "../a2a/core";
import { CopywritingTool, CopywritingInput, CopywritingOutput } from "../tools/copywriting-tool";

export class CopywritingAgent implements Agent<CopywritingInput, CopywritingOutput> {
    name = "copywriting-agent";
    description = "Agent responsible for writing persuasive, conversion-focused ad copy tailored to visuals.";

    async run(input: CopywritingInput, context?: A2AContext): Promise<ToolResult<CopywritingOutput>> {
        const tool = new CopywritingTool();

        console.log(`[CopywritingAgent] Generating copy for product: ${input.productName}`);
        if (input.imageContext?.imageBase64) {
            console.log(`[CopywritingAgent] analyzing attached visual context...`);
        }

        return await tool.execute(input, context);
    }
}
