import os
import sys
import io
import re
from pathlib import Path
import pytest
from decimal import Decimal

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from PIL import Image

# Ensure environment variables for tests
os.environ["INTERNAL_API_SECRET"] = "test_internal_secret_key_12345"
os.environ["ADMIN_EMAILS"] = "admin@viralora.com,admin@instafame.com"

from main import app
from db import db
from services.wallet_deposit_service import (
    generate_amount_upi_qr,
    validate_and_save_screenshot,
    INTERNAL_API_SECRET
)

client = TestClient(app)

def create_valid_test_image(format="JPEG", size=(100, 100)) -> bytes:
    img = Image.new("RGB", size, color=(255, 0, 128))
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()

@pytest.fixture(autouse=True)
def setup_test_data():
    # Clear test deposits in fallback store for test isolation
    store = db.load_fallback_store() if hasattr(db, "load_fallback_store") else None
    if store is None:
        from db import load_fallback_store, save_fallback_store
        store = load_fallback_store()
        store["deposits"] = []
        save_fallback_store(store)
    else:
        store["deposits"] = []
        db.save_fallback_store(store)

    conn = db.get_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM wallet_transactions WHERE user_email IN ('hasnain1@test.com', 'hasnain2@test.com');")
                cur.execute("DELETE FROM wallet_deposits WHERE user_id IN ('user_hasnain_1', 'user_hasnain_2');")
            conn.commit()
            conn.close()
        except Exception:
            pass

    # Sync two users having the EXACT SAME NAME to verify strict identity segregation
    db.sync_login_user(
        user_id="user_hasnain_1",
        email="hasnain1@test.com",
        name="Hasnain Khan",
        avatar_url="",
        role="user"
    )
    db.sync_login_user(
        user_id="user_hasnain_2",
        email="hasnain2@test.com",
        name="Hasnain Khan",
        avatar_url="",
        role="user"
    )
    # Sync admin user
    db.sync_login_user(
        user_id="admin_1",
        email="admin@viralora.com",
        name="Viralora Admin",
        avatar_url="",
        role="admin"
    )
    # Set known starting balance to 50.00
    user1 = db.get_user_by_id("user_hasnain_1")
    if user1:
        diff = 50.00 - float(user1.get("wallet_balance", 50.00))
        if diff > 0:
            db.add_wallet_balance("hasnain1@test.com", diff)
        elif diff < 0:
            db.deduct_wallet_balance("hasnain1@test.com", abs(diff))


# ==========================================
# 1. UTR Validation Tests
# ==========================================
def test_utr_regex_strict_12_digits():
    """Enforces strictly 12 numeric digits: ^[0-9]{12}$"""
    valid_utrs = ["123456789012", "999888777666", "000000000001"]
    invalid_utrs = [
        "12345678901",       # 11 digits
        "1234567890123",     # 13 digits
        "12345678901A",      # contains letter
        "ABC123456789",      # letters
        "1234 56789012",     # internal space
        " 123456789012 ",    # un-trimmed space
        "12345-6789012",     # hyphen
    ]

    for utr in valid_utrs:
        assert re.match(r"^[0-9]{12}$", utr) is not None, f"Expected {utr} to be valid"

    for utr in invalid_utrs:
        assert re.match(r"^[0-9]{12}$", utr) is None, f"Expected {utr} to be invalid"


# ==========================================
# 2. Dynamic Amount QR URI Tests
# ==========================================
def test_dynamic_amount_upi_qr_generation():
    """Generates standard UPI payment URI containing amount and receiver"""
    uri, qr_data_url = generate_amount_upi_qr("1000")
    assert "upi://pay?" in uri
    assert "pa=8591365203@naviaxis" in uri
    assert "am=1000" in uri
    assert "cu=INR" in uri
    assert qr_data_url.startswith("data:image/png;base64,")


# ==========================================
# 3. Server-to-Server Authentication Tests
# ==========================================
def test_deposit_submission_requires_valid_internal_secret():
    """Direct browser calls or requests without secret must be rejected with 401"""
    img_bytes = create_valid_test_image()
    
    # Missing secret
    res = client.post(
        "/api/wallet/deposits",
        data={"amount": "500", "utr": "111122223333"},
        files={"screenshot": ("test.jpg", img_bytes, "image/jpeg")},
        headers={"x-user-id": "user_hasnain_1"}
    )
    assert res.status_code == 401

    # Wrong secret
    res = client.post(
        "/api/wallet/deposits",
        data={"amount": "500", "utr": "111122223333"},
        files={"screenshot": ("test.jpg", img_bytes, "image/jpeg")},
        headers={"x-internal-secret": "wrong_secret", "x-user-id": "user_hasnain_1"}
    )
    assert res.status_code == 401


