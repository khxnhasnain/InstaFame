"use client";

import React, { useState } from "react";
import { Grid, Heart, MessageCircle, Film, Bookmark, UserSquare2, Layers, Loader2 } from "lucide-react";
import { InstagramPost } from "@/lib/instagramData";
import InstagramPostModal from "./InstagramPostModal";

interface InstagramGridProps {
  posts: InstagramPost[];
  reels?: InstagramPost[];
  username: string;
  avatarUrl: string;
  hasMorePosts?: boolean;
  hasMoreReels?: boolean;
  loadingMore?: boolean;
  onLoadMorePosts?: () => void;
  onLoadMoreReels?: () => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export default function InstagramGrid({
  posts,
  reels = [],
  username,
  avatarUrl,
  hasMorePosts,
  hasMoreReels,
  loadingMore,
  onLoadMorePosts,
  onLoadMoreReels,
  hasMore,
  onLoadMore,
}: InstagramGridProps) {
  const [activeTab, setActiveTab] = useState<"posts" | "reels" | "saved" | "tagged">("posts");
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);

  const formatShortNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
  };

  const videoPosts = posts.filter((p) => p.isVideo);
  const reelsList = reels.length > 0 ? reels : videoPosts;
  const displayList = activeTab === "reels" ? reelsList : posts;

  const showMorePosts = (hasMorePosts ?? hasMore) || posts.length >= 6;
  const showMoreReels = Boolean(hasMoreReels) || reelsList.length >= 6;

  const handleTriggerLoadMore = () => {
    if (activeTab === "posts") {
      if (onLoadMorePosts) onLoadMorePosts();
      else if (onLoadMore) onLoadMore();
    } else if (activeTab === "reels") {
      if (onLoadMoreReels) onLoadMoreReels();
    }
  };

  return (
    <div className="w-full max-w-[935px] mx-auto border-t border-slate-200 dark:border-slate-800">
      {/* Tabs */}
      <div className="flex justify-center gap-12 text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400">
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex items-center gap-2 py-4 border-t-2 transition-colors ${
            activeTab === "posts"
              ? "border-slate-900 dark:border-white text-slate-900 dark:text-white"
              : "border-transparent hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          POSTS
        </button>
        <button
          onClick={() => setActiveTab("reels")}
          className={`flex items-center gap-2 py-4 border-t-2 transition-colors ${
            activeTab === "reels"
              ? "border-slate-900 dark:border-white text-slate-900 dark:text-white"
              : "border-transparent hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          REELS {reelsList.length > 0 && `(${reelsList.length})`}
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex items-center gap-2 py-4 border-t-2 transition-colors ${
            activeTab === "saved"
              ? "border-slate-900 dark:border-white text-slate-900 dark:text-white"
              : "border-transparent hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          SAVED
        </button>
        <button
          onClick={() => setActiveTab("tagged")}
          className={`flex items-center gap-2 py-4 border-t-2 transition-colors ${
            activeTab === "tagged"
              ? "border-slate-900 dark:border-white text-slate-900 dark:text-white"
              : "border-transparent hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <UserSquare2 className="w-3.5 h-3.5" />
          TAGGED
        </button>
      </div>

      {/* Grid Content */}
      {activeTab === "posts" || activeTab === "reels" ? (
        displayList.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-3 gap-1 md:gap-4 mt-1">
              {displayList.map((post) => {
                const isCarousel = post.carouselMedia && post.carouselMedia.length > 1;
                return (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="aspect-square relative group cursor-pointer bg-slate-100 dark:bg-slate-900 overflow-hidden"
                  >
                    <img
                      src={post.imageUrl || (post as any).thumbnail_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80"}
                      alt={post.caption || "Instagram media"}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        // Fallback gracefully on expired CDN URLs
                        const target = e.currentTarget;
                        if (!target.src.includes("unsplash.com")) {
                          target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80";
                        }
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Video Indicator Badge */}
                    {post.isVideo && (
                      <div className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-md backdrop-blur-sm shadow-sm z-10">
                        <Film className="w-4 h-4" />
                      </div>
                    )}

                    {/* Carousel Multiple Images Indicator Badge */}
                    {!post.isVideo && isCarousel && (
                      <div className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-md backdrop-blur-sm shadow-sm z-10">
                        <Layers className="w-4 h-4" />
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2.5 text-white font-bold z-20">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Heart className="w-5 h-5 fill-white text-white" />
                          <span>{formatShortNumber(post.likes)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-5 h-5 fill-white text-white" />
                          <span>{formatShortNumber(post.commentsCount)}</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-gradient-to-r from-instagram-orange via-instagram-pink to-indigo-600 text-white px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1 font-extrabold">
                        ⚡ Boost Likes
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button for POSTS */}
            {activeTab === "posts" && showMorePosts && (
              <div className="flex justify-center pt-4 pb-8">
                <button
                  onClick={handleTriggerLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 px-6 py-3 rounded-full font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading more posts...</span>
                    </>
                  ) : (
                    <span>Load More Posts</span>
                  )}
                </button>
              </div>
            )}

            {/* Load More Button for REELS */}
            {activeTab === "reels" && showMoreReels && (
              <div className="flex justify-center pt-4 pb-8">
                <button
                  onClick={handleTriggerLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 px-6 py-3 rounded-full font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading more reels...</span>
                    </>
                  ) : (
                    <span>Load More Reels</span>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400">
            <p className="font-semibold text-lg">No {activeTab} available</p>
            <p className="text-xs mt-1">When {username} shares {activeTab}, they will appear here.</p>
          </div>
        )
      ) : (
        <div className="py-16 text-center text-slate-500 dark:text-slate-400">
          <p className="font-semibold text-lg">No {activeTab} yet</p>
          <p className="text-xs mt-1">When {username} shares {activeTab}, they will appear here.</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedPost && (
        <InstagramPostModal
          post={selectedPost}
          username={username}
          avatarUrl={avatarUrl}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
}
