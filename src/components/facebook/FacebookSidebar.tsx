"use client";

import React from "react";
import { Briefcase, GraduationCap, Home, MapPin, Heart, Clock, Image as ImageIcon, Users } from "lucide-react";
import { FacebookProfile } from "@/lib/facebookData";

interface FacebookSidebarProps {
  profile: FacebookProfile;
}

export default function FacebookSidebar({ profile }: FacebookSidebarProps) {
  return (
    <div className="space-y-4">
      {/* Intro Box */}
      <div className="bg-white dark:bg-[#242526] p-4 rounded-xl shadow-sm border border-slate-200 dark:border-[#3E4042]">
        <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-3">Intro</h2>

        {/* Bio */}
        {profile.bio && (
          <p className="text-center text-sm text-slate-700 dark:text-slate-300 pb-3 border-b border-slate-200 dark:border-[#3E4042]">
            {profile.bio}
          </p>
        )}

        {/* Info Items */}
        <div className="space-y-3 pt-3 text-sm text-slate-700 dark:text-slate-300">
          {profile.workplace && (
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-slate-500 flex-shrink-0" />
              <span>{profile.workplace}</span>
            </div>
          )}

          {profile.education && (
            <div className="flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-slate-500 flex-shrink-0" />
              <span>{profile.education}</span>
            </div>
          )}

          {profile.livesIn && (
            <div className="flex items-center gap-3">
              <Home className="w-5 h-5 text-slate-500 flex-shrink-0" />
              <span>
                Lives in <strong className="font-semibold">{profile.livesIn}</strong>
              </span>
            </div>
          )}

          {profile.fromLocation && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-slate-500 flex-shrink-0" />
              <span>
                From <strong className="font-semibold">{profile.fromLocation}</strong>
              </span>
            </div>
          )}

          {profile.relationshipStatus && (
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-slate-500 flex-shrink-0" />
              <span>{profile.relationshipStatus}</span>
            </div>
          )}

          {profile.joinedDate && (
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-slate-500 flex-shrink-0" />
              <span>Joined {profile.joinedDate}</span>
            </div>
          )}
        </div>

        <button className="w-full mt-4 bg-slate-100 dark:bg-[#3A3B3C] hover:bg-slate-200 dark:hover:bg-[#4E4F50] text-slate-900 dark:text-white font-semibold py-2 rounded-lg text-sm transition-colors">
          Edit Details
        </button>
      </div>

      {/* Featured Photos Grid */}
      <div className="bg-white dark:bg-[#242526] p-4 rounded-xl shadow-sm border border-slate-200 dark:border-[#3E4042]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-facebook-blue" />
            Photos
          </h2>
          <button className="text-facebook-blue text-sm font-semibold hover:underline">
            See all photos
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden">
          {profile.featuredPhotos.slice(0, 6).map((img, idx) => (
            <div key={idx} className="aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <img
                src={img}
                alt="Featured Photo"
                loading="lazy"
                className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Friends Card Summary */}
      <div className="bg-white dark:bg-[#242526] p-4 rounded-xl shadow-sm border border-slate-200 dark:border-[#3E4042]">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-facebook-blue" />
              Friends
            </h2>
            <p className="text-xs text-slate-500">{profile.friendsCount.toLocaleString()} friends</p>
          </div>
          <button className="text-facebook-blue text-sm font-semibold hover:underline">
            See all friends
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3">
          {profile.featuredPhotos.slice(0, 6).map((img, idx) => (
            <div key={idx} className="space-y-1 cursor-pointer">
              <img
                src={img}
                alt="Friend"
                className="w-full aspect-square rounded-lg object-cover"
              />
              <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                Friend {idx + 1}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
