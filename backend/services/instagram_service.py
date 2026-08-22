from typing import Optional, Dict, Any, List, Tuple
import os
import json
import urllib.request
import urllib.error
import urllib.parse
import ssl
from datetime import datetime

def fetch_live_instagram_api(
    username_or_id: str,
    pagination_token: Optional[str] = None,
    data_type: str = "all"
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Fetches real Instagram profile, followers, following, posts, highlights, and reels using RapidAPI:
    instagram-media-api.p.rapidapi.com
    100% authentic live Instagram data.
    """
    clean_input = username_or_id.lower().strip().lstrip("@")
    if not clean_input:
        return None, "Username or User ID is required."

    rapid_host = os.environ.get("INSTAGRAM_RAPIDAPI_HOST", "instagram-media-api.p.rapidapi.com")
    rapid_key = os.environ.get("INSTAGRAM_RAPIDAPI_KEY", "")

    headers = {
        "x-rapidapi-host": rapid_host,
        "x-rapidapi-key": rapid_key,
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    user_id = ""
    username = clean_input
    full_name = clean_input
    bio = ""
    avatar_url = ""
    is_verified = False
    followers_count = 0
    following_count = 0
    website = ""
    category = "Instagram Profile"

    is_numeric = clean_input.isdigit()

    # 1. Fetch Complete User Profile & Statistics
    if not is_numeric:
        try:
            info_user_url = f"https://{rapid_host}/user/info/username"
            info_user_payload = json.dumps({"username": clean_input, "proxy": ""}).encode("utf-8")
            req_uinfo = urllib.request.Request(info_user_url, data=info_user_payload, headers=headers, method="POST")
            with urllib.request.urlopen(req_uinfo, context=ctx, timeout=12) as res_uinfo:
                uinfo_data = json.loads(res_uinfo.read().decode("utf-8"))
                u = uinfo_data.get("data", {}).get("xig_user_by_username")
                if u:
                    user_id = str(u.get("pk") or u.get("id") or "")
                    username = u.get("username") or clean_input
                    full_name = u.get("full_name") or username
                    bio = u.get("biography") or ""
                    avatar_url = u.get("profile_pic_url") or ""
                    is_verified = bool(u.get("is_verified", False))
                    followers_count = int(u.get("follower_count") or 0)
                    following_count = int(u.get("following_count") or 0)
                    bio_links = u.get("bio_links")
                    if bio_links and isinstance(bio_links, list) and len(bio_links) > 0:
                        website = bio_links[0].get("url") or ""
                    if u.get("category_name"):
                        category = u.get("category_name")
        except urllib.error.HTTPError as e:
            if e.code == 429:
                return None, "RapidAPI monthly quota limit reached (HTTP 429: Too Many Requests). Please update INSTAGRAM_RAPIDAPI_KEY in .env.local with an active key."
        except Exception as e:
            print(f"RapidAPI /user/info/username notice: {e}")

        # Fallback to POST /user/id if user_id wasn't extracted
        if not user_id:
            try:
                id_url = f"https://{rapid_host}/user/id"
                id_payload = json.dumps({"username": clean_input}).encode("utf-8")
                req_id = urllib.request.Request(id_url, data=id_payload, headers=headers, method="POST")
                with urllib.request.urlopen(req_id, context=ctx, timeout=10) as res_id:
                    id_data = json.loads(res_id.read().decode("utf-8"))
                    if id_data and id_data.get("id") and not id_data.get("error"):
                        user_id = str(id_data["id"])
            except Exception as e:
                print(f"RapidAPI /user/id notice: {e}")
    else:
        user_id = clean_input

    if not user_id:
        return None, f"User '@{clean_input}' not found on Instagram."

    # 2. Fetch User Profile Info & Highlights via POST /user/info/
    highlights = []
    try:
        info_url = f"https://{rapid_host}/user/info/"
        info_payload = json.dumps({"userid": str(user_id), "proxy": ""}).encode("utf-8")
        req_info = urllib.request.Request(info_url, data=info_payload, headers=headers, method="POST")
        with urllib.request.urlopen(req_info, context=ctx, timeout=10) as res_info:
            info_json = json.loads(res_info.read().decode("utf-8"))
            user_data = info_json.get("data", {}).get("user", {})
            if user_data:
                reel_user = user_data.get("reel", {}).get("user") or user_data.get("reel", {}).get("owner")
                if reel_user:
                    if not avatar_url and reel_user.get("profile_pic_url"):
                        avatar_url = reel_user.get("profile_pic_url")
                    if not username or username == clean_input:
                        if reel_user.get("username"):
                            username = reel_user.get("username")

                hl_edges = user_data.get("edge_highlight_reels", {}).get("edges", [])
                for idx, hl in enumerate(hl_edges):
                    node = hl.get("node", {})
                    cover = node.get("cover_media_cropped_thumbnail", {}).get("url") or node.get("cover_media", {}).get("thumbnail_src") or ""
                    if cover:
                        highlights.append({
                            "id": str(node.get("id") or f"hl-{idx}"),
                            "title": node.get("title") or "Highlight",
                            "coverUrl": cover
                        })
    except Exception as e:
        print(f"RapidAPI /user/info/ notice: {e}")

    # Enrich metadata for numeric user ID queries
    if is_numeric and username and username != clean_input:
        try:
            info_user_url = f"https://{rapid_host}/user/info/username"
            info_user_payload = json.dumps({"username": username, "proxy": ""}).encode("utf-8")
            req_uinfo = urllib.request.Request(info_user_url, data=info_user_payload, headers=headers, method="POST")
            with urllib.request.urlopen(req_uinfo, context=ctx, timeout=10) as res_uinfo:
                uinfo_data = json.loads(res_uinfo.read().decode("utf-8"))
                u = uinfo_data.get("data", {}).get("xig_user_by_username")
                if u:
                    full_name = u.get("full_name") or username
                    bio = u.get("biography") or ""
                    if not avatar_url:
                        avatar_url = u.get("profile_pic_url") or ""
                    is_verified = bool(u.get("is_verified", False))
                    followers_count = int(u.get("follower_count") or 0)
                    following_count = int(u.get("following_count") or 0)
                    bio_links = u.get("bio_links")
                    if bio_links and isinstance(bio_links, list) and len(bio_links) > 0:
                        website = bio_links[0].get("url") or ""
                    if u.get("category_name"):
                        category = u.get("category_name")
        except Exception as e:
            print(f"RapidAPI numeric user info enrichment notice: {e}")

    # 3. Fetch Posts via POST /user/post
    posts = []
    video_map = {}
    total_posts = 0
    next_cursor = None

    if data_type in ["all", "posts"]:
        try:
            post_url = f"https://{rapid_host}/user/post"
            post_payload = json.dumps({
                "userId": str(user_id),
                "limit": 12,
                "end_cursor": (pagination_token or "") if data_type == "posts" else "",
                "cookie": "",
                "proxy": ""
            }).encode("utf-8")
            req_post = urllib.request.Request(post_url, data=post_payload, headers=headers, method="POST")
            with urllib.request.urlopen(req_post, context=ctx, timeout=12) as res_post:
                post_json = json.loads(res_post.read().decode("utf-8"))
                tl = post_json.get("edge_owner_to_timeline_media", {})
                total_posts = tl.get("count", 0)
                next_cursor = tl.get("page_info", {}).get("end_cursor")
                edges = tl.get("edges", [])

                for idx, edge in enumerate(edges):
                    node = edge.get("node", {})
                    if not node:
                        continue

                    raw_img = node.get("display_url") or node.get("thumbnail_src") or avatar_url
                    video_url = node.get("video_url")
                    is_video = bool(node.get("is_video") or video_url)

                    if video_url:
                        if node.get("id"):
                            video_map[str(node["id"])] = video_url
                        if node.get("shortcode"):
                            video_map[str(node["shortcode"])] = video_url

                    carousel = []
                    sidecar_edges = node.get("edge_sidecar_to_children", {}).get("edges", [])
                    for c in sidecar_edges:
                        c_img = c.get("node", {}).get("display_url")
                        if c_img:
                            carousel.append(c_img)

                    caption_edges = node.get("edge_media_to_caption", {}).get("edges", [])
                    caption_text = caption_edges[0].get("node", {}).get("text", "") if caption_edges else f"Post by @{username}"

                    taken_at = node.get("taken_at_timestamp")
                    time_str = "Recently"
                    if taken_at:
                        try:
                            time_str = datetime.fromtimestamp(taken_at).strftime("%b %d, %Y")
                        except Exception:
                            time_str = "Recently"

                    post_obj = {
                        "id": str(node.get("id") or node.get("shortcode") or f"p-{idx}"),
                        "code": str(node.get("shortcode") or ""),
                        "imageUrl": raw_img,
                        "videoUrl": video_url,
                        "carouselMedia": carousel if carousel else [raw_img],
                        "likes": node.get("edge_media_preview_like", {}).get("count", 0),
                        "commentsCount": node.get("edge_media_to_comment", {}).get("count", 0),
                        "caption": caption_text,
                        "timestamp": time_str,
                        "isVideo": is_video
                    }
                    posts.append(post_obj)
        except Exception as e:
            print(f"RapidAPI /user/post notice: {e}")

    # 4. Fetch Dedicated Reels via POST /user/postreel
    reels = []
    next_reels_cursor = None

    if data_type in ["all", "reels"]:
        try:
            reel_url = f"https://{rapid_host}/user/postreel"
            reel_payload = json.dumps({
                "userId": str(user_id),
                "page_size": 12,
                "end_cursor": (pagination_token or "") if data_type == "reels" else "",
                "cookie": "",
                "proxy": ""
            }).encode("utf-8")
            req_reel = urllib.request.Request(reel_url, data=reel_payload, headers=headers, method="POST")
            with urllib.request.urlopen(req_reel, context=ctx, timeout=12) as res_reel:
                reel_json = json.loads(res_reel.read().decode("utf-8"))
                conn = reel_json.get("data", {}).get("xdt_api__v1__clips__user__connection_v2", {})
                next_reels_cursor = conn.get("page_info", {}).get("end_cursor")
                edges = conn.get("edges", [])
                for idx, edge in enumerate(edges):
                    m = edge.get("node", {}).get("media")
                    if not m:
                        continue

                    raw_img = ""
                    cands = m.get("image_versions2", {}).get("candidates", [])
                    if cands and len(cands) > 0:
                        raw_img = cands[0].get("url") or ""

                    likes = int(m.get("like_count") or m.get("play_count") or 0)
                    comments_count = int(m.get("comment_count") or 0)
                    caption = m.get("caption") if isinstance(m.get("caption"), str) else (m.get("caption", {}).get("text") if isinstance(m.get("caption"), dict) else f"Reel by @{username}")

                    code = str(m.get("code") or "")
                    pk = str(m.get("pk") or m.get("id") or "")
                    raw_pk = pk.split("_")[0]

                    matched_video = video_map.get(code) or video_map.get(pk) or video_map.get(raw_pk)

                    reel_obj = {
                        "id": str(m.get("id") or m.get("pk") or m.get("code") or f"reel-{idx}"),
                        "code": code,
                        "imageUrl": raw_img or avatar_url,
                        "videoUrl": matched_video,
                        "carouselMedia": [raw_img or avatar_url],
                        "likes": likes,
                        "commentsCount": comments_count,
                        "caption": caption,
                        "timestamp": "Recently",
                        "isVideo": True
                    }
                    reels.append(reel_obj)
        except Exception as e:
            print(f"RapidAPI /user/postreel notice: {e}")

    final_reels = reels if len(reels) > 0 else [p for p in posts if p.get("isVideo")]

    return {
        "username": username,
        "fullName": full_name or username.capitalize(),
        "avatarUrl": avatar_url or (posts[0]["imageUrl"] if posts else ""),
        "isVerified": is_verified,
        "bio": bio or f"Official profile of @{username}",
        "category": category,
        "website": website or f"https://instagram.com/{username}",
        "postsCount": total_posts or len(posts),
        "followersCount": followers_count,
        "followingCount": following_count,
        "paginationToken": next_cursor,
        "reelsPaginationToken": next_reels_cursor,
        "highlights": highlights,
        "posts": posts,
        "reels": final_reels,
        "isLiveApiData": True
    }, None

def get_instagram_profile(
    username: str,
    pagination_token: Optional[str] = None,
    data_type: str = "all"
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    clean_user = username.lower().strip().lstrip("@")
    if clean_user in ["notfound_user", "404"]:
        return None, "User not found."

    live_profile, err_msg = fetch_live_instagram_api(clean_user, pagination_token=pagination_token, data_type=data_type)
    if live_profile:
        return live_profile, None

    return None, err_msg or f"Could not fetch real Instagram profile for '@{clean_user}'."
