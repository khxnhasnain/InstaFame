from typing import Optional, Dict, Any, Tuple
import logging
from app.services.session_manager import SessionManager
from app.services.profile_service import ProfileService

logger = logging.getLogger(__name__)

_profile_service = None

def get_profile_service() -> ProfileService:
    global _profile_service
    if _profile_service is None:
        session_manager = SessionManager()
        client = session_manager.get_client()
        _profile_service = ProfileService(client)
    return _profile_service

def fetch_live_instagram_api(
    username_or_id: str,
    pagination_token: Optional[str] = None,
    data_type: str = "all"
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Fetches real Instagram profile using instagrapi backend service.
    """
    clean_input = username_or_id.lower().strip().lstrip("@")
    if not clean_input:
        return None, "Username or User ID is required."

    raw_data = None
    try:
        ig_svc = get_profile_service()
        raw_data = ig_svc.get_profile(clean_input)
    except Exception as ig_err:
        logger.error(f"instagrapi failed for @{clean_input}: {ig_err}")
        return None, str(ig_err)

    if not raw_data:
        return None, f"User '@{clean_input}' not found or profile could not be loaded."

    posts = []
    reels = []
    for p in raw_data.get("posts", []):
        post_obj = {
            "id": p.get("id", ""),
            "code": p.get("code", ""),
            "imageUrl": p.get("imageUrl") or p.get("thumbnail_url") or "",
            "videoUrl": p.get("videoUrl") or p.get("video_url"),
            "carouselMedia": [p.get("imageUrl") or p.get("thumbnail_url")] if (p.get("imageUrl") or p.get("thumbnail_url")) else [],
            "likes": p.get("likes") or p.get("like_count", 0),
            "commentsCount": p.get("commentsCount") or p.get("comment_count", 0),
            "caption": p.get("caption", ""),
            "timestamp": p.get("timestamp") or p.get("taken_at") or "Recently",
            "isVideo": p.get("isVideo", False) or bool(p.get("videoUrl") or p.get("video_url"))
        }
        posts.append(post_obj)
        if post_obj["isVideo"]:
            reels.append(post_obj)

    highlights = []
    for h in raw_data.get("highlights", []):
        highlights.append({
            "id": h.get("id", ""),
            "title": h.get("title", "Highlight"),
            "coverUrl": h.get("coverUrl") or h.get("cover_url", "")
        })

    profile = {
        "username": raw_data.get("username", clean_input),
        "fullName": raw_data.get("fullName") or raw_data.get("full_name") or clean_input.capitalize(),
        "avatarUrl": raw_data.get("avatarUrl") or raw_data.get("profile_pic_url_hd") or raw_data.get("profile_pic_url", ""),
        "isVerified": raw_data.get("isVerified") or raw_data.get("is_verified", False),
        "bio": raw_data.get("bio") or raw_data.get("biography") or "",
        "category": "Instagram Profile",
        "website": raw_data.get("website") or f"https://instagram.com/{clean_input}",
        "postsCount": raw_data.get("postsCount") or raw_data.get("media_count", len(posts)),
        "followersCount": raw_data.get("followersCount") or raw_data.get("follower_count", 0),
        "followingCount": raw_data.get("followingCount") or raw_data.get("following_count", 0),
        "paginationToken": None,
        "reelsPaginationToken": None,
        "highlights": highlights,
        "posts": posts,
        "reels": reels if reels else [p for p in posts if p.get("isVideo")],
        "isLiveApiData": True,
        "rawInstagrapi": raw_data
    }

    return profile, None

def get_instagram_profile(
    username: str,
    pagination_token: Optional[str] = None,
    data_type: str = "all"
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    clean_user = username.lower().strip().lstrip("@")
    if clean_user in ["notfound_user", "404"]:
        return None, "User not found."

    return fetch_live_instagram_api(clean_user, pagination_token=pagination_token, data_type=data_type)
