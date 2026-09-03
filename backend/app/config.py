import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env or .env.local in project root or current directory
root_dir = Path(__file__).resolve().parent.parent.parent
env_local = root_dir / ".env.local"
env_file = root_dir / ".env"

if env_local.exists():
    load_dotenv(dotenv_path=env_local)
elif env_file.exists():
    load_dotenv(dotenv_path=env_file)
else:
    load_dotenv()

class Settings:
    IG_USERNAME: str = os.getenv("IG_USERNAME", "")
    IG_PASSWORD: str = os.getenv("IG_PASSWORD", "")
    IG_SESSIONID: str = os.getenv("IG_SESSIONID", "")
    IG_PROXY: str = os.getenv("IG_PROXY", "")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key")
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", "3600"))
    MIN_DELAY: int = int(os.getenv("MIN_DELAY", "1"))
    MAX_DELAY: int = int(os.getenv("MAX_DELAY", "3"))

settings = Settings()
