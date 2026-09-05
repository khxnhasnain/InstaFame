from typing import Optional, Dict, Any
from fastapi import FastAPI, Query, HTTPException, Response, Request, Body, UploadFile, File, Form, Header
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import re
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
from services.wallet_deposit_service import (
    get_upi_config,
    generate_amount_upi_qr,
    validate_and_save_screenshot,
    get_screenshot_path,
    INTERNAL_API_SECRET
)
from services.smm_service import place_smm_order, get_smm_order_status
from db import db
from app.api.instagram import router as instagram_router

app = FastAPI(
    title="Viralora Python Backend API",
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
        "service": "Viralora Python FastAPI Backend",
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
    service_type = (order_data.get("service_type") or "").lower().strip()
    package_amount = int(order_data.get("package_amount") or 0)
    user_email = (order_data.get("user_email") or "guest@viralora.com").lower().strip()
    price = float(order_data.get("price") or 0.0)

    if not service_type or package_amount <= 0:
        raise HTTPException(status_code=400, detail="service_type and a positive package_amount are required.")

    # 1. Verify user wallet balance has enough funds for our platform price
    user_wallet = db.get_user_wallet(user_email)
    if user_wallet < price:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient wallet balance (₹{user_wallet:.2f}). Required: ₹{price:.2f}. Please recharge your wallet first."
        )

    # 2. For Instagram followers boost, submit to SMMVault Service 8393
    if service_type == "followers":
        target_username = (order_data.get("target_username") or "").strip().lstrip("@")
        if not target_username:
            raise HTTPException(status_code=400, detail="Target Instagram username is required to boost followers.")
        
        # Build canonical Instagram profile link
        profile_link = f"https://www.instagram.com/{target_username}/"
        
        # Call SMMVault API (Service 8393: Indian flw)
        smm_success, order_id_from_smm, smm_err = place_smm_order(
            service_id="8393",
            link=profile_link,
            quantity=package_amount
        )
        
        if not smm_success:
            # If SMM provider fails, abort WITHOUT charging user wallet
            raise HTTPException(
                status_code=400,
                detail=f"SMM Provider Error: {smm_err or 'Failed to place boost order with provider.'}"
            )
        
        order_data["smm_order_id"] = str(order_id_from_smm)
        order_data["smm_status"] = "Pending"

    # 3. Create order and deduct user wallet balance in database at our platform price
    created = db.create_order(order_data)
    if isinstance(created, dict) and created.get("success") is False:
        raise HTTPException(status_code=400, detail=created.get("error", "Insufficient wallet balance."))
    return {"success": True, "data": created, "message": "Boost order placed and recorded successfully."}

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

