from typing import Optional, Dict, Any
from fastapi import FastAPI, Query, HTTPException, Response, Request, Body
from fastapi.middleware.cors import CORSMiddleware
import time
import sys
import socket
from pathlib import Path
from dotenv import load_dotenv





backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Load environment variables from .env.local in project root
root_env = backend_dir.parent / ".env.local"
if root_env.exists():
    load_dotenv(dotenv_path=root_env)
else:
    load_dotenv()



from services.instagram_service import get_instagram_profile, fetch_live_instagram_api
from services.youtube_service import get_youtube_channel_data, get_more_youtube_videos
from db import db
from app.api.instagram import router as instagram_router

app = FastAPI(
    title="InstaFame Python Backend API",
    description="Python FastAPI backend serving Instagram, YouTube data, and MySQL dynamic pricing & order management.",
    version="2.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(instagram_router)


# In-memory rate limiting tracker
request_tracker = {}
RATE_LIMIT_MAX = 60
RATE_LIMIT_WINDOW = 60  # seconds

def check_rate_limit(client_ip: str):
    now = time.time()
    record = request_tracker.get(client_ip, {"count": 0, "timestamp": now})
    if now - record["timestamp"] > RATE_LIMIT_WINDOW:
        record["count"] = 1
        record["timestamp"] = now
    else:
        record["count"] += 1
    request_tracker[client_ip] = record

    if record["count"] > RATE_LIMIT_MAX:
        raise HTTPException(
            status_code=429,
            detail="Too many requests from this IP. Please try again later."
        )

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "InstaFame Python FastAPI Backend",
        "database": "MySQL Connected" if db.is_connected() else "MySQL Ready (Local Buffer)",
        "endpoints": [
            "/api/instagram",
            "/api/youtube",
            "/api/packages",
            "/api/users",
            "/api/orders",
            "/api/admin/stats"
        ]
    }

# ==========================================
# 1. Instagram Profile & Reels Endpoint
# ==========================================
@app.get("/api/instagram")
def fetch_instagram(
    request: Request,
    response: Response,
    username: str = Query(..., description="Instagram username or User ID"),
    pagination_token: Optional[str] = Query(None, description="Pagination token for next page of posts"),
    type: Optional[str] = Query("all", description="Type of data: all, posts, reels")
):
    client_ip = request.client.host if request.client else "anonymous"
    check_rate_limit(client_ip)

    clean_user = username.lower().strip()

    if clean_user in ["ratelimit_user", "429"]:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Rate limit exceeded. Please wait a minute."
        )

    profile, err_msg = get_instagram_profile(clean_user, pagination_token=pagination_token, data_type=type or "all")

    if not profile:
        status_code = 429 if err_msg and ("429" in err_msg or "quota" in err_msg.lower()) else 404
        raise HTTPException(
            status_code=status_code,
            detail=err_msg or f"User '@{clean_user}' not found. The requested Instagram profile does not exist."
        )

    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=300"
    return {"success": True, "data": profile, "source": "Python FastAPI Backend"}

# ==========================================
# 2. YouTube Channel & Video Endpoint
# ==========================================
@app.get("/api/youtube")
def fetch_youtube(
    request: Request,
    response: Response,
    channel: Optional[str] = Query(None, description="YouTube channel handle, name, or URL"),
    username: Optional[str] = Query(None, description="Fallback username or channel handle"),
    pagination_token: Optional[str] = Query(None, description="Pagination token to load more previous videos")
):
    client_ip = request.client.host if request.client else "anonymous"
    check_rate_limit(client_ip)

    # If pagination_token is provided, fetch previous videos batch
    if pagination_token:
        more_data = get_more_youtube_videos(pagination_token)
        return {"success": True, "data": more_data, "source": "Python FastAPI Backend InnerTube"}

    target = channel or username or ""
    clean_channel = target.strip()

    if not clean_channel:
        raise HTTPException(
            status_code=400,
            detail="channel or username query parameter is required."
        )

    if clean_channel.lower() in ["ratelimit_user", "429"]:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Rate limit exceeded. Please wait a minute."
        )

    channel_data = get_youtube_channel_data(clean_channel)

    if not channel_data:
        raise HTTPException(
            status_code=404,
            detail=f"YouTube channel '{clean_channel}' not found."
        )

    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=300"
    return {"success": True, "data": channel_data, "source": "Python FastAPI Backend"}

# ==========================================
# 3. Dynamic Pricing / Packages (MySQL)
# ==========================================
@app.get("/api/packages")
def get_packages(type: Optional[str] = Query(None, description="Service type: followers or likes")):
    packages = db.get_packages(service_type=type)
    return {
        "success": True,
        "data": packages,
        "count": len(packages),
        "database": "mysql" if db.is_connected() else "buffered"
    }

