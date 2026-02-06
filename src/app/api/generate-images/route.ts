
import { NextRequest, NextResponse } from "next/server";
import { ImageAgent } from "@/lib/agents/image-agent";

export async function POST(req: NextRequest) {
    try {
        const json = await req.json();
        const { prompt, campaignContext, overlayText } = json;

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        const agent = new ImageAgent();
        const result = await agent.run({ ...json, overlayText });

        if (result.success && result.data) {
            return NextResponse.json(result.data);
        } else {
            return NextResponse.json(
                { error: result.error || "Failed to generate image" },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error("Image Generation Route Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
