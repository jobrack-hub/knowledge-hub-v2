import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildAIContext } from "@/lib/ai-context";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Rate limiting — simple in-memory store (resets on cold start)
// 20 requests per IP per 60 seconds
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;

  entry.count++;
  return true;
}

// Prune stale entries periodically to avoid unbounded memory growth
let lastPruned = Date.now();
function maybePruneRateLimit() {
  const now = Date.now();
  if (now - lastPruned < 5 * 60_000) return;
  lastPruned = now;
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}

// ---------------------------------------------------------------------------

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

const ALLOWED_ROLES = new Set(["user", "assistant"]);
const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4000;

export async function POST(request: Request) {
  // Rate limiting
  maybePruneRateLimit();
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 });
    }

    if (messages.length > MAX_MESSAGES) {
      return NextResponse.json(
        { error: `Too many messages (max ${MAX_MESSAGES})` },
        { status: 400 }
      );
    }

    // Validate each message
    for (const msg of messages) {
      if (typeof msg !== "object" || msg === null) {
        return NextResponse.json({ error: "Invalid message format" }, { status: 400 });
      }
      if (!ALLOWED_ROLES.has(msg.role)) {
        return NextResponse.json(
          { error: `Invalid message role: ${msg.role}` },
          { status: 400 }
        );
      }
      if (typeof msg.content !== "string") {
        return NextResponse.json({ error: "Message content must be a string" }, { status: 400 });
      }
      if (msg.content.length > MAX_MESSAGE_LENGTH) {
        return NextResponse.json(
          { error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` },
          { status: 400 }
        );
      }
    }

    const latestUserMsg = [...messages]
      .reverse()
      .find((m: { role: string }) => m.role === "user");

    const context = await buildAIContext(latestUserMsg?.content);

    // Keep last 10 messages for conversation context
    const recentMessages = messages.slice(-10).map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

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

    const reply =
      completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
