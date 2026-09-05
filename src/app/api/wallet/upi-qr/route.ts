import { NextRequest, NextResponse } from "next/server";

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const amount = searchParams.get("amount") || "100";

    const res = await fetch(`${PYTHON_BACKEND_URL}/api/wallet/upi-qr?amount=${encodeURIComponent(amount)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    const errData = await res.json().catch(() => ({}));
    return NextResponse.json(
      {
        success: false,
        error: errData.detail || "Failed to generate dynamic amount QR code",
      },
      { status: res.status }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error generating dynamic QR",
      },
      { status: 500 }
    );
  }
}
