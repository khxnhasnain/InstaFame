import os
import json
import logging
import urllib.request
import urllib.parse
from typing import Optional, Dict, Any, Tuple

logger = logging.getLogger(__name__)

SMM_API_URL = os.environ.get("SMM_API_URL", "https://smmvault.in/api/v2")
SMM_API_KEY = os.environ.get("SMM_API_KEY", "9ffa626994b11648cedd29c2b6cf5af04bdf7554")
DEFAULT_FOLLOWERS_SERVICE_ID = os.environ.get("SMM_FOLLOWERS_SERVICE_ID", "8393")
DEFAULT_LIKES_SERVICE_ID = os.environ.get("SMM_LIKES_SERVICE_ID", "7672")
DEFAULT_REEL_VIEWS_SERVICE_ID = os.environ.get("SMM_REEL_VIEWS_SERVICE_ID", "7685")


def place_smm_order(
    service_id: str,
    link: str,
    quantity: int,
    custom_comments: Optional[str] = None
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Submits an order to the SMM provider (SMMVault).
    
    Returns:
        (success: bool, smm_order_id: Optional[str], error_message: Optional[str])
    """
    if not SMM_API_KEY:
        return False, None, "SMM Provider API key is not configured."

    if not link or not link.strip():
        return False, None, "Target post or profile link is required."

    if quantity <= 0:
        return False, None, "Order quantity must be greater than 0."

    # Build form-encoded payload for SMM panel
    payload = {
        "key": SMM_API_KEY.strip(),
        "action": "add",
        "service": str(service_id).strip(),
        "link": link.strip(),
        "quantity": str(quantity),
    }

    if custom_comments:
        payload["comments"] = custom_comments

    try:
        encoded_data = urllib.parse.urlencode(payload).encode("utf-8")
        req = urllib.request.Request(
            SMM_API_URL,
            data=encoded_data,
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "Viralora-SMM-Engine/1.0",
            },
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=20) as response:
            response_text = response.read().decode("utf-8")
            logger.info(f"SMM API Response for service {service_id}: {response_text}")

            try:
                res_data = json.loads(response_text)
            except json.JSONDecodeError:
                return False, None, f"Invalid JSON response from SMM provider: {response_text[:200]}"

            if isinstance(res_data, dict):
                # Standard SMM success response: {"order": 123456}
                if "order" in res_data and res_data["order"]:
                    return True, str(res_data["order"]), None

                # Error response: {"error": "Not enough funds on balance"}
                if "error" in res_data:
                    return False, None, str(res_data["error"])

            return False, None, f"Unexpected response from SMM provider: {response_text[:200]}"

    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        logger.error(f"SMM API HTTP error {e.code}: {err_body}")
        return False, None, f"SMM provider HTTP {e.code}: {err_body[:200]}"
    except urllib.error.URLError as e:
        logger.error(f"SMM API connection error: {e.reason}")
        return False, None, f"Failed to reach SMM provider: {e.reason}"
    except Exception as e:
        logger.error(f"SMM API unexpected error: {str(e)}")
        return False, None, f"SMM provider order failure: {str(e)}"


def get_smm_order_status(smm_order_id: str) -> Optional[Dict[str, Any]]:
    """
    Checks the status of an existing order on SMMVault.
    
    Returns:
        Dict containing status, start_count, remains, etc. or None on failure.
    """
    if not SMM_API_KEY or not smm_order_id:
        return None

    payload = {
        "key": SMM_API_KEY.strip(),
        "action": "status",
        "order": str(smm_order_id).strip(),
    }

    try:
        encoded_data = urllib.parse.urlencode(payload).encode("utf-8")
        req = urllib.request.Request(
            SMM_API_URL,
            data=encoded_data,
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "Viralora-SMM-Engine/1.0",
            },
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=15) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            if isinstance(res_data, dict) and "status" in res_data:
                return res_data
            return None
    except Exception as e:
        logger.error(f"Failed to check SMM order status for {smm_order_id}: {str(e)}")
        return None
