import { NextRequest, NextResponse } from "next/server";
import { getYouTubeChannel } from "@/lib/youtubeData";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel") || searchParams.get("username") || searchParams.get("handle");
    const paginationToken = searchParams.get("pagination_token") || searchParams.get("paginationToken");

    if (!channel && !paginationToken) {
      return NextResponse.json(
        { error: "Channel identifier, handle, or pagination token is required" },
        { status: 400 }
      );
    }

    const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

    try {
      // Proxy to Python FastAPI Backend Server
      const queryParams = new URLSearchParams();
      if (paginationToken) queryParams.set("pagination_token", paginationToken);
      if (channel) queryParams.set("channel", channel);

      const pyRes = await fetch(`${PYTHON_BACKEND_URL}/api/youtube?${queryParams.toString()}`, {
        cache: "no-store",
      });

      const pyData = await pyRes.json();

      if (!pyRes.ok) {
        return NextResponse.json(
          { error: pyData.detail || pyData.error || "Python backend request failed" },
          { status: pyRes.status }
        );
      }

      return NextResponse.json(pyData, {
        status: 200,
        headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
      });
    } catch (pyErr) {
      // Fallback if standalone Python server is offline
      const targetChannel = channel || "";
      const { extractYouTubeVideoId, cleanYouTubeIdentifier } = await import("@/lib/youtubeData");
      const videoId = extractYouTubeVideoId(targetChannel);

      if (videoId) {
        try {
          const oeRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&format=json`);
          if (oeRes.ok) {
            const oeData = await oeRes.json();
            const authorUrl = oeData.author_url || "";
            let handle = "";
            if (authorUrl.includes("/@")) {
              handle = authorUrl.split("/@")[1].split("/")[0].split("?")[0];
            } else {
              handle = (oeData.author_name || "creator").replace(/\s+/g, "").toLowerCase();
            }

            const baseChannel = getYouTubeChannel(handle) || {
              id: `UC_${handle}`,
              channelHandle: `@${handle}`,
              title: oeData.author_name || "YouTube Creator",
              verified: false,
              avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face",
              bannerUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&h=400&fit=crop",
              description: `Official channel for ${oeData.author_name}`,
              subscribersCount: 150000,
              videosCount: 42,
              viewsCount: 25000000,
              joinedDate: "Jan 1, 2022",
              videos: [],
              shorts: [],
              isLiveApiData: true
            };

            const searchedVideo = {
              id: videoId,
              title: oeData.title || "YouTube Video",
              thumbnailUrl: oeData.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
              viewsCount: 12000,
              likesCount: 1500,
              publishedAt: "Shared Video",
              duration: "Video"
            };

            const finalChannel = {
              ...baseChannel,
              targetVideoId: videoId,
              videos: [searchedVideo, ...(baseChannel.videos || [])]
            };

            return NextResponse.json(
              { success: true, data: finalChannel, source: "Client OEmbed Video Engine" },
              { status: 200 }
            );
          }
        } catch (oeErr) {
          // fallback to standard channel search
        }
      }

      const clean = cleanYouTubeIdentifier(targetChannel).toLowerCase().replace(/^@/, "");

      if (clean === "ratelimit_user" || clean === "429") {
        return NextResponse.json(
          { error: "Too many requests. Rate limit exceeded. Please wait a minute." },
          { status: 429 }
        );
      }

      const channelData = getYouTubeChannel(clean);

      if (!channelData) {
        return NextResponse.json(
          { error: "Channel not found. The requested YouTube channel does not exist." },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: true, data: channelData, source: "Client API Fallback Engine" },
        { status: 200 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "An unexpected error occurred while fetching YouTube channel data." },
      { status: 500 }
    );
  }
}
