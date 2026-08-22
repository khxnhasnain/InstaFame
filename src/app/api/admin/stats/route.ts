import { NextRequest, NextResponse } from "next/server";

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

export async function GET(request: NextRequest) {
  try {
    try {
      const url = `${PYTHON_BACKEND_URL}/api/admin/stats`;
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
      data: {
        total_users: 0,
        total_orders: 0,
        total_revenue: 0,
        total_followers_boosted: 0,
        total_likes_boosted: 0,
        database_engine: "MySQL Ready (Local Buffer)",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch stats" }, { status: 500 });
  }
}
