import { NextRequest, NextResponse } from "next/server";

const BOT_API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || "http://localhost:3001";
const BOT_API_SECRET = process.env.NEXT_PUBLIC_BOT_API_SECRET || "";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const week = searchParams.get("week");
  const limit = searchParams.get("limit");

  const qs = new URLSearchParams();
  if (week) qs.set("week", week);
  if (limit) qs.set("limit", limit);

  try {
    const res = await fetch(`${BOT_API_URL}/api/data/matches?${qs}`, {
      headers: { "X-Bot-API-Secret": BOT_API_SECRET },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al obtener partidos del bot" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying matches:", error);
    return NextResponse.json(
      { error: "Bot API no disponible" },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await fetch(`${BOT_API_URL}/api/data/matches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Bot-API-Secret": BOT_API_SECRET,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al crear partido" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying match creation:", error);
    return NextResponse.json(
      { error: "Bot API no disponible" },
      { status: 503 }
    );
  }
}
