import os
import json
import time
import re
import threading
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, date
from typing import Dict, Any, List, Optional, Tuple

from pathlib import Path

_db_lock = threading.Lock()

try:
    import pymysql
    import pymysql.cursors
    PYMYSQL_AVAILABLE = True
except ImportError:
    PYMYSQL_AVAILABLE = False

# MySQL Configuration from Environment (default to XAMPP)
MYSQL_HOST = os.environ.get("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = int(os.environ.get("MYSQL_PORT", 3306))
MYSQL_USER = os.environ.get("MYSQL_USER", "root")
MYSQL_PASSWORD = os.environ.get("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.environ.get("MYSQL_DATABASE", "Viralora_db")

FALLBACK_STORE_FILE = Path(__file__).resolve().parent / "fallback_db.json"

DEFAULT_RATES = {
    "id": "global_rates",
    "rate_per_1000_followers": 80.00,
    "rate_per_1000_likes": 40.00,
    "rate_per_1000_views": 20.00,
    "currency": "INR"
}

def generate_default_packages(rate_followers: float = 80.00, rate_likes: float = 40.00, rate_views: float = 20.00) -> List[Dict[str, Any]]:
    return [
        # Followers Packages: 1k, 10k, 100k, 1M
        {
            "id": "pkg_followers_1k",
            "service_type": "followers",
            "amount": 1000,
            "label": "1K Followers",
            "price": round((1000 / 1000.0) * rate_followers, 2),
            "currency": "INR",
            "popular": False,
            "tag": "Starter Growth",
            "is_active": True
        },
        {
            "id": "pkg_followers_10k",
            "service_type": "followers",
            "amount": 10000,
            "label": "10K Followers",
            "price": round((10000 / 1000.0) * rate_followers * 0.95, 2), # 5% discount
            "currency": "INR",
            "popular": True,
            "tag": "Most Popular",
            "is_active": True
        },
        {
            "id": "pkg_followers_100k",
            "service_type": "followers",
            "amount": 100000,
            "label": "100K Followers",
            "price": round((100000 / 1000.0) * rate_followers * 0.90, 2), # 10% discount
            "currency": "INR",
            "popular": False,
            "tag": "Pro Creator",
            "is_active": True
        },
        {
            "id": "pkg_followers_1m",
            "service_type": "followers",
            "amount": 1000000,
            "label": "1M Followers",
            "price": round((1000000 / 1000.0) * rate_followers * 0.80, 2), # 20% discount
            "currency": "INR",
            "popular": False,
            "tag": "Celebrity Fame",
            "is_active": True
        },

        # Likes Packages: 1k, 10k, 100k, 1M
        {
            "id": "pkg_likes_1k",
            "service_type": "likes",
            "amount": 1000,
            "label": "1K Likes",
            "price": round((1000 / 1000.0) * rate_likes, 2),
            "currency": "INR",
            "popular": False,
            "tag": "Starter Boost",
            "is_active": True
        },
        {
            "id": "pkg_likes_10k",
            "service_type": "likes",
            "amount": 10000,
            "label": "10K Likes",
            "price": round((10000 / 1000.0) * rate_likes * 0.95, 2), # 5% discount
            "currency": "INR",
            "popular": True,
            "tag": "Most Popular",
            "is_active": True
        },
        {
            "id": "pkg_likes_100k",
            "service_type": "likes",
            "amount": 100000,
            "label": "100K Likes",
            "price": round((100000 / 1000.0) * rate_likes * 0.90, 2), # 10% discount
            "currency": "INR",
            "popular": False,
            "tag": "Viral Hit",
            "is_active": True
        },
        {
            "id": "pkg_likes_1m",
            "service_type": "likes",
            "amount": 1000000,
            "label": "1M Likes",
            "price": round((1000000 / 1000.0) * rate_likes * 0.80, 2), # 20% discount
            "currency": "INR",
            "popular": False,
            "tag": "Explore Sensation",
            "is_active": True
        },

        # Reel Views Packages: 1k, 10k, 100k, 1M
        {
            "id": "pkg_views_1k",
            "service_type": "views",
            "amount": 1000,
            "label": "1K Reel Views",
            "price": round((1000 / 1000.0) * rate_views, 2),
            "currency": "INR",
            "popular": False,
            "tag": "Starter Views",
            "is_active": True
        },
        {
            "id": "pkg_views_10k",
            "service_type": "views",
            "amount": 10000,
            "label": "10K Reel Views",
            "price": round((10000 / 1000.0) * rate_views * 0.95, 2), # 5% discount
            "currency": "INR",
            "popular": True,
            "tag": "Most Popular",
            "is_active": True
        },
        {
            "id": "pkg_views_100k",
            "service_type": "views",
            "amount": 100000,
            "label": "100K Reel Views",
            "price": round((100000 / 1000.0) * rate_views * 0.90, 2), # 10% discount
            "currency": "INR",
            "popular": False,
            "tag": "Viral Reel",
            "is_active": True
        },
        {
            "id": "pkg_views_1m",
            "service_type": "views",
            "amount": 1000000,
            "label": "1M Reel Views",
            "price": round((1000000 / 1000.0) * rate_views * 0.80, 2), # 20% discount
            "currency": "INR",
            "popular": False,
            "tag": "Explore Sensation",
            "is_active": True
        },
    ]

def load_fallback_store() -> Dict[str, Any]:
    if FALLBACK_STORE_FILE.exists():
        try:
            with open(FALLBACK_STORE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    store = {
        "rates": DEFAULT_RATES,
        "packages": generate_default_packages(),
        "users": [],
        "orders": [],
        "transactions": [],
        "deposits": []
    }
    save_fallback_store(store)
    return store

def save_fallback_store(store: Dict[str, Any]):
    try:
        with open(FALLBACK_STORE_FILE, "w", encoding="utf-8") as f:
            json.dump(store, f, indent=2, default=str)
    except Exception as e:
        print(f"Fallback DB save notice: {e}")

class DatabaseManager:
    def __init__(self):
        self._is_mysql_connected = False
        self._last_check_time = 0

    def get_connection(self):
        if not PYMYSQL_AVAILABLE:
            return None

        now = time.time()
        if not self._is_mysql_connected and (now - self._last_check_time < 5):
            return None
        self._last_check_time = now

        try:
            # Connect and ensure DB exists
            server_conn = pymysql.connect(
                host=MYSQL_HOST,
                port=MYSQL_PORT,
                user=MYSQL_USER,
                password=MYSQL_PASSWORD,
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=1
            )
            with server_conn.cursor() as cursor:
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DATABASE}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            server_conn.close()

            conn = pymysql.connect(
                host=MYSQL_HOST,
                port=MYSQL_PORT,
                user=MYSQL_USER,
                password=MYSQL_PASSWORD,
                database=MYSQL_DATABASE,
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=1,
                autocommit=True
            )
            self._is_mysql_connected = True
            return conn
        except Exception as e:
            self._is_mysql_connected = False
            return None

    def init_tables(self):
        conn = self.get_connection()
        if not conn:
            self._is_mysql_connected = False
            return False

        try:
            with conn.cursor() as cursor:
                # 1. Packages table
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS `packages` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `package_key` VARCHAR(128) UNIQUE NOT NULL,
                    `service_type` VARCHAR(32) NOT NULL,
                    `amount` INT NOT NULL,
                    `label` VARCHAR(128) NOT NULL,
                    `price` DECIMAL(10, 2) NOT NULL,
                    `currency` VARCHAR(16) DEFAULT 'INR',
                    `popular` BOOLEAN DEFAULT FALSE,
                    `tag` VARCHAR(64) DEFAULT '',
                    `is_active` BOOLEAN DEFAULT TRUE,
                    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)

                # 2. Users table
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS `users` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `auth_uid` VARCHAR(128) UNIQUE NOT NULL,
                    `email` VARCHAR(255) UNIQUE NOT NULL,
                    `name` VARCHAR(255) DEFAULT '',
                    `avatar_url` TEXT,
                    `provider` VARCHAR(64) DEFAULT 'google',
                    `role` VARCHAR(32) DEFAULT 'user',
                    `total_orders_count` INT DEFAULT 0,
                    `wallet_balance` DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
                    `last_login` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)

                try:
                    cursor.execute("ALTER TABLE `users` ADD COLUMN `wallet_balance` DECIMAL(10, 2) NOT NULL DEFAULT 50.00;")
                except Exception:
                    pass

                # 3. Wallet Transactions History table (Credits & Debits)
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS `wallet_transactions` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `transaction_id` VARCHAR(64) UNIQUE NOT NULL,
                    `user_email` VARCHAR(255) NOT NULL,
                    `type` VARCHAR(32) NOT NULL,
                    `amount` DECIMAL(10, 2) NOT NULL,
                    `balance_after` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                    `service_type` VARCHAR(64) DEFAULT 'wallet_topup',
                    `description` VARCHAR(255) NOT NULL,
                    `reference_id` VARCHAR(64) DEFAULT '',
                    `status` VARCHAR(32) DEFAULT 'successful',
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)

                # 4. Manual UPI Wallet Deposits table
                # user_id stores user's auth_uid
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS `wallet_deposits` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `deposit_id` VARCHAR(64) UNIQUE NOT NULL,
                    `user_id` VARCHAR(128) NOT NULL,
                    `amount` DECIMAL(10, 2) NOT NULL,
                    `utr` VARCHAR(12) NOT NULL UNIQUE,
                    `payment_screenshot` VARCHAR(255) NOT NULL,
                    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
                    `rejection_reason` VARCHAR(500) DEFAULT NULL,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    `approved_at` TIMESTAMP NULL DEFAULT NULL,
                    `approved_by` VARCHAR(255) DEFAULT NULL,
                    `rejected_at` TIMESTAMP NULL DEFAULT NULL,
                    `rejected_by` VARCHAR(255) DEFAULT NULL,
                    INDEX `idx_dep_user_id` (`user_id`),
                    INDEX `idx_dep_status` (`status`),
                    INDEX `idx_dep_utr` (`utr`),
                    INDEX `idx_dep_created_at` (`created_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)

                # Add index on wallet_transactions for fast idempotent checks on deposit approvals
                try:
                    cursor.execute("ALTER TABLE `wallet_transactions` ADD INDEX `idx_txn_service_ref` (`service_type`, `reference_id`);")
                except Exception:
                    pass

                rf = 80.00
                rl = 40.00
                rv = 20.00

                # Seed initial packages only if not already present (do not overwrite admin custom price)
                for pkg in generate_default_packages(rf, rl, rv):
                    cursor.execute("""
                    INSERT INTO `packages` (`package_key`, `service_type`, `amount`, `label`, `price`, `currency`, `popular`, `tag`, `is_active`)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        `amount` = VALUES(`amount`),
                        `label` = VALUES(`label`),
                        `currency` = VALUES(`currency`),
                        `popular` = VALUES(`popular`),
                        `tag` = VALUES(`tag`);
                    """, (
                        pkg["id"], pkg["service_type"], pkg["amount"], pkg["label"],
                        pkg["price"], pkg["currency"], pkg["popular"], pkg["tag"], pkg["is_active"]
                    ))

                # Delete legacy non-standard or duplicate packages
                cursor.execute("""
                DELETE FROM `packages` WHERE `package_key` NOT IN (
                    'pkg_followers_1k', 'pkg_followers_10k', 'pkg_followers_100k', 'pkg_followers_1m',
                    'pkg_likes_1k', 'pkg_likes_10k', 'pkg_likes_100k', 'pkg_likes_1m',
                    'pkg_views_1k', 'pkg_views_10k', 'pkg_views_100k', 'pkg_views_1m'
                );
                """)

            conn.close()
            self._is_mysql_connected = True
            return True
        except Exception as e:
            print(f"MySQL Table Init notice: {e}")
            if conn:
                conn.close()
            self._is_mysql_connected = False
            return False

    def is_connected(self) -> bool:
        now = time.time()
        if now - self._last_check_time > 5:
            self._last_check_time = now
            conn = self.get_connection()
            if conn:
                self._is_mysql_connected = True
                conn.close()
            else:
                self._is_mysql_connected = False
        return self._is_mysql_connected

    # --- Master Rates (Per 1,000 Followers, Likes & Views) ---
    def get_pricing_rates(self) -> Dict[str, Any]:
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT `id`, `package_key`, `price` FROM `packages` WHERE `package_key` IN ('pkg_followers_1k', 'pkg_likes_1k', 'pkg_views_1k');")
                    rows = cursor.fetchall()
                    conn.close()
                    rf = 80.0
                    rl = 40.0
                    rv = 20.0
                    for r in rows:
                        pkey = r.get("package_key")
                        if pkey == "pkg_followers_1k":
                            rf = float(r["price"])
                        elif pkey == "pkg_likes_1k":
                            rl = float(r["price"])
                        elif pkey == "pkg_views_1k":
                            rv = float(r["price"])
                    return {
                        "rate_per_1000_followers": rf,
                        "rate_per_1000_likes": rl,
                        "rate_per_1000_views": rv,
                        "currency": "INR"
                    }
            except Exception as e:
                print(f"MySQL get_pricing_rates notice: {e}")
                if conn:
                    conn.close()

        store = load_fallback_store()
        return store.get("rates", DEFAULT_RATES)

    def update_pricing_rates(self, rate_followers: float, rate_likes: float, rate_views: float = 20.00, auto_update_packages: bool = True) -> Dict[str, Any]:
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    new_pkgs = generate_default_packages(rate_followers, rate_likes, rate_views)
                    for p in new_pkgs:
                        cursor.execute("""
                        INSERT INTO `packages` (`package_key`, `service_type`, `amount`, `label`, `price`, `currency`, `popular`, `tag`, `is_active`)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE
                            `price` = VALUES(`price`),
                            `amount` = VALUES(`amount`),
                            `label` = VALUES(`label`),
                            `currency` = VALUES(`currency`),
                            `tag` = VALUES(`tag`),
                            `popular` = VALUES(`popular`);
                        """, (
                            p["id"], p["service_type"], p["amount"], p["label"],
                            p["price"], p["currency"], p["popular"], p["tag"], p["is_active"]
                        ))
                    conn.commit()
                conn.close()
                return {"rate_per_1000_followers": rate_followers, "rate_per_1000_likes": rate_likes, "rate_per_1000_views": rate_views, "currency": "INR"}
            except Exception as e:
                print(f"MySQL update_pricing_rates notice: {e}")
                if conn:
                    conn.close()

        # Fallback store
        store = load_fallback_store()
        store["rates"] = {"id": "global_rates", "rate_per_1000_followers": rate_followers, "rate_per_1000_likes": rate_likes, "rate_per_1000_views": rate_views, "currency": "INR"}
        if auto_update_packages:
            store["packages"] = generate_default_packages(rate_followers, rate_likes, rate_views)
        save_fallback_store(store)
        return store["rates"]

    # --- Packages / Dynamic Pricing Management ---
    def get_packages(self, service_type: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    # Clean up any legacy non-pkg packages
                    cursor.execute("""
                    DELETE FROM `packages` WHERE `package_key` NOT IN (
                        'pkg_followers_1k', 'pkg_followers_10k', 'pkg_followers_100k', 'pkg_followers_1m',
                        'pkg_likes_1k', 'pkg_likes_10k', 'pkg_likes_100k', 'pkg_likes_1m',
                        'pkg_views_1k', 'pkg_views_10k', 'pkg_views_100k', 'pkg_views_1m'
                    );
                    """)

                    if service_type:
                        cursor.execute("SELECT * FROM `packages` WHERE `service_type` = %s AND `is_active` = TRUE ORDER BY `amount` ASC;", (service_type,))
                    else:
                        cursor.execute("SELECT * FROM `packages` WHERE `is_active` = TRUE ORDER BY `service_type`, `amount` ASC;")
                    rows = cursor.fetchall()
                    for r in rows:
                        r["id"] = int(r["id"])
                        r["package_key"] = r.get("package_key") or ""
                        r["price"] = float(r["price"])
                        r["popular"] = bool(r["popular"])
                        r["is_active"] = bool(r["is_active"])
                    conn.close()
                    if rows:
                        return rows
            except Exception as e:
                print(f"MySQL get_packages notice: {e}")
                if conn:
                    conn.close()

        # Fallback store
        store = load_fallback_store()
        pkgs = store.get("packages")
        if not pkgs:
            rates = self.get_pricing_rates()
            rf = float(rates.get("rate_per_1000_followers", 80.0))
            rl = float(rates.get("rate_per_1000_likes", 40.0))
            rv = float(rates.get("rate_per_1000_views", 20.0))
            pkgs = generate_default_packages(rf, rl, rv)
            store["packages"] = pkgs
            save_fallback_store(store)
        if service_type:
            return [p for p in pkgs if p.get("service_type") == service_type]
        return pkgs


    def update_package(self, package_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    fields = []
                    values = []
                    for k in ["price", "amount", "label", "popular", "tag", "is_active", "currency"]:
                        if k in updates:
                            fields.append(f"`{k}` = %s")
                            values.append(updates[k])
                    if fields:
                        values.extend([str(package_id), str(package_id)])
                        query = f"UPDATE `packages` SET {', '.join(fields)} WHERE `id` = %s OR `package_key` = %s;"
                        cursor.execute(query, tuple(values))
                        cursor.execute("SELECT * FROM `packages` WHERE `id` = %s OR `package_key` = %s;", (str(package_id), str(package_id)))
                        row = cursor.fetchone()
                        if row:
                            row["id"] = int(row["id"])
                            row["package_key"] = row.get("package_key") or ""
                            row["price"] = float(row["price"])
                            row["popular"] = bool(row["popular"])
                            row["is_active"] = bool(row["is_active"])
                            conn.close()
                            return row
                conn.close()
            except Exception as e:
                print(f"MySQL update_package notice: {e}")
                if conn:
                    conn.close()

        # Fallback store
        store = load_fallback_store()
        for idx, p in enumerate(store.get("packages", [])):
            if str(p.get("id")) == str(package_id) or str(p.get("package_key")) == str(package_id):
                store["packages"][idx].update(updates)
                save_fallback_store(store)
                return store["packages"][idx]
        return None

    # --- Wallet & Funds Management ---
    def get_user_wallet(self, email: str) -> float:
        clean_email = email.lower().strip()
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT `wallet_balance` FROM `users` WHERE `email` = %s;", (clean_email,))
                    row = cursor.fetchone()
                    conn.close()
                    if row and "wallet_balance" in row:
                        return float(row["wallet_balance"])
            except Exception as e:
                print(f"MySQL get_user_wallet notice: {e}")
                if conn:
                    conn.close()

        store = load_fallback_store()
        for u in store.get("users", []):
            if u.get("email") == clean_email:
                return float(u.get("wallet_balance", 50.00))
        return 50.00

    def add_wallet_balance(self, email: str, amount: float, description: str = "Wallet Top-Up / Recharge") -> Dict[str, Any]:
        clean_email = email.lower().strip()
        added_amount = max(0.0, float(amount))
        txn_id = f"TXN-{int(time.time() * 1000) % 10000000:07d}"
        created_at_str = datetime.now().isoformat()

        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    # Ensure user row exists in MySQL
                    cursor.execute("""
                    INSERT INTO `users` (`auth_uid`, `email`, `name`, `wallet_balance`, `provider`, `role`)
                    VALUES (%s, %s, %s, 50.00, 'google', 'user')
                    ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);
                    """, (f"usr_{clean_email.replace('@', '_').replace('.', '_')}", clean_email, clean_email.split('@')[0]))

                    cursor.execute("UPDATE `users` SET `wallet_balance` = `wallet_balance` + %s WHERE `email` = %s;", (added_amount, clean_email))
                    cursor.execute("SELECT `wallet_balance` FROM `users` WHERE `email` = %s;", (clean_email,))
                    row = cursor.fetchone()
                    new_bal = float(row["wallet_balance"]) if row else (50.00 + added_amount)

                    # Insert into wallet_transactions
                    cursor.execute("""
                    INSERT INTO `wallet_transactions` (
                        `transaction_id`, `user_email`, `type`, `amount`, `balance_after`,
                        `service_type`, `description`, `reference_id`, `status`
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
                    """, (
                        txn_id, clean_email, "credit", added_amount, new_bal,
                        "wallet_topup", description, txn_id, "successful"
                    ))
                    conn.commit()
                    conn.close()
                    return {
                        "id": txn_id,
                        "transaction_id": txn_id,
                        "email": clean_email,
                        "wallet_balance": new_bal,
                        "added_amount": added_amount,
                        "type": "credit",
                        "description": description,
                        "created_at": created_at_str
                    }
            except Exception as e:
                print(f"MySQL add_wallet_balance notice: {e}")
                if conn:
                    conn.close()

        store = load_fallback_store()
        current_balance = 50.00
        found = False
        for u in store.get("users", []):
            if u.get("email") == clean_email:
                u["wallet_balance"] = round(float(u.get("wallet_balance", 50.00)) + added_amount, 2)
                current_balance = u["wallet_balance"]
                found = True
                break
        if not found:
            user_obj = {
                "id": f"usr_{int(time.time())}",
                "auth_uid": f"usr_{int(time.time())}",
                "email": clean_email,
                "name": clean_email.split("@")[0],
                "avatar_url": "",
                "provider": "google",
                "role": "user",
                "total_orders_count": 0,
                "wallet_balance": round(50.00 + added_amount, 2),
                "created_at": created_at_str,
                "last_login": created_at_str
            }
            store["users"].append(user_obj)
            current_balance = user_obj["wallet_balance"]

        # Record in fallback transactions
        txns = store.setdefault("transactions", [])
        txn_obj = {
            "id": txn_id,
            "transaction_id": txn_id,
            "user_email": clean_email,
            "type": "credit",
            "amount": added_amount,
            "balance_after": current_balance,
            "service_type": "wallet_topup",
            "description": description,
            "reference_id": txn_id,
            "status": "successful",
            "created_at": created_at_str
        }
        txns.insert(0, txn_obj)
        save_fallback_store(store)
        return {
            "id": txn_id,
            "transaction_id": txn_id,
            "email": clean_email,
            "wallet_balance": current_balance,
            "added_amount": added_amount,
            "type": "credit",
            "description": description,
            "created_at": created_at_str
        }

    def deduct_wallet_balance(self, email: str, amount: float) -> Tuple[bool, float, str]:
        clean_email = email.lower().strip()
        deduct_amount = Decimal(str(amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        conn = self.get_connection()
        if conn:
            try:
                conn.autocommit(False)
                with conn.cursor() as cursor:
                    # Ensure user row exists in MySQL
                    cursor.execute("""
                    INSERT INTO `users` (`auth_uid`, `email`, `name`, `wallet_balance`, `provider`, `role`)
                    VALUES (%s, %s, %s, 50.00, 'google', 'user')
                    ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);
                    """, (f"usr_{clean_email.replace('@', '_').replace('.', '_')}", clean_email, clean_email.split('@')[0]))

                    # Lock user row FOR UPDATE to prevent race conditions with concurrent deposit approvals
                    cursor.execute("SELECT `wallet_balance` FROM `users` WHERE `email` = %s FOR UPDATE;", (clean_email,))
                    row = cursor.fetchone()
                    current_balance = Decimal(str(row["wallet_balance"])).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) if row else Decimal("50.00")

                    if current_balance < deduct_amount:
                        conn.rollback()
                        conn.close()
                        return False, float(current_balance), f"Insufficient wallet balance (₹{float(current_balance):.2f}). Required: ₹{float(deduct_amount):.2f}."

                    new_bal = (current_balance - deduct_amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                    cursor.execute("UPDATE `users` SET `wallet_balance` = %s WHERE `email` = %s;", (new_bal, clean_email))
                    conn.commit()
                    conn.close()
                    return True, float(new_bal), "Wallet balance deducted successfully."
            except Exception as e:
                print(f"MySQL deduct_wallet_balance notice: {e}")
                if conn:
                    try:
                        conn.rollback()
                        conn.close()
                    except Exception:
                        pass

        # Fallback store (Thread-safe lock)
        with _db_lock:
            store = load_fallback_store()
            current_balance = Decimal(str(self.get_user_wallet(clean_email))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            if current_balance < deduct_amount:
                return False, float(current_balance), f"Insufficient wallet balance (₹{float(current_balance):.2f}). Required: ₹{float(deduct_amount):.2f}."

            new_bal = (current_balance - deduct_amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            for u in store.get("users", []):
                if u.get("email") == clean_email:
                    u["wallet_balance"] = float(new_bal)
                    break
            save_fallback_store(store)
            return True, float(new_bal), "Wallet balance deducted successfully."

    # --- Login Users Management ---
    def sync_login_user(self, user_id: str, email: str, name: str, avatar_url: str = "", provider: str = "google", role: str = "user") -> Dict[str, Any]:
        clean_email = email.lower().strip()
        auth_uid = user_id or f"usr_{clean_email.replace('@', '_').replace('.', '_')}"
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("""
                    INSERT INTO `users` (`auth_uid`, `email`, `name`, `avatar_url`, `provider`, `role`, `wallet_balance`, `last_login`)
                    VALUES (%s, %s, %s, %s, %s, %s, 50.00, NOW())
                    ON DUPLICATE KEY UPDATE
                        `auth_uid` = VALUES(`auth_uid`),
                        `name` = VALUES(`name`),
                        `avatar_url` = VALUES(`avatar_url`),
                        `role` = VALUES(`role`),
                        `last_login` = NOW();
                    """, (auth_uid, clean_email, name or clean_email.split("@")[0], avatar_url, provider, role))
                    cursor.execute("SELECT * FROM `users` WHERE `email` = %s;", (clean_email,))
                    row = cursor.fetchone()
                    conn.close()
                    if row:
                        row["id"] = int(row["id"])
                        row["auth_uid"] = row.get("auth_uid") or ""
                        row["wallet_balance"] = float(row.get("wallet_balance", 50.00))
                        return row
            except Exception as e:
                print(f"MySQL sync_login_user notice: {e}")
                if conn:
                    conn.close()

        # Fallback store
        store = load_fallback_store()
        users = store.get("users", [])
        found = False
        user_obj = None
        for u in users:
            if u.get("email") == clean_email:
                u["name"] = name or u.get("name")
                u["avatar_url"] = avatar_url or u.get("avatar_url")
                u["role"] = role
                u["last_login"] = datetime.now().isoformat()
                if "wallet_balance" not in u:
                    u["wallet_balance"] = 50.00
                user_obj = u
                found = True
                break
        if not found:
            user_obj = {
                "id": user_id or f"usr_{int(time.time())}",
                "auth_uid": user_id or f"usr_{int(time.time())}",
                "email": clean_email,
                "name": name or clean_email.split("@")[0],
                "avatar_url": avatar_url,
                "provider": provider,
                "role": role,
                "total_orders_count": 0,
                "wallet_balance": 50.00,
                "created_at": datetime.now().isoformat(),
                "last_login": datetime.now().isoformat()
            }
            users.append(user_obj)
        store["users"] = users
        save_fallback_store(store)
        return user_obj

    def get_users(self) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT * FROM `users` ORDER BY `last_login` DESC;")
                    rows = cursor.fetchall()
                    for r in rows:
                        r["id"] = int(r["id"])
                        r["auth_uid"] = r.get("auth_uid") or ""
                        r["wallet_balance"] = float(r.get("wallet_balance", 50.00))
                    conn.close()
                    return rows
            except Exception as e:
                print(f"MySQL get_users notice: {e}")
                if conn:
                    conn.close()
        store = load_fallback_store()
        for u in store.get("users", []):
            if "wallet_balance" not in u:
                u["wallet_balance"] = 50.00
        return store.get("users", [])

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        if not user_id:
            return None
        clean_id = str(user_id).strip()
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT * FROM `users` WHERE `id` = %s OR `auth_uid` = %s OR `email` = %s;", (clean_id, clean_id, clean_id.lower()))
                    row = cursor.fetchone()
                    conn.close()
                    if row:
                        row["id"] = int(row["id"])
                        row["auth_uid"] = row.get("auth_uid") or ""
                        row["wallet_balance"] = float(row.get("wallet_balance", 50.00))
                        return row
            except Exception as e:
                print(f"MySQL get_user_by_id notice: {e}")
                if conn:
                    conn.close()

        store = load_fallback_store()
        for u in store.get("users", []):
            if str(u.get("id")) == clean_id or str(u.get("auth_uid", "")) == clean_id or str(u.get("email", "")).lower() == clean_id.lower():
                u_copy = dict(u)
                u_copy["wallet_balance"] = float(u_copy.get("wallet_balance", 50.00))
                return u_copy
        return None

    # --- Growth Orders (Followers & Likes Boost Records) ---
    def create_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        order_id = order_data.get("id") or f"ORD-{int(time.time() * 1000) % 1000000:06d}"
        smm_order_id = str(order_data.get("smm_order_id") or order_data.get("smmOrderId") or "").strip() or None
        user_email = (order_data.get("user_email") or "guest@viralora.com").lower().strip()
        service_type = order_data.get("service_type") or "followers"
        target_username = order_data.get("target_username") or ""
        target_post_url = order_data.get("target_post_url") or ""
        package_amount = int(order_data.get("package_amount") or 0)
        package_label = order_data.get("package_label") or f"+{package_amount}"
        price = float(order_data.get("price") or 0.0)
        initial_count = int(order_data.get("initial_count") or 0)
        approx_after_count = int(order_data.get("approx_after_count") or (initial_count + package_amount))
        current_count = int(order_data.get("current_count") or initial_count)
        remains = int(order_data.get("remains") or 0)
        status = order_data.get("status") or "ordered"
        smm_status = order_data.get("smm_status") or None

        # Check and deduct wallet balance
        success, remaining_balance, err_msg = self.deduct_wallet_balance(user_email, price)
        if not success:
            return {
                "success": False,
                "error": err_msg,
                "wallet_balance": remaining_balance,
                "required_amount": price
            }

        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("UPDATE `users` SET `total_orders_count` = `total_orders_count` + 1 WHERE `email` = %s;", (user_email,))

                    # Insert corresponding debit transaction record into wallet_transactions
                    txn_id = f"TXN-{order_id}"
                    order_desc = f"{service_type.capitalize()} Boost ({package_label}) for @{target_username}"
                    cursor.execute("""
                    INSERT INTO `wallet_transactions` (
                        `transaction_id`, `user_email`, `type`, `amount`, `balance_after`,
                        `service_type`, `description`, `reference_id`, `status`
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
                    """, (
                        txn_id, user_email, "debit", price, remaining_balance,
                        service_type, order_desc, order_id, status
                    ))

                    conn.commit()
                    conn.close()

                    return {
                        "id": order_id,
                        "transaction_id": txn_id,
                        "smm_order_id": smm_order_id,
                        "user_email": user_email,
                        "service_type": service_type,
                        "target_username": target_username,
                        "target_post_url": target_post_url,
                        "package_amount": package_amount,
                        "package_label": package_label,
                        "price": price,
                        "initial_count": initial_count,
                        "approx_after_count": approx_after_count,
                        "current_count": current_count,
                        "remains": remains,
                        "status": status,
                        "smm_status": smm_status,
                        "created_at": datetime.now().isoformat(),
                        "success": True,
                        "remaining_wallet_balance": remaining_balance
                    }
            except Exception as e:
                print(f"MySQL create_order notice: {e}")
                if conn:
                    conn.close()

        # Fallback store
        store = load_fallback_store()
        orders = store.get("orders", [])
        order_obj = {
            "id": order_id,
            "smm_order_id": smm_order_id,
            "user_email": user_email,
            "service_type": service_type,
            "target_username": target_username,
            "target_post_url": target_post_url,
            "package_amount": package_amount,
            "package_label": package_label,
            "price": price,
            "initial_count": initial_count,
            "approx_after_count": approx_after_count,
            "current_count": current_count,
            "remains": remains,
            "status": status,
            "smm_status": smm_status,
            "created_at": datetime.now().isoformat(),
            "success": True,
            "remaining_wallet_balance": remaining_balance
        }
        orders.insert(0, order_obj)
        store["orders"] = orders

        # Record in fallback transactions
        txns = store.setdefault("transactions", [])
        txn_id = f"TXN-{order_id}"
        order_desc = f"{service_type.capitalize()} Boost ({package_label}) for @{target_username}"
        txns.insert(0, {
            "id": txn_id,
            "transaction_id": txn_id,
            "user_email": user_email,
            "type": "debit",
            "amount": price,
            "balance_after": remaining_balance,
            "service_type": service_type,
            "description": order_desc,
            "reference_id": order_id,
            "status": status,
            "created_at": datetime.now().isoformat()
        })

        for u in store.get("users", []):
            if u.get("email") == user_email:
                u["total_orders_count"] = u.get("total_orders_count", 0) + 1
        save_fallback_store(store)
        return order_obj

    def update_order_status(self, order_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        new_status = updates.get("status")
        conn = self.get_connection()
        if conn and new_status:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("""
                    UPDATE `wallet_transactions`
                    SET `status` = %s
                    WHERE `reference_id` = %s OR `transaction_id` = %s OR `id` = %s;
                    """, (new_status, str(order_id), str(order_id), str(order_id)))
                    conn.commit()
                    cursor.execute("""
                    SELECT * FROM `wallet_transactions`
                    WHERE `reference_id` = %s OR `transaction_id` = %s OR `id` = %s;
                    """, (str(order_id), str(order_id), str(order_id)))
                    row = cursor.fetchone()
                    conn.close()
                    if row:
                        return {
                            "id": row.get("reference_id") or row.get("transaction_id") or str(row.get("id")),
                            "status": row.get("status"),
                            "price": float(row.get("amount", 0.0)),
                            "user_email": row.get("user_email")
                        }
            except Exception as e:
                print(f"MySQL update_order_status notice: {e}")
                if conn:
                    conn.close()

        # Fallback store
        store = load_fallback_store()
        for idx, o in enumerate(store.get("orders", [])):
            if str(o.get("id")) == str(order_id) or str(o.get("smm_order_id")) == str(order_id):
                store["orders"][idx].update(updates)
                store["orders"][idx]["last_checked_at"] = datetime.now().isoformat()
                save_fallback_store(store)
                return store["orders"][idx]
        return None

    def get_orders(self, user_email: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        clean_email = user_email.lower().strip() if user_email and user_email != "all" else None
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    if clean_email:
                        cursor.execute("""
                        SELECT * FROM `wallet_transactions`
                        WHERE `type` = 'debit' AND `user_email` = %s
                        ORDER BY `created_at` DESC LIMIT %s;
                        """, (clean_email, limit))
                    else:
                        cursor.execute("""
                        SELECT * FROM `wallet_transactions`
                        WHERE `type` = 'debit'
                        ORDER BY `created_at` DESC LIMIT %s;
                        """, (limit,))
                    rows = cursor.fetchall()
                    conn.close()
                    orders = []
                    for r in rows:
                        orders.append({
                            "id": r.get("reference_id") or r.get("transaction_id") or str(r.get("id")),
                            "numeric_id": int(r["id"]),
                            "transaction_id": r.get("transaction_id"),
                            "smm_order_id": r.get("reference_id"),
                            "user_email": r.get("user_email"),
                            "service_type": r.get("service_type") or "followers",
                            "target_username": (r.get("description", "").split("@")[-1].strip()) if "@" in r.get("description", "") else "user",
                            "package_label": r.get("description") or "Boost Order",
                            "price": float(r.get("amount", 0.0)),
                            "status": r.get("status") or "ordered",
                            "created_at": r.get("created_at").isoformat() if hasattr(r.get("created_at"), "isoformat") else str(r.get("created_at"))
                        })
                    return orders
            except Exception as e:
                print(f"MySQL get_orders notice: {e}")
                if conn:
                    conn.close()
        store = load_fallback_store()
        orders = store.get("orders", [])
        if user_email and user_email != "all":
            return [o for o in orders if o.get("user_email") == user_email.lower().strip()][:limit]
        return orders[:limit][:limit]

    # --- Wallet Transactions History (Credits & Debits) ---
    def get_transactions(self, user_email: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        clean_email = user_email.lower().strip() if user_email and user_email != "all" else None
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    if clean_email:
                        cursor.execute("""
                        SELECT * FROM `wallet_transactions`
                        WHERE `user_email` = %s
                        ORDER BY `created_at` DESC LIMIT %s;
                        """, (clean_email, limit))
                    else:
                        cursor.execute("""
                        SELECT * FROM `wallet_transactions`
                        ORDER BY `created_at` DESC LIMIT %s;
                        """, (limit,))
                    rows = cursor.fetchall()
                    for r in rows:
                        r["id"] = int(r["id"])
                        r["transaction_id"] = r.get("transaction_id") or ""
                        r["amount"] = float(r.get("amount", 0.0))
                        r["balance_after"] = float(r.get("balance_after", 0.0))
                    conn.close()
                    return list(rows)
            except Exception as e:
                print(f"MySQL get_transactions notice: {e}")
                if conn:
                    conn.close()

        store = load_fallback_store()
        txns = store.get("transactions", [])
        if not txns and store.get("orders"):
            for o in store.get("orders", []):
                txns.append({
                    "id": f"TXN-{o.get('id', '')}",
                    "user_email": o.get("user_email", ""),
                    "type": "debit",
                    "amount": float(o.get("price", 0.0)),
                    "balance_after": float(o.get("remaining_wallet_balance", 0.0)),
                    "service_type": o.get("service_type", "followers"),
                    "description": f"{o.get('service_type', 'followers').capitalize()} Boost ({o.get('package_label', '')}) for @{o.get('target_username', '')}",
                    "reference_id": o.get("id", ""),
                    "status": o.get("status", "ordered"),
                    "created_at": o.get("created_at", datetime.now().isoformat())
                })
            store["transactions"] = txns
            save_fallback_store(store)

        if clean_email:
            return [t for t in txns if t.get("user_email", "").lower().strip() == clean_email][:limit]
        return txns[:limit]

    # --- Manual UPI Wallet Deposits Management ---
    def is_utr_in_deposits(self, utr: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Checks whether the given UTR / Transaction ID already exists in wallet_deposits.
        Strictly checks wallet_deposits only (not wallet_transactions).
        Returns (exists: bool, deposit_info: Optional[Dict[str, Any]]).
        """
        clean_utr = str(utr or "").strip()
        if not clean_utr:
            return False, None

        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "SELECT `id`, `deposit_id`, `user_id`, `amount`, `utr`, `status`, `created_at` FROM `wallet_deposits` WHERE `utr` = %s LIMIT 1;",
                        (clean_utr,)
                    )
                    row = cursor.fetchone()
                    if row:
                        return True, dict(row)
            except Exception as e:
                print(f"MySQL is_utr_in_deposits notice: {e}")
            finally:
                try:
                    conn.close()
                except Exception:
                    pass

        # Fallback JSON store check (deposits list only)
        with _db_lock:
            store = load_fallback_store()
            deposits = store.get("deposits", [])
            for dep in deposits:
                if str(dep.get("utr", "")).strip() == clean_utr:
                    return True, dep

        return False, None

    def create_deposit(self, user_id: str, amount: Any, utr: str, payment_screenshot: str) -> Tuple[bool, Optional[Dict[str, Any]], str]:
        clean_user_id = str(user_id).strip()
        clean_utr = str(utr or "").strip()

        # 1. Exact 12-digit numeric validation
        if not re.match(r"^[0-9]{12}$", clean_utr):
            return False, None, "UTR / Transaction ID must be exactly 12 numeric digits (e.g., 123456789012)."

        # Pre-check unique UTR strictly in wallet_deposits
        exists_in_dep, _ = self.is_utr_in_deposits(clean_utr)
        if exists_in_dep:
            return False, None, f"A deposit with UTR '{clean_utr}' has already been submitted. Duplicate submissions are not allowed."

        # 2. Decimal Amount validation
        try:
            dec_amount = Decimal(str(amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        except Exception:
            return False, None, "Invalid deposit amount format."

        min_amt = Decimal(os.environ.get("MIN_DEPOSIT_AMOUNT", "100.00"))
        max_amt = Decimal(os.environ.get("MAX_DEPOSIT_AMOUNT", "50000.00"))
        if dec_amount < min_amt or dec_amount > max_amt:
            return False, None, f"Deposit amount must be between ₹{float(min_amt):.2f} and ₹{float(max_amt):.2f}."

        if not payment_screenshot:
            return False, None, "Payment screenshot is required."

        max_pending = int(os.environ.get("MAX_PENDING_DEPOSITS_PER_USER", 3))
        deposit_id = f"DEP-{int(time.time() * 1000) % 10000000:07d}"
        created_at_iso = datetime.now().isoformat()

        conn = self.get_connection()
        if conn:
            try:
                conn.autocommit(False)
                with conn.cursor() as cursor:
                    # Resolve user row
                    cursor.execute("SELECT `id`, `auth_uid`, `email`, `name`, `wallet_balance` FROM `users` WHERE `id` = %s OR `auth_uid` = %s;", (clean_user_id, clean_user_id))
                    u_row = cursor.fetchone()
                    if not u_row:
                        conn.rollback()
                        conn.close()
                        return False, None, f"Authenticated user '{clean_user_id}' not found in database."

                    target_auth_uid = u_row.get("auth_uid") or str(u_row["id"])

                    # Check max pending deposits per user
                    cursor.execute("SELECT COUNT(*) as pending_count FROM `wallet_deposits` WHERE (`user_id` = %s OR `user_id` = %s) AND `status` = 'pending';", (target_auth_uid, str(u_row["id"])))
                    cnt_row = cursor.fetchone()
                    if cnt_row and int(cnt_row.get("pending_count", 0)) >= max_pending:
                        conn.rollback()
                        conn.close()
                        return False, None, f"You already have {max_pending} pending deposits awaiting manual verification. Please wait for them to be processed."

                    # Check unique UTR
                    cursor.execute("SELECT `id` FROM `wallet_deposits` WHERE `utr` = %s;", (clean_utr,))
                    if cursor.fetchone():
                        conn.rollback()
                        conn.close()
                        return False, None, f"A deposit with UTR '{clean_utr}' has already been submitted. Duplicate submissions are not allowed."

                    # Insert deposit with status = 'pending' (NEVER credit wallet)
                    cursor.execute("""
                    INSERT INTO `wallet_deposits` (
                        `deposit_id`, `user_id`, `amount`, `utr`, `payment_screenshot`, `status`
                    ) VALUES (%s, %s, %s, %s, %s, 'pending');
                    """, (deposit_id, target_auth_uid, dec_amount, clean_utr, payment_screenshot))

                    # Ensure corresponding wallet_transactions row is created with status = 'pending'
                    cursor.execute("SELECT `wallet_balance`, `email` FROM `users` WHERE `id` = %s;", (u_row["id"],))
                    u_bal_row = cursor.fetchone()
                    user_email_addr = u_bal_row["email"] if u_bal_row else u_row["email"]
                    user_curr_bal = float(u_bal_row.get("wallet_balance", 50.00)) if u_bal_row else 50.00

                    cursor.execute("""
                    INSERT INTO `wallet_transactions` (
                        `transaction_id`, `user_email`, `type`, `amount`, `balance_after`,
                        `service_type`, `description`, `reference_id`, `status`
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
                    """, (
                        f"TXN-{deposit_id}", user_email_addr, "credit", dec_amount, user_curr_bal,
                        "wallet_deposit", f"Manual UPI Deposit (UTR: {clean_utr}) - Pending Verification", deposit_id, "pending"
                    ))

                    conn.commit()

                    cursor.execute("SELECT * FROM `wallet_deposits` WHERE `deposit_id` = %s;", (deposit_id,))
                    created_row = cursor.fetchone()
                    conn.close()
                    if created_row:
                        created_row["id"] = int(created_row["id"])
                        created_row["deposit_id"] = created_row.get("deposit_id") or ""
                        created_row["amount"] = float(created_row["amount"])
                        return True, created_row, "Deposit submitted successfully. Awaiting manual admin verification."
            except Exception as e:
                print(f"MySQL create_deposit notice: {e}")
                if conn:
                    try:
                        conn.rollback()
                        conn.close()
                    except Exception:
                        pass

        # Fallback store (Thread-safe lock)
        with _db_lock:
            store = load_fallback_store()
            user_found = None
            for u in store.get("users", []):
                if str(u.get("id")) == clean_user_id or str(u.get("auth_uid", "")) == clean_user_id:
                    user_found = u
                    break
            if not user_found:
                user_found = {
                    "id": clean_user_id,
                    "auth_uid": clean_user_id,
                    "email": f"{clean_user_id}@viralora.local",
                    "name": clean_user_id,
                    "wallet_balance": 50.00
                }
                store.setdefault("users", []).append(user_found)

            deposits = store.setdefault("deposits", [])
            user_pending = [d for d in deposits if (str(d.get("user_id")) == clean_user_id or str(d.get("user_id")) == str(user_found.get("auth_uid"))) and d.get("status") == "pending"]
            if len(user_pending) >= max_pending:
                return False, None, f"You already have {max_pending} pending deposits awaiting manual verification. Please wait for them to be processed."

            if any(str(d.get("utr")) == clean_utr for d in deposits):
                return False, None, f"A deposit with UTR '{clean_utr}' has already been submitted. Duplicate submissions are not allowed."

            dep_obj = {
                "id": deposit_id,
                "deposit_id": deposit_id,
                "user_id": clean_user_id,
                "amount": float(dec_amount),
                "utr": clean_utr,
                "payment_screenshot": payment_screenshot,
                "status": "pending",
                "rejection_reason": None,
                "created_at": created_at_iso,
                "updated_at": created_at_iso,
                "approved_at": None,
                "approved_by": None,
                "rejected_at": None,
                "rejected_by": None
            }
            deposits.insert(0, dep_obj)

            # Record in fallback transactions with status = 'pending'
            txns = store.setdefault("transactions", [])
            txns.insert(0, {
                "id": f"TXN-{deposit_id}",
                "transaction_id": f"TXN-{deposit_id}",
                "user_email": user_found.get("email", f"{clean_user_id}@viralora.local"),
                "type": "credit",
                "amount": float(dec_amount),
                "balance_after": float(user_found.get("wallet_balance", 50.00)),
                "service_type": "wallet_deposit",
                "description": f"Manual UPI Deposit (UTR: {clean_utr}) - Pending Verification",
                "reference_id": deposit_id,
                "status": "pending",
                "created_at": created_at_iso
            })

            save_fallback_store(store)
            return True, dep_obj, "Deposit submitted successfully. Awaiting manual admin verification."

    def get_user_deposits(self, user_id: str, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        clean_user_id = str(user_id).strip()
        offset = max(0, (page - 1) * page_size)

        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("""
                    SELECT COUNT(*) as total FROM `wallet_deposits`
                    WHERE `user_id` = %s OR `user_id` = (SELECT auth_uid FROM `users` WHERE `id` = %s LIMIT 1);
                    """, (clean_user_id, clean_user_id))
                    total = cursor.fetchone()["total"]

                    cursor.execute("""
                    SELECT d.*, u.id as user_numeric_id, u.auth_uid as user_auth_uid, u.email as user_email, u.name as user_name
                    FROM `wallet_deposits` d
                    LEFT JOIN `users` u ON (d.user_id = u.auth_uid OR d.user_id = CAST(u.id AS CHAR))
                    WHERE d.user_id = %s OR d.user_id = (SELECT auth_uid FROM `users` WHERE `id` = %s LIMIT 1)
                    ORDER BY d.created_at DESC
                    LIMIT %s OFFSET %s;
                    """, (clean_user_id, clean_user_id, page_size, offset))
                    rows = cursor.fetchall()
                    for r in rows:
                        r["id"] = int(r["id"])
                        r["deposit_id"] = r.get("deposit_id") or ""
                        r["amount"] = float(r["amount"])
                    conn.close()
                    total_pages = max(1, (total + page_size - 1) // page_size) if total > 0 else 1
                    return {
                        "items": rows,
                        "total": total,
                        "page": page,
                        "page_size": page_size,
                        "total_pages": total_pages
                    }
            except Exception as e:
                print(f"MySQL get_user_deposits notice: {e}")
                if conn:
                    conn.close()

        with _db_lock:
            store = load_fallback_store()
            user_deps = [d for d in store.get("deposits", []) if str(d.get("user_id")) == clean_user_id]
            total = len(user_deps)
            paged = user_deps[offset : offset + page_size]
            total_pages = max(1, (total + page_size - 1) // page_size) if total > 0 else 1
            return {
                "items": paged,
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages
            }

    def get_deposit_by_id(self, deposit_id: str) -> Optional[Dict[str, Any]]:
        clean_id = str(deposit_id).strip()
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("""
                    SELECT d.*, u.id as user_numeric_id, u.auth_uid as user_auth_uid, COALESCE(u.email, d.user_id) as user_email, COALESCE(u.name, 'User') as user_name, COALESCE(u.wallet_balance, 0.00) as current_wallet_balance
                    FROM `wallet_deposits` d
                    LEFT JOIN `users` u ON (d.user_id = u.auth_uid OR d.user_id = CAST(u.id AS CHAR))
                    WHERE d.id = %s OR d.deposit_id = %s;
                    """, (clean_id, clean_id))
                    row = cursor.fetchone()
                    conn.close()
                    if row:
                        row["id"] = int(row["id"])
                        row["deposit_id"] = row.get("deposit_id") or ""
                        row["amount"] = float(row["amount"]) if row.get("amount") is not None else 0.0
                        row["current_wallet_balance"] = float(row["current_wallet_balance"]) if row.get("current_wallet_balance") is not None else 0.0
                        row["user_email"] = row.get("user_email") or row.get("user_id") or "User"
                        row["user_name"] = row.get("user_name") or "User"
                        for dt_field in ["created_at", "updated_at", "approved_at", "rejected_at"]:
                            if isinstance(row.get(dt_field), (datetime, date)):
                                row[dt_field] = row[dt_field].isoformat()
                        return row
            except Exception as e:
                print(f"MySQL get_deposit_by_id notice: {e}")
                if conn:
                    conn.close()

        with _db_lock:
            store = load_fallback_store()
            for d in store.get("deposits", []):
                if str(d.get("id")) == clean_id or str(d.get("deposit_id")) == clean_id:
                    d_copy = dict(d)
                    d_copy["amount"] = float(d_copy.get("amount", 0.0))
                    for u in store.get("users", []):
                        if str(u.get("id")) == str(d.get("user_id")) or str(u.get("auth_uid")) == str(d.get("user_id")):
                            d_copy["user_email"] = u.get("email")
                            d_copy["user_name"] = u.get("name")
                            d_copy["current_wallet_balance"] = float(u.get("wallet_balance", 50.00))
                            break
                    return d_copy
        return None

    def get_all_deposits(self, status: Optional[str] = None, search: Optional[str] = None, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        offset = max(0, (page - 1) * page_size)
        clean_status = status.lower().strip() if status and status.lower().strip() != "all" else None
        clean_search = search.strip() if search and search.strip() else None

        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    where_clauses = []
                    params: List[Any] = []
                    if clean_status:
                        where_clauses.append("d.status = %s")
                        params.append(clean_status)
                    if clean_search:
                        where_clauses.append("(d.id LIKE %s OR d.deposit_id LIKE %s OR d.utr LIKE %s OR u.email LIKE %s OR u.name LIKE %s)")
                        s_like = f"%{clean_search}%"
                        params.extend([s_like, s_like, s_like, s_like, s_like])

                    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

                    count_query = f"""
                    SELECT COUNT(*) as total
                    FROM `wallet_deposits` d
                    LEFT JOIN `users` u ON (d.user_id = u.auth_uid OR d.user_id = CAST(u.id AS CHAR))
                    {where_sql};
                    """
                    cursor.execute(count_query, tuple(params))
                    total = cursor.fetchone()["total"]

                    data_query = f"""
                    SELECT d.*, u.id as user_numeric_id, u.auth_uid as user_auth_uid, COALESCE(u.email, d.user_id) as user_email, COALESCE(u.name, 'User') as user_name, COALESCE(u.wallet_balance, 0.00) as current_wallet_balance
                    FROM `wallet_deposits` d
                    LEFT JOIN `users` u ON (d.user_id = u.auth_uid OR d.user_id = CAST(u.id AS CHAR))
                    {where_sql}
                    ORDER BY d.created_at DESC
                    LIMIT %s OFFSET %s;
                    """
                    cursor.execute(data_query, tuple(params + [page_size, offset]))
                    rows = cursor.fetchall()
                    for r in rows:
                        r["id"] = int(r["id"])
                        r["deposit_id"] = r.get("deposit_id") or ""
                        r["amount"] = float(r["amount"]) if r.get("amount") is not None else 0.0
                        r["current_wallet_balance"] = float(r["current_wallet_balance"]) if r.get("current_wallet_balance") is not None else 0.0
                        r["user_email"] = r.get("user_email") or r.get("user_id") or "User"
                        r["user_name"] = r.get("user_name") or "User"
                        for dt_field in ["created_at", "updated_at", "approved_at", "rejected_at"]:
                            if isinstance(r.get(dt_field), (datetime, date)):
                                r[dt_field] = r[dt_field].isoformat()
                    conn.close()
                    total_pages = max(1, (total + page_size - 1) // page_size) if total > 0 else 1
                    return {
                        "items": rows,
                        "total": total,
                        "page": page,
                        "page_size": page_size,
                        "total_pages": total_pages
                    }
            except Exception as e:
                print(f"MySQL get_all_deposits notice: {e}")
                if conn:
                    conn.close()

        with _db_lock:
            store = load_fallback_store()
            deps = store.get("deposits", [])
            users_map = {str(u.get("id")): u for u in store.get("users", [])}
            enriched = []
            for d in deps:
                u = users_map.get(str(d.get("user_id")), {})
                d_copy = dict(d)
                d_copy["amount"] = float(d_copy.get("amount", 0.0))
                d_copy["user_email"] = u.get("email", "")
                d_copy["user_name"] = u.get("name", "")
                d_copy["current_wallet_balance"] = float(u.get("wallet_balance", 50.00))
                enriched.append(d_copy)

            filtered = enriched
            if clean_status:
                filtered = [d for d in filtered if d.get("status") == clean_status]
            if clean_search:
                cs_lower = clean_search.lower()
                filtered = [
                    d for d in filtered
                    if cs_lower in str(d.get("id", "")).lower()
                    or cs_lower in str(d.get("deposit_id", "")).lower()
                    or cs_lower in str(d.get("utr", "")).lower()
                    or cs_lower in str(d.get("user_email", "")).lower()
                    or cs_lower in str(d.get("user_name", "")).lower()
                ]

            total = len(filtered)
            paged = filtered[offset : offset + page_size]
            total_pages = max(1, (total + page_size - 1) // page_size) if total > 0 else 1
            return {
                "items": paged,
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages
            }

    def approve_deposit(self, deposit_id: str, admin_id: str) -> Tuple[bool, Optional[Dict[str, Any]], str]:
        clean_dep_id = str(deposit_id).strip()
        clean_admin = str(admin_id or "admin").strip()
        now_dt = datetime.now()
        now_iso = now_dt.isoformat()

        conn = self.get_connection()
        if conn:
            try:
                conn.autocommit(False)
                with conn.cursor() as cursor:
                    # 1. Row-level lock deposit FOR UPDATE
                    cursor.execute("SELECT * FROM `wallet_deposits` WHERE `id` = %s OR `deposit_id` = %s FOR UPDATE;", (clean_dep_id, clean_dep_id))
                    deposit = cursor.fetchone()
                    if not deposit:
                        conn.rollback()
                        conn.close()
                        return False, None, f"Deposit record '{clean_dep_id}' not found."

                    dep_id_str = deposit["deposit_id"]
                    dep_numeric_id = deposit["id"]

                    # 2. Strict State Machine: only pending can be approved
                    if deposit["status"] != "pending":
                        conn.rollback()
                        conn.close()
                        return False, None, f"Cannot approve deposit '{clean_dep_id}' because its status is already '{deposit['status']}'."

                    dep_amount = Decimal(str(deposit["amount"])).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                    target_user_id = deposit["user_id"]

                    # 3. Row-level lock user wallet FOR UPDATE
                    cursor.execute("SELECT `id`, `auth_uid`, `email`, `wallet_balance` FROM `users` WHERE `auth_uid` = %s OR `id` = %s FOR UPDATE;", (target_user_id, target_user_id))
                    user_row = cursor.fetchone()
                    if not user_row:
                        cursor.execute("""
                        INSERT INTO `users` (`auth_uid`, `email`, `name`, `wallet_balance`, `provider`, `role`)
                        VALUES (%s, %s, %s, 0.00, 'google', 'user')
                        ON DUPLICATE KEY UPDATE `id` = `id`;
                        """, (target_user_id, f"{target_user_id}@user.local", f"User {str(target_user_id)[:8]}"))
                        cursor.execute("SELECT `id`, `auth_uid`, `email`, `wallet_balance` FROM `users` WHERE `auth_uid` = %s OR `id` = %s FOR UPDATE;", (target_user_id, target_user_id))
                        user_row = cursor.fetchone()

                    if not user_row:
                        conn.rollback()
                        conn.close()
                        return False, None, f"User '{target_user_id}' associated with deposit could not be resolved."

                    user_email = user_row["email"]
                    current_bal = Decimal(str(user_row["wallet_balance"])).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

                    # 4. Check ledger idempotency
                    cursor.execute("SELECT `id`, `transaction_id`, `status` FROM `wallet_transactions` WHERE `service_type` = 'wallet_deposit' AND `reference_id` = %s FOR UPDATE;", (dep_id_str,))
                    existing_txn = cursor.fetchone()
                    if existing_txn and existing_txn.get("status") == "successful":
                        conn.rollback()
                        conn.close()
                        return False, None, f"Wallet credit transaction already exists for deposit '{clean_dep_id}'. Duplicate approval prevented."

                    # 5. Credit user's wallet
                    new_bal = (current_bal + dep_amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                    cursor.execute("UPDATE `users` SET `wallet_balance` = %s WHERE `id` = %s;", (new_bal, user_row["id"]))

                    # 6. Update or insert wallet credit transaction with status = 'successful'
                    if existing_txn:
                        cursor.execute("""
                        UPDATE `wallet_transactions`
                        SET `status` = 'successful', `balance_after` = %s, `description` = %s
                        WHERE `id` = %s;
                        """, (new_bal, f"Manual UPI Deposit (UTR: {deposit['utr']}) - Approved", existing_txn["id"]))
                    else:
                        txn_id = f"TXN-{dep_id_str}"
                        cursor.execute("""
                        INSERT INTO `wallet_transactions` (
                            `transaction_id`, `user_email`, `type`, `amount`, `balance_after`,
                            `service_type`, `description`, `reference_id`, `status`
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
                        """, (
                            txn_id, user_email, "credit", dep_amount, new_bal,
                            "wallet_deposit", f"Manual UPI Deposit (UTR: {deposit['utr']}) - Approved", dep_id_str, "successful"
                        ))

                    # 7. Update deposit status to approved
                    cursor.execute("""
                    UPDATE `wallet_deposits`
                    SET `status` = 'approved', `approved_by` = %s, `approved_at` = NOW()
                    WHERE `id` = %s;
                    """, (clean_admin, dep_numeric_id))

                    conn.commit()

                    cursor.execute("SELECT * FROM `wallet_deposits` WHERE `id` = %s;", (dep_numeric_id,))
                    updated_row = cursor.fetchone()
                    conn.close()
                    if updated_row:
                        updated_row["id"] = int(updated_row["id"])
                        updated_row["deposit_id"] = updated_row.get("deposit_id") or ""
                        updated_row["amount"] = float(updated_row["amount"])
                        updated_row["new_wallet_balance"] = float(new_bal)
                        return True, updated_row, f"Deposit approved. Credited ₹{float(dep_amount):.2f} to user wallet."
            except Exception as e:
                print(f"MySQL approve_deposit notice: {e}")
                if conn:
                    try:
                        conn.rollback()
                        conn.close()
                    except Exception:
                        pass

        # Fallback store (Thread-safe lock)
        with _db_lock:
            store = load_fallback_store()
            deposits = store.setdefault("deposits", [])
            target_dep = None
            for d in deposits:
                if str(d.get("id")) == clean_dep_id or str(d.get("deposit_id")) == clean_dep_id:
                    target_dep = d
                    break
            if not target_dep:
                return False, None, f"Deposit record '{clean_dep_id}' not found."

            if target_dep.get("status") != "pending":
                return False, None, f"Cannot approve deposit '{clean_dep_id}' because its status is already '{target_dep.get('status')}'."

            target_user_id = str(target_dep.get("user_id"))
            dep_amount = Decimal(str(target_dep.get("amount", 0.0))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            # Check ledger idempotency
            txns = store.setdefault("transactions", [])
            found_txn = False
            for t in txns:
                if t.get("service_type") == "wallet_deposit" and str(t.get("reference_id")) == clean_dep_id:
                    if t.get("status") == "successful":
                        return False, None, f"Wallet credit transaction already exists for deposit '{clean_dep_id}'. Duplicate approval prevented."
                    t["status"] = "successful"
                    t["balance_after"] = float(new_bal if 'new_bal' in locals() else 0.0)
                    t["description"] = f"Manual UPI Deposit (UTR: {target_dep.get('utr')}) - Approved"
                    found_txn = True
                    break

            # Find user
            user_found = None
            for u in store.get("users", []):
                if str(u.get("id")) == target_user_id or str(u.get("auth_uid", "")) == target_user_id:
                    user_found = u
                    break
            if not user_found:
                return False, None, f"User '{target_user_id}' associated with deposit not found."

            user_email = user_found.get("email")
            current_bal = Decimal(str(user_found.get("wallet_balance", 50.00))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            new_bal = (current_bal + dep_amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            user_found["wallet_balance"] = float(new_bal)

            if not found_txn:
                # Record ledger credit
                txn_id = f"TXN-{clean_dep_id}"
                txns.insert(0, {
                    "id": txn_id,
                    "transaction_id": txn_id,
                    "user_email": user_email,
                    "type": "credit",
                    "amount": float(dep_amount),
                    "balance_after": float(new_bal),
                    "service_type": "wallet_deposit",
                    "description": f"Manual UPI Deposit (UTR: {target_dep.get('utr')}) - Approved",
                    "reference_id": clean_dep_id,
                    "status": "successful",
                    "created_at": now_iso
                })
            else:
                for t in txns:
                    if t.get("service_type") == "wallet_deposit" and str(t.get("reference_id")) == clean_dep_id:
                        t["balance_after"] = float(new_bal)
                        break

            # Update deposit status
            target_dep["status"] = "approved"
            target_dep["approved_by"] = clean_admin
            target_dep["approved_at"] = now_iso
            target_dep["updated_at"] = now_iso
            save_fallback_store(store)

            res_dep = dict(target_dep)
            res_dep["new_wallet_balance"] = float(new_bal)
            return True, res_dep, f"Deposit approved. Credited ₹{float(dep_amount):.2f} to user wallet."

    def reject_deposit(self, deposit_id: str, admin_id: str, rejection_reason: str) -> Tuple[bool, Optional[Dict[str, Any]], str]:
        clean_dep_id = str(deposit_id).strip()
        clean_admin = str(admin_id or "admin").strip()
        clean_reason = str(rejection_reason or "").strip()

        if len(clean_reason) < 3 or len(clean_reason) > 500:
            return False, None, "Rejection reason is required and must be between 3 and 500 characters."

        now_iso = datetime.now().isoformat()

        conn = self.get_connection()
        if conn:
            try:
                conn.autocommit(False)
                with conn.cursor() as cursor:
                    # 1. Lock deposit row FOR UPDATE
                    cursor.execute("SELECT * FROM `wallet_deposits` WHERE `id` = %s OR `deposit_id` = %s FOR UPDATE;", (clean_dep_id, clean_dep_id))
                    deposit = cursor.fetchone()
                    if not deposit:
                        conn.rollback()
                        conn.close()
                        return False, None, f"Deposit record '{clean_dep_id}' not found."

                    dep_id_str = deposit["deposit_id"]
                    dep_numeric_id = deposit["id"]

                    # 2. Strict State Machine: only pending can be rejected
                    if deposit["status"] != "pending":
                        conn.rollback()
                        conn.close()
                        return False, None, f"Cannot reject deposit '{clean_dep_id}' because its status is already '{deposit['status']}'."

                    # 3. Update status = 'rejected' (wallet balance unchanged)
                    cursor.execute("""
                    UPDATE `wallet_deposits`
                    SET `status` = 'rejected', `rejection_reason` = %s, `rejected_by` = %s, `rejected_at` = NOW()
                    WHERE `id` = %s;
                    """, (clean_reason, clean_admin, dep_numeric_id))

                    # 4. Update or insert in wallet_transactions with status = 'rejected'
                    cursor.execute("SELECT `id` FROM `wallet_transactions` WHERE `service_type` = 'wallet_deposit' AND `reference_id` = %s FOR UPDATE;", (dep_id_str,))
                    existing_rej_txn = cursor.fetchone()
                    if existing_rej_txn:
                        cursor.execute("""
                        UPDATE `wallet_transactions`
                        SET `status` = 'rejected', `description` = %s
                        WHERE `id` = %s;
                        """, (f"Manual UPI Deposit (UTR: {deposit['utr']}) - Rejected: {clean_reason}", existing_rej_txn["id"]))
                    else:
                        cursor.execute("SELECT `email`, `wallet_balance` FROM `users` WHERE `auth_uid` = %s OR `id` = %s;", (deposit["user_id"], deposit["user_id"]))
                        rej_email = u_rej["email"] if u_rej else f"{deposit['user_id']}@user.local"
                        rej_bal = float(u_rej.get("wallet_balance", 0.0)) if u_rej else 0.0
                        cursor.execute("""
                        INSERT INTO `wallet_transactions` (
                            `transaction_id`, `user_email`, `type`, `amount`, `balance_after`,
                            `service_type`, `description`, `reference_id`, `status`
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
                        """, (
                            f"TXN-{dep_id_str}", rej_email, "credit", float(deposit["amount"]), rej_bal,
                            "wallet_deposit", f"Manual UPI Deposit (UTR: {deposit['utr']}) - Rejected: {clean_reason}", dep_id_str, "rejected"
                        ))

                    conn.commit()
                    cursor.execute("SELECT * FROM `wallet_deposits` WHERE `id` = %s;", (dep_numeric_id,))
                    updated_row = cursor.fetchone()
                    conn.close()
                    if updated_row:
                        updated_row["id"] = int(updated_row["id"])
                        updated_row["deposit_id"] = updated_row.get("deposit_id") or ""
                        updated_row["amount"] = float(updated_row["amount"])
                        return True, updated_row, f"Deposit '{clean_dep_id}' has been rejected. User wallet remains unchanged."
            except Exception as e:
                print(f"MySQL reject_deposit notice: {e}")
                if conn:
                    try:
                        conn.rollback()
                        conn.close()
                    except Exception:
                        pass

        # Fallback store (Thread-safe lock)
        with _db_lock:
            store = load_fallback_store()
            deposits = store.setdefault("deposits", [])
            target_dep = None
            for d in deposits:
                if str(d.get("id")) == clean_dep_id:
                    target_dep = d
                    break
            if not target_dep:
                return False, None, f"Deposit record '{clean_dep_id}' not found."

            if target_dep.get("status") != "pending":
                return False, None, f"Cannot reject deposit '{clean_dep_id}' because its status is already '{target_dep.get('status')}'."

            target_dep["status"] = "rejected"
            target_dep["rejection_reason"] = clean_reason
            target_dep["rejected_by"] = clean_admin
            target_dep["rejected_at"] = now_iso
            target_dep["updated_at"] = now_iso

            # Update transaction in fallback store
            txns = store.setdefault("transactions", [])
            for t in txns:
                if t.get("service_type") == "wallet_deposit" and str(t.get("reference_id")) == clean_dep_id:
                    t["status"] = "rejected"
                    t["description"] = f"Manual UPI Deposit (UTR: {target_dep.get('utr')}) - Rejected: {clean_reason}"
                    break

            save_fallback_store(store)

            return True, dict(target_dep), f"Deposit '{clean_dep_id}' has been rejected. User wallet remains unchanged."

    # --- Analytics & Admin Stats ---
    def get_admin_stats(self) -> Dict[str, Any]:
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT COUNT(*) as total_users, COALESCE(SUM(`wallet_balance`), 0) as total_wallet FROM `users`;")
                    user_stats = cursor.fetchone()
                    total_users = user_stats["total_users"]
                    total_wallet = float(user_stats["total_wallet"])

                    cursor.execute("SELECT COUNT(*) as total_orders, COALESCE(SUM(`amount`), 0) as total_revenue FROM `wallet_transactions` WHERE `type` = 'debit';")
                    order_stats = cursor.fetchone()
                    total_orders = order_stats["total_orders"]
                    total_revenue = float(order_stats["total_revenue"])

                    cursor.execute("SELECT COUNT(*) as total_followers FROM `wallet_transactions` WHERE `type` = 'debit' AND `service_type` = 'followers';")
                    total_followers = cursor.fetchone()["total_followers"]

                    cursor.execute("SELECT COUNT(*) as total_likes FROM `wallet_transactions` WHERE `type` = 'debit' AND `service_type` = 'likes';")
                    total_likes = cursor.fetchone()["total_likes"]

                    cursor.execute("SELECT COUNT(*) as total_views FROM `wallet_transactions` WHERE `type` = 'debit' AND `service_type` = 'views';")
                    total_views = cursor.fetchone()["total_views"]

                    # UPI Wallet Deposits Stats
                    cursor.execute("SELECT COUNT(*) as pending_count, COALESCE(SUM(`amount`), 0) as pending_amount FROM `wallet_deposits` WHERE `status` = 'pending';")
                    dep_p_stats = cursor.fetchone()
                    pending_dep_count = dep_p_stats["pending_count"]
                    pending_dep_amount = float(dep_p_stats["pending_amount"])

                    cursor.execute("SELECT COUNT(*) as approved_count, COALESCE(SUM(`amount`), 0) as approved_amount FROM `wallet_deposits` WHERE `status` = 'approved';")
                    dep_a_stats = cursor.fetchone()
                    approved_dep_count = dep_a_stats["approved_count"]
                    approved_dep_amount = float(dep_a_stats["approved_amount"])

                    conn.close()
                    return {
                        "total_users": total_users,
                        "total_orders": total_orders,
                        "total_revenue": total_revenue,
                        "total_wallet_balance": round(total_wallet, 2),
                        "total_followers_boosted": total_followers,
                        "total_likes_boosted": total_likes,
                        "total_views_boosted": total_views,
                        "pending_deposits_count": pending_dep_count,
                        "pending_deposits_amount": round(pending_dep_amount, 2),
                        "approved_deposits_count": approved_dep_count,
                        "approved_deposits_amount": round(approved_dep_amount, 2),
                        "database_engine": "MySQL (Connected)"
                    }
            except Exception as e:
                print(f"MySQL get_admin_stats notice: {e}")
                if conn:
                    conn.close()

        store = load_fallback_store()
        users = store.get("users", [])
        orders = store.get("orders", [])
        deposits = store.get("deposits", [])
        total_revenue = sum(float(o.get("price", 0)) for o in orders)
        total_wallet = sum(float(u.get("wallet_balance", 50.00)) for u in users)
        total_followers = sum(int(o.get("package_amount", 0)) for o in orders if o.get("service_type") == "followers")
        total_likes = sum(int(o.get("package_amount", 0)) for o in orders if o.get("service_type") == "likes")
        total_views = sum(int(o.get("package_amount", 0)) for o in orders if o.get("service_type") == "views")
        pending_deps = [d for d in deposits if d.get("status") == "pending"]
        approved_deps = [d for d in deposits if d.get("status") == "approved"]
        return {
            "total_users": len(users),
            "total_orders": len(orders),
            "total_revenue": round(total_revenue, 2),
            "total_wallet_balance": round(total_wallet, 2),
            "total_followers_boosted": total_followers,
            "total_likes_boosted": total_likes,
            "total_views_boosted": total_views,
            "pending_deposits_count": len(pending_deps),
            "pending_deposits_amount": round(sum(float(d.get("amount", 0)) for d in pending_deps), 2),
            "approved_deposits_count": len(approved_deps),
            "approved_deposits_amount": round(sum(float(d.get("amount", 0)) for d in approved_deps), 2),
            "database_engine": "MySQL Ready (Local Buffer)"
        }



db = DatabaseManager()
db.init_tables()
db.init_tables()
