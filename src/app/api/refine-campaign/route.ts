
import { NextRequest, NextResponse } from "next/server";
import { RefinementAgent } from "@/lib/agents/refinement-agent";

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();

    const agent = new RefinementAgent();
    // input matches RefinementInput interface { strategy, creative, feedback }
    const result = await agent.run(input);

    if (result.success && result.data) {
      return NextResponse.json(result.data);
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to refine campaign" },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("Refinement Error:", error);
    return NextResponse.json({ error: error.message || "Failed to refine campaign" }, { status: 500 });
  }
}
