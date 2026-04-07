import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "hub-auth";

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /api/sync has its own token-based auth — skip here
  if (pathname === "/api/sync") return NextResponse.next();

  const password = process.env.HUB_PASSWORD;

  // No password set — only allow in dev (NODE_ENV check prevents accidental open prod)
  if (!password) {
    if (process.env.NODE_ENV === "development") return NextResponse.next();
    return new NextResponse("Server misconfiguration: HUB_PASSWORD not set", { status: 500 });
  }

  // Check session cookie against hashed password (never store plaintext in cookie)
  const expectedToken = await hashPassword(password);
  const cookie = request.cookies.get(AUTH_COOKIE)?.value;
  if (cookie === expectedToken) return NextResponse.next();

  // Redirect to login, preserving the intended destination
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next (Next.js internals)
     * - favicon.ico
     * - /login (the login page itself)
     * - /api/login (the login API action)
     */
    "/((?!_next|favicon\\.ico|login|api/login).*)",
  ],
};