@app.get("/api/pricing/rates")
def get_pricing_rates():
    rates = db.get_pricing_rates()
    return {"success": True, "data": rates}

@app.put("/api/pricing/rates")
def update_pricing_rates(payload: Dict[str, Any] = Body(...)):
    rate_followers = float(payload.get("rate_per_1000_followers", 80.00))
    rate_likes = float(payload.get("rate_per_1000_likes", 40.00))
    rate_views = float(payload.get("rate_per_1000_views", 20.00))
    auto_update = bool(payload.get("auto_update_packages", False))
    updated = db.update_pricing_rates(rate_followers, rate_likes, rate_views=rate_views, auto_update_packages=auto_update)
    return {"success": True, "data": updated, "message": "Master rates per 1,000 followers, likes, and reel views updated successfully."}


@app.put("/api/packages/{package_id}")
def update_package(package_id: str, updates: Dict[str, Any] = Body(...)):
    updated = db.update_package(package_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Package '{package_id}' not found.")
    return {"success": True, "data": updated, "message": "Package pricing updated successfully in database."}

# ==========================================
# 4. Login Users Database (MySQL)
# ==========================================
@app.post("/api/users/sync")
def sync_user(payload: Dict[str, Any] = Body(...)):
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="User email is required.")
    user = db.sync_login_user(
        user_id=payload.get("id", ""),
        email=email,
        name=payload.get("name", ""),
        avatar_url=payload.get("avatar_url", ""),
        provider=payload.get("provider", "google")
    )
    return {"success": True, "data": user}

@app.get("/api/users")
def list_users():
    users = db.get_users()
    return {"success": True, "data": users, "count": len(users)}

# ==========================================
# 4.5. User Wallet & Funds Management
# ==========================================
@app.get("/api/wallet")
def get_user_wallet(user_email: str = Query(..., description="User email address")):
    if not user_email:
        raise HTTPException(status_code=400, detail="user_email query parameter is required.")
    balance = db.get_user_wallet(user_email)
    return {"success": True, "email": user_email.lower().strip(), "wallet_balance": balance}

@app.post("/api/wallet/add")
def add_user_wallet(payload: Dict[str, Any] = Body(...)):
    user_email = payload.get("user_email") or payload.get("email")
    amount = float(payload.get("amount") or 0.0)
    description = payload.get("description") or "Wallet Top-Up / Recharge"
    if not user_email or amount <= 0:
        raise HTTPException(status_code=400, detail="Valid user_email and positive amount are required.")
    updated = db.add_wallet_balance(user_email, amount, description=description)
    return {"success": True, "data": updated, "message": f"Successfully credited ₹{amount:.2f} to user wallet."}

@app.get("/api/wallet/transactions")
def get_user_transactions(user_email: Optional[str] = Query(None, description="User email address or 'all'")):
    txns = db.get_transactions(user_email=user_email)
    return {"success": True, "data": txns, "count": len(txns)}

# ==========================================
# 5. Growth Boost Orders (MySQL)
# ==========================================
@app.post("/api/orders")
def record_order(order_data: Dict[str, Any] = Body(...)):
    if not order_data.get("service_type") or not order_data.get("package_amount"):
        raise HTTPException(status_code=400, detail="service_type and package_amount are required.")
    created = db.create_order(order_data)
    if isinstance(created, dict) and created.get("success") is False:
        raise HTTPException(status_code=400, detail=created.get("error", "Insufficient wallet balance."))
    return {"success": True, "data": created, "message": "Boost order recorded in database."}

@app.get("/api/orders")
def list_orders(user_email: Optional[str] = Query(None, description="Filter orders by user email")):
    orders = db.get_orders(user_email=user_email)
    return {"success": True, "data": orders, "count": len(orders)}

@app.patch("/api/orders/{order_id}/status")
@app.put("/api/orders/{order_id}/status")
def update_order_status(order_id: str, payload: Dict[str, Any] = Body(...)):
    updated = db.update_order_status(order_id, payload)
    if not updated:
        return {"success": False, "message": f"Order '{order_id}' not found in database.", "data": payload}
    return {"success": True, "data": updated, "message": "Order status updated successfully in database."}



# ==========================================
# 6. Admin Analytics Stats (MySQL)
# ==========================================
@app.get("/api/admin/stats")
def admin_stats():
    stats = db.get_admin_stats()
    return {"success": True, "data": stats}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
