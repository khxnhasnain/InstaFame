"use client";

import React, { useState } from "react";
import { X, Heart, MessageCircle, Send, Bookmark, Smile, MoreHorizontal, ChevronLeft, ChevronRight, Layers, Download, Check, Zap } from "lucide-react";
import { InstagramPost } from "@/lib/instagramData";
import InstagramBoostModal from "./InstagramBoostModal";

interface InstagramPostModalProps {
  post: InstagramPost;
  username: string;
  avatarUrl: string;
  onClose: () => void;
}

export default function InstagramPostModal({ post, username, avatarUrl, onClose }: InstagramPostModalProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState(post.commentsList || []);
  const [newComment, setNewComment] = useState("");
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);

  const imagesList = post.carouselMedia && post.carouselMedia.length > 0 ? post.carouselMedia : [post.imageUrl];

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev > 0 ? prev - 1 : imagesList.length - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev < imagesList.length - 1 ? prev + 1 : 0));
  };

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikesCount((prev) => prev - 1);
    } else {
      setLiked(true);
      setLikesCount((prev) => prev + 1);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setComments([
      ...comments,
      {
        id: `c-new-${Date.now()}`,
        user: "you",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
        text: newComment.trim(),
        time: "Just now",
      },
    ]);
    setNewComment("");
  };

  const reelCode = post.code || (post.id && !post.id.startsWith("reel-") && !post.id.startsWith("post-") ? post.id.split("_")[0] : "");

  // One-Click HD Media Downloader
  const handleDownloadMedia = () => {
    setDownloading(true);

    let targetUrl = "";
    let filename = "";

    if (post.isVideo && post.videoUrl) {
      targetUrl = post.videoUrl;
      filename = `${username}_reel_${post.id}.mp4`;
    } else {
      targetUrl = imagesList[currentImgIndex] || post.imageUrl;
      filename = `${username}_photo_${post.id}_${currentImgIndex + 1}.jpg`;
    }

    let downloadHref = targetUrl;
    if (targetUrl.includes("/api/image-proxy")) {
      downloadHref = `${targetUrl}&download=true&filename=${encodeURIComponent(filename)}`;
    } else if (targetUrl.startsWith("http")) {
      downloadHref = `/api/image-proxy?url=${encodeURIComponent(targetUrl)}&download=true&filename=${encodeURIComponent(filename)}`;
    }

    const anchor = document.createElement("a");
    anchor.href = downloadHref;
    anchor.download = filename;
    anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    setTimeout(() => {
      setDownloading(false);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm animate-in fade-in">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors z-50 cursor-pointer"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden w-full max-w-5xl max-h-[90vh] flex flex-col md:flex-row shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Left: Interactive Video / Carousel Media Container */}
        <div className="flex-1 bg-black relative flex items-center justify-center min-h-[350px] md:min-h-[550px] group select-none">
          {post.isVideo && post.videoUrl ? (
            <video
              src={post.videoUrl}
              poster={post.imageUrl}
              controls
              autoPlay
              loop
              playsInline
              className="w-full h-full object-contain max-h-[80vh]"
            />
          ) : post.isVideo && reelCode ? (
            /* Instagram Embed Video Player Fallback */
            <div className="w-full h-full min-h-[450px] md:min-h-[550px] flex items-center justify-center bg-black">
              <iframe
                src={`https://www.instagram.com/reel/${reelCode}/embed/`}
                className="w-full h-full min-h-[450px] md:min-h-[550px] border-0"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : (
            <img
              src={imagesList[currentImgIndex]}
              alt={post.caption || "Instagram Post"}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain max-h-[80vh] transition-all duration-300"
            />
          )}

          {/* Top-Right Overlays: Increase Likes UI Button + Download Button */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
            <button
              onClick={() => setShowBoostModal(true)}
              className="bg-gradient-to-r from-instagram-orange via-instagram-pink to-indigo-600 hover:opacity-95 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              title="Increase Likes"
            >
              <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              <span>Increase Likes</span>
            </button>

            <button
              onClick={handleDownloadMedia}
              disabled={downloading}
              className="bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              title="Download HD Media"
            >
              {downloaded ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Downloaded</span>
                </>
              ) : downloading ? (
                <span>Downloading...</span>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </>
              )}
            </button>
          </div>

          {/* Carousel Left / Right Controls */}
          {!post.isVideo && imagesList.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all shadow-md backdrop-blur-sm cursor-pointer"
                title="Previous Photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={handleNextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all shadow-md backdrop-blur-sm cursor-pointer"
                title="Next Photo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Photo Counter Badge */}
              <div className="absolute top-4 left-4 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>{currentImgIndex + 1} / {imagesList.length}</span>
              </div>

              {/* Pagination Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                {imagesList.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImgIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentImgIndex ? "bg-white w-4" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: Comments & Post Meta Sidebar */}
        <div className="w-full md:w-[400px] flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {/* Top Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={avatarUrl}
                alt={username}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
              <span className="font-semibold text-sm text-slate-900 dark:text-white hover:underline cursor-pointer">
                {username}
              </span>
            </div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Middle: Caption & Comments Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[350px] md:max-h-none">
            {/* Caption */}
            {post.caption && (
              <div className="flex gap-3 text-sm">
                <img
                  src={avatarUrl}
                  alt={username}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div className="space-y-1">
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white mr-2">
                      {username}
                    </span>
                    {post.caption}
                  </p>
                  <p className="text-[10px] text-slate-400">{post.timestamp}</p>
                </div>
              </div>
            )}

            {/* Comments List */}
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 text-xs items-start">
                <img
                  src={comment.avatar}
                  alt={comment.user}
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 space-y-0.5">
                  <p className="text-slate-800 dark:text-slate-200">
                    <span className="font-semibold text-slate-900 dark:text-white mr-2">
                      {comment.user}
                    </span>
                    {comment.text}
                  </p>
                  <p className="text-[10px] text-slate-400">{comment.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Actions & Engagement Section */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
            {/* Like, Comment, Share, Save, Download Icons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-slate-700 dark:text-slate-200">
                <button
                  onClick={handleLike}
                  className={`hover:text-red-500 transition-transform active:scale-125 cursor-pointer ${
                    liked ? "text-red-500" : ""
                  }`}
                >
                  <Heart className={`w-6 h-6 ${liked ? "fill-red-500" : ""}`} />
                </button>
                <button className="hover:text-slate-500 cursor-pointer">
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button className="hover:text-slate-500 cursor-pointer">
                  <Send className="w-6 h-6" />
                </button>
                <button
                  onClick={handleDownloadMedia}
                  title="Download Media"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <Download className="w-6 h-6" />
                </button>
              </div>
              <button
                onClick={() => setSaved(!saved)}
                className={`hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ${
                  saved ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-200"
                }`}
              >
                <Bookmark className={`w-6 h-6 ${saved ? "fill-slate-900 dark:fill-white" : ""}`} />
              </button>
            </div>

            {/* Like Counter + Increase Likes UI Button */}
            <div className="flex items-center justify-between pt-0.5">
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                {likesCount.toLocaleString()} likes
              </p>
              <button
                onClick={() => setShowBoostModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-white bg-gradient-to-r from-instagram-orange via-instagram-pink to-indigo-600 shadow-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer"
              >
                <Zap className="w-3 h-3 fill-amber-300 text-amber-300" />
                <span>Increase Likes</span>
              </button>
            </div>

            {/* Timestamp */}
            <p className="text-[10px] uppercase tracking-wider text-slate-400">
              {post.timestamp}
            </p>

            {/* Add Comment Input Form */}
            <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Smile className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-600" />
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="text-xs font-semibold text-blue-500 hover:text-blue-700 disabled:opacity-40 cursor-pointer"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Increase Likes Modal */}
      {showBoostModal && (
        <InstagramBoostModal
          type="likes"
          targetUsername={username}
          avatarUrl={avatarUrl}
          initialCount={post.likes}
          targetPost={post}
          onClose={() => setShowBoostModal(false)}
        />
      )}
    </div>
  );
}
