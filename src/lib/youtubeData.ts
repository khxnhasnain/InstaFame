export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  viewsCount: number;
  likesCount: number;
  publishedAt: string;
  duration?: string;
  description?: string;
  isShort?: boolean;
}

export interface YouTubeCommunityPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  timestamp: string;
  content: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
}

export interface YouTubeChannel {
  id: string;
  channelHandle: string; // e.g. "@MrBeast"
  title: string; // e.g. "MrBeast"
  verified: boolean;
  avatarUrl: string;
  bannerUrl: string;
  description: string;
  subscribersCount: number;
  videosCount: number;
  viewsCount: number;
  joinedDate: string;
  country?: string;
  customUrl?: string;
  featuredPlaylistsCount?: number;
  videos: YouTubeVideo[];
  shorts: YouTubeVideo[];
  communityPosts?: YouTubeCommunityPost[];
  isLiveApiData?: boolean;
  targetVideoId?: string;
  paginationToken?: string | null;
  hasMoreVideos?: boolean;
}

export const YOUTUBE_PRESETS: Record<string, YouTubeChannel> = {
  mrbeast: {
    id: "UCX6OQ3DkcsbYNE6H8uQQuVA",
    channelHandle: "@MrBeast",
    title: "MrBeast",
    verified: true,
    avatarUrl: "https://yt3.googleusercontent.com/nxYrc_1_2f77DoBadyxMTmv7ZpRZapHR5jbuYe7PlPd5cIRJxtNNEYyOC0ZsxaDyJJzXrnJiuDE=s160-c-k-c0x00ffffff-no-rj",
    bannerUrl: "https://yt3.googleusercontent.com/mHMO_eEMp0dPvh0ADwXhPXNYb_GnjSVsLI8biqF1CpxT8OPl7izhNQsDPD3JHhd5y5Mg9GrP=w2560-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj",
    description: "I want to make the world a better place before I die. Giving away millions of dollars, building houses, and doing crazy stunts! ⚡🔥",
    subscribersCount: 315000000,
    videosCount: 999,
    viewsCount: 59000000000,
    joinedDate: "February 2012",
    country: "United States",
    customUrl: "youtube.com/@MrBeast",
    featuredPlaylistsCount: 14,
    videos: [
      {
        id: "Qtl8lJwbd4g",
        title: "Escape 100 Cops, Win $500,000",
        thumbnailUrl: "https://i.ytimg.com/vi/Qtl8lJwbd4g/hq720.jpg",
        viewsCount: 87000000,
        likesCount: 5400000,
        publishedAt: "2 weeks ago",
        duration: "18:42",
        description: "We hired 100 actual police officers to hunt me down in a giant abandoned city!"
      },
      {
        id: "Af6i6ChAVTw",
        title: "Last To Leave Mansion, Keeps It",
        thumbnailUrl: "https://i.ytimg.com/vi/Af6i6ChAVTw/hq720.jpg",
        viewsCount: 142000000,
        likesCount: 8900000,
        publishedAt: "1 month ago",
        duration: "24:15",
        description: "We locked 10 competitors in a $20,000,000 mansion. Last one to step outside keeps the deed!"
      },
      {
        id: "lVylRtlPOIE",
        title: "I Granted 100 Kids Their Biggest Wish!",
        thumbnailUrl: "https://i.ytimg.com/vi/lVylRtlPOIE/hq720.jpg",
        viewsCount: 95000000,
        likesCount: 6100000,
        publishedAt: "2 months ago",
        duration: "16:20",
        description: "We spent $3,000,000 fulfilling the lifelong dreams of 100 amazing kids worldwide."
      },
      {
        id: "0e3GPea1Tyg",
        title: "$1 vs $1,000,000,000 Private Island!",
        thumbnailUrl: "https://i.ytimg.com/vi/0e3GPea1Tyg/hq720.jpg",
        viewsCount: 215000000,
        likesCount: 12400000,
        publishedAt: "4 months ago",
        duration: "16:42",
        description: "We explored the cheapest private island in the world and compared it to a $1B luxury island!"
      }
    ],
    shorts: [
      {
        id: "Qtl8lJwbd4g",
        title: "Would You Press This Button For $100,000? 😱 #shorts",
        thumbnailUrl: "https://i.ytimg.com/vi/Qtl8lJwbd4g/hq720.jpg",
        viewsCount: 84000000,
        likesCount: 4200000,
        publishedAt: "5 days ago",
        isShort: true
      },
      {
        id: "Af6i6ChAVTw",
        title: "Giving Strangers Rolex Watches! ⌚✨ #shorts",
        thumbnailUrl: "https://i.ytimg.com/vi/Af6i6ChAVTw/hq720.jpg",
        viewsCount: 112000000,
        likesCount: 7800000,
        publishedAt: "1 week ago",
        isShort: true
      }
    ],
    communityPosts: [
      {
        id: "yt_comm_1",
        authorName: "MrBeast",
        authorAvatar: "https://yt3.googleusercontent.com/nxYrc_1_2f77DoBadyxMTmv7ZpRZapHR5jbuYe7PlPd5cIRJxtNNEYyOC0ZsxaDyJJzXrnJiuDE=s160-c-k-c0x00ffffff-no-rj",
        timestamp: "Yesterday",
        content: "New video this Saturday! It took 6 months to film and cost over $4,000,000. Get ready! 🚀",
        imageUrl: "https://i.ytimg.com/vi/Qtl8lJwbd4g/hq720.jpg",
        likesCount: 520000,
        commentsCount: 38200
      }
    ],
    isLiveApiData: true
  },
  carryminati: {
    id: "UCj22tfcQrWG7EMEKS0qLeEg",
    channelHandle: "@CarryMinati",
    title: "CarryMinati",
    verified: true,
    avatarUrl: "https://yt3.googleusercontent.com/j099v7bH1vN8Lp-M8ZqT7A8jFpS1eF2m-p4_y4mGqJ6Q8l3k1s1h9P8q9x8w7v6u5t4s3r2q=s160-c-k-c0x00ffffff-no-rj",
    bannerUrl: "https://yt3.googleusercontent.com/u_p6M8L9K8J7I6H5G4F3E2D1C0B9A8Z7Y6X5W4V3U2T1S0R9Q8P7O6N5M4L3K2J1I0H9=w2560-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj",
    description: "Ajey Nagar aka CarryMinati. Indian YouTuber, streamer, and content creator from Faridabad. 🚀🔥",
    subscribersCount: 45700000,
    videosCount: 210,
    viewsCount: 3900000000,
    joinedDate: "October 2014",
    country: "India",
    customUrl: "youtube.com/@CarryMinati",
    featuredPlaylistsCount: 10,
    videos: [
      {
        id: "bMTlNeKqV4o",
        title: "MOTIVATIONAL SPEAKER 2 | CARRYMINATI",
        thumbnailUrl: "https://i.ytimg.com/vi/bMTlNeKqV4o/hq720.jpg",
        viewsCount: 34000000,
        likesCount: 3800000,
        publishedAt: "2 weeks ago",
        duration: "14:28",
        description: "Official roast and comedy special by CarryMinati."
      },
      {
        id: "zzwRbKI2pn4",
        title: "YALGAAR - CARRYMINATI X Wily Frenzy",
        thumbnailUrl: "https://i.ytimg.com/vi/zzwRbKI2pn4/hq720.jpg",
        viewsCount: 380000000,
        likesCount: 16000000,
        publishedAt: "3 years ago",
        duration: "3:14",
        description: "Official music video of Yalgaar by CarryMinati."
      }
    ],
    shorts: [
      {
        id: "bMTlNeKqV4o",
        title: "Motivational Speaker Moment 😂 #shorts",
        thumbnailUrl: "https://i.ytimg.com/vi/bMTlNeKqV4o/hq720.jpg",
        viewsCount: 18000000,
        likesCount: 1400000,
        publishedAt: "1 week ago",
        isShort: true
      }
    ],
    isLiveApiData: true
  },
  mkbhd: {
    id: "UCBJycsmduPz011gz4BgSRYg",
    channelHandle: "@MKBHD",
    title: "Marques Brownlee",
    verified: true,
    avatarUrl: "https://yt3.googleusercontent.com/lkH37D712tiyphnu0Id0D5MwwQ7IRuwgQLVD05iMXlDWO-kDHqqd8EM0Io29TngZZcK2eIMQ=s160-c-k-c0x00ffffff-no-rj",
    bannerUrl: "https://yt3.googleusercontent.com/yRzYgZpL7oA4B4B9C8D7E6F5G4H3I2J1K0L9M8N7O6P5Q4R3S2T1U0V9W8X7Y6Z5=w2560-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj",
    description: "Quality tech videos | YouTuber | Geek | Consumer Electronics reviews & insights 📱⚡",
    subscribersCount: 21200000,
    videosCount: 1800,
    viewsCount: 4500000000,
    joinedDate: "March 2008",
    country: "United States",
    customUrl: "youtube.com/@MKBHD",
    featuredPlaylistsCount: 22,
    videos: [
      {
        id: "348OX_m2gO0",
        title: "The Ultimate Smartphone Comparison 2026!",
        thumbnailUrl: "https://i.ytimg.com/vi/348OX_m2gO0/hq720.jpg",
        viewsCount: 4800000,
        likesCount: 310000,
        publishedAt: "2 days ago",
        duration: "14:12",
        description: "Is this the biggest leap in mobile hardware we've seen this decade? Let's break it down."
      },
      {
        id: "dtp6bRe6x3U",
        title: "Apple Vision Pro: The True Review!",
        thumbnailUrl: "https://i.ytimg.com/vi/dtp6bRe6x3U/hq720.jpg",
        viewsCount: 16200000,
        likesCount: 820000,
        publishedAt: "1 year ago",
        duration: "37:50",
        description: "Everything you need to know about spatial computing and hardware reality."
      }
    ],
    shorts: [
      {
        id: "348OX_m2gO0",
        title: "This hidden smartphone feature is insane! 🔥 #shorts",
        thumbnailUrl: "https://i.ytimg.com/vi/348OX_m2gO0/hq720.jpg",
        viewsCount: 14200000,
        likesCount: 890000,
        publishedAt: "4 days ago",
        isShort: true
      }
    ],
    isLiveApiData: true
  }
};

