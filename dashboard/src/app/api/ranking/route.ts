import { NextRequest, NextResponse } from "next/server";

const BOT_API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || "http://localhost:3001";
const BOT_API_SECRET = process.env.NEXT_PUBLIC_BOT_API_SECRET || "";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const week = searchParams.get("week");

  const qs = week ? `?week=${week}` : "";

  try {
    const res = await fetch(`${BOT_API_URL}/api/data/ranking${qs}`, {
      headers: { "X-Bot-API-Secret": BOT_API_SECRET },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al obtener ranking del bot" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying ranking:", error);
    return NextResponse.json(
      { error: "Bot API no disponible" },
      { status: 503 }
    );
  }
}
