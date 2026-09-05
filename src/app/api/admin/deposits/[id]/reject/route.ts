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

    if (!isUserAdmin(session.user.email)) {
      return NextResponse.json({ error: "Forbidden: Administrator privileges required" }, { status: 403 });
    }

    const adminId = (session.user as any)?.id || session.user.email;
    const depositId = params.id;

    const body = await request.json().catch(() => ({}));
    const rejectionReason = (body.rejection_reason || "").trim();

    if (rejectionReason.length < 3 || rejectionReason.length > 500) {
      return NextResponse.json(
        { error: "A valid rejection reason between 3 and 500 characters is required." },
        { status: 400 }
      );
    }

    const res = await fetch(`${PYTHON_BACKEND_URL}/api/admin/deposits/${encodeURIComponent(depositId)}/reject`, {
      method: "POST",
      headers: {
        "X-Internal-Secret": INTERNAL_API_SECRET,
        "X-Admin-Id": adminId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rejection_reason: rejectionReason }),
      signal: AbortSignal.timeout(8000),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || "Failed to reject deposit" },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal server error rejecting deposit" }, { status: 500 });
  }
}
