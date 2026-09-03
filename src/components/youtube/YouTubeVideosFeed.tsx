"use client";

import React from "react";
import {
  Play,
  Eye,
  ThumbsUp,
  Clock,
  Sparkles,
  ExternalLink,
  Flame,
  Globe,
  Calendar,
  Layers,
  MessageSquare,
} from "lucide-react";
import { YouTubeChannel, YouTubeVideo } from "@/lib/youtubeData";

interface YouTubeVideosFeedProps {
  channel: YouTubeChannel;
  activeTab: string;
  onSelectVideo: (video: YouTubeVideo) => void;
  onBoostVideo: (video: YouTubeVideo) => void;
  hasMoreVideos?: boolean;
  loadingMore?: boolean;
  onLoadMoreVideos?: () => void;
}

export default function YouTubeVideosFeed({
  channel,
  activeTab,
  onSelectVideo,
  onBoostVideo,
  hasMoreVideos,
  loadingMore,
  onLoadMoreVideos,
}: YouTubeVideosFeedProps) {
  const formatCount = (num: number): string => {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return num.toLocaleString();
  };

  // Tab 1: Videos Grid
  if (activeTab === "Videos") {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-red-600 fill-current" />
            <h2 className="text-xl font-extrabold text-slate-900">Latest Uploads</h2>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {channel.videos.length} videos
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {channel.videos.map((video) => (
            <div
              key={video.id}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              {/* Thumbnail Container */}
              <div
                onClick={() => onSelectVideo(video)}
                className="relative aspect-video w-full bg-slate-900 cursor-pointer overflow-hidden"
              >
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes("/api/image-proxy")) {
                      target.src = `/api/image-proxy?url=${encodeURIComponent(video.thumbnailUrl)}`;
                    }
                  }}
                />

                {/* Duration Badge */}
                {video.duration && (
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                    {video.duration}
                  </span>
                )}

                {/* Hover Play Button Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Video Info Content */}
              <div className="p-4 flex flex-col flex-grow justify-between space-y-3">
                <div className="space-y-1.5">
                  <h3
                    onClick={() => onSelectVideo(video)}
                    className="font-bold text-sm text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2 cursor-pointer leading-snug"
                    title={video.title}
                  >
                    {video.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span>{formatCount(video.viewsCount)} views</span>
                    <span>•</span>
                    <span>{video.publishedAt}</span>
                  </div>
                </div>

                {/* Action Buttons: In-App Play & Boost Video */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => onSelectVideo(video)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3 rounded-xl transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Watch</span>
                  </button>

                  <button
                    onClick={() => onBoostVideo(video)}
                    className="flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-extrabold py-2 px-3 rounded-xl transition-colors border border-red-200 cursor-pointer"
                    title="Boost Views & Likes on this video"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Boost</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Videos Button */}
        {hasMoreVideos && (
          <div className="flex justify-center pt-8 pb-4">
            <button
              onClick={onLoadMoreVideos}
              disabled={loadingMore}
              className="inline-flex items-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm px-8 py-3.5 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loadingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Loading previous videos...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  <span>Load More Videos</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Tab 2: Shorts Tab
  if (activeTab === "Shorts") {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Flame className="w-5 h-5 text-red-600 fill-current" />
          <h2 className="text-xl font-extrabold text-slate-900">YouTube Shorts</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {channel.shorts.map((short) => (
            <div
              key={short.id}
              onClick={() => onSelectVideo(short)}
              className="group relative aspect-[9/16] bg-slate-900 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
            >
              <img
                src={short.thumbnailUrl}
                alt={short.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes("/api/image-proxy")) {
                    target.src = `/api/image-proxy?url=${encodeURIComponent(short.thumbnailUrl)}`;
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              <div className="absolute bottom-3 left-3 right-3 space-y-1">
                <h4 className="text-white text-xs font-bold line-clamp-2 leading-tight">
                  {short.title}
                </h4>
                <p className="text-[11px] text-zinc-300 font-semibold">
                  {formatCount(short.viewsCount)} views
                </p>
              </div>

              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Tab 3: Community Posts
  if (activeTab === "Community") {
    return (
      <div className="max-w-[768px] mx-auto px-4 py-8 space-y-6">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-red-600" />
          <span>Community Updates</span>
        </h2>

        {channel.communityPosts && channel.communityPosts.length > 0 ? (
          channel.communityPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4"
            >
              <div className="flex items-center gap-3">
                <img
                  src={post.authorAvatar}
                  alt={post.authorName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{post.authorName}</h4>
                  <p className="text-xs text-slate-500">{post.timestamp}</p>
                </div>
              </div>

              <p className="text-sm text-slate-800 leading-relaxed">{post.content}</p>

              {post.imageUrl && (
                <div className="rounded-xl overflow-hidden aspect-video bg-slate-100">
                  <img
                    src={post.imageUrl}
                    alt="Community attachment"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex items-center gap-6 text-xs font-bold text-slate-500 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <ThumbsUp className="w-4 h-4 text-red-600" />
                  {formatCount(post.likesCount)}
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  {formatCount(post.commentsCount)} comments
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
            No community updates published yet.
          </div>
        )}
      </div>
    );
  }

  // Tab 4: About Channel
  return (
    <div className="max-w-[1024px] mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Description */}
        <div className="md:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">About {channel.title}</h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {channel.description || "No channel description available."}
            </p>
          </div>

          <div className="pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-left">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold uppercase">Subscribers</span>
              <p className="text-base font-extrabold text-slate-900">
                {channel.subscribersCount.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold uppercase">Total Views</span>
              <p className="text-base font-extrabold text-slate-900">
                {channel.viewsCount.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold uppercase">Videos</span>
              <p className="text-base font-extrabold text-slate-900">
                {channel.videosCount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Right Stats Sidebar */}
        <div className="md:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 h-fit">
          <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Channel Details
          </h4>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>Location: <strong>{channel.country || "Global"}</strong></span>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>Joined: <strong>{channel.joinedDate || "Unknown"}</strong></span>
            </div>

            <div className="flex items-center gap-3">
              <Layers className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>Custom Handle: <strong>{channel.channelHandle}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
