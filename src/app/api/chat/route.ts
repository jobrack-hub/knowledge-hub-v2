import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildAIContext, buildSystemPrompt } from "@/lib/ai-context";

export const dynamic = "force-dynamic";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 });
    }

    const context = await buildAIContext();
    const systemPrompt = buildSystemPrompt(context);

    // Keep last 10 messages for conversation context
    const recentMessages = messages.slice(-10);

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...recentMessages,
      ],
      temperature: 0.2,
      max_tokens: 800,
    });

    const reply = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json(
      { error: "Chat failed", details: String(err) },
      { status: 500 }
    );
  }
}
