import { NextRequest, NextResponse } from "next/server";

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: NextRequest) {
  const { password, next } = await request.json();
  const expected = process.env.HUB_PASSWORD;

  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const destination = typeof next === "string" && next.startsWith("/") ? next : "/";
  const response = NextResponse.json({ ok: true, redirect: destination });

  // Store a hash of the password, never the plaintext
  const sessionToken = await hashPassword(expected);

  response.cookies.set("hub-auth", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // 7-day session
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
