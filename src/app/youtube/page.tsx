"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/common/Navbar";
import YouTubeHeader from "@/components/youtube/YouTubeHeader";
import YouTubeVideosFeed from "@/components/youtube/YouTubeVideosFeed";
import YouTubePlayerModal from "@/components/youtube/YouTubePlayerModal";
import YouTubeBoostModal from "@/components/youtube/YouTubeBoostModal";
import YouTubeSkeleton from "@/components/youtube/YouTubeSkeleton";
import {
  Search,
  Play,
  AlertCircle,
  RefreshCw,
  Video,
  Eye,
  TrendingUp,
} from "lucide-react";
import {
  YouTubeChannel,
  YouTubeVideo,
  cleanYouTubeIdentifier,
  extractYouTubeVideoId,
  getYouTubeChannel,
} from "@/lib/youtubeData";

export default function YouTubePage() {
  const { status } = useSession();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Videos");

  // In-App Video Player State
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  // Pagination State for Loading More Videos
  const [loadingMore, setLoadingMore] = useState(false);

  // Growth Booster Modal State
  const [boostModalOpen, setBoostModalOpen] = useState(false);
  const [boostType, setBoostType] = useState<"subscribers" | "views" | "likes">("subscribers");
  const [boostTargetVideo, setBoostTargetVideo] = useState<YouTubeVideo | null>(null);

  // Load More Videos handler
  const handleLoadMoreVideos = async () => {
    if (!channel?.paginationToken || loadingMore) return;

    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/youtube?channel=${encodeURIComponent(channel.channelHandle)}&pagination_token=${encodeURIComponent(channel.paginationToken)}`
      );
      const json = await res.json();

      if (res.ok && json.data?.videos?.length) {
        setChannel((prev) => {
          if (!prev) return null;
          const existingIds = new Set(prev.videos.map((v) => v.id));
          const newVideos = json.data.videos.filter((v: YouTubeVideo) => !existingIds.has(v.id));

          return {
            ...prev,
            videos: [...prev.videos, ...newVideos],
            paginationToken: json.data.paginationToken || null,
            hasMoreVideos: Boolean(json.data.hasMore ?? json.data.paginationToken),
          };
        });
      } else {
        setChannel((prev) => (prev ? { ...prev, hasMoreVideos: false } : null));
      }
    } catch (err) {
      console.error("Failed to load more videos:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Authentication Route Guard
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Execute channel or video search
  const executeSearch = async (rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    setActiveQuery(trimmed);
    setLoading(true);
    setError(null);

    const videoId = extractYouTubeVideoId(trimmed);

    try {
      const res = await fetch(`/api/youtube?channel=${encodeURIComponent(trimmed)}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch YouTube channel or video");
      }

      setChannel(json.data);

      // If user searched for a direct video link or backend returned targetVideoId, open player modal
      const targetVid = videoId || json.data?.targetVideoId;
      if (targetVid && json.data) {
        const found =
          json.data.videos?.find((v: YouTubeVideo) => v.id === targetVid) ||
          json.data.shorts?.find((v: YouTubeVideo) => v.id === targetVid);

        if (found) {
          setSelectedVideo(found);
        } else {
          setSelectedVideo({
            id: targetVid,
            title: json.data.title ? `${json.data.title} - Video` : "YouTube Video",
            thumbnailUrl: `https://i.ytimg.com/vi/${targetVid}/hqdefault.jpg`,
            viewsCount: 0,
            likesCount: 0,
            publishedAt: "Searched Video",
            duration: "Video",
          });
        }
      }
    } catch (err: any) {
      setChannel(null);
      setError(err.message || `Channel '${trimmed}' not found. The requested YouTube channel does not exist.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      executeSearch(searchTerm);
    }
  };

  // Open Boost Subscribers Modal
  const handleOpenSubscribersBoost = () => {
    setBoostType("subscribers");
    setBoostTargetVideo(null);
    setBoostModalOpen(true);
  };

  // Open Boost Video Views / Likes Modal
  const handleOpenVideoBoost = (video: YouTubeVideo) => {
    setBoostType("views");
    setBoostTargetVideo(video);
    setBoostModalOpen(true);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      {/* Top Sticky Search Bar */}
      <section className="sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 py-3.5 px-4 shadow-xs">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Title Chip */}
          <div className="flex items-center gap-2.5 font-bold text-sm text-slate-900 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-red-600 p-1 flex items-center justify-center text-white shadow-xs">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
            <span>YouTube Profile & Video Viewer</span>
          </div>

          {/* Quick Preset Badges */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <span className="text-slate-400">Popular:</span>
            {["MrBeast", "MKBHD", "PewDiePie", "Veritasium"].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setSearchTerm(name);
                  executeSearch(name);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer text-slate-700 text-[11px]"
              >
                @{name}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-88">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search channel name, @handle, or video URL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 text-sm text-slate-900 pl-9 pr-4 py-2 rounded-xl border border-transparent focus:border-red-600 focus:outline-hidden placeholder:text-slate-400 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={!searchTerm.trim()}
              className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs flex-shrink-0 disabled:opacity-40 cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-grow w-full pb-12">
        {loading ? (
          <YouTubeSkeleton />
        ) : error ? (
          <div className="max-w-md mx-auto my-16 p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-4 shadow-xl animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Channel Not Found</h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">{error}</p>
            </div>
            {activeQuery && (
              <button
                onClick={() => executeSearch(activeQuery)}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            )}
          </div>
        ) : channel ? (
          <div className="animate-in fade-in duration-300">
            {/* Header with Banner & Channel Details */}
            <YouTubeHeader
              channel={channel}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onBoostSubscribers={handleOpenSubscribersBoost}
            />

            {/* Video Feed & Tabs */}
            <YouTubeVideosFeed
              channel={channel}
              activeTab={activeTab}
              onSelectVideo={(video) => setSelectedVideo(video)}
              onBoostVideo={(video) => handleOpenVideoBoost(video)}
              hasMoreVideos={Boolean(channel.hasMoreVideos ?? channel.paginationToken)}
              loadingMore={loadingMore}
              onLoadMoreVideos={handleLoadMoreVideos}
            />
          </div>
        ) : (
          /* Initial Empty State (Prompt user to search) */
          <div className="max-w-md mx-auto my-20 px-6 text-center space-y-5 animate-in fade-in duration-300">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 p-1 shadow-xl shadow-red-500/20">
              <div className="w-full h-full bg-white rounded-[20px] flex items-center justify-center">
                <svg className="w-11 h-11" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
                    fill="#FF0000"
                  />
                  <polygon points="9.545,15.568 15.818,12 9.545,8.432" fill="#FFFFFF" />
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">YouTube Profile & Video Viewer</h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Type any YouTube channel name, handle, or video link in the search bar above and press <strong>Search</strong> or <strong>Enter</strong> to view live profiles & videos.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer Features & Description */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white/60 backdrop-blur-xs py-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* 3 Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-2.5 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Direct Video Link Support</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Paste any YouTube watch link, short, or share URL in the search bar above to immediately load the creator channel and play the video in-app.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-2.5 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Live Channel Analytics</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Inspect authentic subscriber counts, total views, verified badge status, and all recent video uploads with genuine metadata.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-2.5 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Targeted Growth Boosting</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                One-click order genuine subscribers, high-retention video views, and likes directly for any searched channel or video.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* In-App YouTube Player Modal */}
      {selectedVideo && (
        <YouTubePlayerModal
          video={selectedVideo}
          channelTitle={channel?.title}
          channelAvatar={channel?.avatarUrl}
          onClose={() => setSelectedVideo(null)}
          onBoostVideo={(video) => {
            setSelectedVideo(null);
            handleOpenVideoBoost(video);
          }}
        />
      )}

      {/* Growth Booster Modal Popup */}
      {boostModalOpen && channel && (
        <YouTubeBoostModal
          type={boostType}
          targetChannelTitle={channel.title}
          targetHandle={channel.channelHandle}
          avatarUrl={channel.avatarUrl}
          initialCount={
            boostType === "subscribers"
              ? channel.subscribersCount
              : boostTargetVideo
              ? boostTargetVideo.viewsCount
              : 0
          }
          targetVideo={boostTargetVideo}
          onClose={() => setBoostModalOpen(false)}
        />
      )}
    </div>
  );
}
