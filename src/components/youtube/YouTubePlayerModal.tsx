"use client";

import React, { useEffect } from "react";
import { X, Play, Eye, ThumbsUp, Sparkles, ExternalLink, ShieldCheck, Share2 } from "lucide-react";
import { YouTubeVideo } from "@/lib/youtubeData";

interface YouTubePlayerModalProps {
  video: YouTubeVideo | null;
  channelTitle?: string;
  channelAvatar?: string;
  onClose: () => void;
  onBoostVideo?: (video: YouTubeVideo) => void;
}

export default function YouTubePlayerModal({
  video,
  channelTitle,
  channelAvatar,
  onClose,
  onBoostVideo,
}: YouTubePlayerModalProps) {
  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!video) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-red-600/30">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-red-500 uppercase tracking-wider block">
                In-App YouTube Viewer
              </span>
              <h3 className="text-sm font-bold text-zinc-100 truncate">{video.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {onBoostVideo && (
              <button
                onClick={() => onBoostVideo(video)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-extrabold shadow-md shadow-red-600/25 transition-all cursor-pointer active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Boost Video</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
              aria-label="Close Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embedded Video Player Container */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          <iframe
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* Video Info Footer */}
        <div className="p-5 space-y-4 overflow-y-auto bg-zinc-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-white leading-snug">{video.title}</h2>
              <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                <span className="flex items-center gap-1 font-semibold">
                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                  {video.viewsCount.toLocaleString()} views
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-semibold">
                  <ThumbsUp className="w-3.5 h-3.5 text-zinc-400" />
                  {video.likesCount.toLocaleString()} likes
                </span>
                <span>•</span>
                <span>{video.publishedAt}</span>
              </div>
            </div>

            {/* Channel Info Pill */}
            {channelTitle && (
              <div className="flex items-center gap-2.5 bg-zinc-800/60 px-3.5 py-2 rounded-2xl border border-zinc-700/60 flex-shrink-0">
                {channelAvatar ? (
                  <img
                    src={channelAvatar}
                    alt={channelTitle}
                    className="w-7 h-7 rounded-full object-cover border border-zinc-600"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold">
                    {channelTitle.charAt(0)}
                  </div>
                )}
                <span className="text-xs font-bold text-zinc-200">{channelTitle}</span>
              </div>
            )}
          </div>

          {video.description && (
            <div className="p-3.5 bg-zinc-950/60 rounded-2xl border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed max-h-24 overflow-y-auto">
              {video.description}
            </div>
          )}

          {/* Quick Stats & Security Pill */}
          <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-800/60">
            <div className="flex items-center gap-1 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Playing securely in InstaFame viewer</span>
            </div>
            <a
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-zinc-400 hover:text-red-400 font-bold transition-colors"
            >
              <span>Open on YouTube.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
