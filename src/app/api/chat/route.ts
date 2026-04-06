import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildAIContext } from "@/lib/ai-context";

export const dynamic = "force-dynamic";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const SYSTEM_PROMPT = `You are a JobRack SOP assistant. You help team members find and understand information from the company's Standard Operating Procedures.

You are smart and helpful. You understand that people ask questions in many different ways — "mark role as filled" could mean "change role status", "close a position", "complete a hire", etc.

RULES:
- Answer based on the documentation the user provides
- Think about what the user is REALLY asking — match their intent, not just exact words
- Search for synonyms and related terms throughout ALL the documentation
- When referencing information, mention which document it comes from
- Be concise and practical — use bullet points
- If asked about a process, walk through the steps clearly
- Only say you can't find something if NOTHING in the docs is even remotely related`;

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 });
    }

    const latestUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user");
    const context = await buildAIContext(latestUserMsg?.content);

    // Keep last 10 messages for conversation context
    const recentMessages = messages.slice(-10);

    console.log(`[AI Chat] Context length: ${context.length} chars, approx ${Math.round(context.length/4)} tokens`);
    console.log(`[AI Chat] Contains 'filled': ${context.toLowerCase().includes('filled')}`);

    // Send docs as first user message so GPT actually reads them
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Here are all JobRack SOPs for reference:\n\n${context}` },
        { role: "assistant", content: "I've read all the SOPs. Ask me anything about them." },
        ...recentMessages,
      ],
      temperature: 0.3,
      max_tokens: 1500,
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
