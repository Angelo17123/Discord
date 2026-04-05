import { NextRequest, NextResponse } from "next/server";

const BOT_API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || "http://localhost:3001";
const BOT_API_SECRET = process.env.NEXT_PUBLIC_BOT_API_SECRET || "";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const br = searchParams.get("br") || "false";

  try {
    const res = await fetch(`${BOT_API_URL}/api/data/facciones?br=${br}`, {
      headers: { "X-Bot-API-Secret": BOT_API_SECRET },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al obtener facciones del bot" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying facciones:", error);
    return NextResponse.json(
      { error: "Bot API no disponible" },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${BOT_API_URL}/api/data/facciones`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Bot-API-Secret": BOT_API_SECRET,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al crear faccion" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating faccion:", error);
    return NextResponse.json(
      { error: "Bot API no disponible" },
      { status: 503 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const key = searchParams.get("key");
    if (!key) {
      return NextResponse.json({ error: "Key required" }, { status: 400 });
    }

    const res = await fetch(`${BOT_API_URL}/api/data/facciones/${encodeURIComponent(key)}`, {
      method: "DELETE",
      headers: { "X-Bot-API-Secret": BOT_API_SECRET },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al eliminar faccion" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error deleting faccion:", error);
    return NextResponse.json(
      { error: "Bot API no disponible" },
      { status: 503 }
    );
  }
}
