
import { NextRequest, NextResponse } from "next/server";
import { CampaignAgent } from "@/lib/agents/campaign-agent";

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();

    const agent = new CampaignAgent();
    // Pass the whole body as input since it matches the interface
    const result = await agent.run(input);

    if (result.success && result.data) {
      return NextResponse.json(result.data);
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to generate campaign" },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate campaign" }, { status: 500 });
  }
}
