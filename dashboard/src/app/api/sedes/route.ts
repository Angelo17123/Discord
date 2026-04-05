import { NextRequest, NextResponse } from "next/server";

const BOT_API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || "http://localhost:3001";
const BOT_API_SECRET = process.env.NEXT_PUBLIC_BOT_API_SECRET || "";

export async function GET() {
  try {
    const res = await fetch(`${BOT_API_URL}/api/data/sedes`, {
      headers: { "X-Bot-API-Secret": BOT_API_SECRET },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al obtener sedes del bot" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying sedes:", error);
    return NextResponse.json(
      { error: "Bot API no disponible" },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${BOT_API_URL}/api/data/sedes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Bot-API-Secret": BOT_API_SECRET,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al crear sede" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating sede:", error);
    return NextResponse.json(
      { error: "Bot API no disponible" },
      { status: 503 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const name = searchParams.get("name");
    if (!name) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    const res = await fetch(`${BOT_API_URL}/api/data/sedes/${encodeURIComponent(name)}`, {
      method: "DELETE",
      headers: { "X-Bot-API-Secret": BOT_API_SECRET },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al eliminar sede" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error deleting sede:", error);
    return NextResponse.json(
      { error: "Bot API no disponible" },
      { status: 503 }
    );
  }
}
