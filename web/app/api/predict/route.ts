import { NextResponse } from "next/server";

const BASE_URL = process.env.MODEL_API_URL || "http://127.0.0.1:8000";

export async function POST(req: Request) {
  const body = await req.json();

  try {
    const r = await fetch(`${BASE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!r.ok) {
      const text = await r.text();
      return NextResponse.json({ ok: false, error: text }, { status: 502 });
    }

    const data = await r.json();
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Could not reach the local model API. Start the backend on :8000 or set MODEL_API_URL.",
        detail: String(e),
      },
      { status: 502 }
    );
  }
}
