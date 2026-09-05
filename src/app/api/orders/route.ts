import { NextRequest, NextResponse } from "next/server";

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("user_email");

    try {
      const url = `${PYTHON_BACKEND_URL}/api/orders${userEmail ? `?user_email=${encodeURIComponent(userEmail)}` : ""}`;
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend offline fallback
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    try {
      const url = `${PYTHON_BACKEND_URL}/api/orders`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return NextResponse.json(data);
      } else {
        return NextResponse.json(
          { error: data.detail || data.error || "Failed to process order" },
          { status: res.status }
        );
      }
    } catch (err: any) {
      console.error("Backend order connection error:", err);
      return NextResponse.json(
        { error: "Backend database service is unreachable. Please ensure the backend server is running." },
        { status: 503 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to record order" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const orderId = body.id || body.order_id;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    try {
      const url = `${PYTHON_BACKEND_URL}/api/orders/${encodeURIComponent(orderId)}/status`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return NextResponse.json(data);
      } else {
        return NextResponse.json(
          { error: data.detail || data.error || "Failed to update order status" },
          { status: res.status }
        );
      }
    } catch (err: any) {
      console.error("Backend order PATCH connection error:", err);
      return NextResponse.json(
        { error: "Backend database service is unreachable. Please ensure the backend server is running." },
        { status: 503 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update order" }, { status: 500 });
  }
}

