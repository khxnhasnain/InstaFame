import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, isUserAdmin } from "@/lib/auth";

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || "instafame_internal_server_secret_7392817491028374";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!isUserAdmin(session.user.email)) {
      return NextResponse.json({ error: "Forbidden: Administrator privileges required" }, { status: 403 });
    }

    const adminId = (session.user as any)?.id || session.user.email;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";
    const page = searchParams.get("page") || "1";
    const pageSize = searchParams.get("page_size") || "20";

    const res = await fetch(
      `${PYTHON_BACKEND_URL}/api/admin/deposits?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}&page=${encodeURIComponent(page)}&page_size=${encodeURIComponent(pageSize)}`,
      {
        headers: {
          "X-Internal-Secret": INTERNAL_API_SECRET,
          "X-Admin-Id": adminId,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      }
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch admin deposits" }, { status: 500 });
  }
}
