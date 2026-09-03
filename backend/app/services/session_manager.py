import os
import json
import logging
from instagrapi import Client
from instagrapi.exceptions import ChallengeRequired, LoginRequired, BadPassword, PleaseWaitFewMinutes, ClientError
from app.config import settings

logger = logging.getLogger(__name__)

class SessionManager:
    SESSION_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "sessions")

    def __init__(self, username: str = None, password: str = None, sessionid: str = None):
        self.username = username or settings.IG_USERNAME
        self.password = password or settings.IG_PASSWORD
        self.sessionid = sessionid or settings.IG_SESSIONID
        self.session_path = os.path.join(self.SESSION_DIR, f"{self.username}.json") if self.username else os.path.join(self.SESSION_DIR, "session.json")

        os.makedirs(self.SESSION_DIR, exist_ok=True)

        self.client = Client()
        self.client.request_timeout = 0
        self.client.delay_range = [0, 1]
        # Use modern Instagram Android User-Agent to prevent 467/429 errors from Meta
        self.client.set_user_agent('Instagram 316.0.0.38.109 Android (33/13; 480dpi; 1080x2340; samsung; SM-S911B; dm3q; qcom; en_US; 564998246)')
        # Prevent stdin blocking on background servers
        self.client.challenge_code_handler = lambda u, c: False

        if settings.IG_PROXY and len(settings.IG_PROXY.strip()) > 5:
            try:
                self.client.set_proxy(settings.IG_PROXY.strip())
                logger.info(f"Configured instagrapi proxy: {settings.IG_PROXY.split('@')[-1]}")
            except Exception as e:
                logger.warning(f"Failed to configure proxy: {e}")

    def get_client(self) -> Client:
        # 1. First priority: Session ID (Cleanest and bypasses IG bot challenges)
        if self.sessionid and len(self.sessionid.strip()) > 5:
            try:
                logger.info("Authenticating instagrapi with IG_SESSIONID...")
                self.client.login_by_sessionid(self.sessionid.strip())
                logger.info("Successfully authenticated instagrapi with IG_SESSIONID!")
                if self.session_path:
                    try:
                        self.client.dump_settings(self.session_path)
                    except Exception:
                        pass
                return self.client
            except Exception as e:
                logger.warning(f"Failed to authenticate with IG_SESSIONID: {e}")

        # 2. Second priority: Pre-existing session file
        if self.session_path and os.path.exists(self.session_path):
            try:
                self.client.load_settings(self.session_path)
                logger.info(f"Loaded saved instagrapi session from {self.session_path}")
                return self.client
            except Exception as e:
                logger.warning(f"Failed to load session settings from {self.session_path}: {e}")

        # 3. Third priority: Username and Password login
        if self.username and self.password and self.username not in ["your_test_account", "your_ig_username", ""]:
            try:
                logger.info(f"Attempting login for user: {self.username}")
                try:
                    self.client.login(self.username, self.password)
                except Exception as login_err:
                    # instagrapi often throws 467 on post-login login_flow(), check if user_id was set
                    if getattr(self.client, "user_id", None):
                        logger.info(f"Login succeeded for {self.username} (user_id={self.client.user_id}), ignoring secondary login_flow error: {login_err}")
                    else:
                        raise login_err

                if self.session_path:
                    try:
                        self.client.dump_settings(self.session_path)
                        logger.info(f"Session successfully saved to {self.session_path}")
                    except Exception:
                        pass
                return self.client
            except ChallengeRequired as e:
                logger.error(f"Instagram Challenge Required for '{self.username}': {e}. Tip: Use IG_SESSIONID from browser cookies in .env.local instead.")
                return self.client
            except Exception as e:
                logger.error(f"Login failed for username '{self.username}': {e}. Tip: If your IP is blocked by Instagram, provide IG_SESSIONID in .env.local.")
                return self.client

        logger.warning("No valid Instagram credentials or session configured. instagrapi will operate in anonymous mode.")
        return self.client
