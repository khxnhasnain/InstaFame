export interface InstagramPost {
  id: string;
  code?: string;
  imageUrl: string;
  videoUrl?: string;
  carouselMedia?: string[];
  likes: number;
  commentsCount: number;
  caption: string;
  timestamp: string;
  isVideo?: boolean;
  views?: number;
  location?: string;
  commentsList?: { id: string; user: string; avatar: string; text: string; time: string }[];
}


export interface InstagramHighlight {
  id: string;
  title: string;
  coverUrl: string;
}

export interface InstagramProfile {
  username: string;
  fullName: string;
  avatarUrl: string;
  isVerified: boolean;
  bio: string;
  category?: string;
  website?: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  paginationToken?: string;
  reelsPaginationToken?: string;
  highlights: InstagramHighlight[];
  posts: InstagramPost[];
  reels?: InstagramPost[];
}

export function proxyImage(url: string | undefined | null): string {
  if (!url) return "";
  if (url.startsWith("http://localhost") || url.startsWith("/api/")) return url;
  if (url.includes("cdninstagram.com") || url.includes("fbcdn.net") || url.includes("instagram.com")) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export interface FetchResult {
  profile: InstagramProfile | null;
  error?: string;
  status?: number;
}
