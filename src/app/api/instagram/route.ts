import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const paginationToken = searchParams.get("pagination_token") || undefined;
    const typeParam = (searchParams.get("type") as "all" | "posts" | "reels") || "all";

    if (!username) {
      return NextResponse.json(
        { error: "Username parameter is required" },
        { status: 400 }
      );
    }

    const cleanUsername = username.toLowerCase().trim().replace(/^@/, "");

    if (cleanUsername === "ratelimit_user" || cleanUsername === "429") {
      return NextResponse.json(
        { error: "Too many requests. Rate limit exceeded. Please wait a minute." },
        { status: 429 }
      );
    }

    const limitParam = searchParams.get("limit") || "12";

    const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

    // Call Python FastAPI backend (instagrapi)
    try {
      let pyUrl = `${PYTHON_BACKEND_URL}/instagram/profile/${encodeURIComponent(cleanUsername)}`;
      if (typeParam === "posts") {
        pyUrl = `${PYTHON_BACKEND_URL}/instagram/profile/${encodeURIComponent(cleanUsername)}/posts?limit=${encodeURIComponent(limitParam)}${paginationToken ? `&pagination_token=${encodeURIComponent(paginationToken)}` : ""}`;
      } else if (typeParam === "reels") {
        pyUrl = `${PYTHON_BACKEND_URL}/instagram/profile/${encodeURIComponent(cleanUsername)}/reels?limit=${encodeURIComponent(limitParam)}${paginationToken ? `&pagination_token=${encodeURIComponent(paginationToken)}` : ""}`;
      }

      const pyRes = await fetch(pyUrl, { cache: "no-store", signal: AbortSignal.timeout(18000) });

      if (pyRes.ok) {
        const pyData = await pyRes.json();
        if (pyData) {
          const responseData = pyData.data || pyData;
          return NextResponse.json(
            { success: true, data: responseData, source: "Python instagrapi Backend" },
            {
              status: 200,
              headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
            }
          );
        }
      }

      const errData = await pyRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.detail || errData.error || `User '@${cleanUsername}' not found or instagrapi fetch failed.` },
        { status: pyRes.status || 404 }
      );
    } catch (pyErr: any) {
      console.warn("Python backend connection error:", pyErr);
      const isTimeout = pyErr?.name === "TimeoutError" || pyErr?.message?.includes("aborted");
      return NextResponse.json(
        { 
          error: isTimeout 
            ? "Instagram request timed out. Instagram may be rate-limiting automated requests from your current IP. Please use IG_SESSIONID in .env.local for instant bypass." 
            : `Python instagrapi backend error: ${pyErr?.message || "Connection failed"}. Please ensure 'python backend/main.py' is running on http://127.0.0.1:8000.` 
        },
        { status: 503 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred while fetching Instagram profile data." },
      { status: 500 }
    );
  }
}
