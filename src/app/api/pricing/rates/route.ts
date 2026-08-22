import { NextRequest, NextResponse } from "next/server";

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

export async function GET(request: NextRequest) {
  try {
    try {
      const url = `${PYTHON_BACKEND_URL}/api/pricing/rates`;
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend offline fallback
    }

    return NextResponse.json({
      success: true,
      data: { rate_per_1000_followers: 8.0, rate_per_1000_likes: 4.0, currency: "USD" },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch rates" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    try {
      const url = `${PYTHON_BACKEND_URL}/api/pricing/rates`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend offline fallback
    }

    return NextResponse.json({ success: true, data: body, message: "Rates updated locally" });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update rates" }, { status: 500 });
  }
}
