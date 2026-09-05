import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, isUserAdmin } from "@/lib/auth";

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || "instafame_internal_server_secret_7392817491028374";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any)?.id || session.user.email;
    const userEmail = session.user.email;
    const isAdmin = Boolean(
      (session.user as any)?.isAdmin ||
      (session.user as any)?.role === "admin" ||
      isUserAdmin(userEmail)
    );

    const depositId = params.id;
    if (!depositId) {
      return NextResponse.json({ error: "Deposit ID is required" }, { status: 400 });
    }

    const res = await fetch(`${PYTHON_BACKEND_URL}/api/wallet/deposits/${encodeURIComponent(depositId)}/screenshot`, {
      headers: {
        "X-Internal-Secret": INTERNAL_API_SECRET,
        "X-User-Id": userId,
        "X-Is-Admin": isAdmin ? "true" : "false",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.detail || "Unable to access payment screenshot" },
        { status: res.status }
      );
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const imageBuffer = await res.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to retrieve payment screenshot" }, { status: 500 });
  }
}
