import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || "instafame_internal_server_secret_7392817491028374";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const utr = searchParams.get("utr")?.trim() || "";

    if (!/^[0-9]{12}$/.test(utr)) {
      return NextResponse.json(
        { exists: false, valid: false, message: "UTR must be exactly 12 numeric digits." },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${PYTHON_BACKEND_URL}/api/wallet/deposits/check-utr?utr=${encodeURIComponent(utr)}`,
      {
        headers: {
          "X-Internal-Secret": INTERNAL_API_SECRET,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      }
    );

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to check UTR availability" },
      { status: 500 }
    );
  }
}
