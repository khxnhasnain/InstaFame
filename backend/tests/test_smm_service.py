import os
import sys
from pathlib import Path
import pytest
from unittest.mock import patch, MagicMock

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from main import app
from db import db
from services.smm_service import place_smm_order, get_smm_order_status

client = TestClient(app)

TEST_USER_EMAIL = "smm_tester_user@viralora.com"


@pytest.fixture(autouse=True)
def setup_test_user():
    # Ensure test user exists with known wallet balance
    db.sync_login_user(
        user_id="usr_smm_tester",
        email=TEST_USER_EMAIL,
        name="SMM Tester",
        role="user"
    )
    # Set known balance of ₹200.00
    db.add_wallet_balance(TEST_USER_EMAIL, 200.0, description="Test Setup Balance")
    yield
    # Reset balance after test
    current = db.get_user_wallet(TEST_USER_EMAIL)
    if current > 0:
        db.deduct_wallet_balance(TEST_USER_EMAIL, current)


def test_place_smm_order_validations():
    # Empty link should fail
    success, order_id, err = place_smm_order("8393", "", 100)
    assert success is False
    assert "Target Instagram profile link is required" in err

    # 0 quantity should fail
    success, order_id, err = place_smm_order("8393", "https://instagram.com/user", 0)
    assert success is False
    assert "quantity must be greater than 0" in err


def test_place_smm_order_mock_success():
    mock_response = MagicMock()
    mock_response.read.return_value = b'{"order": 892341}'
    mock_response.__enter__.return_value = mock_response

    with patch("urllib.request.urlopen", return_value=mock_response):
        success, order_id, err = place_smm_order(
            service_id="8393",
            link="https://www.instagram.com/cristiano/",
            quantity=100
        )
        assert success is True
        assert order_id == "892341"
        assert err is None


def test_place_smm_order_mock_provider_error():
    mock_response = MagicMock()
    mock_response.read.return_value = b'{"error": "Not enough funds on balance"}'
    mock_response.__enter__.return_value = mock_response

    with patch("urllib.request.urlopen", return_value=mock_response):
        success, order_id, err = place_smm_order(
            service_id="8393",
            link="https://www.instagram.com/cristiano/",
            quantity=5000
        )
        assert success is False
        assert order_id is None
        assert "Not enough funds on balance" in err


def test_boost_order_insufficient_wallet_balance():
    # Attempt order requiring more than current wallet balance
    payload = {
        "user_email": TEST_USER_EMAIL,
        "service_type": "followers",
        "target_username": "test_account",
        "package_amount": 10000,
        "price": 5000.00,  # exceeds ₹200.00
    }
    response = client.post("/api/orders", json=payload)
    assert response.status_code == 400
    assert "Insufficient wallet balance" in response.json()["detail"]


def test_boost_followers_provider_error_does_not_deduct_wallet():
    initial_balance = db.get_user_wallet(TEST_USER_EMAIL)

    mock_response = MagicMock()
    mock_response.read.return_value = b'{"error": "Service 8393 is currently unavailable"}'
    mock_response.__enter__.return_value = mock_response

    with patch("urllib.request.urlopen", return_value=mock_response):
        payload = {
            "user_email": TEST_USER_EMAIL,
            "service_type": "followers",
            "target_username": "target_creator",
            "package_amount": 50,
            "price": 4.00,  # Platform price
        }
        response = client.post("/api/orders", json=payload)
        assert response.status_code == 400
        assert "SMM Provider Error" in response.json()["detail"]

        # Balance MUST remain untouched
        after_balance = db.get_user_wallet(TEST_USER_EMAIL)
        assert after_balance == initial_balance


def test_boost_followers_success_deducts_platform_price():
    initial_balance = db.get_user_wallet(TEST_USER_EMAIL)
    platform_price = 80.00  # Our defined package price for 1k followers

    mock_response = MagicMock()
    mock_response.read.return_value = b'{"order": 999123}'
    mock_response.__enter__.return_value = mock_response

    with patch("urllib.request.urlopen", return_value=mock_response):
        payload = {
            "user_email": TEST_USER_EMAIL,
            "service_type": "followers",
            "target_username": "real_creator",
            "package_amount": 1000,
            "package_label": "1K Followers",
            "price": platform_price,
        }
        response = client.post("/api/orders", json=payload)
        assert response.status_code == 200
        data = response.json()["data"]

        # Real SMM order id recorded
        assert data["smm_order_id"] == "999123"
        # User charged our platform price
        assert data["price"] == platform_price

        # Wallet balance deducted by platform price
        after_balance = db.get_user_wallet(TEST_USER_EMAIL)
        assert round(after_balance, 2) == round(initial_balance - platform_price, 2)
