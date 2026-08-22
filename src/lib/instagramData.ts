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

// In-Memory Quota-Saver Cache (5 minutes TTL)
interface CacheEntry {
  data: FetchResult;
  timestamp: number;
}
const profileCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function fetchLiveRapidApiInstagramProfile(
  query: string,
  paginationToken?: string,
  type: "all" | "posts" | "reels" = "all"
): Promise<FetchResult> {
  const host = process.env.INSTAGRAM_RAPIDAPI_HOST || "instagram-media-api.p.rapidapi.com";
  const key = process.env.INSTAGRAM_RAPIDAPI_KEY || "";

  const cleanQuery = query.toLowerCase().trim().replace(/^@/, "");
  if (!cleanQuery) return { profile: null, error: "Username is required.", status: 400 };

  const cacheKey = `${cleanQuery}_${type}_${paginationToken || "root"}`;
  const cached = profileCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const headers = {
    "x-rapidapi-host": host,
    "x-rapidapi-key": key,
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  try {
    let userId = "";
    let username = cleanQuery;
    let fullName = cleanQuery;
    let bio = "";
    let avatarUrl = "";
    let isVerified = false;
    let followersCount = 0;
    let followingCount = 0;
    let website = "";
    let category = "Instagram Profile";

    const isNumeric = /^\d+$/.test(cleanQuery);

    // 1. Fetch User Profile Info via POST /user/info/username
    if (!isNumeric) {
      try {
        const userInfoRes = await fetch(`https://${host}/user/info/username`, {
          method: "POST",
          headers,
          body: JSON.stringify({ username: cleanQuery, proxy: "" }),
          cache: "no-store",
        });

        if (userInfoRes.ok) {
          const infoData = await userInfoRes.json();
          const u = infoData?.data?.xig_user_by_username;
          if (u) {
            userId = String(u.pk || u.id || "");
            username = u.username || cleanQuery;
            fullName = u.full_name || username;
            bio = u.biography || "";
            avatarUrl = proxyImage(u.profile_pic_url || "");
            isVerified = Boolean(u.is_verified);
            followersCount = Number(u.follower_count) || 0;
            followingCount = Number(u.following_count) || 0;
            if (u.bio_links && Array.isArray(u.bio_links) && u.bio_links.length > 0) {
              website = u.bio_links[0].url || "";
            }
            if (u.category_name) {
              category = u.category_name;
            }
          }
        } else if (userInfoRes.status === 429) {
          return {
            profile: null,
            error: "RapidAPI monthly quota limit reached (HTTP 429: Too Many Requests). Please update INSTAGRAM_RAPIDAPI_KEY in .env.local with an active key.",
            status: 429,
          };
        }
      } catch (e) {
        console.warn("User info username notice:", e);
      }

      // Fallback: Resolve numeric ID via POST /user/id
      if (!userId) {
        try {
          const idRes = await fetch(`https://${host}/user/id`, {
            method: "POST",
            headers,
            body: JSON.stringify({ username: cleanQuery }),
            cache: "no-store",
          });
          if (idRes.ok) {
            const idData = await idRes.json();
            if (idData && idData.id && !idData.error) {
              userId = String(idData.id);
            }
          }
        } catch (e) {
          console.warn("User id fallback notice:", e);
        }
      }
    } else {
      userId = cleanQuery;
    }

    if (!userId) {
      return {
        profile: null,
        error: `User '@${cleanQuery}' not found on Instagram.`,
        status: 404,
      };
    }

    // 2. Fetch Highlights via POST /user/info (only when type == 'all')
    const highlights: InstagramHighlight[] = [];
    if (type === "all") {
      try {
        const infoRes = await fetch(`https://${host}/user/info/`, {
          method: "POST",
          headers,
          body: JSON.stringify({ userid: userId, proxy: "" }),
          cache: "no-store",
        });

        if (infoRes.ok) {
          const infoData = await infoRes.json();
          const userData = infoData?.data?.user;
          if (!avatarUrl) {
            const reelUser = userData?.reel?.user || userData?.reel?.owner;
            if (reelUser?.profile_pic_url) {
              avatarUrl = proxyImage(reelUser.profile_pic_url);
            }
          }

          const hlEdges = userData?.edge_highlight_reels?.edges || [];
          hlEdges.forEach((hl: any, idx: number) => {
            const node = hl?.node;
            const cover =
              node?.cover_media_cropped_thumbnail?.url ||
              node?.cover_media?.thumbnail_src ||
              "";
            if (cover) {
              highlights.push({
                id: String(node.id || `hl-${idx}`),
                title: node.title || "Highlight",
                coverUrl: proxyImage(cover),
              });
            }
          });
        }
      } catch (infoErr) {
        console.warn("User highlights notice:", infoErr);
      }

      if (isNumeric && username && username !== cleanQuery) {
        try {
          const userInfoRes = await fetch(`https://${host}/user/info/username`, {
            method: "POST",
            headers,
            body: JSON.stringify({ username, proxy: "" }),
            cache: "no-store",
          });
          if (userInfoRes.ok) {
            const infoData = await userInfoRes.json();
            const u = infoData?.data?.xig_user_by_username;
            if (u) {
              fullName = u.full_name || username;
              bio = u.biography || "";
              if (!avatarUrl) avatarUrl = proxyImage(u.profile_pic_url || "");
              isVerified = Boolean(u.is_verified);
              followersCount = Number(u.follower_count) || 0;
              followingCount = Number(u.following_count) || 0;
              if (u.bio_links && Array.isArray(u.bio_links) && u.bio_links.length > 0) {
                website = u.bio_links[0].url || "";
              }
              if (u.category_name) category = u.category_name;
            }
          }
        } catch (enrichErr) {
          console.warn("Numeric user enrichment notice:", enrichErr);
        }
      }
    }

    // 3. Fetch Posts via POST /user/post
    const posts: InstagramPost[] = [];
    const videoUrlMap = new Map<string, string>();
    let totalPostsCount = 0;
    let nextEndCursor: string | undefined = undefined;

    if (type === "all" || type === "posts") {
      try {
        const postPayload = {
          userId,
          limit: 12,
          end_cursor: type === "posts" ? (paginationToken || "") : "",
          cookie: "",
          proxy: "",
        };

        const postRes = await fetch(`https://${host}/user/post`, {
          method: "POST",
          headers,
          body: JSON.stringify(postPayload),
          cache: "no-store",
        });

        if (postRes.ok) {
          const postData = await postRes.json();
          const timeline = postData?.edge_owner_to_timeline_media;
          totalPostsCount = timeline?.count || 0;
          nextEndCursor = timeline?.page_info?.end_cursor || undefined;

          const edges = timeline?.edges || [];
          edges.forEach((edge: any, idx: number) => {
            const node = edge?.node;
            if (!node) return;

            const rawImg = node.display_url || node.thumbnail_src || "";
            const imgUrl = proxyImage(rawImg) || avatarUrl;
            const videoUrl = node.video_url ? proxyImage(node.video_url) : undefined;
            const isVideo = Boolean(node.is_video || videoUrl);
            const shortcode = String(node.shortcode || "");

            // Index video URLs for cross-referencing with reels
            if (videoUrl) {
              if (node.id) videoUrlMap.set(String(node.id), videoUrl);
              if (shortcode) videoUrlMap.set(shortcode, videoUrl);
            }

            const carouselMedia: string[] = [];
            const sidecarEdges = node.edge_sidecar_to_children?.edges || [];
            sidecarEdges.forEach((c: any) => {
              const cImg = c?.node?.display_url;
              if (cImg) {
                carouselMedia.push(proxyImage(cImg));
              }
            });

            const captionEdges = node.edge_media_to_caption?.edges || [];
            const captionText =
              captionEdges.length > 0 && captionEdges[0]?.node?.text
                ? captionEdges[0].node.text
                : `Post by @${username}`;

            let timeStr = "Recently";
            if (node.taken_at_timestamp) {
              try {
                timeStr = new Date(node.taken_at_timestamp * 1000).toLocaleDateString();
              } catch {
                timeStr = "Recently";
              }
            }

            const postObj: InstagramPost = {
              id: String(node.id || node.shortcode || `post-${idx}`),
              code: shortcode,
              imageUrl: imgUrl,
              videoUrl,
              carouselMedia: carouselMedia.length > 0 ? carouselMedia : [imgUrl],
              likes: node.edge_media_preview_like?.count || 0,
              commentsCount: node.edge_media_to_comment?.count || 0,
              caption: captionText,
              timestamp: timeStr,
              isVideo,
            };

            posts.push(postObj);
          });
        }
      } catch (postErr) {
        console.warn("User post notice:", postErr);
      }
    }

    // 4. Fetch Dedicated Account Reels via POST /user/postreel
    const reels: InstagramPost[] = [];
    let nextReelsCursor: string | undefined = undefined;

    if (type === "all" || type === "reels") {
      try {
        const reelPayload = {
          userId,
          page_size: 12,
          end_cursor: type === "reels" ? (paginationToken || "") : "",
          cookie: "",
          proxy: "",
        };

        const reelRes = await fetch(`https://${host}/user/postreel`, {
          method: "POST",
          headers,
          body: JSON.stringify(reelPayload),
          cache: "no-store",
        });

        if (reelRes.ok) {
          const reelData = await reelRes.json();
          const conn = reelData?.data?.xdt_api__v1__clips__user__connection_v2;
          nextReelsCursor = conn?.page_info?.end_cursor || undefined;
          const edges = conn?.edges || [];
          edges.forEach((edge: any, idx: number) => {
            const m = edge?.node?.media;
            if (!m) return;

            let rawImg = "";
            if (m.image_versions2?.candidates?.length > 0) {
              rawImg = m.image_versions2.candidates[0].url;
            }

            const imgUrl = proxyImage(rawImg) || avatarUrl;
            const likes = Number(m.like_count || m.play_count || 0);
            const commentsCount = Number(m.comment_count || 0);
            const captionText =
              typeof m.caption === "string"
                ? m.caption
                : m.caption?.text || `Reel by @${username}`;

            const reelPk = String(m.pk || m.id || "");
            const reelCode = String(m.code || "");
            const rawId = reelPk.split("_")[0];

            // Cross-reference videoUrl from timeline posts map
            const matchedVideoUrl =
              videoUrlMap.get(reelCode) ||
              videoUrlMap.get(reelPk) ||
              videoUrlMap.get(rawId) ||
              undefined;

            const reelObj: InstagramPost = {
              id: String(m.id || m.pk || m.code || `reel-${idx}`),
              code: reelCode,
              imageUrl: imgUrl,
              videoUrl: matchedVideoUrl,
              carouselMedia: [imgUrl],
              likes,
              commentsCount,
              caption: captionText,
              timestamp: "Recently",
              isVideo: true,
            };
            reels.push(reelObj);
          });
        }
      } catch (reelErr) {
        console.warn("Reels fetch notice:", reelErr);
      }
    }

    const finalReels = reels.length > 0 ? reels : posts.filter((p) => p.isVideo);

    const result: FetchResult = {
      profile: {
        username,
        fullName: fullName || username,
        avatarUrl: avatarUrl || (posts.length > 0 ? posts[0].imageUrl : ""),
        isVerified,
        bio,
        category,
        website: website || `https://instagram.com/${username}`,
        postsCount: totalPostsCount || posts.length,
        followersCount,
        followingCount,
        paginationToken: nextEndCursor,
        reelsPaginationToken: nextReelsCursor,
        highlights,
        posts,
        reels: finalReels,
      },
      status: 200,
    };

    // Store in memory cache
    profileCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return result;
  } catch (err: any) {
    console.error("fetchLiveRapidApiInstagramProfile error:", err);
    return {
      profile: null,
      error: err?.message || "Failed to connect to Instagram API.",
      status: 500,
    };
  }
}
