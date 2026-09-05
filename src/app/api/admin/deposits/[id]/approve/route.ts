import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, isUserAdmin } from "@/lib/auth";

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || "instafame_internal_server_secret_7392817491028374";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Enforce admin authorization server-side
    if (!isUserAdmin(session.user.email)) {
      return NextResponse.json({ error: "Forbidden: Administrator privileges required" }, { status: 403 });
    }

    const adminId = (session.user as any)?.id || session.user.email;
    const depositId = params.id;

    // Call FastAPI backend to execute transactional approval with FOR UPDATE locks
    // NOTE: Does NOT send or accept any client-supplied 'verified_amount'
    const res = await fetch(`${PYTHON_BACKEND_URL}/api/admin/deposits/${encodeURIComponent(depositId)}/approve`, {
      method: "POST",
      headers: {
        "X-Internal-Secret": INTERNAL_API_SECRET,
        "X-Admin-Id": adminId,
      },
      signal: AbortSignal.timeout(8000),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || "Failed to approve deposit" },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal server error approving deposit" }, { status: 500 });
  }
}
