import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { password, next } = await request.json();
  const expected = process.env.HUB_PASSWORD;

  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const destination = typeof next === "string" && next.startsWith("/") ? next : "/";
  const response = NextResponse.json({ ok: true, redirect: destination });

  response.cookies.set("hub-auth", expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // 7-day session
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
