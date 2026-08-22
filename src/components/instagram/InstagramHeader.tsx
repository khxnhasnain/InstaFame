"use client";

import React, { useState } from "react";
import { CheckCircle2, MoreHorizontal, UserPlus, ExternalLink, Zap } from "lucide-react";
import { InstagramProfile } from "@/lib/instagramData";
import InstagramBoostModal from "./InstagramBoostModal";

interface InstagramHeaderProps {
  profile: InstagramProfile;
}

export default function InstagramHeader({ profile }: InstagramHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 10000) return (num / 1000).toFixed(1) + "k";
    return num.toLocaleString();
  };

  return (
    <header className="w-full max-w-[935px] mx-auto flex flex-col pt-6 pb-6 px-4 md:px-0">
      <div className="flex flex-col md:flex-row">
        {/* Avatar Container */}
        <div className="flex-shrink-0 flex justify-center md:justify-start md:mr-16 mb-6 md:mb-0 w-full md:w-auto">
          <div className="relative group cursor-pointer">
            {/* Gradient Ring */}
            <div className="w-[90px] h-[90px] md:w-[154px] md:h-[154px] rounded-full p-[3px] ig-gradient-border flex items-center justify-center shadow-sm">
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'><circle cx='12' cy='12' r='10' fill='%23f1f5f9'/><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' fill='%2394a3b8'/></svg>";
                }}
              />
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="flex flex-col flex-grow text-center md:text-left">
          {/* Username + Action Buttons */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-3.5 mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-normal text-slate-900 dark:text-white tracking-tight">
                {profile.username}
              </h1>
              {profile.isVerified && (
                <CheckCircle2 className="w-5 h-5 text-sky-500 fill-sky-500 text-white" />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {/* Increase Followers UI Button */}
              <button
                onClick={() => setShowBoostModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-extrabold text-white bg-gradient-to-r from-instagram-orange via-instagram-pink to-indigo-600 shadow-md shadow-pink-500/25 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                <span>Increase Followers</span>
              </button>

              <button
                onClick={() => setIsFollowing(!isFollowing)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  isFollowing
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300"
                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>

              <button className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white p-2 rounded-lg transition-colors cursor-pointer">
                <UserPlus className="w-4 h-4" />
              </button>

              <button className="p-1 text-slate-700 dark:text-slate-300 hover:opacity-70 transition-opacity cursor-pointer">
                <MoreHorizontal className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <ul className="flex justify-center md:justify-start gap-8 md:gap-10 py-3 mb-3 border-y md:border-y-0 border-slate-200 dark:border-slate-800 text-sm md:text-base">
            <li className="text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatNumber(profile.postsCount)}
              </span>{" "}
              posts
            </li>
            <li className="text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatNumber(profile.followersCount)}
              </span>{" "}
              followers
            </li>
            <li className="text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatNumber(profile.followingCount)}
              </span>{" "}
              following
            </li>
          </ul>

          {/* Bio Section */}
          <div className="text-sm text-slate-900 dark:text-slate-100 max-w-[440px] space-y-1">
            <p className="font-semibold text-base">{profile.fullName}</p>
            {profile.category && (
              <p className="text-slate-500 dark:text-slate-400 font-medium text-xs">
                {profile.category}
              </p>
            )}
            <p className="whitespace-pre-line text-slate-700 dark:text-slate-300">{profile.bio}</p>
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400 hover:underline pt-1 text-xs"
              >
                <ExternalLink className="w-3 h-3" />
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Increase Followers Modal */}
      {showBoostModal && (
        <InstagramBoostModal
          type="followers"
          targetUsername={profile.username}
          avatarUrl={profile.avatarUrl}
          initialCount={profile.followersCount}
          onClose={() => setShowBoostModal(false)}
        />
      )}
    </header>
  );
}
