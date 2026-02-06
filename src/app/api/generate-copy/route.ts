
import { NextRequest, NextResponse } from "next/server";
import { CopywritingAgent } from "@/lib/agents/copywriting-agent";

export async function POST(req: NextRequest) {
    try {
        const json = await req.json();
        const { productName, productDescription, strategy, imageContext } = json;

        if (!productName || !strategy) {
            return NextResponse.json({ error: "Product Name and Strategy are required" }, { status: 400 });
        }

        const agent = new CopywritingAgent();
        const result = await agent.run({
            productName,
            productDescription,
            strategy,
            imageContext
        });

        if (result.success && result.data) {
            return NextResponse.json(result.data);
        } else {
            return NextResponse.json(
                { error: result.error || "Failed to generate copy" },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error("Copywriting Generation Route Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
