import os
import io
import re
import uuid
from decimal import Decimal
from pathlib import Path
from typing import Tuple, Optional, Dict, Any, Union
from fastapi import UploadFile
from PIL import Image
import qrcode
import base64

# Base uploads directory (Private, outside public web root)
UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads" / "deposits"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Configuration from Environment
UPI_ID = os.environ.get("UPI_ID", "8591365203@naviaxis")
UPI_DISPLAY_NAME = os.environ.get("UPI_DISPLAY_NAME", "Viralora Media")
MIN_DEPOSIT_AMOUNT = Decimal(os.environ.get("MIN_DEPOSIT_AMOUNT", "100.00"))
MAX_DEPOSIT_AMOUNT = Decimal(os.environ.get("MAX_DEPOSIT_AMOUNT", "50000.00"))
INTERNAL_API_SECRET = os.environ.get("INTERNAL_API_SECRET", "instafame_internal_server_secret_7392817491028374")

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

def get_upi_config() -> Dict[str, Any]:
    return {
        "upi_id": UPI_ID,
        "upi_display_name": UPI_DISPLAY_NAME,
        "min_deposit": float(MIN_DEPOSIT_AMOUNT),
        "max_deposit": float(MAX_DEPOSIT_AMOUNT),
        "fallback_qr_image": "/images/upi_qr.jpg",
        "instructions": [
            "Open your preferred UPI app (Google Pay, PhonePe, Paytm, BHIM, or Axis).",
            f"Scan the dynamic amount QR code, or pay to UPI ID {UPI_ID}.",
            "Complete the payment in your UPI app.",
            "Copy the 12-digit numeric UTR / Ref ID from your payment confirmation screen.",
            "Upload your payment screenshot and submit for admin verification."
        ]
    }

def generate_amount_upi_qr(amount: Union[Decimal, float, int, str]) -> Tuple[str, str]:
    """
    Generates dynamic amount-specific UPI payment URI and base64 PNG data URL.
    URI format: upi://pay?pa=8591365203@naviaxis&pn=Viralora%20Media&am=1000&cu=INR
    Note: The QR code pre-fills the amount in the user's UPI app.
    """
    try:
        dec_amount = Decimal(str(amount)).quantize(Decimal("0.01"))
    except Exception:
        dec_amount = Decimal("100.00")

    # Format without trailing zeros if whole number, else with 2 decimals
    amount_str = f"{dec_amount:.2f}" if dec_amount % 1 != 0 else f"{int(dec_amount)}"
    
    # URL encode parameters
    encoded_name = UPI_DISPLAY_NAME.replace(" ", "%20")
    upi_uri = f"upi://pay?pa={UPI_ID}&pn={encoded_name}&am={amount_str}&cu=INR"

    # Generate QR Code image using qrcode
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(upi_uri)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    png_bytes = buffer.getvalue()
    b64_encoded = base64.b64encode(png_bytes).decode("utf-8")
    data_url = f"data:image/png;base64,{b64_encoded}"

    return upi_uri, data_url

def validate_and_save_screenshot(file: UploadFile, content: bytes) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    5-Layer Image Validation:
    1. Size verification (<= 5MB)
    2. Extension verification (.jpg, .jpeg, .png, .webp)
    3. MIME type inspection
    4. Magic bytes verification
    5. Pillow image decoding / parsing verification
    Saves securely with a generated UUID filename in private backend/uploads/deposits/.
    """
    # 1. Size check
    if len(content) > MAX_FILE_SIZE:
        return False, None, f"Payment screenshot exceeds maximum allowed size of 5 MB (size: {len(content) / (1024 * 1024):.1f} MB)."

    if len(content) < 100:
        return False, None, "Uploaded file is too small or empty to be a valid image."

    # 2. Extension check
    orig_name = (file.filename or "").lower().strip()
    ext = Path(orig_name).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, None, f"Invalid file extension '{ext}'. Allowed formats: JPG, JPEG, PNG, WEBP."

    # 3. MIME type check
    content_type = (file.content_type or "").lower().strip()
    if content_type and content_type not in ALLOWED_MIME_TYPES:
        return False, None, f"Invalid MIME type '{content_type}'. Must be image/jpeg, image/png, or image/webp."

    # 4. Magic bytes inspection
    # JPEG: starts with \xff\xd8\xff
    # PNG: starts with \x89PNG\r\n\x1a\n
    # WEBP: starts with RIFF and contains WEBP at bytes 8-12
    is_jpeg = content.startswith(b"\xff\xd8\xff")
    is_png = content.startswith(b"\x89PNG\r\n\x1a\n")
    is_webp = content.startswith(b"RIFF") and len(content) >= 12 and content[8:12] == b"WEBP"

    if not (is_jpeg or is_png or is_webp):
        return False, None, "File signature mismatch. The uploaded file is not a genuine image file."

    # 5. Pillow parsing / integrity verification
    try:
        with Image.open(io.BytesIO(content)) as img:
            img.verify()
            detected_format = (img.format or "").upper()
            if detected_format not in {"JPEG", "PNG", "WEBP"}:
                return False, None, f"Unsupported internal image format '{detected_format}'."
    except Exception as e:
        return False, None, f"Corrupted or malicious image payload: {str(e)}"

    # Generate secure UUID filename to prevent directory traversal or script execution
    secure_filename = f"dep_{uuid.uuid4().hex}{ext}"
    target_path = UPLOADS_DIR / secure_filename

    try:
        with open(target_path, "wb") as f:
            f.write(content)
        return True, secure_filename, None
    except Exception as e:
        return False, None, f"Failed to store screenshot: {str(e)}"

def get_screenshot_path(filename: str) -> Optional[Path]:
    """
    Safely resolves screenshot path within UPLOADS_DIR, preventing directory traversal.
    """
    if not filename:
        return None
    # Extract the base filename to safely handle potential relative paths
    clean_name = Path(filename).name
    if not clean_name or ".." in clean_name:
        return None
    file_path = UPLOADS_DIR / clean_name
    if file_path.exists() and file_path.is_file():
        return file_path
    return None

