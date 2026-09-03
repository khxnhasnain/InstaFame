"use client";

import React from "react";

export default function YouTubeSkeleton() {
  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-8 animate-pulse">
      {/* Banner Skeleton */}
      <div className="w-full aspect-[6.5/1] min-h-[140px] bg-slate-200 rounded-3xl" />

      {/* Header Info Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 -mt-12 sm:-mt-14 px-2">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-300 ring-4 ring-white" />
        <div className="space-y-3 flex-grow pt-2">
          <div className="w-48 h-7 bg-slate-200 rounded-xl" />
          <div className="w-36 h-4 bg-slate-200 rounded-lg" />
          <div className="w-72 h-3 bg-slate-200 rounded-lg" />
        </div>
        <div className="w-36 h-11 bg-slate-200 rounded-full" />
      </div>

      {/* Video Grid Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-3 space-y-3">
            <div className="aspect-video w-full bg-slate-200 rounded-xl" />
            <div className="space-y-2">
              <div className="w-full h-4 bg-slate-200 rounded-md" />
              <div className="w-2/3 h-4 bg-slate-200 rounded-md" />
              <div className="w-1/3 h-3 bg-slate-200 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
