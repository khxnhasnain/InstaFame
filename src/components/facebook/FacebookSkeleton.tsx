import React from "react";

export default function FacebookSkeleton() {
  return (
    <div className="w-full max-w-[1095px] mx-auto pb-12">
      {/* Header & Cover Skeleton */}
      <div className="bg-white dark:bg-[#242526] shadow-sm rounded-b-xl overflow-hidden mb-4">
        <div className="w-full h-48 sm:h-72 md:h-96 skeleton-shimmer" />

        <div className="max-w-[1024px] mx-auto px-4 pb-4">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 -mt-16 sm:-mt-24 mb-4">
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full skeleton-shimmer border-4 border-white dark:border-[#242526] flex-shrink-0" />
            <div className="space-y-2 text-center md:text-left flex-grow">
              <div className="w-64 h-8 rounded skeleton-shimmer mx-auto md:mx-0" />
              <div className="w-40 h-4 rounded skeleton-shimmer mx-auto md:mx-0" />
            </div>
            <div className="flex gap-2">
              <div className="w-28 h-9 rounded-lg skeleton-shimmer" />
              <div className="w-28 h-9 rounded-lg skeleton-shimmer" />
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-[#3E4042] pt-2 flex gap-6">
            <div className="w-16 h-8 rounded skeleton-shimmer" />
            <div className="w-16 h-8 rounded skeleton-shimmer" />
            <div className="w-16 h-8 rounded skeleton-shimmer" />
            <div className="w-16 h-8 rounded skeleton-shimmer" />
          </div>
        </div>
      </div>

      {/* Main Grid Skeleton */}
      <div className="max-w-[1024px] mx-auto px-4 grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-5 space-y-4">
          <div className="h-64 rounded-xl skeleton-shimmer" />
          <div className="h-48 rounded-xl skeleton-shimmer" />
        </div>
        <div className="md:col-span-7 space-y-4">
          <div className="h-32 rounded-xl skeleton-shimmer" />
          <div className="h-80 rounded-xl skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}