@app.get("/api/orders/{order_id}/smm-status")
def check_order_smm_status(order_id: str):
    orders = db.get_orders()
    order = next((o for o in orders if str(o.get("id")) == str(order_id) or str(o.get("smm_order_id")) == str(order_id)), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    smm_order_id = order.get("smm_order_id")
    if not smm_order_id:
        return {"success": False, "message": "No external SMM order linked."}
    status_data = get_smm_order_status(smm_order_id)
    if status_data:
        smm_stat = status_data.get("status")
        if smm_stat:
            db.update_order_status(order_id, {"smm_status": smm_stat})
        return {"success": True, "data": status_data}
    return {"success": False, "message": "Unable to fetch SMM status."}



# ==========================================
# 6. Admin Analytics Stats (MySQL)
# ==========================================
@app.get("/api/admin/stats")
def admin_stats():
    stats = db.get_admin_stats()
    return {"success": True, "data": stats}

# ==========================================
# 7. Manual UPI Wallet Deposit System
# ==========================================

def verify_internal_secret(x_internal_secret: Optional[str]):
    """Enforces server-to-server internal secret authentication from Next.js server routes."""
    expected = os.environ.get("INTERNAL_API_SECRET", INTERNAL_API_SECRET)
    if not x_internal_secret or x_internal_secret.strip() != expected.strip():
        raise HTTPException(status_code=401, detail="Unauthorized internal server request.")

def check_is_admin(user: Optional[Dict[str, Any]], raw_admin_id: Optional[str] = None) -> bool:
    """Verifies whether a resolved user entity possesses administrator privileges."""
    admin_emails = [e.strip().lower() for e in os.environ.get("ADMIN_EMAILS", "khanhasnain2310@gmail.com,admin@viralora.com,admin@instafame.com").split(",") if e.strip()]
    if raw_admin_id:
        raw_clean = str(raw_admin_id).strip().lower()
        if raw_clean in admin_emails or raw_clean.startswith("admin") or raw_clean == "admin_1":
            return True
    if not user:
        return False
    if str(user.get("role", "")).lower() == "admin":
        return True
    user_email = str(user.get("email", "")).lower().strip()
    return user_email in admin_emails or user_email.startswith("admin@")

@app.get("/api/wallet/upi-config")
def get_wallet_upi_config():
    """Returns UPI payment configuration and receiving details."""
    return {"success": True, "data": get_upi_config()}

@app.get("/api/wallet/upi-qr")
def get_amount_upi_qr(amount: float = Query(100.00, ge=100.00, le=50000.00, description="Selected deposit amount")):
    """Generates dynamic amount-encoded UPI payment URI and base64 QR code image."""
    upi_uri, qr_data_url = generate_amount_upi_qr(amount)
    return {
        "success": True,
        "amount": amount,
        "upi_uri": upi_uri,
        "qr_data_url": qr_data_url,
        "note": f"QR code pre-fills ₹{amount:.2f} in your UPI app. Please verify the amount before paying."
    }

@app.get("/api/wallet/deposits/check-utr")
def check_utr_availability(
    utr: str = Query(..., description="12-digit numeric UTR to verify"),
    x_internal_secret: Optional[str] = Header(None, alias="x-internal-secret")
):
    """
    Verifies whether a UTR / Transaction ID already exists in wallet_deposits only.
    Returns exists: bool.
    """
    verify_internal_secret(x_internal_secret)
    clean_utr = str(utr or "").strip()
    if not clean_utr or not re.match(r"^[0-9]{12}$", clean_utr):
        return {"exists": False, "valid": False, "message": "Invalid UTR format. Must be 12 numeric digits."}

    exists, dep_info = db.is_utr_in_deposits(clean_utr)
    return {
        "exists": exists,
        "valid": True,
        "utr": clean_utr,
        "message": f"A deposit with UTR '{clean_utr}' has already been submitted. Duplicate submissions are not allowed." if exists else "UTR is unique and available."
    }

@app.post("/api/wallet/deposits")
async def submit_wallet_deposit(
    amount: float = Form(...),
    utr: str = Form(...),
    screenshot: UploadFile = File(...),
    x_internal_secret: Optional[str] = Header(None, alias="x-internal-secret"),
    x_user_id: Optional[str] = Header(None, alias="x-user-id")
):
    """
    Submits manual UPI deposit for manual admin verification.
    NEVER credits wallet balance automatically; creates record with status='pending'.
    Strictly checks wallet_deposits to ensure UTR is not a duplicate before accepting.
    """
    verify_internal_secret(x_internal_secret)

    if not x_user_id:
        raise HTTPException(status_code=401, detail="Trusted user ID header is required.")

    # Resolve authentic user from database
    user = db.get_user_by_id(x_user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"Authenticated user '{x_user_id}' not found.")

    clean_utr = str(utr or "").strip()
    if not re.match(r"^[0-9]{12}$", clean_utr):
        raise HTTPException(status_code=400, detail="UTR / Transaction ID must be exactly 12 numeric digits (e.g., 123456789012).")

    # Strictly check wallet_deposits BEFORE reading or saving screenshot file
    exists_in_deposits, _ = db.is_utr_in_deposits(clean_utr)
    if exists_in_deposits:
        raise HTTPException(
            status_code=409,
            detail=f"A deposit with UTR '{clean_utr}' has already been submitted. Duplicate submissions are not allowed."
        )

    # 5-layer image verification & storage (only executed if UTR is NOT in wallet_deposits)
    screenshot_bytes = await screenshot.read()
    valid, secure_filename, err_msg = validate_and_save_screenshot(screenshot, screenshot_bytes)
    if not valid:
        raise HTTPException(status_code=400, detail=err_msg or "Invalid payment screenshot.")

    # Create pending deposit record in database
    ok, deposit, msg = db.create_deposit(user["id"], amount, clean_utr, secure_filename)
    if not ok:
        status_code = 409 if ("already been submitted" in msg or "already have" in msg) else 400
        raise HTTPException(status_code=status_code, detail=msg)

    return {
        "success": True,
        "data": deposit,
        "message": msg
    }

@app.get("/api/wallet/deposits")
def list_user_deposits(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    x_internal_secret: Optional[str] = Header(None, alias="x-internal-secret"),
    x_user_id: Optional[str] = Header(None, alias="x-user-id")
):
    """Lists paginated deposit history for the authenticated user."""
    verify_internal_secret(x_internal_secret)
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Trusted user ID header is required.")

    result = db.get_user_deposits(x_user_id, page=page, page_size=page_size)
    return {"success": True, "data": result}

@app.get("/api/wallet/deposits/{deposit_id}/screenshot")
def stream_deposit_screenshot(
    deposit_id: str,
    x_internal_secret: Optional[str] = Header(None, alias="x-internal-secret"),
    x_user_id: Optional[str] = Header(None, alias="x-user-id"),
    x_is_admin: Optional[str] = Header(None, alias="x-is-admin")
):
    """
    Streams private payment screenshot.
    Access is strictly restricted to the deposit creator or authorized administrators.
    """
    verify_internal_secret(x_internal_secret)

    deposit = db.get_deposit_by_id(deposit_id)
    if not deposit:
        raise HTTPException(status_code=404, detail=f"Deposit '{deposit_id}' not found.")

    is_owner = bool(x_user_id and str(deposit.get("user_id")) == str(x_user_id))
    is_admin_req = bool(x_is_admin and str(x_is_admin).lower() == "true")

    if not (is_owner or is_admin_req):
        raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to view this payment screenshot.")

    file_path = get_screenshot_path(deposit.get("payment_screenshot", ""))
    if not file_path or not file_path.exists():
        raise HTTPException(status_code=404, detail="Screenshot file not found on disk.")

    media_type = "image/jpeg"
    if file_path.suffix.lower() == ".png":
        media_type = "image/png"
    elif file_path.suffix.lower() == ".webp":
        media_type = "image/webp"

    return FileResponse(str(file_path), media_type=media_type)

@app.get("/api/admin/deposits")
def admin_list_deposits(
    status: Optional[str] = Query(None, description="Filter by status: pending, approved, rejected, all"),
    search: Optional[str] = Query(None, description="Search by deposit ID, UTR, user email or name"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    x_internal_secret: Optional[str] = Header(None, alias="x-internal-secret"),
    x_admin_id: Optional[str] = Header(None, alias="x-admin-id")
):
    """Admin-only endpoint to list and search deposits."""
    verify_internal_secret(x_internal_secret)

    admin_user = db.get_user_by_id(x_admin_id or "")
    if not check_is_admin(admin_user, raw_admin_id=x_admin_id):
        raise HTTPException(status_code=403, detail="Administrator privileges required.")

    result = db.get_all_deposits(status=status, search=search, page=page, page_size=page_size)
    return {"success": True, "data": result}

@app.post("/api/admin/deposits/{deposit_id}/approve")
def admin_approve_deposit(
    deposit_id: str,
    x_internal_secret: Optional[str] = Header(None, alias="x-internal-secret"),
    x_admin_id: Optional[str] = Header(None, alias="x-admin-id")
):
    """
    Admin-only transactional deposit approval.
    Applies row-level FOR UPDATE lock on both deposit and user row,
    verifies ledger idempotency, credits user wallet with exact requested amount,
    and updates status to 'approved'.
    """
    verify_internal_secret(x_internal_secret)

    admin_user = db.get_user_by_id(x_admin_id or "")
    if not check_is_admin(admin_user, raw_admin_id=x_admin_id):
        raise HTTPException(status_code=403, detail="Administrator privileges required.")

    admin_identifier = (admin_user.get("email") if admin_user else None) or x_admin_id
    ok, updated_dep, msg = db.approve_deposit(deposit_id, admin_identifier)
    if not ok:
        status_code = 409 if ("already" in msg.lower() or "prevented" in msg.lower()) else 400
        raise HTTPException(status_code=status_code, detail=msg)

    return {
        "success": True,
        "data": updated_dep,
        "message": msg
    }

@app.post("/api/admin/deposits/{deposit_id}/reject")
def admin_reject_deposit(
    deposit_id: str,
    payload: Dict[str, Any] = Body(...),
    x_internal_secret: Optional[str] = Header(None, alias="x-internal-secret"),
    x_admin_id: Optional[str] = Header(None, alias="x-admin-id")
):
    """
    Admin-only deposit rejection.
    Sets status='rejected' with mandatory rejection reason (3-500 chars).
    Leaves user wallet balance untouched.
    """
    verify_internal_secret(x_internal_secret)

    admin_user = db.get_user_by_id(x_admin_id or "")
    if not check_is_admin(admin_user, raw_admin_id=x_admin_id):
        raise HTTPException(status_code=403, detail="Administrator privileges required.")

    rejection_reason = payload.get("rejection_reason", "").strip()
    admin_identifier = (admin_user.get("email") if admin_user else None) or x_admin_id
    ok, updated_dep, msg = db.reject_deposit(deposit_id, admin_identifier, rejection_reason)
    if not ok:
        status_code = 409 if "already" in msg.lower() else 400
        raise HTTPException(status_code=status_code, detail=msg)

    return {
        "success": True,
        "data": updated_dep,
        "message": msg
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
