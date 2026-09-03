import time
import random
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class FollowService:
    def __init__(self, client):
        self.client = client
        self.max_limit = 50

    def get_followers(self, username: str, limit: int = 20) -> dict:
        clean_username = username.lower().strip().lstrip("@")
        try:
            user_id = self.client.user_id_from_username(clean_username)
            delay = random.uniform(settings.MIN_DELAY, settings.MAX_DELAY)
            logger.info(f"Delaying {delay:.2f}s before fetching followers for @{clean_username}")
            time.sleep(delay)

            amount = min(limit, self.max_limit)
            followers_dict = self.client.user_followers(user_id, amount=amount)

            formatted = []
            for fid, info in followers_dict.items():
                formatted.append({
                    "id": str(fid),
                    "username": getattr(info, "username", ""),
                    "full_name": getattr(info, "full_name", ""),
                    "profile_pic_url": str(getattr(info, "profile_pic_url", "")),
                    "is_private": getattr(info, "is_private", False),
                    "is_verified": getattr(info, "is_verified", False)
                })

            return {"username": clean_username, "count": len(formatted), "followers": formatted}
        except Exception as e:
            logger.error(f"Error fetching followers for @{clean_username}: {e}")
            raise

    def get_following(self, username: str, limit: int = 20) -> dict:
        clean_username = username.lower().strip().lstrip("@")
        try:
            user_id = self.client.user_id_from_username(clean_username)
            delay = random.uniform(settings.MIN_DELAY, settings.MAX_DELAY)
            logger.info(f"Delaying {delay:.2f}s before fetching following for @{clean_username}")
            time.sleep(delay)

            amount = min(limit, self.max_limit)
            following_dict = self.client.user_following(user_id, amount=amount)

            formatted = []
            for fid, info in following_dict.items():
                formatted.append({
                    "id": str(fid),
                    "username": getattr(info, "username", ""),
                    "full_name": getattr(info, "full_name", ""),
                    "profile_pic_url": str(getattr(info, "profile_pic_url", "")),
                    "is_private": getattr(info, "is_private", False),
                    "is_verified": getattr(info, "is_verified", False)
                })

            return {"username": clean_username, "count": len(formatted), "following": formatted}
        except Exception as e:
            logger.error(f"Error fetching following for @{clean_username}: {e}")
            raise