// Aliases
YOUTUBE_PRESETS["beast"] = YOUTUBE_PRESETS["mrbeast"];
YOUTUBE_PRESETS["jimmy"] = YOUTUBE_PRESETS["mrbeast"];
YOUTUBE_PRESETS["marques"] = YOUTUBE_PRESETS["mkbhd"];
YOUTUBE_PRESETS["carry"] = YOUTUBE_PRESETS["carryminati"];

// Helper to extract clean video ID from any YouTube URL or string
export function extractYouTubeVideoId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const text = urlOrId.trim();

  // If it is already an 11-char video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(text)) {
    return text;
  }

  const regExp = /(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = text.match(regExp);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

// Helper to extract clean channel identifier or handle
export function cleanYouTubeIdentifier(input: string): string {
  let text = input.trim();
  if (!text) return "";

  // If it's a URL
  try {
    if (text.includes("youtube.com") || text.includes("youtu.be")) {
      const normalizedUrl = text.startsWith("http") ? text : `https://${text}`;
      const urlObj = new URL(normalizedUrl);

      // Check handle @handle in path
      const pathname = urlObj.pathname;
      if (pathname.includes("/@")) {
        const handle = pathname.split("/@")[1].split("/")[0];
        return handle ? `@${handle}` : "";
      }

      // Check /channel/ or /c/ or /user/
      const segments = pathname.split("/").filter(Boolean);
      if (segments.length > 0) {
        const last = segments[segments.length - 1];
        if (last !== "watch") {
          return last.replace(/^@/, "");
        }
      }
    }
  } catch (e) {
    // fallback
  }

  return text.replace(/[/?#].*$/, "").trim();
}

// Helper to extract video ID from any YouTube URL
export function getYouTubeVideoId(urlOrId: string): string {
  const extracted = extractYouTubeVideoId(urlOrId);
  return extracted || "";
}

export function getYouTubeChannel(identifier: string): YouTubeChannel | null {
  const clean = cleanYouTubeIdentifier(identifier).toLowerCase().replace(/^@/, "");

  if (!clean || clean === "notfound_user" || clean === "404") {
    return null;
  }

  if (YOUTUBE_PRESETS[clean]) {
    return YOUTUBE_PRESETS[clean];
  }

  return null;
}
