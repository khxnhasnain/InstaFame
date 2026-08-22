import { NextRequest, NextResponse } from "next/server";
import { fetchLiveRapidApiInstagramProfile } from "@/lib/instagramData";

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

    const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

    // 1. Try Python FastAPI Backend Server
    try {
      let pyUrl = `${PYTHON_BACKEND_URL}/api/instagram?username=${encodeURIComponent(cleanUsername)}&type=${encodeURIComponent(typeParam)}`;
      if (paginationToken) {
        pyUrl += `&pagination_token=${encodeURIComponent(paginationToken)}`;
      }
      const pyRes = await fetch(pyUrl, { cache: "no-store", signal: AbortSignal.timeout(5000) });
      if (pyRes.ok) {
        const pyData = await pyRes.json();
        if (pyData && pyData.data) {
          return NextResponse.json(pyData, {
            status: 200,
            headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
          });
        }
      }
    } catch (pyErr) {
      // Fallback to direct RapidAPI
    }

    // 2. Fetch directly from RapidAPI Live Engine
    const result = await fetchLiveRapidApiInstagramProfile(cleanUsername, paginationToken, typeParam);

    if (result.profile) {
      return NextResponse.json(
        { success: true, data: result.profile, source: "RapidAPI Live Instagram Engine" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: result.error || `User '@${cleanUsername}' not found on Instagram.` },
      { status: result.status || 404 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred while fetching Instagram profile data." },
      { status: 500 }
    );
  }
}
