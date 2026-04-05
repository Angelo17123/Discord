import { NextRequest, NextResponse } from "next/server";

const BOT_API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || "http://localhost:3001";
const BOT_API_SECRET = process.env.NEXT_PUBLIC_BOT_API_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${BOT_API_URL}/api/actions/finish-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Bot-API-Secret": BOT_API_SECRET },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      return NextResponse.json(err, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (error) {
    return NextResponse.json({ error: "Bot API no disponible" }, { status: 503 });
  }
}