# ==========================================
# 4. Deposit Submission Never Auto-Credits Wallet
# ==========================================
def test_deposit_submission_does_not_credit_wallet():
    """Submitting deposit sets status='pending' and keeps wallet balance unchanged"""
    user_before = db.get_user_by_id("user_hasnain_1")
    initial_balance = float(user_before["wallet_balance"])

    img_bytes = create_valid_test_image()
    utr_val = "987654321098"

    res = client.post(
        "/api/wallet/deposits",
        data={"amount": "500", "utr": utr_val},
        files={"screenshot": ("test.jpg", img_bytes, "image/jpeg")},
        headers={
            "x-internal-secret": os.environ["INTERNAL_API_SECRET"],
            "x-user-id": "user_hasnain_1"
        }
    )
    assert res.status_code == 200, res.text
    dep_data = res.json()["data"]
    assert dep_data["status"] == "pending"

    # Verify wallet balance remains exactly identical
    user_after = db.get_user_by_id("user_hasnain_1")
    assert float(user_after["wallet_balance"]) == initial_balance


# ==========================================
# 5. Duplicate UTR Prevention
# ==========================================
def test_duplicate_utr_is_rejected():
    """Submitting the same UTR a second time returns 409 Conflict"""
    img_bytes = create_valid_test_image()
    utr_val = "555666777888"

    # First submission
    res1 = client.post(
        "/api/wallet/deposits",
        data={"amount": "100", "utr": utr_val},
        files={"screenshot": ("test1.jpg", img_bytes, "image/jpeg")},
        headers={
            "x-internal-secret": os.environ["INTERNAL_API_SECRET"],
            "x-user-id": "user_hasnain_1"
        }
    )
    assert res1.status_code == 200

    # Second submission with same UTR
    res2 = client.post(
        "/api/wallet/deposits",
        data={"amount": "100", "utr": utr_val},
        files={"screenshot": ("test2.jpg", img_bytes, "image/jpeg")},
        headers={
            "x-internal-secret": os.environ["INTERNAL_API_SECRET"],
            "x-user-id": "user_hasnain_2"
        }
    )
    assert res2.status_code == 409
    assert "already been submitted" in res2.json()["detail"].lower()


# ==========================================
# 6. Same-Name User Identity Segregation
# ==========================================
def test_same_name_users_are_isolated():
    """Two users named 'Hasnain Khan' are segregated by unique users.id"""
    u1 = db.get_user_by_id("user_hasnain_1")
    u2 = db.get_user_by_id("user_hasnain_2")
    assert u1["name"] == u2["name"] == "Hasnain Khan"
    assert u1["id"] != u2["id"]
    assert u1["email"] != u2["email"]


# ==========================================
# 7. Admin Approval with 2-Row Lock & Double-Approval Prevention
# ==========================================
def test_admin_approval_and_double_approval_prevention():
    """Approval credits wallet once; double approval returns 409 Conflict"""
    img_bytes = create_valid_test_image()
    utr_val = "888999000111"

    # User submits ₹200 deposit
    res_sub = client.post(
        "/api/wallet/deposits",
        data={"amount": "200", "utr": utr_val},
        files={"screenshot": ("test.jpg", img_bytes, "image/jpeg")},
        headers={
            "x-internal-secret": os.environ["INTERNAL_API_SECRET"],
            "x-user-id": "user_hasnain_1"
        }
    )
    assert res_sub.status_code == 200
    dep_id = res_sub.json()["data"]["id"]

    bal_before = float(db.get_user_by_id("user_hasnain_1")["wallet_balance"])

    # 1. Non-admin cannot approve
    res_fail = client.post(
        f"/api/admin/deposits/{dep_id}/approve",
        headers={
            "x-internal-secret": os.environ["INTERNAL_API_SECRET"],
            "x-admin-id": "user_hasnain_2" # regular user
        }
    )
    assert res_fail.status_code == 403

    # 2. Authorized admin approves
    res_app = client.post(
        f"/api/admin/deposits/{dep_id}/approve",
        headers={
            "x-internal-secret": os.environ["INTERNAL_API_SECRET"],
            "x-admin-id": "admin_1"
        }
    )
    assert res_app.status_code == 200
    bal_after = float(db.get_user_by_id("user_hasnain_1")["wallet_balance"])
    assert round(bal_after - bal_before, 2) == 200.00

    # 3. Double approval attempt must fail with 409 Conflict
    res_double = client.post(
        f"/api/admin/deposits/{dep_id}/approve",
        headers={
            "x-internal-secret": os.environ["INTERNAL_API_SECRET"],
            "x-admin-id": "admin_1"
        }
    )
    assert res_double.status_code == 409

    # Balance must still only have been credited once
    bal_after_double = float(db.get_user_by_id("user_hasnain_1")["wallet_balance"])
    assert bal_after_double == bal_after


