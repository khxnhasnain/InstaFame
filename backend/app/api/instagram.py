from fastapi import APIRouter, HTTPException, Query
from instagrapi.exceptions import UserNotFound
from app.services.session_manager import SessionManager
from app.services.profile_service import ProfileService
from app.services.follow_service import FollowService
import logging

router = APIRouter(prefix="/instagram", tags=["instagram"])
logger = logging.getLogger(__name__)

_profile_service = None
_follow_service = None

def _get_services():
    global _profile_service, _follow_service
    if _profile_service is None or _follow_service is None:
        try:
            sm = SessionManager()
            cl = sm.get_client()
            _profile_service = ProfileService(cl)
            _follow_service = FollowService(cl)
        except Exception as e:
            logger.error(f"instagrapi initialization error: {e}")
            raise HTTPException(status_code=500, detail=f"Instagram service error: {str(e)}")
    return _profile_service, _follow_service

@router.get("/profile/{username}")
def get_profile(username: str):
    prof_svc, _ = _get_services()
    try:
        data = prof_svc.get_profile(username)
        return {"success": True, "data": data, "source": "instagrapi"}
    except UserNotFound:
        raise HTTPException(status_code=404, detail=f"User @{username} not found")
    except Exception as e:
        msg = str(e)
        status_code = 404 if "not found" in msg.lower() or "not exist" in msg.lower() else (429 if "rate" in msg.lower() or "limit" in msg.lower() or "429" in msg else 500)
        raise HTTPException(status_code=status_code, detail=msg)

@router.get("/profile/{username}/posts")
def get_posts(username: str, limit: int = Query(12, ge=1, le=100), pagination_token: str = Query(None)):
    prof_svc, _ = _get_services()
    try:
        if pagination_token:
            res = prof_svc.get_paginated_posts(username, limit=limit, pagination_token=pagination_token)
            return {
                "success": True,
                "username": username,
                "count": res.get("count", 0),
                "paginationToken": res.get("paginationToken"),
                "posts": res.get("posts", [])
            }
        profile = prof_svc.get_profile(username)
        posts = profile.get("posts", [])[:limit]
        return {
            "success": True,
            "username": username,
            "count": len(posts),
            "paginationToken": profile.get("paginationToken"),
            "posts": posts
        }
    except UserNotFound:
        raise HTTPException(status_code=404, detail=f"User @{username} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profile/{username}/reels")
def get_reels(username: str, limit: int = Query(12, ge=1, le=100), pagination_token: str = Query(None)):
    prof_svc, _ = _get_services()
    try:
        res = prof_svc.get_paginated_reels(username, limit=limit, pagination_token=pagination_token)
        return {
            "success": True,
            "username": username,
            "count": res.get("count", 0),
            "reelsPaginationToken": res.get("reelsPaginationToken") or (str(limit) if res.get("count", 0) >= limit else None),
            "reels": res.get("reels", [])
        }
    except UserNotFound:
        raise HTTPException(status_code=404, detail=f"User @{username} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profile/{username}/followers")
def get_followers(username: str, limit: int = Query(10, ge=1, le=50)):
    _, fol_svc = _get_services()
    try:
        data = fol_svc.get_followers(username, limit)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profile/{username}/following")
def get_following(username: str, limit: int = Query(10, ge=1, le=50)):
    _, fol_svc = _get_services()
    try:
        data = fol_svc.get_following(username, limit)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
