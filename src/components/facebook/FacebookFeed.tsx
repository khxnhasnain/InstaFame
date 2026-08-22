"use client";

import React, { useState } from "react";
import { ThumbsUp, Heart, MessageSquare, Share2, MoreHorizontal, Smile, Video, Image as ImageIcon, Sparkles, Send } from "lucide-react";
import { FacebookPost } from "@/lib/facebookData";

interface FacebookFeedProps {
  posts: FacebookPost[];
  authorAvatar: string;
  authorName: string;
}

export default function FacebookFeed({ posts: initialPosts, authorAvatar, authorName }: FacebookFeedProps) {
  const [postsList, setPostsList] = useState(initialPosts);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const toggleLike = (postId: string) => {
    setLikedPosts((prev) => {
      const current = !!prev[postId];
      return { ...prev, [postId]: !current };
    });

    setPostsList((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = likedPosts[postId];
          return {
            ...p,
            likesCount: isLiked ? p.likesCount - 1 : p.likesCount + 1,
          };
        }
        return p;
      })
    );
  };

  const handleAddComment = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setPostsList((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const existingComments = p.commentsList || [];
          return {
            ...p,
            commentsCount: p.commentsCount + 1,
            commentsList: [
              ...existingComments,
              {
                id: `fc-new-${Date.now()}`,
                user: "You",
                avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
                text: commentText.trim(),
                time: "Just now",
              },
            ],
          };
        }
        return p;
      })
    );
    setCommentText("");
  };

  return (
    <div className="space-y-4">
      {/* Create Post Box */}
      <div className="bg-white dark:bg-[#242526] p-4 rounded-xl shadow-sm border border-slate-200 dark:border-[#3E4042]">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-[#3E4042]">
          <img
            src={authorAvatar}
            alt={authorName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <input
            type="text"
            placeholder={`What's on your mind, ${authorName.split(" ")[0]}?`}
            className="flex-grow bg-slate-100 dark:bg-[#3A3B3C] hover:bg-slate-200 dark:hover:bg-[#4E4F50] text-sm text-slate-900 dark:text-white px-4 py-2.5 rounded-full focus:outline-none transition-colors cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between pt-3 text-slate-600 dark:text-slate-300 font-semibold text-xs sm:text-sm">
          <button className="flex items-center justify-center gap-2 flex-1 hover:bg-slate-100 dark:hover:bg-[#3A3B3C] py-2 rounded-lg transition-colors">
            <Video className="w-5 h-5 text-red-500" />
            <span>Live Video</span>
          </button>
          <button className="flex items-center justify-center gap-2 flex-1 hover:bg-slate-100 dark:hover:bg-[#3A3B3C] py-2 rounded-lg transition-colors">
            <ImageIcon className="w-5 h-5 text-green-500" />
            <span>Photo/video</span>
          </button>
          <button className="flex items-center justify-center gap-2 flex-1 hover:bg-slate-100 dark:hover:bg-[#3A3B3C] py-2 rounded-lg transition-colors">
            <Smile className="w-5 h-5 text-amber-500" />
            <span>Feeling/activity</span>
          </button>
        </div>
      </div>

      {/* Posts Stream */}
      {postsList.map((post) => {
        const isLiked = !!likedPosts[post.id];
        const isCommentOpen = activeCommentPost === post.id;

        return (
          <div
            key={post.id}
            className="bg-white dark:bg-[#242526] rounded-xl shadow-sm border border-slate-200 dark:border-[#3E4042] overflow-hidden"
          >
            {/* Post Author Header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={post.authorAvatar}
                  alt={post.authorName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white hover:underline cursor-pointer">
                    {post.authorName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{post.timestamp}</p>
                </div>
              </div>
              <button className="text-slate-500 hover:bg-slate-100 dark:hover:bg-[#3A3B3C] p-2 rounded-full transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Post Text Body */}
            <p className="px-4 pb-3 text-sm text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-line">
              {post.content}
            </p>

            {/* Post Image */}
            {post.imageUrl && (
              <div className="w-full bg-slate-900">
                <img
                  src={post.imageUrl}
                  alt="Post Attachment"
                  loading="lazy"
                  className="w-full max-h-[500px] object-cover"
                />
              </div>
            )}

            {/* Reaction Summary Bar */}
            <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100 dark:border-[#3E4042] text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1">
                  <span className="w-4 h-4 rounded-full bg-facebook-blue flex items-center justify-center text-[10px] text-white">
                    👍
                  </span>
                  <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[10px] text-white">
                    ❤️
                  </span>
                </div>
                <span>{post.likesCount.toLocaleString()}</span>
              </div>

              <div className="flex gap-3">
                <span>{post.commentsCount} comments</span>
                <span>{post.sharesCount} shares</span>
              </div>
            </div>

            {/* Action Bar (Like / Comment / Share buttons) */}
            <div className="px-2 py-1 flex items-center justify-between text-slate-600 dark:text-slate-300 font-semibold text-xs sm:text-sm border-b border-slate-100 dark:border-[#3E4042]">
              <button
                onClick={() => toggleLike(post.id)}
                className={`flex items-center justify-center gap-2 flex-1 hover:bg-slate-100 dark:hover:bg-[#3A3B3C] py-2 rounded-lg transition-colors ${
                  isLiked ? "text-facebook-blue" : ""
                }`}
              >
                <ThumbsUp className={`w-5 h-5 ${isLiked ? "fill-facebook-blue" : ""}`} />
                <span>Like</span>
              </button>

              <button
                onClick={() => setActiveCommentPost(isCommentOpen ? null : post.id)}
                className="flex items-center justify-center gap-2 flex-1 hover:bg-slate-100 dark:hover:bg-[#3A3B3C] py-2 rounded-lg transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Comment</span>
              </button>

              <button className="flex items-center justify-center gap-2 flex-1 hover:bg-slate-100 dark:hover:bg-[#3A3B3C] py-2 rounded-lg transition-colors">
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </button>
            </div>

            {/* Comments List & Add Comment Input */}
            {(isCommentOpen || (post.commentsList && post.commentsList.length > 0)) && (
              <div className="p-4 bg-slate-50/50 dark:bg-[#1C1D1E] space-y-3">
                {/* Existing Comments */}
                {post.commentsList?.map((c) => (
                  <div key={c.id} className="flex items-start gap-2 text-xs">
                    <img
                      src={c.avatar}
                      alt={c.user}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="bg-slate-200 dark:bg-[#3A3B3C] p-2.5 rounded-2xl max-w-[85%]">
                      <p className="font-bold text-slate-900 dark:text-white">{c.user}</p>
                      <p className="text-slate-800 dark:text-slate-200 mt-0.5">{c.text}</p>
                    </div>
                  </div>
                ))}

                {/* Add Comment Input */}
                <form
                  onSubmit={(e) => handleAddComment(post.id, e)}
                  className="flex items-center gap-2 pt-2"
                >
                  <img
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"
                    alt="User"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-grow flex items-center bg-slate-100 dark:bg-[#3A3B3C] rounded-full px-3 py-1.5">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="text-facebook-blue hover:opacity-80 disabled:opacity-40 p-1"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
