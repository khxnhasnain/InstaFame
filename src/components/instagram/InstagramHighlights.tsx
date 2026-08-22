"use client";

import React, { useState } from "react";
import { InstagramHighlight } from "@/lib/instagramData";
import { X } from "lucide-react";

interface HighlightsProps {
  highlights: InstagramHighlight[];
  username: string;
}

export default function InstagramHighlights({ highlights, username }: HighlightsProps) {
  const [activeStory, setActiveStory] = useState<InstagramHighlight | null>(null);

  if (!highlights || highlights.length === 0) return null;

  return (
    <>
      <div className="w-full max-w-[935px] mx-auto flex gap-6 md:gap-8 mb-10 overflow-x-auto pb-4 hide-scrollbar px-4 md:px-0">
        {highlights.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveStory(item)}
            className="flex flex-col items-center gap-2 cursor-pointer group flex-shrink-0 focus:outline-none"
          >
            <div className="w-[70px] h-[70px] md:w-[77px] md:h-[77px] rounded-full p-[2px] border border-slate-300 dark:border-slate-700 group-hover:border-slate-400 dark:group-hover:border-slate-500 transition-colors flex items-center justify-center">
              <img
                src={item.coverUrl}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-full object-cover p-[2px] bg-white dark:bg-slate-900 group-hover:scale-105 transition-transform"
              />
            </div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[75px]">
              {item.title}
            </span>
          </button>
        ))}
      </div>

      {/* Story Viewer Modal */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <button
            onClick={() => setActiveStory(null)}
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative w-full max-w-sm aspect-[9/16] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between p-4 border border-white/10">
            {/* Story Top Header */}
            <div className="flex items-center gap-3 z-10">
              <div className="w-9 h-9 rounded-full p-[2px] ig-gradient-border">
                <img
                  src={activeStory.coverUrl}
                  alt={username}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div>
                <p className="text-white text-xs font-semibold">{username}</p>
                <p className="text-slate-400 text-[10px]">{activeStory.title}</p>
              </div>
            </div>

            {/* Story Image */}
            <img
              src={activeStory.coverUrl}
              alt={activeStory.title}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Bottom Gradient overlay */}
            <div className="relative z-10 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-xl text-center">
              <p className="text-white font-bold text-sm">{activeStory.title}</p>
              <p className="text-slate-300 text-xs mt-1">Tap anywhere or click close to exit</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
