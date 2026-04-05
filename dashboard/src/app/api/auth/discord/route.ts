import { NextRequest, NextResponse } from "next/server";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action");

  if (action === "login") {
    const origin = request.nextUrl.origin;
    const REDIRECT_URI = `${origin}/api/auth/discord/callback`;

    const authUrl = new URL("https://discord.com/oauth2/authorize");
    authUrl.searchParams.set("client_id", DISCORD_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "identify");

    return NextResponse.redirect(authUrl.toString());
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
