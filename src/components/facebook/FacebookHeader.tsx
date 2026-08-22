"use client";

import React, { useState } from "react";
import { CheckCircle2, UserPlus, MessageCircle, MoreHorizontal, Camera, PenSquare, ChevronDown } from "lucide-react";
import { FacebookProfile } from "@/lib/facebookData";

interface FacebookHeaderProps {
  profile: FacebookProfile;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function FacebookHeader({ profile, activeTab, setActiveTab }: FacebookHeaderProps) {
  const [isFriend, setIsFriend] = useState(false);

  const formatFriends = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
    if (count >= 1000) return (count / 1000).toFixed(1) + "K";
    return count.toLocaleString();
  };

  const tabs = ["Posts", "About", "Friends", "Photos", "Videos"];

  return (
    <div className="w-full bg-white dark:bg-[#242526] shadow-sm rounded-b-xl overflow-hidden mb-4 border-b border-slate-200 dark:border-[#3E4042]">
      {/* Cover Photo */}
      <div className="relative w-full h-48 sm:h-72 md:h-96 bg-slate-200 dark:bg-slate-800">
        <img
          src={profile.coverUrl}
          alt={`${profile.fullName}'s cover photo`}
          className="w-full h-full object-cover"
        />
        <button className="absolute bottom-4 right-4 bg-white/90 dark:bg-black/70 hover:bg-white text-slate-800 dark:text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 shadow backdrop-blur-sm transition-all">
          <Camera className="w-4 h-4" />
          Edit Cover Photo
        </button>
      </div>

      {/* Header Profile Section */}
      <div className="max-w-[1024px] mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-4 -mt-16 sm:-mt-24 pb-4 border-b border-slate-200 dark:border-[#3E4042]">
          {/* Avatar & Name Info */}
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 text-center md:text-left">
            <div className="relative">
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="w-36 h-36 sm:w-44 sm:h-44 rounded-full object-cover border-4 border-white dark:border-[#242526] shadow-lg bg-white"
              />
              <button className="absolute bottom-2 right-2 bg-slate-200 dark:bg-[#3A3B3C] p-2 rounded-full border-2 border-white dark:border-[#242526] hover:opacity-90">
                <Camera className="w-4 h-4 text-slate-800 dark:text-white" />
              </button>
            </div>

            <div className="space-y-1 pb-1">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {profile.fullName}
                </h1>
                {profile.verified && (
                  <CheckCircle2 className="w-6 h-6 text-facebook-blue fill-facebook-blue text-white" />
                )}
              </div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {formatFriends(profile.friendsCount)} friends
                {profile.mutualFriendsCount && ` · ${profile.mutualFriendsCount} mutual`}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 pb-1">
            <button
              onClick={() => setIsFriend(!isFriend)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                isFriend
                  ? "bg-slate-200 dark:bg-[#3A3B3C] text-slate-900 dark:text-white"
                  : "bg-facebook-blue hover:bg-facebook-hoverBlue text-white shadow-sm"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              {isFriend ? "Friends" : "Add Friend"}
            </button>

            <button className="flex items-center gap-2 bg-slate-200 dark:bg-[#3A3B3C] hover:bg-slate-300 dark:hover:bg-[#4E4F50] text-slate-900 dark:text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
              <MessageCircle className="w-4 h-4" />
              Message
            </button>

            <button className="bg-slate-200 dark:bg-[#3A3B3C] hover:bg-slate-300 dark:hover:bg-[#4E4F50] text-slate-900 dark:text-white p-2 rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Profile Nav Tabs */}
        <div className="flex items-center justify-between overflow-x-auto hide-scrollbar pt-1">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 font-semibold text-sm border-b-4 transition-colors whitespace-nowrap ${
                    isActive
                      ? "border-facebook-blue text-facebook-blue"
                      : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#3A3B3C] rounded-lg"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <button className="hidden sm:flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#3A3B3C] px-3 py-2 rounded-lg text-sm font-semibold">
            More
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
