"use client";

import React from "react";
import {
  CheckCircle2,
  Sparkles,
  Users,
  Play,
  TrendingUp,
  Globe,
  Calendar,
  Share2,
  Zap,
} from "lucide-react";
import { YouTubeChannel } from "@/lib/youtubeData";

interface YouTubeHeaderProps {
  channel: YouTubeChannel;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onBoostSubscribers: () => void;
}

export default function YouTubeHeader({
  channel,
  activeTab,
  setActiveTab,
  onBoostSubscribers,
}: YouTubeHeaderProps) {
  const tabs = ["Videos", "Shorts", "Community", "About"];

  const formatCount = (num: number): string => {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return num.toLocaleString();
  };

  return (
    <div className="w-full bg-white border-b border-slate-200">
      {/* 1. Channel Banner Art */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-4">
        <div className="relative w-full aspect-[6/1] sm:aspect-[6.5/1] min-h-[130px] sm:min-h-[170px] rounded-3xl overflow-hidden bg-slate-900 shadow-md">
          {channel.bannerUrl ? (
            <img
              src={channel.bannerUrl}
              alt={`${channel.title} Banner`}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes("/api/image-proxy")) {
                  target.src = `/api/image-proxy?url=${encodeURIComponent(channel.bannerUrl)}`;
                }
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-red-600 via-rose-600 to-zinc-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        </div>
      </div>

      {/* 2. Channel Main Info Bar */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left: Avatar + Title + Stats */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Channel Avatar */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-white shadow-xl ring-4 ring-slate-100 flex-shrink-0 -mt-10 sm:-mt-14 z-10">
              <img
                src={channel.avatarUrl}
                alt={channel.title}
                className="w-full h-full rounded-full object-cover bg-slate-100"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes("/api/image-proxy")) {
                    target.src = `/api/image-proxy?url=${encodeURIComponent(channel.avatarUrl)}`;
                  }
                }}
              />
            </div>

            {/* Title & Metadata */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {channel.title}
                </h1>
                {channel.verified && (
                  <span title="Verified Channel" className="inline-flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-slate-600 fill-slate-200" />
                  </span>
                )}
                {channel.isLiveApiData && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-300">
                    Live Channel
                  </span>
                )}
              </div>

              {/* Handles & Stats pills */}
              <div className="flex items-center flex-wrap gap-2 text-xs sm:text-sm text-slate-600 font-medium">
                <span className="font-bold text-slate-900">{channel.channelHandle}</span>
                <span>•</span>
                <span className="font-extrabold text-slate-900">
                  {formatCount(channel.subscribersCount)} subscribers
                </span>
                <span>•</span>
                <span>{channel.videosCount.toLocaleString()} videos</span>
              </div>

              {/* Bio / Description preview */}
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl line-clamp-2 leading-relaxed pt-0.5">
                {channel.description || `Welcome to the official channel of ${channel.title}.`}
              </p>
            </div>
          </div>

          {/* Right: Subscribe & Boost Channel Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto flex-shrink-0">
            <button
              onClick={onBoostSubscribers}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:opacity-95 active:scale-95 text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-full shadow-lg shadow-red-600/25 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Boost Subscribers</span>
            </button>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: channel.title,
                    url: window.location.href,
                  }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Channel link copied to clipboard!");
                }
              }}
              className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
              title="Share Channel"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-6 border-t border-slate-100 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3.5 text-xs sm:text-sm font-bold transition-all relative whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "text-slate-900 font-extrabold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>{tab}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
