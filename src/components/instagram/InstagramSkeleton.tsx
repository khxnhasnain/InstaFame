import React from "react";

export default function InstagramSkeleton() {
  return (
    <div className="w-full max-w-[935px] mx-auto pt-6 px-4">
      {/* Profile Header Skeleton */}
      <div className="flex flex-col md:flex-row items-center md:items-start mb-10 gap-8 md:gap-20">
        {/* Avatar Circle Skeleton */}
        <div className="w-[150px] h-[150px] rounded-full skeleton-shimmer flex-shrink-0" />

        {/* Profile Info Lines */}
        <div className="flex-grow space-y-4 w-full text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-44 h-7 rounded-md skeleton-shimmer" />
            <div className="flex gap-2">
              <div className="w-24 h-8 rounded-lg skeleton-shimmer" />
              <div className="w-24 h-8 rounded-lg skeleton-shimmer" />
            </div>
          </div>

          <div className="flex justify-center md:justify-start gap-8 py-2">
            <div className="w-20 h-5 rounded skeleton-shimmer" />
            <div className="w-24 h-5 rounded skeleton-shimmer" />
            <div className="w-24 h-5 rounded skeleton-shimmer" />
          </div>

          <div className="space-y-2 max-w-[350px]">
            <div className="w-36 h-4 rounded skeleton-shimmer" />
            <div className="w-64 h-4 rounded skeleton-shimmer" />
            <div className="w-48 h-4 rounded skeleton-shimmer" />
          </div>
        </div>
      </div>

      {/* Highlights Skeleton */}
      <div className="flex gap-6 mb-10 overflow-hidden pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-[77px] h-[77px] rounded-full skeleton-shimmer" />
            <div className="w-12 h-3 rounded skeleton-shimmer" />
          </div>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="border-t border-slate-200 dark:border-slate-800 flex justify-center gap-12 py-3 mb-2">
        <div className="w-16 h-4 rounded skeleton-shimmer" />
        <div className="w-16 h-4 rounded skeleton-shimmer" />
        <div className="w-16 h-4 rounded skeleton-shimmer" />
      </div>

      {/* 3-Column Posts Skeleton */}
      <div className="grid grid-cols-3 gap-1 md:gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-square skeleton-shimmer rounded-sm" />
        ))}
      </div>
    </div>
  );
}