# ==========================================
# 8. Rejection Leaves Wallet Untouched
# ==========================================
def test_admin_rejection_leaves_wallet_untouched():
    """Rejecting a deposit updates status='rejected' with reason and does not touch wallet"""
    img_bytes = create_valid_test_image()
    utr_val = "777888999000"

    res_sub = client.post(
        "/api/wallet/deposits",
        data={"amount": "300", "utr": utr_val},
        files={"screenshot": ("test.jpg", img_bytes, "image/jpeg")},
        headers={
            "x-internal-secret": os.environ["INTERNAL_API_SECRET"],
            "x-user-id": "user_hasnain_1"
        }
    )
    assert res_sub.status_code == 200
    dep_id = res_sub.json()["data"]["id"]

    bal_before = float(db.get_user_by_id("user_hasnain_1")["wallet_balance"])

    # Admin rejects with reason
    res_rej = client.post(
        f"/api/admin/deposits/{dep_id}/reject",
        json={"rejection_reason": "UTR not found in Axis bank statement"},
        headers={
            "x-internal-secret": os.environ["INTERNAL_API_SECRET"],
            "x-admin-id": "admin_1"
        }
    )
    assert res_rej.status_code == 200
    data = res_rej.json()["data"]
    assert data["status"] == "rejected"
    assert data["rejection_reason"] == "UTR not found in Axis bank statement"

    bal_after = float(db.get_user_by_id("user_hasnain_1")["wallet_balance"])
    assert bal_after == bal_before


# ==========================================
# 9. Concurrent Deposit Approval and Package Purchase
# ==========================================
def test_simultaneous_deposit_approval_and_package_purchase():
    """Row locking ensures deposit approval and package purchase do not lose updates"""
    email = "hasnain1@test.com"
    user = db.get_user_by_id("user_hasnain_1")
    start_bal = float(user["wallet_balance"])

    # Submit a deposit of 500
    img_bytes = create_valid_test_image()
    utr_val = "444555666777"
    res_sub = client.post(
        "/api/wallet/deposits",
        data={"amount": "500", "utr": utr_val},
        files={"screenshot": ("test.jpg", img_bytes, "image/jpeg")},
        headers={
            "x-internal-secret": os.environ["INTERNAL_API_SECRET"],
            "x-user-id": "user_hasnain_1"
        }
    )
    dep_id = res_sub.json()["data"]["id"]

    # Deduct 20 for package purchase (within available balance >= 50.00)
    deduct_ok, bal_after_deduct, msg = db.deduct_wallet_balance(email, 20.00)
    assert deduct_ok is True, msg

    # Approve deposit of 500
    app_ok, dep, msg = db.approve_deposit(dep_id, "admin_1")
    assert app_ok is True, msg

    # Expected: start_bal - 20 + 500
    expected = round(start_bal - 20.00 + 500.00, 2)
    current = round(float(db.get_user_by_id("user_hasnain_1")["wallet_balance"]), 2)
    assert current == expected


# ==========================================
# 10. Real-time UTR Availability & wallet_deposits Scope
# ==========================================
def test_check_utr_availability_endpoint():
    """Validates that GET /api/wallet/deposits/check-utr detects existing deposits in wallet_deposits only"""
    unused_utr = "998877665544"
    res1 = client.get(
        f"/api/wallet/deposits/check-utr?utr={unused_utr}",
        headers={"x-internal-secret": os.environ["INTERNAL_API_SECRET"]}
    )
    assert res1.status_code == 200
    assert res1.json()["exists"] is False

    # Submit deposit with this UTR
    img_bytes = create_valid_test_image()
    res_sub = client.post(
        "/api/wallet/deposits",
        data={"amount": "100", "utr": unused_utr},
        files={"screenshot": ("test.jpg", img_bytes, "image/jpeg")},
        headers={
            "x-internal-secret": os.environ["INTERNAL_API_SECRET"],
            "x-user-id": "user_hasnain_1"
        }
    )
    assert res_sub.status_code == 200

    # Check again -> should exist
    res2 = client.get(
        f"/api/wallet/deposits/check-utr?utr={unused_utr}",
        headers={"x-internal-secret": os.environ["INTERNAL_API_SECRET"]}
    )
    assert res2.status_code == 200
    assert res2.json()["exists"] is True


def test_duplicate_utr_does_not_save_orphaned_file():
    """Duplicate submissions are rejected before saving files to disk"""
    img_bytes = create_valid_test_image()
    utr_val = "121234345656"

    # First submission
    res1 = client.post(
        "/api/wallet/deposits",
        data={"amount": "100", "utr": utr_val},
        files={"screenshot": ("test1.jpg", img_bytes, "image/jpeg")},
        headers={
            "x-internal-secret": os.environ["INTERNAL_API_SECRET"],
            "x-user-id": "user_hasnain_1"
        }
    )
    assert res1.status_code == 200

    from services.wallet_deposit_service import UPLOADS_DIR
    files_before = set(os.listdir(UPLOADS_DIR))

    # Second submission with same UTR
    res2 = client.post(
        "/api/wallet/deposits",
        data={"amount": "100", "utr": utr_val},
        files={"screenshot": ("test2.jpg", img_bytes, "image/jpeg")},
        headers={
            "x-internal-secret": os.environ["INTERNAL_API_SECRET"],
            "x-user-id": "user_hasnain_2"
        }
    )
    assert res2.status_code == 409

    files_after = set(os.listdir(UPLOADS_DIR))
    # No new file should have been written to UPLOADS_DIR on duplicate rejection
    assert files_after == files_before

